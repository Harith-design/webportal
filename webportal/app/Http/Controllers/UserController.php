<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // ==========================================================
    // 🧩 List all users
    // ==========================================================
    public function index()
    {
        return response()->json(User::all());
    }

    // ==========================================================
    // 🧩 Create a new user
    // ==========================================================
    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
            'cardcode'  => 'nullable|string',
            'cardname'  => 'nullable|string',
        ]);

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => bcrypt($request->password),
            'cardcode'  => $request->cardcode ?? null,
            'cardname'  => $request->cardname ?? null,
        ]);

        return response()->json($user, 201);
    }

    // ==========================================================
    // 🧩 Update an existing user
    // ==========================================================
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Validation: all fields optional
        $request->validate([
            'name'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|unique:users,email,' . $user->id,
            'contact_no' => 'nullable|string|max:50',
            'cardcode'   => 'nullable|string',
            'cardname'   => 'nullable|string',
            'password'   => 'nullable|string|min:6',
        ]);

        // Update only provided fields, keep existing otherwise
        $user->update([
            'name'       => $request->name ?? $user->name,
            'email'      => $request->email ?? $user->email,
            'contact_no' => $request->contact_no ?? $user->contact_no,
            'password'   => $request->password ? bcrypt($request->password) : $user->password,
            'cardcode'   => $request->cardcode ?? $user->cardcode,
            'cardname'   => $request->cardname ?? $user->cardname,
        ]);

        return response()->json($user, 200);
    }

    // ==========================================================
    // 🧩 Delete a user
    // ==========================================================
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(null, 204);
    }

    // ==========================================================
    // 🧩 Show user by ID
    // ==========================================================
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    // ==========================================================
    // 🧩 Get current logged-in user
    // ==========================================================
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
