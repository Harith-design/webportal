<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SapB1Service;

class SalesOrderController extends Controller
{
    protected SapB1Service $sap;

    public function __construct(SapB1Service $sap)
    {
        $this->sap = $sap;
    }

    /**
     * GET /api/sales-order/{docNum}
     */
    public function show($docNum)
    {
        try {
            $order = $this->sap->getSalesOrderByDocNum((int)$docNum);
            return response()->json($order);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
