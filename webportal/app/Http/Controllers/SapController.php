<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

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
            case 'delete':
                $response = $http->delete($url);
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

    // =====================================================
    // ---------------------- ITEMS ------------------------
    // =====================================================
    public function getItems(Request $request)
    {
        $search = strtoupper(trim($request->query('search', '')));
        $top = 50;

        $endpoint = "Items?\$top={$top}&\$select=ItemCode,ItemName";

        if (!empty($search)) {
            $escapedSearch = str_replace("'", "''", $search);
            $endpoint .= "&\$filter=startswith(ItemCode,'{$escapedSearch}') or startswith(ItemName,'{$escapedSearch}')";
        }

        $result = $this->callServiceLayer('get', $endpoint);

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch items',
                'details' => $result['details'],
            ], $result['status']);
        }

        $items = $result['value'] ?? [];

        $itemsMapped = collect($items)->map(function ($item) {
            return [
                'ItemCode'    => $item['ItemCode'] ?? '',
                'Description' => $item['ItemName'] ?? '',
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($itemsMapped),
            'data'   => $itemsMapped,
        ]);
    }

    // =====================================================
    // ------------------- SALES ORDERS UDF --------------------
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
                if ($line['ItemCode'] === $itemCode) {
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
            'docEntry'     => $o['DocEntry'] ?? '',   // <-- added docEntry
            'salesNo'      => $o['DocNum'] ?? '',
            'poNo'         => $o['NumAtCard'] ?? '',
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
    // ✅ Expand more fields if you want (UDFs, etc.)
    $endpoint = "Orders({$docEntry})?\$select=DocEntry,DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal&\$expand=DocumentLines(\$select=ItemCode,ItemDescription,Quantity,UnitPrice,LineTotal,TaxCode)";

    $result = $this->callServiceLayer('get', $endpoint);

    if (isset($result['error'])) {
        return response()->json([
            'error' => 'Failed to fetch Sales Order details',
            'details' => $result['details'] ?? $result,
        ], $result['status'] ?? 500);
    }

    // ✅ Normalize and safely extract data
    $lines = collect($result['DocumentLines'] ?? [])->map(function ($line) {
        return [
            'ItemCode'    => $line['ItemCode'] ?? '',
            'Description' => $line['ItemDescription'] ?? '',
            'Quantity'    => isset($line['Quantity']) ? (float)$line['Quantity'] : 0, // ✅ ensure capital Q
            'UnitPrice'   => isset($line['UnitPrice']) ? (float)$line['UnitPrice'] : 0,
            'LineTotal'   => isset($line['LineTotal']) ? (float)$line['LineTotal'] : (
                (isset($line['Quantity'], $line['UnitPrice']))
                    ? (float)$line['Quantity'] * (float)$line['UnitPrice']
                    : 0
            ),
            'TaxCode'     => $line['TaxCode'] ?? '',
        ];
    })->toArray();

    return response()->json([
        'status' => 'success',
        'data'   => [
            'DocEntry'  => $result['DocEntry'] ?? '',
            'DocNum'    => $result['DocNum'] ?? '',
            'CardCode'  => $result['CardCode'] ?? '',
            'Customer'  => $result['CardName'] ?? '',
            'DocDate'   => $result['DocDate'] ?? '',
            'DocDueDate'=> $result['DocDueDate'] ?? '',
            'DocTotal'  => $result['DocTotal'] ?? 0,
            'Lines'     => $lines,
        ],
    ]);
}
    // =====================================================
    // ------------------- INVOICE LIST --------------------
    // =====================================================
    public function getInvoices(Request $request)
    {
        $top = 50;
        $search = strtoupper(trim($request->query('search', '')));

        $endpoint = "Invoices?\$orderby=DocDate desc&\$top={$top}&\$select=DocEntry,DocNum,NumAtCard,CardName,DocDate,DocDueDate,DocTotal,DocCurrency,DocumentStatus,CardCode";

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
            return [
                'invoiceNo'    => $inv['DocNum'] ?? '',
                'poNo'         => $inv['NumAtCard'] ?? '',
                'customer'     => $inv['CardName'] ?? '',
                'customerCode' => $inv['CardCode'] ?? ($inv['CardName'] ?? ''),
                'postingDate'  => substr($inv['DocDate'] ?? '', 0, 10),
                'dueDate'      => substr($inv['DocDueDate'] ?? '', 0, 10),
                'total'        => $inv['DocTotal'] ?? 0,
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
    // ------------------- CREATE SALES ORDER -------------
    // =====================================================
    public function createSalesOrder(Request $request)
    {
        $validated = $request->validate([
            'CardCode' => 'required|string',
            'DocDueDate' => 'required|date',
            'DocumentLines' => 'required|array|min:1',
            'DocumentLines.*.ItemCode' => 'required|string',
            'DocumentLines.*.Quantity' => 'required|numeric|min:1',
            'DocumentLines.*.UnitPrice' => 'required|numeric|min:0',
        ]);

        $payload = [
            'CardCode' => $validated['CardCode'],
            'DocDueDate' => $validated['DocDueDate'],
            'DocumentLines' => collect($validated['DocumentLines'])->map(function ($line) {
                return [
                    'ItemCode'  => $line['ItemCode'],
                    'Quantity'  => $line['Quantity'],
                    'UnitPrice' => $line['UnitPrice'],
                    'U_Weight'  => $line['Weight'] ?? null,
                ];
            })->values()->toArray(),
        ];

        $result = $this->callServiceLayer('post', 'Orders', $payload);

        if (isset($result['error'])) {
            Log::error('❌ Failed to create sales order', ['error' => $result]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create Sales Order',
                'details' => $result['details'] ?? null,
            ], $result['status'] ?? 500);
        }

        Log::info('✅ Sales Order created successfully', ['result' => $result]);

        return response()->json([
            'status' => 'success',
            'message' => 'Sales Order created successfully',
            'data' => $result,
        ], 201);
    }

    // =====================================================
    // ------------------- GET SINGLE INVOICE -------------
    // =====================================================
    public function getInvoice(Request $request)
    {
        $top = 50;
        $search = strtoupper(trim($request->query('search', '')));

        $endpoint = "Invoices?\$orderby=DocDate desc&\$top={$top}&\$select=DocEntry,DocNum,NumAtCard,CardName,DocDate,DocDueDate,DocTotal,DocCurrency,DocumentStatus,CardCode";

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
            return [
                'invoiceNo'    => $inv['DocNum'] ?? '',
                'poNo'         => $inv['NumAtCard'] ?? '',
                'customer'     => $inv['CardName'] ?? '',
                'customerCode' => $inv['CardCode'] ?? ($inv['CardName'] ?? ''),
                'postingDate'  => substr($inv['DocDate'] ?? '', 0, 10),
                'dueDate'      => substr($inv['DocDueDate'] ?? '', 0, 10),
                'total'        => $inv['DocTotal'] ?? 0,
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
}
