<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        return response()->json(User::all());
    }

    // POST /api/users
    public function store(Request $request)
    {
        $request->validate([
            // 'name'            => 'required|string|max:255',
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:6',
            'cardcode'        => 'nullable|string',
            'cardname'        => 'nullable|string',
            'contact'         => 'nullable|string|max:50',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

         $first = $request->input('first_name');
         $last  = $request->input('last_name');

        $data = [
            'first_name' => $first,
            'last_name'  => $last,
            'name'       => trim("$first $last"), // combine first + last name
            'email'      => $request->email,
            'password'   => bcrypt($request->password),
            'cardcode'   => $request->cardcode ?? null,
            'cardname'   => $request->cardname ?? null,
            'contact_no' => $request->contact ?? null, // contact → contact_no
        ];

        // Handle profile picture upload (optional)
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

    // POST /api/users/{id}
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // ---- NAME ----
        $name  = $request->input('name');
        $first = $request->input('first_name') ?? $request->input('firstName');
        $last  = $request->input('last_name')  ?? $request->input('lastName');

        if ($first || $last) {
            $user->name = trim(($first ?? '') . ' ' . ($last ?? ''));
        } elseif (!is_null($name)) {
            $user->name = $name;
        }

        // ---- EMAIL ----
        if ($request->has('email')) {
            $user->email = $request->input('email');
        }

        // ---- PHONE -> contact_no ----
        $phone = $request->input('phone')
            ?? $request->input('contact')
            ?? $request->input('contact_no');

        if (!is_null($phone)) {
            $user->contact_no = $phone;
        }

        // ---- COMPANY -> cardname ----
        $company = $request->input('cardname')      // correct already
            ?? $request->input('CardName')         // capitalised
            ?? $request->input('company')          // generic
            ?? $request->input('company_name')
            ?? $request->input('companyName');

        if (!is_null($company)) {
            $user->cardname = $company;            // DB column
        }

        // ---- CARDCODE (if you send it) ----
        if ($request->has('cardcode')) {
            $user->cardcode = $request->input('cardcode');
        }

        // ---- PASSWORD (optional) ----
        if ($request->filled('password')) {
            $request->validate([
                'password' => 'string|min:6|confirmed',
            ]);
            $user->password = bcrypt($request->password);
        }

        // ---- PROFILE PICTURE (optional) ----
        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = 'uploads/profile_pictures/' . $filename;
            $file->move(public_path('uploads/profile_pictures'), $filename);

            // Delete old profile picture if exists
            if (!empty($user->profile_picture) && file_exists(public_path($user->profile_picture))) {
                @unlink(public_path($user->profile_picture));
            }

            $user->profile_picture = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user,
        ], 200);
    }

    // DELETE /api/users/{id}
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (!empty($user->profile_picture) && file_exists(public_path($user->profile_picture))) {
            @unlink(public_path($user->profile_picture));
        }

        $user->delete();

        return response()->json(null, 204);
    }

    // GET /api/users/{id}
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    // GET /api/user/me
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
