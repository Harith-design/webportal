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
        'contact_no', // backend column
        'cardcode',
        'cardname',
        'profile_picture', // ✅ allow mass assignment for profile picture
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
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * ✅ Accessor to return full URL for profile picture
     * Example: https://yourdomain.com/uploads/profile_pictures/avatar.jpg
     */
    public function getProfilePictureAttribute($value)
    {
        if ($value) {
            // If already has full URL (like from CDN), return as is
            if (str_starts_with($value, 'http')) {
                return $value;
            }

            // Otherwise, build full path
            return asset($value);
        }

        // Return default avatar if not uploaded
        return asset('uploads/profile_pictures/default.png');
    }
}
