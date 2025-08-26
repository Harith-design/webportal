<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SapController extends Controller
{
    // ----------------- DIRECT SQL INSERT (Legacy Example) -----------------
    public function createBP(Request $request)
    {
        $request->validate([
            'CardCode' => 'required|string',
            'CardName' => 'required|string',
            'CardType' => 'required|string|in:C,L,S',
        ]);

        try {
            DB::connection('sqlsrv_sap')->table('OCRD')->insert([
                'CardCode' => $request->CardCode,
                'CardName' => $request->CardName,
                'CardType' => $request->CardType,
            ]);

            return response()->json([
                'message'  => 'BP created successfully (direct SQL)',
                'CardCode' => $request->CardCode,
                'CardName' => $request->CardName,
                'CardType' => $request->CardType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create BP',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // ----------------- SERVICE LAYER SESSION -----------------
    private function getSession()
    {
        return Cache::remember('b1session', 25 * 60, function () {
            $loginResponse = Http::withoutVerifying()->post(
                'https://172.27.31.227:50000/b1s/v1/Login',
                [
                    'CompanyDB' => 'GIIBLIVEDB',
                    'UserName'  => 'manager',
                    'Password'  => 'G@tech123',
                ]
            );

            if ($loginResponse->failed()) {
                throw new \Exception('SAP B1 login failed: ' . $loginResponse->body());
            }

            return $loginResponse->json()['SessionId'];
        });
    }

    // ----------------- GENERIC FETCH METHOD -----------------
    private function fetchFromServiceLayer($endpoint)
    {
        $sessionId = $this->getSession();

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->get("https://172.27.31.227:50000/b1s/v1/$endpoint");

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to fetch data',
                'details' => $response->body(),
            ], $response->status());
        }

        return $response->json()['value'] ?? [];
    }

    // =====================================================
    // ----------------- CUSTOMERS CRUD --------------------
    // =====================================================

    public function getCustomers()
    {
        $customers = $this->fetchFromServiceLayer("BusinessPartners?\$filter=CardType eq 'C'");

        $cleaned = collect($customers)->map(function ($c) {
            return [
                'CardCode' => $c['CardCode'] ?? null,
                'CardName' => $c['CardName'] ?? null,
                'Phone'    => $c['Phone1'] ?? null,
                'City'     => $c['City'] ?? null,
                'Country'  => $c['Country'] ?? null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'count'  => $cleaned->count(),
            'data'   => $cleaned,
        ]);
    }

    public function createCustomer(Request $request)
    {
        $sessionId = $this->getSession();

        $data = $request->validate([
            'CardCode' => 'required|string',
            'CardName' => 'required|string',
            'Phone'    => 'nullable|string',
            'City'     => 'nullable|string',
            'Country'  => 'nullable|string',
        ]);

        $payload = [
            'CardCode' => $data['CardCode'],
            'CardName' => $data['CardName'],
            'CardType' => 'C',
            'Phone1'   => $data['Phone'] ?? '',
            'City'     => $data['City'] ?? '',
            'Country'  => $data['Country'] ?? '',
        ];

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->post("https://172.27.31.227:50000/b1s/v1/BusinessPartners", $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to create customer',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }

    public function updateCustomer(Request $request, $cardCode)
    {
        $sessionId = $this->getSession();

        $data = $request->only(['CardName', 'Phone', 'City', 'Country']);

        $payload = array_filter([
            'CardName' => $data['CardName'] ?? null,
            'Phone1'   => $data['Phone'] ?? null,
            'City'     => $data['City'] ?? null,
            'Country'  => $data['Country'] ?? null,
        ]);

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->patch("https://172.27.31.227:50000/b1s/v1/BusinessPartners('$cardCode')", $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to update customer',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }

    public function deleteCustomer($cardCode)
    {
        $sessionId = $this->getSession();

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->delete("https://172.27.31.227:50000/b1s/v1/BusinessPartners('$cardCode')");

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to delete customer',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'message' => "Customer $cardCode deleted successfully"
        ]);
    }

    // =====================================================
    // ----------------- ITEMS CRUD ------------------------
    // =====================================================

    public function getItems()
    {
        $items = $this->fetchFromServiceLayer("Items");

        $cleaned = collect($items)->map(function ($i) {
            return [
                'ItemCode'    => $i['ItemCode'] ?? null,
                'ItemName'    => $i['ItemName'] ?? null,
                'ForeignName' => $i['ForeignName'] ?? null,
                'OnHand'      => $i['OnHand'] ?? 0,
                'Price'       => $i['ItemPrices'][0]['Price'] ?? null,
                'Currency'    => $i['ItemPrices'][0]['Currency'] ?? null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'count'  => $cleaned->count(),
            'data'   => $cleaned,
        ]);
    }

    public function createItem(Request $request)
    {
        $sessionId = $this->getSession();

        $data = $request->validate([
            'ItemCode' => 'required|string',
            'ItemName' => 'required|string',
            'ForeignName' => 'nullable|string',
        ]);

        $payload = [
            'ItemCode'    => $data['ItemCode'],
            'ItemName'    => $data['ItemName'],
            'ForeignName' => $data['ForeignName'] ?? '',
            'ItemType'    => 'itItems',
        ];

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->post("https://172.27.31.227:50000/b1s/v1/Items", $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to create item',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }

    public function updateItem(Request $request, $itemCode)
    {
        $sessionId = $this->getSession();

        $data = $request->only(['ItemName', 'ForeignName']);

        $payload = array_filter([
            'ItemName'    => $data['ItemName'] ?? null,
            'ForeignName' => $data['ForeignName'] ?? null,
        ]);

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->patch("https://172.27.31.227:50000/b1s/v1/Items('$itemCode')", $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to update item',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }

    public function deleteItem($itemCode)
    {
        $sessionId = $this->getSession();

        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->delete("https://172.27.31.227:50000/b1s/v1/Items('$itemCode')");

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to delete item',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'message' => "Item $itemCode deleted successfully"
        ]);
    }
}
