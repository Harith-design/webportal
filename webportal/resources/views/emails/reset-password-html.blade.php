<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            background-color: #f3f4f6;
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #1d4ed8;
            padding: 20px;
            text-align: center;
        }
        .header img {
            height: 60px;
            margin-bottom: 10px;
        }
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin: 0;
        }
        .content {
            padding: 30px 20px;
            line-height: 1.6;
            font-size: 16px;
        }
        .content p {
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1d4ed8;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            padding: 20px;
        }
        .subcopy {
            font-size: 14px;
            color: #6b7280;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Header --}}
        <div class="header">
            <img src="{{ asset('mylogo.png') }}" alt="{{ config('app.name') }}">
            <h1>{{ config('app.name') }}</h1>
        </div>

        {{-- Body --}}
        <div class="content">
            <p>Hello {{ $name }},</p>
            <p>You requested a password reset for your Web Portal account.</p>
            <p style="text-align:center;">
                <a href="{{ $url }}" class="button">Reset Password</a>
            </p>
            <p>If you did not request this password reset, you can safely ignore this email.</p>
        </div>

        {{-- Subcopy --}}
        <div class="content subcopy">
            <p>If the button above does not work, copy and paste the following URL into your browser:</p>
            <p><a href="{{ $url }}">{{ $url }}</a></p>
        </div>

        {{-- Footer --}}
        <div class="footer">
            © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
        </div>
    </div>
</body>
</html>
