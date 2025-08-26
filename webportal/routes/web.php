<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SapController;

Route::get('/', function () {
    return view('welcome');
});

// ----------------- SAP B1 Routes -----------------

// Direct SQL Insert (Create Business Partner)
Route::post('/sap/create-bp', [SapController::class, 'createBP']);

// Service Layer - Get Customers
Route::get('/sap/customers', [SapController::class, 'getCustomers']);
