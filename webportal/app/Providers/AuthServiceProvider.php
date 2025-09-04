<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Notifications\Messages\MailMessage;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Override the reset password email link
        ResetPassword::toMailUsing(function ($notifiable, $token) {
            // Use env() to avoid cached config issues
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

            $url = $frontendUrl . '/reset-password?token=' . $token 
                   . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

            return (new MailMessage)
                ->subject('Reset Your Password')
                ->line('You requested a password reset.')
                ->action('Reset Password', $url)
                ->line('If you did not request this, please ignore this email.');
        });
    }
}
