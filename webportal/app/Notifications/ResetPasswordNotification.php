<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    public $token;

    /**
     * Create a new notification instance.
     *
     * @param string $token
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification using a custom HTML Blade template.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        // Get frontend URL from .env
        $frontendUrl = env('FRONTEND_URL', 'http://192.168.100.157:3000');

        // Reset password link
        $resetUrl = $frontendUrl . "/reset-password?token={$this->token}&email=" . urlencode($notifiable->email);

        return (new MailMessage)
                    ->subject('Reset Your Web Portal Password')
                    ->view('emails.reset-password-html', [
                        'url' => $resetUrl,
                        'name' => $notifiable->name,
                    ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [];
    }
}
