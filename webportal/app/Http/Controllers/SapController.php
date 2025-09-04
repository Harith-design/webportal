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
                config('sapb1.base_url') . '/Login',
                [
                    'CompanyDB' => config('sapb1.company_db'),
                    'UserName'  => config('sapb1.username'),
                    'Password'  => config('sapb1.password'),
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
        ])->get(config('sapb1.base_url') . "/$endpoint");

        if ($response->failed()) {
            return [
                'error'   => true,
                'status'  => $response->status(),
                'details' => $response->body(),
            ];
        }

        return $response->json();
    }

    // =====================================================
    // ----------------- INVOICES (READ ONLY) --------------
    // =====================================================
    private function transformInvoice($sapInvoice)
    {
        return [
            'id'          => $sapInvoice['DocEntry'] ?? null,
            'ponum'       => $sapInvoice['NumAtCard'] ?? '',
            'invoiceDate' => $sapInvoice['DocDate'] ?? '',
            'dueDate'     => $sapInvoice['DocDueDate'] ?? '',
            'status'      => ($sapInvoice['DocumentStatus'] ?? 'bost_Open') === 'bost_Open' ? 'Open' : 'Closed',
            'billTo'      => $sapInvoice['CardName'] ?? '',
            'shipTo'      => $sapInvoice['Address'] ?? '',
            'currency'    => $sapInvoice['DocCurrency'] ?? 'RM',
            'discount'    => $sapInvoice['DiscountPercent'] ?? 0,
            'vat'         => $sapInvoice['VatSum'] ?? 0,
            'items'       => collect($sapInvoice['DocumentLines'] ?? [])->map(function ($line) {
                return [
                    'name'  => $line['ItemCode'] ?? '',
                    'desc'  => $line['Dscription'] ?? '',
                    'qty'   => $line['Quantity'] ?? 0,
                    'price' => $line['Price'] ?? 0,
                ];
            })->toArray(),
        ];
    }

    public function getInvoice($DocEntry)
    {
        $result = $this->fetchFromServiceLayer("Invoices($DocEntry)");

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch invoice',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $this->transformInvoice($result),
        ]);
    }

    // =====================================================
    // ----------------- SALES ORDERS ----------------------
    // =====================================================
    private function transformSalesOrder($sapOrder)
    {
        return [
            'id'           => $sapOrder['DocEntry'] ?? null,
            'ponum'        => $sapOrder['NumAtCard'] ?? '',
            'orderDate'    => $sapOrder['DocDate'] ?? '',
            'deliveryDate' => $sapOrder['DocDueDate'] ?? '',
            'status'       => ($sapOrder['DocumentStatus'] ?? 'bost_Open') === 'bost_Open' ? 'Open' : 'Closed',
            'customer'     => $sapOrder['CardName'] ?? '',
            'shipTo'       => $sapOrder['Address'] ?? '',
            'currency'     => $sapOrder['DocCurrency'] ?? 'RM',
            'discount'     => $sapOrder['DiscountPercent'] ?? 0,
            'vat'          => $sapOrder['VatSum'] ?? 0,
            'items'        => collect($sapOrder['DocumentLines'] ?? [])->map(function ($line) {
                return [
                    'name'  => $line['ItemCode'] ?? '',
                    'desc'  => $line['Dscription'] ?? '',
                    'qty'   => $line['Quantity'] ?? 0,
                    'price' => $line['Price'] ?? 0,
                ];
            })->toArray(),
            'total'        => $sapOrder['DocTotal'] ?? 0,
        ];
    }

    public function getSalesOrder($DocEntry)
    {
        $result = $this->fetchFromServiceLayer("Orders($DocEntry)");

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch Sales Order',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $this->transformSalesOrder($result),
        ]);
    }

    // ----------------- CREATE SALES ORDER -----------------
    public function createSalesOrder(Request $request)
    {
        $payload = [
            'CardCode'    => $request->input('CardCode'),
            'DocDate'     => $request->input('DocDate'),
            'DocDueDate'  => $request->input('DocDueDate'),
            'DocCurrency' => $request->input('DocCurrency', 'RM'),
            'DocumentLines' => collect($request->input('items', []))->map(function ($item) {
                return [
                    'ItemCode'  => $item['name'] ?? '',
                    'Quantity'  => $item['qty'] ?? 0,
                    'Price'     => $item['price'] ?? 0,
                    'Dscription'=> $item['desc'] ?? '',
                ];
            })->toArray(),
            'DiscountPercent' => $request->input('discount', 0),
        ];

        $sessionId = $this->getSession();
        $response = Http::withoutVerifying()->withHeaders([
            'Cookie' => "B1SESSION=$sessionId",
        ])->post(config('sapb1.base_url') . '/Orders', $payload);

        if ($response->failed()) {
            return response()->json([
                'error'   => 'Failed to create Sales Order',
                'details' => $response->body(),
            ], $response->status());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $response->json(),
        ]);
    }
}
