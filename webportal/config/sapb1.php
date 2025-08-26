<?php

return [
    'base_url'     => env('SAP_SERVICE_BASE_URL', ''),
    'company_db'   => env('SAP_COMPANY_DB', ''),
    'username'     => env('SAP_USERNAME', ''),
    'password'     => env('SAP_PASSWORD', ''),
    'verify_ssl'   => filter_var(env('SAP_SSL_VERIFY', true), FILTER_VALIDATE_BOOL),
    'session_ttl'  => (int) env('SAP_SESSION_TTL', 25),
];
