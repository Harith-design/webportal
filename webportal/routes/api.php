<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SapController;

// ----------------- Public User Routes -----------------
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// ----------------- Authentication Routes -----------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ----------------- Public Password Routes -----------------
Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// ----------------- Protected Routes (require Sanctum token) -----------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);   // get logged in user details
    Route::post('/logout', [AuthController::class, 'logout']); // logout
    Route::get('/me', [UserController::class, 'me']);       // alternative way to fetch user
    Route::post('/orders', [OrderController::class, 'store']);

    // ----------------- SAP B1 Routes (requires token) -----------------
    Route::post('/sap/bp', [SapController::class, 'createBP'])
        ->name('sap.bp'); // optional: naming route for clarity
});

// ----------------- Temporary Public SAP B1 Test Route -----------------
Route::post('/sap/bp/test', [SapController::class, 'createBP'])
    ->withoutMiddleware('auth:sanctum'); // public route for testing without token
