<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return view('welcome');
});

// List all users
Route::get('/users', [UserController::class, 'index']);

// Create new user
Route::post('/users', [UserController::class, 'store']);
