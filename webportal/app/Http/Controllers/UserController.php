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
            $file = $request->file('profile_picture');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = 'uploads/profile_pictures/' . $filename;
            $file->move(public_path('uploads/profile_pictures'), $filename);
            $data['profile_picture'] = $path;
        }

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // ✅ Validation (all optional fields)
        $rules = [
            'name'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|unique:users,email,' . $user->id,
            'contact'    => 'nullable|string|max:50',
            'cardcode'   => 'nullable|string',
            'cardname'   => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'required|string|min:6|confirmed';
        }

        $request->validate($rules);

        // ✅ Collect only provided fields
        $data = $request->only(['name', 'email', 'contact', 'cardcode', 'cardname']);
        $data = array_filter($data, fn($value) => $value !== null && $value !== '');

        // ✅ Handle password if filled
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        }

        // ✅ Handle profile picture upload (if any)
        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = 'uploads/profile_pictures/' . $filename;
            $file->move(public_path('uploads/profile_pictures'), $filename);

            // Delete old profile picture if exists
            if (!empty($user->profile_picture) && file_exists(public_path($user->profile_picture))) {
                @unlink(public_path($user->profile_picture));
            }

            $data['profile_picture'] = $path;
        }

        // ✅ Update only the provided fields
        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ], 200);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (!empty($user->profile_picture) && file_exists(public_path($user->profile_picture))) {
            @unlink(public_path($user->profile_picture));
        }

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
