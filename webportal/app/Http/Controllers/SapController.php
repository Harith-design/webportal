<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SapController extends Controller
{
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
    // ----------------- BUSINESS PARTNERS CRUD ------------
    // =====================================================

    public function getBusinessPartners()
    {
        $bps = $this->fetchFromServiceLayer("BusinessPartners");

        $cleaned = collect($bps)->map(fn($bp) => [
            'CardCode'  => $bp['CardCode'] ?? null,
            'CardName'  => $bp['CardName'] ?? null,
            'CardType'  => $bp['CardType'] ?? null,
            'GroupCode' => $bp['GroupCode'] ?? null,
            'Phone'     => $bp['Phone1'] ?? null,
            'City'      => $bp['City'] ?? null,
            'Country'   => $bp['Country'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'count'  => $cleaned->count(),
            'data'   => $cleaned,
        ]);
    }

    public function createBusinessPartner(Request $request)
    {
        $data = $request->validate([
            'CardCode'  => 'required|string',
            'CardName'  => 'required|string',
            'CardType'  => 'required|string|in:C,S,L', // C=Customer, S=Supplier, L=Lead
            'Phone'     => 'nullable|string',
            'City'      => 'nullable|string',
            'Country'   => 'nullable|string',
            'GroupCode' => 'nullable|integer',
        ]);

        // Convert request data to SAP payload
        $payload = [
            'CardCode'  => $data['CardCode'],
            'CardName'  => $data['CardName'],
            'CardType'  => $data['CardType'],
            'Phone1'    => $data['Phone'] ?? '',
            'City'      => $data['City'] ?? '',
            'Country'   => $data['Country'] ?? '',
        ];

        if (isset($data['GroupCode'])) {
            $payload['GroupCode'] = $data['GroupCode'];
        }

        try {
            $sessionId = $this->getSession();
            $response = Http::withoutVerifying()->withHeaders([
                'Cookie' => "B1SESSION=$sessionId",
            ])->post("https://172.27.31.227:50000/b1s/v1/BusinessPartners", $payload);

            if ($response->failed()) {
                return response()->json([
                    'error'   => 'Failed to create Business Partner',
                    'details' => $response->body(),
                    'payload' => $payload, // include payload for debugging
                ], $response->status());
            }

            return response()->json([
                'status' => 'success',
                'data'   => $response->json(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create Business Partner',
                'error'   => $e->getMessage(),
                'payload' => $payload, // include payload for debugging
            ], 500);
        }
    }

    public function updateBusinessPartner(Request $request, $CardCode)
    {
        $data = $request->only(['CardName', 'Phone', 'City', 'Country', 'CardType', 'GroupCode']);
        $payload = array_filter([
            'CardName'  => $data['CardName'] ?? null,
            'Phone1'    => $data['Phone'] ?? null,
            'City'      => $data['City'] ?? null,
            'Country'   => $data['Country'] ?? null,
            'CardType'  => $data['CardType'] ?? null,
            'GroupCode' => $data['GroupCode'] ?? null,
        ]);

        $sessionId = $this->getSession();
        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->patch("https://172.27.31.227:50000/b1s/v1/BusinessPartners('$CardCode')", $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to update Business Partner',
                'details' => $response->body(),
                'payload' => $payload,
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }

    public function deleteBusinessPartner($CardCode)
    {
        $sessionId = $this->getSession();
        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->delete("https://172.27.31.227:50000/b1s/v1/BusinessPartners('$CardCode')");

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to delete Business Partner',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status'  => 'success',
            'message' => "Business Partner $CardCode deleted successfully",
        ]);
    }
}
