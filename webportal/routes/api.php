<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SapController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ------------------- Authentication Routes -------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// ------------------- Sales Order Routes (internal app logic) -------------------
Route::prefix('sales-order')->group(function () {
    Route::get('/{docNum}', [SalesOrderController::class, 'show']);
});

// ------------------- Debug SAP B1 Login Route -------------------
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

// ------------------- SAP B1 Routes -------------------
Route::prefix('sap')->middleware('auth:sanctum')->group(function () {
    // ---------------- Business Partners ----------------
    Route::get('/business-partners', [SapController::class, 'getBusinessPartners']);
    Route::post('/business-partners', [SapController::class, 'createBusinessPartner']);
    Route::put('/business-partners/{CardCode}', [SapController::class, 'updateBusinessPartner']);
    Route::delete('/business-partners/{CardCode}', [SapController::class, 'deleteBusinessPartner']);

    // ---------------- Invoices ----------------
    Route::get('/invoices/{DocEntry}', [SapController::class, 'getInvoice']);  // Get single invoice
    Route::post('/invoices', [SapController::class, 'createInvoice']);         // Create invoice

    // ---------------- Sales Orders ----------------
    Route::get('/sales-orders/{DocEntry}', [SapController::class, 'getSalesOrder']); // Get sales order by DocEntry
    Route::post('/sales-orders', [SapController::class, 'createSalesOrder']);        // Create sales order
});
