<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return view('welcome');
});

// List all users
Route::get('/users', [UserController::class, 'index']);

// Create new user
Route::post('/users', [UserController::class, 'store']);

// ----------------- SAP B1 Test Route -----------------
Route::get('/test-sap', function() {
    try {
        $partners = DB::connection('sqlsrv_sap')
            ->table('OCRD') // SAP B1 Business Partners table
            ->select('CardCode', 'CardName')
            ->limit(20)
            ->get();

        return response()->json($partners);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage()
        ]);
    }
});
