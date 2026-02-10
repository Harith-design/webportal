<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\CustomerOrderRequestMail;

class SapController extends Controller
{
    protected $baseUrl;
    protected $companyDb;
    protected $username;
    protected $password;

    public function __construct()
    {
        $this->baseUrl   = config('sapb1.base_url');
        $this->companyDb = config('sapb1.company_db');
        $this->username  = config('sapb1.username');
        $this->password  = config('sapb1.password');
    }

    /**
     * Login once and cache the session for reuse
     */
    private function login()
    {
        return Cache::remember('sap_session', 30 * 60, function () {
            $response = Http::withOptions(['verify' => config('sapb1.verify_ssl')])
                ->post($this->baseUrl . '/Login', [
                    'CompanyDB' => $this->companyDb,
                    'UserName'  => $this->username,
                    'Password'  => $this->password,
                ]);

            if ($response->failed()) {
                Log::error('SAP Login Failed', ['response' => $response->body()]);
                return null;
            }

            $session = $response->json();
            $cookies = $response->cookies();

            return [
                'SessionId' => $session['SessionId'] ?? null,
                'RouteId'   => $cookies->getCookieByName('ROUTEID')->getValue() ?? null,
            ];
        });
    }

    private function callServiceLayer($method, $endpoint, $data = [])
    {
        $login = $this->login();
        if (!$login || empty($login['SessionId'])) {
            return [
                'error'  => true,
                'status' => 401,
                'details'=> 'Login to SAP failed',
            ];
        }

        $cookieHeader = "B1SESSION={$login['SessionId']}";
        if (!empty($login['RouteId'])) {
            $cookieHeader .= "; ROUTEID={$login['RouteId']}";
        }

        $http = Http::withOptions(['verify' => config('sapb1.verify_ssl')])
            ->withHeaders(['Cookie' => $cookieHeader]);

        $url = $this->baseUrl . '/' . $endpoint;
        Log::info("Calling SAP Service Layer: {$url}");

        switch (strtolower($method)) {
            case 'get':
                $response = $http->get($url);
                break;
            case 'post':
                $response = $http->post($url, $data);
                break;
            case 'put':
                $response = $http->put($url, $data);
                break;
            case 'patch': // ✅ NEW (needed for partial update)
                $response = $http->patch($url, $data);
                break;
            case 'delete':
                $response = $http->delete($url, $data);
                break;
            default:
                return [
                    'error'  => true,
                    'status' => 400,
                    'details'=> 'Invalid HTTP method',
                ];
        }

        if ($response->status() === 401 || $response->status() === 403) {
            Cache::forget('sap_session');
            return $this->callServiceLayer($method, $endpoint, $data);
        }

        if ($response->successful()) {
            return $response->json();
        }

        return [
            'error'  => true,
            'status' => $response->status(),
            'details'=> $response->json(),
        ];
    }

    // =====================================================
    // ------------------- BUSINESS PARTNERS ---------------
    // =====================================================
    public function getBusinessPartners(Request $request)
    {
        $search = strtoupper(trim($request->query('search', '')));
        $top = 50;

        $endpoint = "BusinessPartners?\$top={$top}&\$select=CardCode,CardName";

        if (!empty($search)) {
            $escapedSearch = str_replace("'", "''", $search);
            $endpoint .= "&\$filter=startswith(CardCode,'{$escapedSearch}') or startswith(CardName,'{$escapedSearch}')";
        }

        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch Business Partners',
                'details' => $result['details'],
            ], $result['status']);
        }

        $partners = $result['value'] ?? [];

        $partnersMapped = collect($partners)->map(function ($bp) {
            return [
                'CardCode' => $bp['CardCode'] ?? '',
                'CardName' => $bp['CardName'] ?? '',
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($partnersMapped),
            'data'   => $partnersMapped,
        ]);
    }

    /**
     * Fetch a single Business Partner by CardCode (OCRD).
     */
    public function getBusinessPartnerByCode($cardCode)
    {
        $endpoint = "BusinessPartners('{$cardCode}')?\$select=CardCode,CardName,Balance,Currency";
        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to fetch Business Partner',
                'details' => $result['details'] ?? $result,
            ], $result['status'] ?? 500);
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'cardCode' => $result['CardCode'] ?? '',
                'cardName' => $result['CardName'] ?? '',
                'balance'  => (float)($result['Balance'] ?? 0),
                'currency' => $result['Currency'] ?? 'MYR',
            ],
        ], 200);
    }

    /**
     * NEW: Get Ship-To and Bill-To addresses for a BP (CRD1 via Service Layer).
     * Route: GET /api/sap/business-partners/{cardCode}/addresses
     */
    public function getBusinessPartnerAddresses(Request $request, $cardCode)
    {
        $safe = str_replace("'", "''", $cardCode);

        // fetch BP header to get default ship/bill
        $bp = $this->callServiceLayer('get', "BusinessPartners('{$safe}')");
        if (isset($bp['error'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to fetch BP header',
                'details' => $bp['details'] ?? $bp,
            ], $bp['status'] ?? 500);
        }

        $shipDefault = $bp['ShipToDefault'] ?? $bp['ShipToDef'] ?? null;
        $billDefault = $bp['BillToDefault'] ?? $bp['BillToDef'] ?? null;

        // working path on your system
        $res = $this->callServiceLayer('get', "BusinessPartners('{$safe}')/BPAddresses");
        if (isset($res['error']) || !isset($res['BPAddresses'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to fetch BPAddresses from Service Layer',
                'details' => $res['details'] ?? $res,
            ], $res['status'] ?? 500);
        }

        $rows = $res['BPAddresses'];
        $shipTo = [];
        $billTo = [];

        foreach ($rows as $r) {
            $type = strtoupper($r['AddressType'] ?? '');
            $mapped = [
                'AddressName'  => $r['AddressName'] ?? '',
                'Street'       => $r['Street'] ?? '',
                'City'         => $r['City'] ?? '',
                'ZipCode'      => $r['ZipCode'] ?? '',
                'County'       => $r['County'] ?? '',
                'Country'      => $r['Country'] ?? '',
                'Building'     => $r['BuildingFloorRoom'] ?? '',
                'AddressType'  => $type,
                'IsDefault'    => false,
            ];

            if (in_array($type, ['BO_SHIPTO', 'SHIPTO', 'S'], true)) {
                $mapped['IsDefault'] = $shipDefault && $r['AddressName'] === $shipDefault;
                $shipTo[] = $mapped;
            } elseif (in_array($type, ['BO_BILLTO', 'BILLTO', 'B'], true)) {
                $mapped['IsDefault'] = $billDefault && $r['AddressName'] === $billDefault;
                $billTo[] = $mapped;
            }
        }

        // fallback default flags
        if ($shipTo && !array_filter($shipTo, fn($x) => $x['IsDefault'])) $shipTo[0]['IsDefault'] = true;
        if ($billTo && !array_filter($billTo, fn($x) => $x['IsDefault'])) $billTo[0]['IsDefault'] = true;

        return response()->json([
            'status'   => 'success',
            'cardCode' => $bp['CardCode'] ?? $safe,
            'cardName' => $bp['CardName'] ?? '',
            'shipTo'   => $shipTo,
            'billTo'   => $billTo,
            'defaults' => ['shipTo' => $shipDefault, 'billTo' => $billDefault],
        ], 200);
    }

    // =====================================================
    // ---------------------- ITEMS ------------------------
    // =====================================================
    public function getItems(Request $request)
    {
        $search = strtoupper(trim($request->query('search', '')));
        $top = 50;

        $endpoint = "Items?\$top={$top}";
        $filters = ["Valid eq 'tYES' and Valid ne null"];

        if (!empty($search)) {
            $escapedSearch = str_replace("'", "''", $search);
            $filters[] = "startswith(ItemCode,'{$escapedSearch}') or startswith(ItemName,'{$escapedSearch}')";
        }

        if (!empty($filters)) {
            $endpoint .= "&\$filter=" . implode(' and ', $filters);
        }

        $result = $this->callServiceLayer('get', $endpoint);

        // 🔹 DEBUG: check the full response from SAP
        \Log::info('SAP Items debug', ['result' => $result]);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch items',
                'details' => $result['details'],
            ], $result['status']);
        }

        $items = $result['value'] ?? [];

        $itemsMapped = collect($items)
        ->filter(fn($i) => ($i['Valid'] ?? '') === 'tYES')
        ->map(function ($item) {

            $itemCode = $item['ItemCode'] ?? '';
            $itemName = $item['ItemName'] ?? '';

            // Attempt to parse item code
            $pattern = '/^([A-Z0-9]+)-(\d+)-([\d.]+)N$/';
            if (preg_match($pattern, $itemCode, $matches)) {
                $compoundCode = $matches[1];
                $width = $matches[2];
                $length = $matches[3];

                $displayName = "{$compoundCode} (Width {$width}mm, Length {$length}mm)";
            } else {
                // fallback if pattern doesn't match
                $displayName = $itemCode;
            }

            return [
                'ItemCode'    => $itemCode,
                'Description' => $displayName,
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($itemsMapped),
            'data'   => $itemsMapped,
        ]);
    }

    /**
     * SINGLE ITEM DETAILS (Item Master)
     * - InventoryWeight (g) → Weight in KG for web portal
     * - Minimum price from ItemPrices
     * Route: GET /api/sap/items/{itemCode}
     */
    public function getItemByCode($itemCode)
    {
        try {
            // escape quotes for OData
            $safe = str_replace("'", "''", $itemCode);

            // 1) Get base item info (for weight, description)
            $itemEndpoint = "Items('{$safe}')?\$select=ItemCode,ItemName,InventoryWeight";
            $itemRes      = $this->callServiceLayer('get', $itemEndpoint);

            if (isset($itemRes['error'])) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to fetch item details',
                    'details' => $itemRes['details'] ?? $itemRes,
                ], $itemRes['status'] ?? 500);
            }

            // ---------- Weight (InventoryWeight is in grams in SAP B1) ----------
            $rawWeightGrams = isset($itemRes['InventoryWeight'])
                ? (float) $itemRes['InventoryWeight']
                : 0.0;

            // convert g → kg for the portal
            $weightKg = $rawWeightGrams / 1000.0;

            // 2) Get minimum price from ItemPrices entity set
            $minPrice = null;

            $priceEndpoint =
                "ItemPrices?"
                . "\$select=ItemCode,Price,ListNum"
                . "&\$filter=ItemCode eq '{$safe}' and Price gt 0"
                . "&\$orderby=Price asc";

            $priceRes = $this->callServiceLayer('get', $priceEndpoint);

            if (!isset($priceRes['error']) && isset($priceRes['value']) && is_array($priceRes['value'])) {
                if (count($priceRes['value']) > 0) {
                    $firstRow = $priceRes['value'][0];
                    if (isset($firstRow['Price'])) {
                        $minPrice = (float) $firstRow['Price'];
                    }
                }
            } else {
                // not fatal – we still return weight even if price fetch fails
                \Log::warning('ItemPrices query failed or empty', [
                    'itemCode' => $itemCode,
                    'priceRes' => $priceRes,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'ItemCode'    => $itemRes['ItemCode'] ?? $itemCode,
                    'Description' => $itemRes['ItemName'] ?? '',
                    'Weight'      => $weightKg,   // in KG
                    'MinPrice'    => $minPrice,   // may be null if no valid prices
                ],
            ], 200);

        } catch (\Throwable $e) {
            \Log::error('getItemByCode exception', [
                'itemCode' => $itemCode,
                'ex'       => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Unexpected error fetching item details',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // =====================================================
    // -------------- SALES ORDERS (UDF helper) ------------
    // =====================================================
    public function getItemDetailsFromSalesOrderUDF($itemCode)
    {
        $endpoint = "Orders?\$select=DocEntry,DocumentLines&\$filter=DocumentLines/any(line: line/ItemCode eq '{$itemCode}')";
        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch item details',
                'details' => $result['details'],
            ], $result['status']);
        }

        $details = [];
        foreach ($result['value'] ?? [] as $order) {
            foreach ($order['DocumentLines'] ?? [] as $line) {
                if (($line['ItemCode'] ?? null) === $itemCode) {
                    $details = [
                        'ItemCode'    => $itemCode,
                        'Weight'      => $line['U_Weight'] ?? null,
                        'PricePerKG'  => $line['U_PriceperKG'] ?? null,
                    ];
                    break 2;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => $details,
        ]);
    }

    // =====================================================
    // ------------------- SALES ORDERS LIST ---------------
    // =====================================================
    public function getSalesOrders(Request $request)
    {
        $top = 50;
        $search = strtoupper(trim($request->query('search', '')));

        $endpoint = "Orders?\$orderby=DocDate desc&\$top={$top}&\$select=DocEntry,DocNum,NumAtCard,CardName,DocDate,DocDueDate,DocTotal,DocCurrency,DocumentStatus,CardCode";

        if (!empty($search)) {
            $escaped = str_replace("'", "''", $search);
            $endpoint .= "&\$filter=contains(CardName,'{$escaped}') or contains(DocNum,'{$escaped}') or contains(NumAtCard,'{$escaped}')";
        }

        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch Sales Orders',
                'details' => $result['details'],
            ], $result['status']);
        }

        $orders = $result['value'] ?? [];

        usort($orders, function ($a, $b) {
            return strtotime($b['DocDate']) <=> strtotime($a['DocDate']);
        });

        $formatted = collect($orders)->map(function ($o) {
            return [
                'docEntry'     => $o['DocEntry'] ?? '',
                'salesNo'      => $o['DocNum'] ?? '',
                'poNo'         => $o['NumAtCard'] ?? 'Processing',
                'customer'     => $o['CardName'] ?? '',
                'customerCode' => $o['CardCode'] ?? ($o['CardName'] ?? ''),
                'orderDate'    => substr($o['DocDate'] ?? '', 0, 10),
                'dueDate'      => substr($o['DocDueDate'] ?? '', 0, 10),
                'total'        => $o['DocTotal'] ?? 0,
                'currency'     => $o['DocCurrency'] ?? 'RM',
                'status'       => ($o['DocumentStatus'] ?? '') === 'bost_Open' ? 'Open' : 'Closed',
                'download'     => url("/api/sap/sales-orders/{$o['DocEntry']}/pdf"),
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($formatted),
            'data'   => $formatted,
        ]);
    }

    // =====================================================
    // ---------------- SALES ORDER DETAILS ----------------
    // =====================================================
    public function getSalesOrderDetails($docEntry)
    {
        try {
            $endpoint = "Orders({$docEntry})";
            $result   = $this->callServiceLayer('get', $endpoint);

            if (isset($result['error'])) {
                return response()->json([
                    'error'   => 'Failed to fetch Sales Order details',
                    'details' => $result['details'] ?? $result,
                ], $result['status'] ?? 500);
            }

            $rawLines = $result['DocumentLines'] ?? [];

            $lines = collect($rawLines)->map(function ($l, $i) {
                $sapQty      = (float) ($l['Quantity'] ?? 0);          // what SAP stores
                $udfTotalPcs = isset($l['U_TotalWeight']) ? (float) $l['U_TotalWeight'] : null; // PCS (new style)
                $udfWeight   = isset($l['U_Weight'])      ? (float) $l['U_Weight']      : null; // KG per PCS (new)

                $sapLineTotal = isset($l['LineTotal']) ? (float) $l['LineTotal'] : null;
                $sapPrice     = (float) ($l['UnitPrice'] ?? ($l['Price'] ?? 0)); // usually RM per KG in new style

                // ------------------------------------------------------------------
                // Detect NEW vs OLD mapping
                // NEW: Quantity = KG, U_TotalWeight = PCS
                // OLD: Quantity = PCS, U_TotalWeight = total KG (or empty)
                // ------------------------------------------------------------------
                $isNewMapping = $udfTotalPcs !== null && $udfTotalPcs > 0 && $sapQty > $udfTotalPcs;

                if ($isNewMapping) {
                    // ---------- NEW ORDERS (what we create now) ----------
                    $displayQty   = $udfTotalPcs;   // PCS for UI
                    $totalWeight  = $sapQty;        // KG
                    $weightPerPcs = $udfWeight;     // KG / PCS

                    $pricePerKg   = $sapPrice;      // RM / KG
                    // what UI really wants to show as "Price" is RM per PCS
                    if ($weightPerPcs && $pricePerKg) {
                        $pricePerPcs = $pricePerKg * $weightPerPcs;  // RM / PCS
                    } else {
                        // fallback: derive from line total if possible
                        $pricePerPcs = ($sapLineTotal !== null && $displayQty > 0)
                            ? $sapLineTotal / $displayQty
                            : $pricePerKg;
                    }

                    $lineTotal = $sapLineTotal !== null
                        ? $sapLineTotal
                        : $pricePerPcs * $displayQty;
                } else {
                    // ---------- OLD ORDERS (before we changed mapping) ----------
                    // Quantity in SAP is already PCS.
                    $displayQty   = $sapQty;                         // PCS
                    $totalWeight  = $udfTotalPcs ?: $sapQty;         // try UDF first
                    $weightPerPcs = $displayQty > 0
                        ? $totalWeight / $displayQty
                        : null;

                    // pricePerPcs – try to read from SAP total if possible
                    if ($sapLineTotal !== null && $displayQty > 0) {
                        $pricePerPcs = $sapLineTotal / $displayQty;
                    } else {
                        // absolute fallback – whatever SAP stored as UnitPrice
                        $pricePerPcs = $sapPrice;
                    }

                    $lineTotal = $sapLineTotal !== null
                        ? $sapLineTotal
                        : $pricePerPcs * $displayQty;
                }

                return [
                    'no'           => $i + 1,
                    'ItemCode'     => $l['ItemCode'] ?? '',
                    'ItemName'     => $l['ItemDescription'] ?? ($l['Text'] ?? ''),
                    'Quantity'     => $displayQty,     // PCS for your frontend
                    'WeightPerPcs' => $weightPerPcs,   // KG per PCS (may be null for old docs)
                    'TotalWeight'  => $totalWeight,    // KG (matches SAP "Total Weight")
                    'UnitPrice'    => $pricePerPcs,    // RM / PCS  <-- what your UI multiplies
                    'LineTotal'    => $lineTotal,      // should match SAP LineTotal/TotalGross
                    'TaxCode'      => $l['TaxCode'] ?? '',
                ];
            })->toArray();

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'DocEntry'       => $result['DocEntry']       ?? '',
                    'DocNum'         => $result['DocNum']         ?? '',
                    'CardCode'       => $result['CardCode']       ?? '',
                    'Customer'       => $result['CardName']       ?? '',
                    'DocDate'        => substr($result['DocDate']    ?? '', 0, 10),
                    'DocDueDate'     => substr($result['DocDueDate'] ?? '', 0, 10),
                    'DocTotal'       => (float)($result['DocTotal'] ?? 0),
                    'DocCurrency'    => $result['DocCurrency']    ?? 'MYR',
                    'NumAtCard'      => $result['NumAtCard']      ?? '-',
                    'DocumentStatus' => $result['DocumentStatus'] ?? '',
                    'ShipToCode'     => $result['ShipToCode']     ?? '',
                    'PayToCode'      => $result['PayToCode']      ?? '',
                    'Lines'          => $lines,
                    'DocumentLines'  => $rawLines,
                ],
            ], 200);

        } catch (\Throwable $e) {
            \Log::error('getSalesOrderDetails exception', [
                'docEntry' => $docEntry,
                'ex'       => $e->getMessage(),
            ]);

            return response()->json([
                'error'   => 'Unexpected error fetching Sales Order details',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // =====================================================
    // ✅ NEW: UPDATE SALES ORDER LINE "UNIT PRICE PER KG"
    // RDR1.U_PriceperKG (and set UnitPrice = same)
    //
    // Route (from api.php):
    // POST /api/sap/orders/{docEntry}/price-per-kg   (auth:sanctum)
    //
    // Payload (flexible):
    // {
    //   "lines": [
    //     { "lineNum": 0, "pricePerKg": 4.79 },
    //     { "itemCode": "ABC", "pricePerKg": 3.93 }
    //   ]
    // }
    // =====================================================
    public function updateSalesOrderPricePerKg(Request $request, $docEntry)
    {
        try {
            $validated = $request->validate([
                'lines' => 'required|array|min:1',

                // allow either lineNum or itemCode
                'lines.*.lineNum'    => 'nullable|integer|min:0',
                'lines.*.itemCode'   => 'nullable|string',

                // accept different keys from frontend
                'lines.*.pricePerKg'       => 'nullable|numeric|min:0',
                'lines.*.unitPricePerKg'   => 'nullable|numeric|min:0',
                'lines.*.UnitPricePerKG'   => 'nullable|numeric|min:0',
                'lines.*.UnitPricePerKg'   => 'nullable|numeric|min:0',
                'lines.*.UnitPrice'        => 'nullable|numeric|min:0',
            ]);

            // 1) Read current order to resolve line numbers if frontend sends itemCode
            $order = $this->callServiceLayer('get', "Orders({$docEntry})?\$select=DocEntry,DocNum,DocumentStatus,DocumentLines");
            if (isset($order['error'])) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to fetch Sales Order before update',
                    'details' => $order['details'] ?? $order,
                ], $order['status'] ?? 500);
            }

            // Prevent update if closed (optional but safer)
            if (($order['DocumentStatus'] ?? '') !== 'bost_Open') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Sales Order is not Open. Cannot update pricing.',
                    'details' => ['DocumentStatus' => $order['DocumentStatus'] ?? null],
                ], 409);
            }

            $docLines = $order['DocumentLines'] ?? [];
            if (!is_array($docLines) || count($docLines) === 0) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Sales Order has no DocumentLines.',
                ], 400);
            }

            // Build map ItemCode => LineNum (0-based)
            $itemToLineNum = [];
            foreach ($docLines as $idx => $dl) {
                $code = $dl['ItemCode'] ?? null;
                if ($code !== null && $code !== '') {
                    // if duplicates, first match wins (consistent)
                    $itemToLineNum[$code] = $idx;
                }
            }

            // 2) Prepare PATCH payload
            $patchLines = [];
            foreach (($validated['lines'] ?? []) as $row) {

                $pricePerKg =
                    $row['pricePerKg']
                    ?? $row['unitPricePerKg']
                    ?? $row['UnitPricePerKG']
                    ?? $row['UnitPricePerKg']
                    ?? $row['UnitPrice']
                    ?? null;

                if ($pricePerKg === null) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Missing pricePerKg for one of the lines.',
                        'details' => $row,
                    ], 422);
                }

                $pricePerKg = (float) $pricePerKg;

                $lineNum = $row['lineNum'] ?? null;

                if ($lineNum === null && !empty($row['itemCode'])) {
                    $lineNum = $itemToLineNum[$row['itemCode']] ?? null;
                }

                if ($lineNum === null || !is_numeric($lineNum)) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Each line must include lineNum OR a valid itemCode that exists in the order.',
                        'details' => $row,
                    ], 422);
                }

                $lineNum = (int) $lineNum;

                if ($lineNum < 0 || $lineNum >= count($docLines)) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => "Invalid lineNum {$lineNum} for this Sales Order.",
                        'details' => ['maxLineNum' => count($docLines) - 1],
                    ], 422);
                }

                // ✅ Update both:
                // - UnitPrice: so SAP computes LineTotal correctly (RM/KG for your new mapping)
                // - U_PriceperKG: so your UDF column shows the value in SAP UI
                $patchLines[] = [
                    'LineNum'       => $lineNum,
                    'UnitPrice'     => $pricePerKg,
                    'U_PriceperKG'  => $pricePerKg,
                ];
            }

            $payload = [
                'DocumentLines' => $patchLines,
            ];

            \Log::info('🧾 Updating Sales Order price-per-kg', [
                'docEntry' => $docEntry,
                'payload'  => $payload,
            ]);

            // 3) PATCH update
            $update = $this->callServiceLayer('patch', "Orders({$docEntry})", $payload);

            if (isset($update['error'])) {
                \Log::error('❌ Failed to update price-per-kg', [
                    'docEntry' => $docEntry,
                    'error'    => $update,
                ]);

                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to update Sales Order pricing',
                    'details' => $update['details'] ?? $update,
                ], $update['status'] ?? 500);
            }

            // 4) Return latest order snapshot (optional but helpful)
            $after = $this->callServiceLayer('get', "Orders({$docEntry})?\$select=DocEntry,DocNum,DocTotal,DocCurrency,DocumentLines");

            return response()->json([
                'status'  => 'success',
                'message' => 'Sales Order pricing updated (UnitPrice + U_PriceperKG).',
                'data'    => [
                    'DocEntry'  => $docEntry,
                    'DocNum'    => $order['DocNum'] ?? null,
                    'updated'   => $patchLines,
                    'after'     => isset($after['error']) ? null : $after,
                ],
            ], 200);

        } catch (\Throwable $e) {
            \Log::error('updateSalesOrderPricePerKg exception', [
                'docEntry' => $docEntry,
                'ex'       => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Unexpected error updating Sales Order pricing',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // =====================================================
    // ------------------- INVOICE LIST --------------------
    // =====================================================
    public function getInvoices(Request $request)
    {
        $top = 50;
        $search = strtoupper(trim($request->query('search', '')));

        $endpoint = "Invoices?\$orderby=DocDate desc"
            . "&\$top={$top}"
            . "&\$select=DocEntry,DocNum,NumAtCard,CardName,DocDate,DocDueDate,DocTotal,PaidToDate,DocCurrency,DocumentStatus,CardCode";

        if (!empty($search)) {
            $escaped = str_replace("'", "''", $search);
            $endpoint .= "&\$filter=contains(CardName,'{$escaped}') or contains(DocNum,'{$escaped}') or contains(NumAtCard,'{$escaped}')";
        }

        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch Invoices',
                'details' => $result['details'],
            ], $result['status']);
        }

        $invoices = $result['value'] ?? [];

        usort($invoices, function ($a, $b) {
            return strtotime($b['DocDate']) <=> strtotime($a['DocDate']);
        });

        $formatted = collect($invoices)->map(function ($inv) {
            $docTotal   = (float)($inv['DocTotal']   ?? 0);
            $paidToDate = (float)($inv['PaidToDate'] ?? 0);
            $remaining  = max(0.0, $docTotal - $paidToDate);

            return [
                'docEntry'     => $inv['DocEntry'] ?? '',
                'invoiceNo'    => $inv['DocNum'] ?? '',
                'poNo'         => $inv['NumAtCard'] ?? '',
                'customer'     => $inv['CardName'] ?? '',
                'customerCode' => $inv['CardCode'] ?? ($inv['CardName'] ?? ''),
                'postingDate'  => substr($inv['DocDate'] ?? '', 0, 10),
                'dueDate'      => substr($inv['DocDueDate'] ?? '', 0, 10),
                'total'        => $docTotal,
                'paidToDate'   => $paidToDate,
                'remaining'    => $remaining,
                'currency'     => $inv['DocCurrency'] ?? 'RM',
                'status'       => ($inv['DocumentStatus'] ?? '') === 'bost_Open' ? 'Open' : 'Closed',
                'download'     => url("/api/sap/invoices/{$inv['DocEntry']}/pdf"),
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($formatted),
            'data'   => $formatted,
        ]);
    }

    // =====================================================
    // ------------------- CREATE SALES ORDER --------------
    // =====================================================
    public function createSalesOrder(Request $request)
    {
        $user = $request->user();
        $role = $user?->role ?? null;

        // -------------------------------------------------
        // ✅ VALIDATION (NO UNIT PRICE REQUIRED)
        // ✅ Plan A: accept WeightPerPcs + TotalWeight from frontend
        // -------------------------------------------------
        $validated = $request->validate([
            'CardCode'      => 'required|string',
            'CardName'      => 'nullable|string',
            'DocDate'       => 'nullable|date',
            'DocDueDate'    => 'required|date',
            'Comments'      => 'nullable|string',
            'ShipToCode'    => 'nullable|string',
            'PayToCode'     => 'nullable|string',

            'DocumentLines'                         => 'required|array|min:1',
            'DocumentLines.*.ItemCode'              => 'required|string',
            'DocumentLines.*.Quantity'              => 'required|numeric|min:1',      // PCS from UI
            'DocumentLines.*.WeightPerPcs'          => 'required|numeric|min:0.0001', // KG/PCS
            'DocumentLines.*.TotalWeight'           => 'required|numeric|min:0.0001', // Total KG
            'DocumentLines.*.description'           => 'nullable|string',
        ]);

        // -------------------------------------------------
        // ✅ HEADER PAYLOAD
        // -------------------------------------------------
        $payload = [
            'CardCode'   => $validated['CardCode'],
            'DocDate'    => $validated['DocDate'] ?? date('Y-m-d'),
            'DocDueDate' => $validated['DocDueDate'],
            'Comments'   => $validated['Comments'] ?? null,
            'ShipToCode' => $validated['ShipToCode'] ?? null,
            'PayToCode'  => $validated['PayToCode'] ?? null,
        ];

        // -------------------------------------------------
        // ✅ DOCUMENT LINES
        // ✅ Plan A (NEW mapping):
        //    SAP Quantity      = Total KG
        //    U_TotalWeight     = PCS
        //    U_Weight          = KG / PCS
        // -------------------------------------------------
        $payload['DocumentLines'] = collect($validated['DocumentLines'])
            ->map(function ($line) {

                $pcs = (float) ($line['Quantity'] ?? 0);
                $weightPerPcs = (float) ($line['WeightPerPcs'] ?? 0);
                $totalKg = (float) ($line['TotalWeight'] ?? 0);

                return [
                    'ItemCode'      => $line['ItemCode'],

                    // SAP stores total KG in Quantity (new mapping)
                    'Quantity'      => $totalKg,

                    // keep your current default price behavior
                    'UnitPrice'     => 0,

                    // UDFs on RDR1
                    'U_TotalWeight' => $pcs,         // PCS
                    'U_Weight'      => $weightPerPcs // KG/PCS  (RDR1.U_Weight)
                ];
            })
            ->values()
            ->toArray();

        $payload = array_filter($payload, fn ($v) => $v !== null);

        \Log::info('📥 Incoming sales order request', ['request' => $request->all()]);
        \Log::info('📦 Payload to SAP Orders', ['payload' => $payload]);

        // -------------------------------------------------
        // ✅ CREATE SAP ORDER
        // -------------------------------------------------
        $result = $this->callServiceLayer('post', 'Orders', $payload);

        if (isset($result['error'])) {
            \Log::error('❌ Failed to create sales order', ['error' => $result]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to create Sales Order',
                'details' => $result['details'] ?? $result,
            ], $result['status'] ?? 500);
        }

        \Log::info('✅ Sales Order created successfully', ['result' => $result]);

        // -------------------------------------------------
        // ✅ EMAIL DATA (used for BOTH sales + customer)
        // -------------------------------------------------
        $companyCode = $user?->cardcode ?? ($validated['CardCode'] ?? null);
        $companyName = $user?->cardname ?? ($validated['CardName'] ?? null);

        $docNum   = $result['DocNum'] ?? null;
        $docEntry = $result['DocEntry'] ?? null;

        $mailData = [
            'customer_name' => $user?->name ?? $user?->email ?? ($companyName ?: ($companyCode ?: 'Customer')),
            'customer_email' => $user?->email ?? null,
            'customer_company_code' => $companyCode,
            'customer_company_name' => $companyName,
            'requested_delivery_date' => $validated['DocDueDate'] ?? null,
            'sap_docnum' => $docNum,
            'sap_docentry' => $docEntry,
            'lines' => collect($validated['DocumentLines'])
                ->map(fn ($l) => [
                    'itemCode' => $l['ItemCode'],
                    'quantity' => $l['Quantity'],
                    'description' => $l['description'] ?? null,
                ])
                ->toArray(),
        ];

        // -------------------------------------------------
        // ✅ SEND EMAIL AFTER SAP SUCCESS (DIFFERENT SUBJECTS)
        // -------------------------------------------------
        try {
            // Sales subject
            $subjectCompany = $companyName ?: ($companyCode ?: 'Customer');
            $salesSubject = 'New Order - ' . $subjectCompany . ($docNum ? (' - DocNum ' . $docNum) : '');

            // Customer subject
            $customerSubject = 'Your Order Confirmation' . ($docNum ? (' - DocNum ' . $docNum) : '');

            // 1) Sales team emails
            $salesEmails = array_filter(
                array_map('trim', explode(',', env('SALES_NOTIFY_EMAILS', ''))))
            ;

            if (!empty($salesEmails)) {
                Mail::to($salesEmails)->send(
                    (new \App\Mail\CustomerOrderRequestMail($mailData))->subject($salesSubject)
                );

                \Log::info('📧 Sales notification email sent', [
                    'emails' => $salesEmails,
                    'subject' => $salesSubject
                ]);
            } else {
                \Log::warning('⚠️ SALES_NOTIFY_EMAILS is empty, sales email not sent');
            }

            // 2) Customer email (logged-in user)
            if (!empty($user?->email)) {
                Mail::to($user->email)->send(
                    (new \App\Mail\CustomerOrderRequestMail($mailData))->subject($customerSubject)
                );

                \Log::info('📧 Customer confirmation email sent', [
                    'email' => $user->email,
                    'subject' => $customerSubject
                ]);
            } else {
                \Log::warning('⚠️ User email empty OR not logged in, customer email not sent');
            }

        } catch (\Throwable $e) {
            \Log::error('❌ Email sending failed', ['error' => $e->getMessage()]);
            // don't fail order just because email failed
        }

        // -------------------------------------------------
        // ✅ FINAL RESPONSE
        // -------------------------------------------------
        return response()->json([
            'status'  => 'success',
            'message' => 'Sales Order created successfully',
            'data'    => $result,
        ], 201);
    }

    // =====================================================
    // ------------------- GET SINGLE INVOICE DETAILS ------
    // =====================================================
    public function getInvoiceDetails($docEntry)
    {
        try {
            // 1) Get the full invoice document (header + DocumentLines)
            //    No $expand, no separate /DocumentLines call
            $endpoint = "Invoices({$docEntry})";
            $result   = $this->callServiceLayer('get', $endpoint);

            \Log::info('SAP raw invoice response', [
                'docEntry'   => $docEntry,
                'hasLines'   => isset($result['DocumentLines']),
                'line_count' => isset($result['DocumentLines']) && is_array($result['DocumentLines'])
                    ? count($result['DocumentLines'])
                    : 0,
            ]);

            if (isset($result['error'])) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to fetch invoice details',
                    'details' => $result['details'] ?? $result,
                ], $result['status'] ?? 500);
            }

            // 2) Build multi-line address strings from AddressExtension
            $ae = $result['AddressExtension'] ?? [];

            $shipLines = [];
            if (!empty($ae['ShipToStreet'])) {
                $shipLines[] = $ae['ShipToStreet'];
            }
            if (!empty($ae['ShipToZipCode']) || !empty($ae['ShipToCity'])) {
                $shipLines[] = trim(($ae['ShipToZipCode'] ?? '') . ' ' . ($ae['ShipToCity'] ?? ''));
            }
            if (!empty($ae['ShipToCounty']) || !empty($ae['ShipToCountry'])) {
                $county  = trim($ae['ShipToCounty']  ?? '');
                $country = trim($ae['ShipToCountry'] ?? '');
                $shipLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
            }
            $shipToText = implode("\n", array_filter($shipLines));

            $billLines = [];
            if (!empty($ae['BillToStreet'])) {
                $billLines[] = $ae['BillToStreet'];
            }
            if (!empty($ae['BillToZipCode']) || !empty($ae['BillToCity'])) {
                $billLines[] = trim(($ae['BillToZipCode'] ?? '') . ' ' . ($ae['BillToCity'] ?? ''));
            }
            if (!empty($ae['BillToCounty']) || !empty($ae['BillToCountry'])) {
                $county  = trim($ae['BillToCounty']  ?? '');
                $country = trim($ae['BillToCountry'] ?? '');
                $billLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
            }
            $billToText = implode("\n", array_filter($billLines));

            // 3) Lines directly from DocumentLines on the invoice
            $rawLines = $result['DocumentLines'] ?? [];

            $lines = collect($rawLines)->map(function ($line, $i) {
                $qty   = (float)($line['Quantity']  ?? 0);
                $price = (float)($line['UnitPrice'] ?? ($line['Price'] ?? 0));
                $total = isset($line['LineTotal']) ? (float)$line['LineTotal'] : $qty * $price;

                return [
                    'no'              => $i + 1,
                    'ItemCode'        => $line['ItemCode'] ?? '',
                    'ItemDescription' => $line['ItemDescription'] ?? ($line['Text'] ?? ''),
                    'Quantity'        => $qty,
                    'Price'           => $price,
                    'LineTotal'       => $total,
                    'TaxCode'         => $line['TaxCode'] ?? '',
                ];
            })->toArray();

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'DocEntry'       => $result['DocEntry']       ?? '',
                    'DocNum'         => $result['DocNum']         ?? '',
                    'CardCode'       => $result['CardCode']       ?? '',
                    'Customer'       => $result['CardName']       ?? '',
                    'DocDate'        => $result['DocDate']        ?? '',
                    'DocDueDate'     => $result['DocDueDate']     ?? '',
                    'DocTotal'       => (float)($result['DocTotal'] ?? 0),
                    'DocCurrency'    => $result['DocCurrency']    ?? 'MYR',
                    'NumAtCard'      => $result['NumAtCard']      ?? '-',
                    'DocumentStatus' => $result['DocumentStatus'] ?? '',
                    'ShipToCode'     => $result['ShipToCode']     ?? '',
                    'PayToCode'      => $result['PayToCode']      ?? '',
                    'ShipToText'     => $shipToText,
                    'BillToText'     => $billToText,

                    // expose both for the frontend
                    'Lines'          => $lines,
                    'DocumentLines'  => $rawLines,
                ],
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Exception fetching invoice details', [
                'docEntry' => $docEntry,
                'message'  => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => 'error',
                'message' => 'Unexpected error fetching invoice details',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // =====================================================
    // --------------- GET INVOICE DOCUMENT LINES ----------
    // =====================================================
    public function getInvoiceDocumentLines($docEntry)
    {
        try {
            $endpoint = "Invoices({$docEntry})/DocumentLines";
            $result = $this->callServiceLayer('get', $endpoint);

            Log::info("SAP DocumentLines Response", ['result' => $result]);

            if (isset($result['error'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to fetch invoice document lines',
                    'details' => $result['details'] ?? $result,
                ], 500);
            }

            return response()->json([
                'status' => 'success',
                'data' => $result['value'] ?? [],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice document lines', ['docEntry' => $docEntry, 'message' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Unexpected error fetching invoice document lines',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

   // ==============================
// Helpers for PDF address fallback
// ==============================
private function buildAddressTextFromAddressExtension(array $ae, string $prefix): string
{
    // $prefix = 'ShipTo' or 'BillTo'
    $street   = $ae[$prefix . 'Street']   ?? '';
    $zip      = $ae[$prefix . 'ZipCode']  ?? '';
    $city     = $ae[$prefix . 'City']     ?? '';
    $county   = $ae[$prefix . 'County']   ?? '';
    $country  = $ae[$prefix . 'Country']  ?? '';

    $lines = [];

    if (!empty($street)) {
        $lines[] = $street;
    }

    if (!empty($zip) || !empty($city)) {
        $lines[] = trim($zip . ' ' . $city);
    }

    if (!empty($county) || !empty($country)) {
        $county  = trim($county);
        $country = trim($country);
        $lines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
    }

    return implode("\n", array_filter($lines));
}

private function formatBpAddress(array $a): string
{
    // Match your frontend approach as close as possible
    $lines = [];

    $line2 = trim(implode(', ', array_filter([
        $a['Building'] ?? null,
        $a['Street'] ?? null,
    ])));
    if ($line2) $lines[] = $line2;

    $line3 = trim(implode(' ', array_filter([
        $a['ZipCode'] ?? null,
        $a['City'] ?? null,
    ])));
    if ($line3) $lines[] = $line3;

    $line4 = trim(implode(', ', array_filter([
        $a['County'] ?? null,
        $a['Country'] ?? null,
    ])));
    if ($line4) $lines[] = $line4;

    return implode("\n", array_filter($lines));
}

private function fetchBpAddressesPack(string $cardCode): array
{
    $safe = str_replace("'", "''", $cardCode);

    // header to know defaults (optional)
    $bp = $this->callServiceLayer('get', "BusinessPartners('{$safe}')");
    $shipDefault = is_array($bp) ? ($bp['ShipToDefault'] ?? $bp['ShipToDef'] ?? null) : null;
    $billDefault = is_array($bp) ? ($bp['BillToDefault'] ?? $bp['BillToDef'] ?? null) : null;

    $res = $this->callServiceLayer('get', "BusinessPartners('{$safe}')/BPAddresses");

    $rows = [];
    if (is_array($res) && isset($res['BPAddresses']) && is_array($res['BPAddresses'])) {
        $rows = $res['BPAddresses'];
    } elseif (is_array($res) && isset($res['value']) && is_array($res['value'])) {
        // some SL versions return { value: [...] }
        $rows = $res['value'];
    }

    $shipTo = [];
    $billTo = [];

    foreach ($rows as $r) {
        $type = strtoupper($r['AddressType'] ?? '');

        $mapped = [
            'AddressName' => $r['AddressName'] ?? '',
            'Street'      => $r['Street'] ?? '',
            'City'        => $r['City'] ?? '',
            'ZipCode'     => $r['ZipCode'] ?? '',
            'County'      => $r['County'] ?? '',
            'Country'     => $r['Country'] ?? '',
            'Building'    => $r['BuildingFloorRoom'] ?? ($r['Building'] ?? ''),
            'AddressType' => $type,
            'IsDefault'   => false,
        ];

        if (in_array($type, ['BO_SHIPTO', 'SHIPTO', 'S'], true)) {
            $mapped['IsDefault'] = $shipDefault && ($mapped['AddressName'] === $shipDefault);
            $shipTo[] = $mapped;
        } elseif (in_array($type, ['BO_BILLTO', 'BILLTO', 'B'], true)) {
            $mapped['IsDefault'] = $billDefault && ($mapped['AddressName'] === $billDefault);
            $billTo[] = $mapped;
        }
    }

    if ($shipTo && !array_filter($shipTo, fn($x) => $x['IsDefault'])) $shipTo[0]['IsDefault'] = true;
    if ($billTo && !array_filter($billTo, fn($x) => $x['IsDefault'])) $billTo[0]['IsDefault'] = true;

    return [
        'shipTo' => $shipTo,
        'billTo' => $billTo,
        'defaults' => [
            'shipTo' => $shipDefault,
            'billTo' => $billDefault,
        ],
    ];
}

private function resolveAddressFromBpPack(array $pack, string $code, string $type): ?array
{
    $list = $type === 'ship' ? ($pack['shipTo'] ?? []) : ($pack['billTo'] ?? []);

    if ($code) {
        foreach ($list as $a) {
            if (($a['AddressName'] ?? '') === $code) return $a;
        }
    }

    foreach ($list as $a) {
        if (!empty($a['IsDefault'])) return $a;
    }

    return $list[0] ?? null;
}

// =====================================================
// ------------------- SALES ORDER PDF -----------------
// =====================================================
public function salesOrderPdf($docEntry)
{
    try {
        if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'PDF engine not installed. Run: composer require barryvdh/laravel-dompdf',
            ], 501);
        }

        // 1) Get Sales Order from SAP
        $header = $this->callServiceLayer('get', "Orders({$docEntry})");
        if (isset($header['error'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to fetch sales order header',
                'details' => $header['details'] ?? $header,
            ], 500);
        }

        // 2) Build Ship/Bill text (same as your current code)
        $ae = $header['AddressExtension'] ?? [];

        $shipLines = [];
        if (!empty($ae['ShipToStreet']))  $shipLines[] = $ae['ShipToStreet'];
        if (!empty($ae['ShipToZipCode']) || !empty($ae['ShipToCity'])) {
            $shipLines[] = trim(($ae['ShipToZipCode'] ?? '') . ' ' . ($ae['ShipToCity'] ?? ''));
        }
        if (!empty($ae['ShipToCounty']) || !empty($ae['ShipToCountry'])) {
            $county  = trim($ae['ShipToCounty']  ?? '');
            $country = trim($ae['ShipToCountry'] ?? '');
            $shipLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
        }
        $shipToText = implode("\n", array_filter($shipLines));

        $billLines = [];
        if (!empty($ae['BillToStreet']))  $billLines[] = $ae['BillToStreet'];
        if (!empty($ae['BillToZipCode']) || !empty($ae['BillToCity'])) {
            $billLines[] = trim(($ae['BillToZipCode'] ?? '') . ' ' . ($ae['BillToCity'] ?? ''));
        }
        if (!empty($ae['BillToCounty']) || !empty($ae['BillToCountry'])) {
            $county  = trim($ae['BillToCounty']  ?? '');
            $country = trim($ae['BillToCountry'] ?? '');
            $billLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
        }
        $billToText = implode("\n", array_filter($billLines));

        // 3) Lines
        $rawLines = $header['DocumentLines'] ?? [];
        $lines = collect($rawLines)->map(function ($l, $i) {
            $qty   = (float)($l['Quantity']   ?? 0);
            $price = (float)($l['UnitPrice']  ?? ($l['Price'] ?? 0));
            $total = isset($l['LineTotal']) ? (float)$l['LineTotal'] : $qty * $price;

            return [
                'no'          => $i + 1,
                'ItemCode'    => $l['ItemCode'] ?? '-',
                'Description' => $l['ItemDescription'] ?? ($l['Text'] ?? '-'),
                'Quantity'    => $qty,
                'UnitPrice'   => $price,
                'LineTotal'   => $total,
            ];
        })->values()->toArray();

        if (!count($lines)) {
            $lines = [[
                'no'          => 1,
                'ItemCode'    => '-',
                'Description' => 'Item details not available',
                'Quantity'    => 1,
                'UnitPrice'   => (float)($header['DocTotal'] ?? 0),
                'LineTotal'   => (float)($header['DocTotal'] ?? 0),
            ]];
        }

        $subtotal = array_reduce($lines, fn($s, $r) => $s + (float)$r['LineTotal'], 0.0);
        $discount = 0.0;
        $vat      = 0.0;
        $grand    = $subtotal - $discount + $vat;

        // 4) ✅ LOGO: Embed Base64 (DOMPDF-safe)
        // Try multiple possible locations so you don't get stuck.
        $logoCandidates = [
            public_path('images/giib-logo.png'), // recommended
            public_path('giib-logo.png'),
            public_path('logo.png'),
            public_path('images/logo.png'),
        ];

        $logoDataUri = null;
        $logoPicked = null;

        foreach ($logoCandidates as $p) {
            if (is_file($p)) {
                $logoPicked = $p;
                $logoDataUri = 'data:image/png;base64,' . base64_encode(file_get_contents($p));
                break;
            }
        }

        \Log::info('🖼️ PDF logo debug', [
            'docEntry' => $docEntry,
            'candidates' => $logoCandidates,
            'picked' => $logoPicked,
            'exists_picked' => $logoPicked ? is_file($logoPicked) : false,
        ]);

        // 5) Data for blade
        $data = [
            'DocEntry'   => $header['DocEntry']   ?? '',
            'DocNum'     => $header['DocNum']     ?? '',
            'CardCode'   => $header['CardCode']   ?? '',
            'Customer'   => $header['CardName']   ?? '',
            'DocDate'    => substr($header['DocDate']    ?? '', 0, 10),
            'DocDueDate' => substr($header['DocDueDate'] ?? '', 0, 10),
            'PONum'      => $header['NumAtCard']  ?? '-',
            'Status'     => (($header['DocumentStatus'] ?? '') === 'bost_Open') ? 'Open' : 'Closed',
            'Currency'   => $header['DocCurrency'] ?? ($header['DocCurrencyCode'] ?? ''),

            'ShipToCode' => $header['ShipToCode'] ?? '',
            'PayToCode'  => $header['PayToCode']  ?? '',
            'ShipToText' => $shipToText,
            'BillToText' => $billToText,

            'Lines'      => $lines,
            'Subtotal'   => $subtotal,
            'Discount'   => $discount,
            'VAT'        => $vat,
            'Grand'      => $grand,

            // ✅ pass logo into blade
            'LogoDataUri' => $logoDataUri,
        ];

        // 6) Render PDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.order', $data)
            ->setPaper('a4')
            // These options help some environments (even if using base64)
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        $filename = "SalesOrder_{$data['DocNum']}.pdf";

        // ✅ Stream inline (open in browser, not forced download)
        return $pdf->stream($filename, ['Attachment' => 0]);

    } catch (\Throwable $e) {
        \Log::error('salesOrderPdf error', [
            'docEntry' => $docEntry,
            'ex'       => $e->getMessage(),
        ]);

        return response()->json([
            'status'  => 'error',
            'message' => 'Failed to generate sales order PDF',
            'details' => $e->getMessage(),
        ], 500);
    }
}

    // =====================================================
    // ------------------- INVOICE PDF (with addresses) ----
    // =====================================================
    public function invoicePdf($docEntry)
    {
        try {
            if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'PDF engine not installed. Run: composer require barryvdh/laravel-dompdf',
                ], 501);
            }

            // 🔹 Single call: full invoice (header + DocumentLines)
            $header = $this->callServiceLayer('get', "Invoices({$docEntry})");
            if (isset($header['error'])) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to fetch invoice header',
                    'details' => $header['details'] ?? $header,
                ], 500);
            }

            // AddressExtension → text
            $ae = $header['AddressExtension'] ?? [];
            $shipLines = [];
            if (!empty($ae['ShipToStreet']))  $shipLines[] = $ae['ShipToStreet'];
            if (!empty($ae['ShipToZipCode']) || !empty($ae['ShipToCity'])) {
                $shipLines[] = trim(($ae['ShipToZipCode'] ?? '') . ' ' . ($ae['ShipToCity'] ?? ''));
            }
            if (!empty($ae['ShipToCounty']) || !empty($ae['ShipToCountry'])) {
                $county  = trim($ae['ShipToCounty']  ?? '');
                $country = trim($ae['ShipToCountry'] ?? '');
                $shipLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
            }
            $shipToText = implode("\n", array_filter($shipLines));

            $billLines = [];
            if (!empty($ae['BillToStreet']))  $billLines[] = $ae['BillToStreet'];
            if (!empty($ae['BillToZipCode']) || !empty($ae['BillToCity'])) {
                $billLines[] = trim(($ae['BillToZipCode'] ?? '') . ' ' . ($ae['BillToCity'] ?? ''));
            }
            if (!empty($ae['BillToCounty']) || !empty($ae['BillToCountry'])) {
                $county  = trim($ae['BillToCounty']  ?? '');
                $country = trim($ae['BillToCountry'] ?? '');
                $billLines[] = trim($county . (strlen($county) && strlen($country) ? ', ' : '') . $country);
            }
            $billToText = implode("\n", array_filter($billLines));

            // 🔹 Lines directly from DocumentLines
            $rawLines = $header['DocumentLines'] ?? [];
            $lines = collect($rawLines)->map(function ($l, $i) {
                $qty   = (float)($l['Quantity']   ?? 0);
                $price = (float)($l['UnitPrice']  ?? ($l['Price'] ?? 0));
                $total = isset($l['LineTotal']) ? (float)$l['LineTotal'] : $qty * $price;

                return [
                    'no'          => $i + 1,
                    'ItemCode'    => $l['ItemCode'] ?? '-',
                    'Description' => $l['ItemDescription'] ?? ($l['Text'] ?? '-'),
                    'Quantity'    => $qty,
                    'UnitPrice'   => $price,
                    'LineTotal'   => $total,
                ];
            })->values()->toArray();

            if (!count($lines)) {
                $lines = [[
                    'no'          => 1,
                    'ItemCode'    => '-',
                    'Description' => 'Item details not available',
                    'Quantity'    => 1,
                    'UnitPrice'   => (float)($header['DocTotal'] ?? 0),
                    'LineTotal'   => (float)($header['DocTotal'] ?? 0),
                ]];
            }

            // Totals
            $subtotal = array_reduce($lines, fn($s, $r) => $s + (float)$r['LineTotal'], 0.0);
            $discount = 0.0;
            $vat      = 0.0;
            $grand    = $subtotal - $discount + $vat;

            // Data for blade (now includes addresses)
            $data = [
                'DocEntry'   => $header['DocEntry']   ?? '',
                'DocNum'     => $header['DocNum']     ?? '',
                'CardCode'   => $header['CardCode']   ?? '',
                'Customer'   => $header['CardName']   ?? '',
                'DocDate'    => substr($header['DocDate']    ?? '', 0, 10),
                'DocDueDate' => substr($header['DocDueDate'] ?? '', 0, 10),
                'PONum'      => $header['NumAtCard']  ?? '-',
                'Status'     => (($header['DocumentStatus'] ?? '') === 'bost_Open') ? 'Open' : 'Closed',
                'Currency'   => $header['DocCurrency'] ?? 'MYR',

                'ShipToCode' => $header['ShipToCode'] ?? '',
                'PayToCode'  => $header['PayToCode']  ?? '',
                'ShipToText' => $shipToText,
                'BillToText' => $billToText,

                'Lines'      => $lines,
                'Subtotal'   => $subtotal,
                'Discount'   => $discount,
                'VAT'        => $vat,
                'Grand'      => $grand,
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', $data)->setPaper('a4');
            return $pdf->download("Invoice_{$data['DocNum']}.pdf");


        } catch (\Throwable $e) {
            Log::error('invoicePdf error', ['docEntry' => $docEntry, 'ex' => $e->getMessage()]);
            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to generate invoice PDF',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
