<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use App\Mail\CustomerOrderRequestMail;

use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SapController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Http;

// ✅ Catalog Controller
use App\Http\Controllers\CatalogController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

/**
 * Simple health-check / connectivity test
 * GET https://giibportal.cloud/api/ping  →  {"pong": true}
 */
Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

/**
 * ✅ STEP 1.2 — Test Sales Notification Email
 * TEMPORARY route (can delete after testing)
 */
Route::get('/test-sales-email', function () {

    $emails = array_filter(
        array_map('trim', explode(',', env('SALES_NOTIFY_EMAILS', '')))
    );

    if (empty($emails)) {
        return response()->json([
            'error' => 'SALES_NOTIFY_EMAILS is empty'
        ], 400);
    }

    Mail::to($emails)->send(new CustomerOrderRequestMail([
        'customer_name' => 'TEST CUSTOMER',
        'requested_delivery_date' => now()->toDateString(),
        'lines' => [
            ['itemCode' => 'TEST-ITEM-001', 'quantity' => 5],
            ['itemCode' => 'TEST-ITEM-002', 'quantity' => 2],
        ],
    ]));

    return response()->json([
        'ok' => true,
        'sent_to' => $emails
    ]);
});

// ------------------- Authentication Routes -------------------
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ------------------- CATALOG (PUBLIC) -------------------
// ✅ STEP 1 — list general products (compound codes)
Route::get('/catalog/products', [CatalogController::class, 'products']);

// ✅ STEP 2 — get dropdown options for a selected compound
Route::get('/catalog/products/{compoundCode}/options', [CatalogController::class, 'options']);

// ✅ STEP 3 — resolve selected specs to exact ItemCode
Route::get('/catalog/resolve', [CatalogController::class, 'resolveItem']);

Route::get('/catalog/item/{itemCode}', [CatalogController::class, 'itemByCode']);


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
    Route::middleware('role:user,admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::post('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // ✅ IMPORTANT: Only protect the CREATE sales order endpoint
    Route::prefix('sap')->group(function () {
        Route::post('/sales-orders', [SapController::class, 'createSalesOrder']);

        // ✅ NEW: Approve Pricing (update U_PriceperKG on RDR1 lines)
        // Frontend calls: POST /api/sap/orders/{docEntry}/price-per-kg  with { lines: [{lineNum, pricePerKg}] }
        Route::post('/orders/{docEntry}/price-per-kg', [SapController::class, 'updateSalesOrderPricePerKg']);
    });

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

// ------------------- SAP B1 Routes -------------------
// ✅ Public read routes so portal pages can load data
Route::prefix('sap')->group(function () {

    // ---------------- Items ----------------
    Route::get('/items', [SapController::class, 'getItems']);
    Route::get('/items/{itemCode}', [SapController::class, 'getItemByCode']);

    // ---------------- Business Partners ----------------
    Route::get('/business-partners', [SapController::class, 'getBusinessPartners']);
    Route::get('/business-partners/{cardcode}', [SapController::class, 'getBusinessPartnerByCode']);
    Route::get('/business-partners/{cardcode}/addresses', [SapController::class, 'getBusinessPartnerAddresses']);

    Route::post('/business-partners', [SapController::class, 'createBusinessPartner']);
    Route::put('/business-partners/{CardCode}', [SapController::class, 'updateBusinessPartner']);
    Route::delete('/business-partners/{CardCode}', [SapController::class, 'deleteBusinessPartner']);

    // ---------------- Invoices ----------------
    Route::get('/invoices', [SapController::class, 'getInvoices']);
    Route::get('/invoices/{docEntry}/details', [SapController::class, 'getInvoiceDetails']);
    Route::get('/invoices/{docEntry}/documentlines', [SapController::class, 'getInvoiceDocumentLines']);
    Route::get('/invoices/{docEntry}/pdf', [SapController::class, 'invoicePdf']);

    // ---------------- Orders ----------------
    Route::get('/orders', [SapController::class, 'getSalesOrders']);
    Route::get('/orders/{docEntry}', [SapController::class, 'getSalesOrderDetails']);
    Route::get('/sales-orders/{docEntry}/pdf', [SapController::class, 'salesOrderPdf']);

    // ❌ DO NOT put Route::post('/sales-orders') here (already protected above)
});
