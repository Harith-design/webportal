<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SapController;
use Illuminate\Support\Facades\Http; // added for debug login

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are for your backend API (tested via Postman, curl, etc.)
|--------------------------------------------------------------------------
*/

// Default Laravel example
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// --- Sales Order Routes ---
Route::get('/sales-order/{docNum}', [SalesOrderController::class, 'show']);

// --- Debug SAP Login Route ---
Route::get('/sap-debug-login', function () {
    $payload = [
        'CompanyDB' => config('sapb1.company_db'),
        'UserName'  => config('sapb1.username'),
        'Password'  => config('sapb1.password'),
    ];

    $res = Http::withOptions(['verify' => config('sapb1.verify_ssl')])
        ->post(config('sapb1.base_url') . '/Login', $payload);

    return [
        'payload_sent' => $payload,
        'response'     => $res->json(),
        'status'       => $res->status(),
    ];
});

// ----------------- SAP B1 Customers (CRUD) -----------------
Route::prefix('sap')->group(function () {
    // Customers
    Route::get('/customers', [SapController::class, 'getCustomers']);               // Read all
    Route::post('/customers', [SapController::class, 'createCustomer']);            // Create
    Route::put('/customers/{CardCode}', [SapController::class, 'updateCustomer']);  // Update
    Route::delete('/customers/{CardCode}', [SapController::class, 'deleteCustomer']); // Delete
});
