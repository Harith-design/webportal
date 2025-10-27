<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SapController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Auth; 
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ------------------- Authentication Routes -------------------
// Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ------------------- Protected Routes (requires auth) -------------------
Route::middleware('auth:sanctum')->group(function () {

    // 🔹 Current logged-in user
    Route::get('/user/me', [UserController::class, 'me']);

    // wan test
    Route::get('/user/company', function(Request $request){
        return response()->json($request->user());
    });
    // wan test end
    
    // 🔹 Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // ------------------- Users -------------------
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']); // 🔹 For profile save
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
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
Route::prefix('sap')->group(function () {

    // ---------------- Items ----------------
    Route::get('/items', [SapController::class, 'getItems']); // 🔹 With pagination

    // ---------------- Business Partners ----------------
    Route::get('/business-partners', [SapController::class, 'getBusinessPartners']);
    Route::post('/business-partners', [SapController::class, 'createBusinessPartner']);
    Route::put('/business-partners/{CardCode}', [SapController::class, 'updateBusinessPartner']);
    Route::delete('/business-partners/{CardCode}', [SapController::class, 'deleteBusinessPartner']);

    // ---------------- Invoices ----------------
   // ---------------- Invoices ----------------
    // In api.php
    Route::get('/invoices', [SapController::class, 'getInvoices']); // list like orders
    Route::get('/invoices/{DocEntry}', [SapController::class, 'getInvoice']); // single invoice


    // ---------------- Sales Orders ----------------
    Route::get('/orders', [SapController::class, 'getSalesOrders']);
    Route::get('/orders/{docEntry}', [SapController::class, 'getSalesOrderDetails']);


    // ------- Create Sales Order (for Place Order Page) -------------------
    Route::post('/sales-orders', [SapController::class, 'createSalesOrder']);
});
