<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SapController extends Controller
{
    public function createBP(Request $request)
    {
        // Validate input
        $request->validate([
            'CardCode' => 'required|string',
            'CardName' => 'required|string',
            'CardType' => 'required|string|in:C,L,S', // C=Customer, L=Lead, S=Supplier
        ]);

        // Insert into SAP B1 OCRD table
        $inserted = DB::connection('sqlsrv_sap')->table('OCRD')->insert([
            'CardCode' => $request->CardCode,
            'CardName' => $request->CardName,
            'CardType' => $request->CardType,
        ]);

        if ($inserted) {
            return response()->json(['message' => 'BP created successfully']);
        } else {
            return response()->json(['message' => 'Failed to create BP'], 500);
        }
    }
}
