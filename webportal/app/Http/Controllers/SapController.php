<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

    private function login()
    {
        $response = Http::withOptions(['verify' => config('sapb1.verify_ssl')])
            ->post($this->baseUrl . '/Login', [
                'CompanyDB' => $this->companyDb,
                'UserName'  => $this->username,
                'Password'  => $this->password,
            ]);

        if ($response->failed()) {
            return null;
        }

        $session = $response->json();
        $cookies = $response->cookies();

        return [
            'SessionId' => $session['SessionId'] ?? null,
            'RouteId'   => $cookies->getCookieByName('ROUTEID')->getValue() ?? null,
        ];
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
            ->withHeaders([
                'Cookie' => $cookieHeader,
            ]);

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
    // ----------------- BUSINESS PARTNERS -----------------
    // =====================================================
    public function getBusinessPartners()
    {
        $result = $this->callServiceLayer('get', 'BusinessPartners?$top=50&$select=CardCode,CardName');

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch business partners',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    public function createBusinessPartner(Request $request)
    {
        $result = $this->callServiceLayer('post', 'BusinessPartners', $request->all());

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to create business partner',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    public function updateBusinessPartner(Request $request, $CardCode)
    {
        $result = $this->callServiceLayer('put', "BusinessPartners('$CardCode')", $request->all());

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to update business partner',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    public function deleteBusinessPartner($CardCode)
    {
        $result = $this->callServiceLayer('delete', "BusinessPartners('$CardCode')");

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to delete business partner',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json(['status' => 'success', 'message' => 'Business partner deleted']);
    }

    // =====================================================
    // ---------------------- INVOICES ---------------------
    // =====================================================
    public function getInvoice($DocEntry)
    {
        $result = $this->callServiceLayer('get', "Invoices($DocEntry)");

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch invoice',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    public function createInvoice(Request $request)
    {
        $result = $this->callServiceLayer('post', 'Invoices', $request->all());

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to create invoice',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    // =====================================================
    // ------------------- SALES ORDERS --------------------
    // =====================================================
    public function getSalesOrder($DocEntry)
    {
        $result = $this->callServiceLayer('get', "Orders($DocEntry)");

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to fetch sales order',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    public function createSalesOrder(Request $request)
    {
        $result = $this->callServiceLayer('post', 'Orders', $request->all());

        if (isset($result['error'])) {
            return response()->json([
                'error'   => 'Failed to create sales order',
                'details' => $result['details'],
            ], $result['status']);
        }

        return response()->json($result);
    }

    // =====================================================
    // ---------------------- ITEMS ------------------------
    // =====================================================
    public function getItems(Request $request)
    {
        $search = strtoupper(trim($request->query('search', '')));
        $top = 100;

        $endpoint = "Items?\$top={$top}&\$select=ItemCode,ItemName";

        if (!empty($search)) {
            $escapedSearch = str_replace("'", "''", $search);
            $endpoint .= "&\$filter=startswith(ItemCode,'{$escapedSearch}')";
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
                'ItemCode' => $item['ItemCode'] ?? '',
                'ItemName' => $item['ItemName'] ?? '',
            ];
        })->toArray();

        return response()->json([
            'status' => 'success',
            'count'  => count($itemsMapped),
            'data'   => $itemsMapped,
        ]);
    }
}
