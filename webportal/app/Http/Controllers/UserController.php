<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
            'cardcode'  => 'nullable|string',
            'cardname'  => 'nullable|string',
            'contact'   => 'nullable|string|max:50',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = [
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => bcrypt($request->password),
            'cardcode'  => $request->cardcode ?? null,
            'cardname'  => $request->cardname ?? null,
            'contact_no' => $request->contact ?? null,
        ];

        // ✅ Handle profile picture upload (optional)
        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $data['profile_picture'] = $path;
        }

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // ✅ Base validation (no password required)
        $rules = [
            'name'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|unique:users,email,' . $user->id,
            'contact'    => 'nullable|string|max:50',
            'cardcode'   => 'nullable|string',
            'cardname'   => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];

        // ✅ Only validate password if user filled it in
        if ($request->filled('password')) {
            $rules['password'] = 'required|string|min:6|confirmed';
        }

        $request->validate($rules);

        $data = [
            'name'          => $request->name,
            'email'         => $request->email,
            'contact_no'    => $request->contact,
            'cardcode'      => $request->cardcode,
            'cardname'      => $request->cardname,
        ];

        // ✅ Handle password only if filled
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        }

        // ✅ Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $data['profile_picture'] = $path;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ], 200);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(null, 204);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
