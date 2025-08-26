<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SapController extends Controller
{
    // ----------------- DIRECT SQL INSERT (Existing) -----------------
    public function createBP(Request $request)
    {
        $request->validate([
            'CardCode' => 'required|string',
            'CardName' => 'required|string',
            'CardType' => 'required|string|in:C,L,S', // C=Customer, L=Lead, S=Supplier
        ]);

        try {
            DB::connection('sqlsrv_sap')->table('OCRD')->insert([
                'CardCode' => $request->CardCode,
                'CardName' => $request->CardName,
                'CardType' => $request->CardType,
            ]);

            return response()->json([
                'message'  => 'BP created successfully',
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

    // ----------------- SERVICE LAYER ENDPOINTS -----------------
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

    public function getSuppliers()
    {
        $suppliers = $this->fetchFromServiceLayer("BusinessPartners?\$filter=CardType eq 'S'");

        $cleaned = collect($suppliers)->map(function ($s) {
            return [
                'CardCode' => $s['CardCode'] ?? null,
                'CardName' => $s['CardName'] ?? null,
                'Phone'    => $s['Phone1'] ?? null,
                'City'     => $s['City'] ?? null,
                'Country'  => $s['Country'] ?? null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'count'  => $cleaned->count(),
            'data'   => $cleaned,
        ]);
    }

    public function getItems()
    {
        $items = $this->fetchFromServiceLayer("Items");

        $cleaned = collect($items)->map(function ($i) {
            return [
                'ItemCode' => $i['ItemCode'] ?? null,
                'ItemName' => $i['ItemName'] ?? null,
                'ForeignName' => $i['ForeignName'] ?? null,
                'OnHand'   => $i['OnHand'] ?? 0,
                'Price'    => $i['ItemPrices'][0]['Price'] ?? null,
                'Currency' => $i['ItemPrices'][0]['Currency'] ?? null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'count'  => $cleaned->count(),
            'data'   => $cleaned,
        ]);
    }
}
