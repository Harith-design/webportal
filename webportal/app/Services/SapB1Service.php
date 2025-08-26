<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SapB1Service
{
    protected string $baseUrl;
    protected bool $verifySsl;
    protected int $sessionTtl;

    public function __construct()
    {
        $this->baseUrl   = config('sapb1.base_url');
        $this->verifySsl = config('sapb1.verify_ssl');
        $this->sessionTtl = config('sapb1.session_ttl');
    }

    /** Get Sales Order by DocNum */
    public function getSalesOrderByDocNum(int $docNum): array
    {
        $query = http_build_query([
            '$filter' => "DocNum eq {$docNum}",
            '$select' => 'DocEntry,DocNum,CardCode,CardName,DocDate,DocTotal,DocumentStatus,DocCurrency',
            '$expand' => 'DocumentLines($select=ItemCode,ItemDescription,Quantity,UnitPrice,LineTotal,WarehouseCode)'
        ]);

        $res = $this->client()->get("Orders?\{$query}");

        if ($res->failed()) {
            abort(500, "Failed to fetch Sales Order: " . $res->body());
        }

        $data = $res->json();
        $list = $data['value'] ?? [];

        if (count($list) === 0) {
            abort(404, "Sales Order with DocNum {$docNum} not found");
        }

        return $list[0];
    }

    /** Build HTTP client with SAP session */
    protected function client()
    {
        $cookies = $this->ensureSession();

        $cookieHeader = collect($cookies)
            ->map(fn($v, $k) => "{$k}={$v}")
            ->implode('; ');

        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['Cookie' => $cookieHeader])
            ->timeout(30)
            ->withOptions(['verify' => $this->verifySsl]);
    }

    /** Ensure we have a valid session, login if not */
    protected function ensureSession(): array
    {
        $cached = Cache::get('sapb1.session');
        if (is_array($cached) && isset($cached['B1SESSION'])) {
            return $cached;
        }

        $payload = [
            'CompanyDB' => config('sapb1.company_db'),
            'UserName'  => config('sapb1.username'),
            'Password'  => config('sapb1.password'),
        ];

        $login = Http::baseUrl($this->baseUrl)
            ->withOptions(['verify' => $this->verifySsl])
            ->post('Login', $payload);

        if ($login->failed()) {
            abort(500, 'SAP Login failed: ' . $login->body());
        }

        // --- Capture cookies (B1SESSION + ROUTEID) ---
        $setCookies = $login->header('Set-Cookie');
        $cookies = $this->parseCookies($setCookies);

        // Fallback to JSON session ID if needed
        $json = $login->json();
        if (!isset($cookies['B1SESSION']) && isset($json['SessionId'])) {
            $cookies['B1SESSION'] = $json['SessionId'];
        }

        if (!isset($cookies['B1SESSION'])) {
            abort(500, 'SAP Login succeeded but no B1SESSION cookie found');
        }

        Cache::put('sapb1.session', $cookies, now()->addMinutes($this->sessionTtl));

        return $cookies;
    }

    /** Parse Set-Cookie header(s) into array */
    protected function parseCookies($setCookieHeader): array
    {
        $cookies = [];

        if (is_array($setCookieHeader)) {
            foreach ($setCookieHeader as $cookieStr) {
                $parts = explode(';', $cookieStr);
                foreach ($parts as $part) {
                    if (str_contains($part, '=')) {
                        [$k, $v] = explode('=', trim($part), 2);
                        if (in_array($k, ['B1SESSION', 'ROUTEID'])) {
                            $cookies[$k] = $v;
                        }
                    }
                }
            }
        } elseif (is_string($setCookieHeader)) {
            $parts = explode(';', $setCookieHeader);
            foreach ($parts as $part) {
                if (str_contains($part, '=')) {
                    [$k, $v] = explode('=', trim($part), 2);
                    if (in_array($k, ['B1SESSION', 'ROUTEID'])) {
                        $cookies[$k] = $v;
                    }
                }
            }
        }

        return $cookies;
    }
}
