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
        'role',   // ✅ added role field
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // 👇 Map frontend 'contact' to backend 'contact_no'
    public function setContactAttribute($value)
    {
        $this->attributes['contact_no'] = $value;
    }

    public function getContactAttribute()
    {
        return $this->attributes['contact_no'];
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
