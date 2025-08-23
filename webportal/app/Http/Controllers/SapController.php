<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SapController extends Controller
{
    public function createBP(Request $request)
    {
        // Simple validation
        $request->validate([
            'CardCode' => 'required|string',
            'CardName' => 'required|string',
            'CardType' => 'required|string|in:C,L,S', // C=Customer, L=Lead, S=Supplier
        ]);

        try {
            // Attempt to insert into SAP B1 OCRD table
            DB::connection('sqlsrv_sap')->table('OCRD')->insert([
                'CardCode' => $request->CardCode,
                'CardName' => $request->CardName,
                'CardType' => $request->CardType,
            ]);

            return response()->json([
                'message' => 'BP created successfully',
                'CardCode' => $request->CardCode,
                'CardName' => $request->CardName,
                'CardType' => $request->CardType
            ]);

        } catch (\Exception $e) {
            // Return error as JSON
            return response()->json([
                'message' => 'Failed to create BP',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
