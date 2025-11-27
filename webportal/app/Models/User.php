<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'contact_no',
        'cardcode',
        'cardname',
        'profile_picture',
        'role',

        // extra frontend-style names we may receive, but we map them
        'phone',
        'company',
        'contact',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // ========== CONTACT / PHONE MAPPINGS ==========

    // map `contact` <-> `contact_no`
    public function setContactAttribute($value)
    {
        $this->attributes['contact_no'] = $value;
    }

    public function getContactAttribute()
    {
        return $this->attributes['contact_no'] ?? null;
    }

    // map `phone` <-> `contact_no`
    public function setPhoneAttribute($value)
    {
        $this->attributes['contact_no'] = $value;
    }

    public function getPhoneAttribute()
    {
        return $this->attributes['contact_no'] ?? null;
    }

    // ========== COMPANY / CARDNAME MAPPINGS ==========

    // map `company` <-> `cardname`
    public function setCompanyAttribute($value)
    {
        $this->attributes['cardname'] = $value;
    }

    public function getCompanyAttribute()
    {
        return $this->attributes['cardname'] ?? null;
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Get full URL for profile picture.
     */
    public function getProfilePictureAttribute($value)
    {
        if ($value) {
            // If already full URL, return directly
            if (str_starts_with($value, 'http')) {
                return $value;
            }

            // Build full path
            return asset($value);
        }

        // Default avatar
        return asset('uploads/profile_pictures/default.png');
    }
}
