<?php
/**
 * GeolocationService — Multi-source location resolution with caching & rate-limiting.
 *
 * Priority chain:
 *   1. Cache hit  → instant
 *   2. ipapi.co   → city-level accuracy (rate-limited)
 *   3. Timezone + Language inference → regional fallback
 *   4. Cloudflare headers → country-level fallback
 *
 * Single-Responsibility: this class owns *only* geolocation resolution.
 */

interface GeolocationInterface {
    public function locate(string $ip, string $timezone, string $language, array $headers): array;
}

class GeolocationService implements GeolocationInterface {

    private string $cacheFile;
    private string $rateLimitFile;
    private int    $cacheTtlHours;
    private int    $maxRequests;
    private int    $windowSeconds;
    private bool   $fallbackEnabled;

    public function __construct(array $config = []) {
        $baseDir = __DIR__;
        $this->cacheFile       = $baseDir . '/geo_cache.json';
        $this->rateLimitFile   = $baseDir . '/geo_ratelimit.json';
        $this->cacheTtlHours   = $config['cache_ttl_hours']              ?? 24;
        $this->fallbackEnabled = $config['fallback_enabled']             ?? true;
        $this->maxRequests     = $config['rate_limit']['max_requests']   ?? 900;
        $this->windowSeconds   = $config['rate_limit']['window_seconds'] ?? 86400;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    public function locate(string $ip, string $timezone, string $language, array $headers): array {
        // 1. Try cache first
        $cached = $this->getFromCache($ip);
        if ($cached) {
            $cached['source'] = 'cache';
            return $cached;
        }

        // 2. Try ipapi.co API (if rate limit allows)
        if ($this->canMakeApiCall()) {
            $apiResult = $this->lookupIPAPI($ip);
            if ($apiResult) {
                $this->saveToCache($ip, $apiResult);
                $this->recordApiCall();
                return $apiResult;
            }
        }

        // 3. Fallback: Timezone + Language inference
        if ($this->fallbackEnabled && $timezone) {
            $inferred = $this->inferFromTimezone($timezone, $language);
            if ($inferred) {
                return $inferred;
            }
        }

        // 4. Fallback: Cloudflare headers
        $cfResult = $this->parseCloudflare($headers);
        if ($cfResult) {
            return $cfResult;
        }

        // 5. Nothing available
        return [
            'country'     => 'Unknown',
            'countryCode' => '??',
            'region'      => null,
            'city'        => null,
            'latitude'    => null,
            'longitude'   => null,
            'isp'         => null,
            'confidence'  => 0.0,
            'source'      => 'none',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Provider: ipapi.co                                                */
    /* ------------------------------------------------------------------ */

    private function lookupIPAPI(string $ip): ?array {
        // Skip private / reserved IPs
        if ($this->isPrivateIP($ip)) return null;

        $url = "https://ipapi.co/{$ip}/json/";

        $ctx = stream_context_create([
            'http' => [
                'timeout' => 5,
                'header'  => "User-Agent: CowPointsPixel/1.0\r\n",
            ],
        ]);

        $raw = @file_get_contents($url, false, $ctx);
        if (!$raw) return null;

        $data = json_decode($raw, true);
        if (!$data || isset($data['error'])) return null;

        return [
            'country'     => $data['country_name'] ?? 'Unknown',
            'countryCode' => $data['country_code'] ?? '??',
            'region'      => $data['region']       ?? null,
            'city'        => $data['city']         ?? null,
            'latitude'    => $data['latitude']     ?? null,
            'longitude'   => $data['longitude']    ?? null,
            'isp'         => $data['org']          ?? null,
            'confidence'  => 0.85,
            'source'      => 'ipapi',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Fallback: Timezone Inference                                      */
    /* ------------------------------------------------------------------ */

    private function inferFromTimezone(string $tz, string $lang): ?array {
        // Curated mapping of timezone prefixes → likely locations
        $tzMap = [
            'America/New_York'      => ['country'=>'United States','countryCode'=>'US','region'=>'Eastern US','city'=>null],
            'America/Chicago'       => ['country'=>'United States','countryCode'=>'US','region'=>'Central US','city'=>null],
            'America/Denver'        => ['country'=>'United States','countryCode'=>'US','region'=>'Mountain US','city'=>null],
            'America/Los_Angeles'   => ['country'=>'United States','countryCode'=>'US','region'=>'Pacific US','city'=>null],
            'America/Phoenix'       => ['country'=>'United States','countryCode'=>'US','region'=>'Arizona','city'=>'Phoenix'],
            'America/Anchorage'     => ['country'=>'United States','countryCode'=>'US','region'=>'Alaska','city'=>null],
            'Pacific/Honolulu'      => ['country'=>'United States','countryCode'=>'US','region'=>'Hawaii','city'=>null],
            'America/Toronto'       => ['country'=>'Canada','countryCode'=>'CA','region'=>'Ontario','city'=>null],
            'America/Vancouver'     => ['country'=>'Canada','countryCode'=>'CA','region'=>'British Columbia','city'=>null],
            'Europe/London'         => ['country'=>'United Kingdom','countryCode'=>'GB','region'=>'England','city'=>null],
            'Europe/Paris'          => ['country'=>'France','countryCode'=>'FR','region'=>null,'city'=>null],
            'Europe/Berlin'         => ['country'=>'Germany','countryCode'=>'DE','region'=>null,'city'=>null],
            'Europe/Madrid'         => ['country'=>'Spain','countryCode'=>'ES','region'=>null,'city'=>null],
            'Europe/Rome'           => ['country'=>'Italy','countryCode'=>'IT','region'=>null,'city'=>null],
            'Europe/Amsterdam'      => ['country'=>'Netherlands','countryCode'=>'NL','region'=>null,'city'=>null],
            'Europe/Moscow'         => ['country'=>'Russia','countryCode'=>'RU','region'=>'Moscow','city'=>null],
            'Asia/Tokyo'            => ['country'=>'Japan','countryCode'=>'JP','region'=>null,'city'=>null],
            'Asia/Shanghai'         => ['country'=>'China','countryCode'=>'CN','region'=>null,'city'=>null],
            'Asia/Kolkata'          => ['country'=>'India','countryCode'=>'IN','region'=>null,'city'=>null],
            'Asia/Seoul'            => ['country'=>'South Korea','countryCode'=>'KR','region'=>null,'city'=>null],
            'Asia/Singapore'        => ['country'=>'Singapore','countryCode'=>'SG','region'=>null,'city'=>null],
            'Asia/Dubai'            => ['country'=>'UAE','countryCode'=>'AE','region'=>'Dubai','city'=>null],
            'Australia/Sydney'      => ['country'=>'Australia','countryCode'=>'AU','region'=>'New South Wales','city'=>null],
            'Australia/Melbourne'   => ['country'=>'Australia','countryCode'=>'AU','region'=>'Victoria','city'=>null],
            'America/Sao_Paulo'     => ['country'=>'Brazil','countryCode'=>'BR','region'=>'São Paulo','city'=>null],
            'America/Mexico_City'   => ['country'=>'Mexico','countryCode'=>'MX','region'=>null,'city'=>null],
            'Africa/Lagos'          => ['country'=>'Nigeria','countryCode'=>'NG','region'=>null,'city'=>null],
            'Africa/Johannesburg'   => ['country'=>'South Africa','countryCode'=>'ZA','region'=>null,'city'=>null],
        ];

        $match = $tzMap[$tz] ?? null;

        // Try prefix matching if exact match fails (e.g. America/Indiana/Indianapolis)
        if (!$match) {
            foreach ($tzMap as $key => $val) {
                $prefix = explode('/', $key)[0] . '/' . explode('/', $key)[1];
                if (strpos($tz, $prefix) === 0) {
                    $match = $val;
                    break;
                }
            }
        }

        // Use the UTC offset as a very rough fallback
        if (!$match) {
            $match = $this->inferFromOffset($tz);
        }

        if (!$match) return null;

        return array_merge($match, [
            'latitude'   => null,
            'longitude'  => null,
            'isp'        => null,
            'confidence' => 0.4,
            'source'     => 'timezone',
        ]);
    }

    /**
     * Very rough mapping from UTC offset to region.
     */
    private function inferFromOffset(string $tz): ?array {
        try {
            $dtz = new DateTimeZone($tz);
            $offset = $dtz->getOffset(new DateTime('now', $dtz)) / 3600;
        } catch (\Exception $e) {
            return null;
        }

        if ($offset >= -5 && $offset <= -4) {
            return ['country'=>'United States','countryCode'=>'US','region'=>'Eastern','city'=>null];
        }
        if ($offset >= -8 && $offset <= -7) {
            return ['country'=>'United States','countryCode'=>'US','region'=>'Pacific/Mountain','city'=>null];
        }
        if ($offset >= 0 && $offset <= 1) {
            return ['country'=>'Europe','countryCode'=>'EU','region'=>'Western Europe','city'=>null];
        }
        if ($offset >= 5 && $offset <= 6) {
            return ['country'=>'India/South Asia','countryCode'=>'IN','region'=>null,'city'=>null];
        }
        if ($offset >= 8 && $offset <= 9) {
            return ['country'=>'East Asia','countryCode'=>'??','region'=>null,'city'=>null];
        }

        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Fallback: Cloudflare Headers                                      */
    /* ------------------------------------------------------------------ */

    private function parseCloudflare(array $headers): ?array {
        // Cloudflare supplies CF-IPCountry
        $country = $headers['cf-ipcountry'] ?? $headers['CF-IPCountry'] ?? null;
        if (!$country || $country === 'XX') return null;

        // CF-Ray contains the data-center code (e.g. "abc123-LAX")
        $ray  = $headers['cf-ray'] ?? $headers['CF-Ray'] ?? '';
        $colo = '';
        if ($ray && strpos($ray, '-') !== false) {
            $colo = explode('-', $ray)[1] ?? '';
        }

        return [
            'country'     => $country,
            'countryCode' => $country,
            'region'      => null,
            'city'        => $colo ?: null,
            'latitude'    => null,
            'longitude'   => null,
            'isp'         => null,
            'confidence'  => 0.5,
            'source'      => 'cloudflare',
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Cache                                                             */
    /* ------------------------------------------------------------------ */

    private function getFromCache(string $ip): ?array {
        if (!file_exists($this->cacheFile)) return null;

        $cache = json_decode(file_get_contents($this->cacheFile), true);
        if (!$cache || !isset($cache[$ip])) return null;

        $entry = $cache[$ip];
        $age = time() - strtotime($entry['timestamp'] ?? '2000-01-01');
        if ($age > ($this->cacheTtlHours * 3600)) return null; // Expired

        return $entry['location'] ?? null;
    }

    private function saveToCache(string $ip, array $location): void {
        $cache = [];
        if (file_exists($this->cacheFile)) {
            $cache = json_decode(file_get_contents($this->cacheFile), true) ?? [];
        }

        // Evict expired entries (keep cache file small)
        $cutoff = time() - ($this->cacheTtlHours * 3600);
        foreach ($cache as $k => $v) {
            if (strtotime($v['timestamp'] ?? '2000-01-01') < $cutoff) {
                unset($cache[$k]);
            }
        }

        $cache[$ip] = [
            'location'  => $location,
            'timestamp' => date('c'),
        ];

        file_put_contents($this->cacheFile, json_encode($cache, JSON_PRETTY_PRINT), LOCK_EX);
    }

    /* ------------------------------------------------------------------ */
    /*  Rate Limiting                                                     */
    /* ------------------------------------------------------------------ */

    private function canMakeApiCall(): bool {
        $state = $this->loadRateState();
        $now   = time();

        // Reset window if expired
        if ($now - $state['windowStart'] > $this->windowSeconds) {
            return true; // New window, definitely ok
        }

        return $state['count'] < $this->maxRequests;
    }

    private function recordApiCall(): void {
        $state = $this->loadRateState();
        $now   = time();

        if ($now - $state['windowStart'] > $this->windowSeconds) {
            $state = ['windowStart' => $now, 'count' => 0];
        }

        $state['count']++;
        file_put_contents($this->rateLimitFile, json_encode($state), LOCK_EX);
    }

    private function loadRateState(): array {
        if (!file_exists($this->rateLimitFile)) {
            return ['windowStart' => time(), 'count' => 0];
        }
        $data = json_decode(file_get_contents($this->rateLimitFile), true);
        return $data ?: ['windowStart' => time(), 'count' => 0];
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    private function isPrivateIP(string $ip): bool {
        return !filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
}
