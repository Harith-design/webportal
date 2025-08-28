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

// ------------------- Sales Order Routes -------------------
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

// ------------------- SAP B1 Business Partners CRUD Routes -------------------
Route::prefix('sap')->group(function () {
    // Read all business partners
    Route::get('/business-partners', [SapController::class, 'getBusinessPartners']);

    // Create a new business partner (customer or supplier)
    Route::post('/business-partners', [SapController::class, 'createBusinessPartner']);

    // Update an existing business partner
    Route::put('/business-partners/{CardCode}', [SapController::class, 'updateBusinessPartner']);

    // Delete a business partner
    Route::delete('/business-partners/{CardCode}', [SapController::class, 'deleteBusinessPartner']);
});
