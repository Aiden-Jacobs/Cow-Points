<?php
/**
 * BotScorer — Multi-factor scoring engine for classifying visitors.
 *
 * Scores a visitor from 0 (certain bot) to 100 (certain human) using four
 * weighted signal categories: Entropy, Behavioral, Consistency, and Human.
 *
 * Follows Single-Responsibility: this class owns *only* the scoring logic.
 */

interface ScorerInterface {
    /**
     * @param  array $visitor      Current visitor data (from pixel.php).
     * @param  array $history      Recent visitor records for comparison.
     * @return array{score:float, classification:string, breakdown:array}
     */
    public function score(array $visitor, array $history = []): array;
}

class BotScorer implements ScorerInterface {

    private array $weights;

    public function __construct(array $config = []) {
        $defaults = [
            'entropy'     => 0.30,
            'behavioral'  => 0.25,
            'consistency' => 0.25,
            'human'       => 0.20,
        ];
        $this->weights = $config['weights'] ?? $defaults;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    public function score(array $visitor, array $history = []): array {
        $q = $visitor['query'] ?? [];

        $breakdown = [
            'entropy'     => $this->entropyScore($q, $history),
            'behavioral'  => $this->behavioralScore($q, $visitor),
            'consistency' => $this->consistencyScore($q, $visitor),
            'human'       => $this->humanScore($q, $visitor),
        ];

        $weighted = 0;
        foreach ($breakdown as $key => $value) {
            $weighted += $value * ($this->weights[$key] ?? 0);
        }
        $finalScore = round($weighted * 100, 1);

        return [
            'score'          => $finalScore,
            'classification' => self::classify($finalScore),
            'breakdown'      => $breakdown,
        ];
    }

    public static function classify(float $score): string {
        if ($score >= 70) return 'human';
        if ($score >= 30) return 'suspicious';
        return 'bot';
    }

    /* ------------------------------------------------------------------ */
    /*  Category 1 — Entropy (30 %)                                        */
    /*  Unique fingerprints ≈ real devices. Bots reuse the same canvas.   */
    /* ------------------------------------------------------------------ */

    private function entropyScore(array $q, array $history): float {
        $signals = [];

        // 1a. Canvas hash uniqueness — how many visitors share this hash?
        $canvasHash = $q['canvasHash'] ?? null;
        if ($canvasHash && count($history) > 0) {
            $sameHash = 0;
            foreach ($history as $h) {
                if (($h['query']['canvasHash'] ?? '') === $canvasHash) $sameHash++;
            }
            $ratio = $sameHash / count($history);
            // Low ratio = rare hash = likely unique device = human
            // Very high ratio = shared/default hash = likely bot farm
            $signals[] = $ratio < 0.01 ? 1.0 : max(0, 1.0 - ($ratio * 10));
        } else {
            // No canvas hash at all is suspicious (headless browsers)
            $signals[] = $canvasHash ? 0.5 : 0.15;
        }

        // 1b. GPU renderer diversity
        $gpu = $q['gpuRenderer'] ?? null;
        if ($gpu) {
            // Known headless / generic GPU strings
            $genericGPUs = ['swiftshader', 'llvmpipe', 'mesa', 'google swiftshader'];
            $isGeneric = false;
            foreach ($genericGPUs as $g) {
                if (stripos($gpu, $g) !== false) { $isGeneric = true; break; }
            }
            $signals[] = $isGeneric ? 0.1 : 0.9;
        } else {
            $signals[] = 0.2; // Missing GPU info
        }

        // 1c. Screen resolution — odd or missing?
        $w = (int)($q['screenWidth']  ?? 0);
        $h = (int)($q['screenHeight'] ?? 0);
        if ($w > 0 && $h > 0) {
            $common = [
                '1920x1080','1366x768','1536x864','1440x900',
                '1280x720','2560x1440','3840x2160','390x844',
                '375x812','414x896','412x915','360x800',
            ];
            $signals[] = in_array("{$w}x{$h}", $common) ? 0.8 : 0.5;
        } else {
            $signals[] = 0.1;
        }

        return $this->avg($signals);
    }

    /* ------------------------------------------------------------------ */
    /*  Category 2 — Behavioral (25 %)                                     */
    /*  Real devices have battery APIs, touch support, network info, etc.  */
    /* ------------------------------------------------------------------ */

    private function behavioralScore(array $q, array $visitor): float {
        $signals = [];

        // 2a. Battery API — present on real mobile devices
        if (isset($q['batteryLevel'])) {
            $level = (float)$q['batteryLevel'];
            // Exact 1.0 and charging=true is the headless default
            $signals[] = ($level === 1.0 && ($q['batteryCharging'] ?? '') === 'true') ? 0.3 : 0.9;
        } else {
            $signals[] = 0.5; // Desktop browsers don't always expose battery
        }

        // 2b. Touch capability
        $touch = (int)($q['maxTouchPoints'] ?? -1);
        $ua    = strtolower($visitor['userAgent'] ?? '');
        if ($touch >= 0) {
            $isMobileUA = (bool)preg_match('/mobile|android|iphone|ipad/', $ua);
            // Mobile UA should have touch; desktop should usually be 0
            if ($isMobileUA && $touch > 0) $signals[] = 1.0;
            elseif (!$isMobileUA && $touch === 0) $signals[] = 0.9;
            elseif ($isMobileUA && $touch === 0) $signals[] = 0.2; // Spoofed UA
            else $signals[] = 0.6;
        } else {
            $signals[] = 0.4;
        }

        // 2c. Network connection info
        $connType = $q['connectionType'] ?? '';
        if ($connType !== '') {
            // Real connections have 4g, 3g, wifi, etc.
            $valid = ['slow-2g','2g','3g','4g'];
            $signals[] = in_array($connType, $valid) ? 0.9 : 0.4;
        } else {
            $signals[] = 0.5;
        }

        // 2d. Mouse activity (if tracked)
        $mouseActivity = (int)($q['mouseActivity'] ?? -1);
        $timeToMove    = (int)($q['timeToFirstMove'] ?? -1);
        if ($mouseActivity >= 0) {
            $signals[] = $mouseActivity > 0 ? 0.95 : 0.2;
        }
        if ($timeToMove >= 0) {
            // Instant movement (< 50ms) is suspicious; very slow (> 30s) also odd
            if ($timeToMove < 50) $signals[] = 0.2;
            elseif ($timeToMove > 30000) $signals[] = 0.3;
            else $signals[] = 0.9;
        }

        // 2e. Hardware concurrency — headless often reports 1 or 2
        $cores = (int)($q['hardwareConcurrency'] ?? 0);
        if ($cores > 0) {
            $signals[] = $cores >= 4 ? 0.85 : ($cores >= 2 ? 0.5 : 0.2);
        }

        // 2f. Device memory
        $mem = (float)($q['deviceMemory'] ?? 0);
        if ($mem > 0) {
            $signals[] = $mem >= 4 ? 0.85 : ($mem >= 2 ? 0.6 : 0.3);
        }

        return $this->avg($signals);
    }

    /* ------------------------------------------------------------------ */
    /*  Category 3 — Consistency (25 %)                                    */
    /*  Mismatches between UA, platform, and features reveal spoofing.    */
    /* ------------------------------------------------------------------ */

    private function consistencyScore(array $q, array $visitor): float {
        $signals = [];
        $ua       = strtolower($visitor['userAgent'] ?? '');
        $platform = strtolower($q['platform'] ?? '');

        // 3a. Platform ↔ User-Agent agreement
        if ($platform && $ua) {
            $match = false;
            $platformMap = [
                'win32'    => ['windows'],
                'win16'    => ['windows'],
                'macintel' => ['macintosh','mac os'],
                'linux'    => ['linux','android'],
                'iphone'   => ['iphone'],
                'ipad'     => ['ipad'],
            ];
            foreach ($platformMap as $pKey => $uaPatterns) {
                if (strpos($platform, $pKey) !== false) {
                    foreach ($uaPatterns as $pat) {
                        if (strpos($ua, $pat) !== false) { $match = true; break 2; }
                    }
                }
            }
            $signals[] = $match ? 1.0 : 0.15;
        } else {
            $signals[] = 0.3;
        }

        // 3b. Timezone ↔ Language plausibility
        $tz   = $q['timezone'] ?? '';
        $lang = $q['language'] ?? '';
        if ($tz && $lang) {
            // Very rough: 'America/*' should be en/es/pt/fr, 'Asia/*' should be zh/ja/ko/etc.
            $plausible = true; // Default optimistic
            if (preg_match('/^America\//', $tz) && preg_match('/^(zh|ja|ko)/', $lang)) {
                $plausible = false;
            }
            if (preg_match('/^Asia\//', $tz) && preg_match('/^(es|pt|fr|de)/', $lang)) {
                $plausible = false;
            }
            $signals[] = $plausible ? 0.85 : 0.3;
        }

        // 3c. Color depth — headless browsers often report 24
        $depth = (int)($q['colorDepth'] ?? 0);
        if ($depth > 0) {
            $signals[] = in_array($depth, [24, 30, 32, 48]) ? 0.8 : 0.4;
        }

        // 3d. Cookies enabled check
        $cookies = $q['cookieEnabled'] ?? '';
        if ($cookies !== '') {
            $signals[] = ($cookies === 'true' || $cookies === '1') ? 0.9 : 0.3;
        }

        // 3e. DoNotTrack — bots sometimes set unusual values
        $dnt = $q['doNotTrack'] ?? '';
        if ($dnt !== '') {
            $signals[] = in_array($dnt, ['1', '0', 'unspecified', 'null']) ? 0.7 : 0.3;
        }

        return $this->avg($signals);
    }

    /* ------------------------------------------------------------------ */
    /*  Category 4 — Human Indicators (20 %)                              */
    /*  Referrer paths, page context, and timing suggest real browsing.    */
    /* ------------------------------------------------------------------ */

    private function humanScore(array $q, array $visitor): float {
        $signals = [];

        // 4a. Referrer present — bots often have no referrer
        $ref = $visitor['referrer'] ?? '';
        if ($ref && $ref !== '') {
            $signals[] = 0.85;
        } else {
            $signals[] = 0.3; // Direct visit is common but less trustworthy
        }

        // 4b. Page title & URL present — indicates a real embedded pixel
        $title = $q['pageTitle'] ?? '';
        $url   = $q['url'] ?? '';
        if ($title && $url) {
            $signals[] = 1.0;
        } elseif ($url) {
            $signals[] = 0.7;
        } else {
            $signals[] = 0.2;
        }

        // 4c. Language list depth — real users have preferences
        $langs = $q['languages'] ?? '';
        if ($langs) {
            $langCount = count(explode(',', $langs));
            $signals[] = $langCount >= 2 ? 0.9 : 0.6;
        } else {
            $signals[] = 0.3;
        }

        // 4d. Load time — headless browsers can be extremely fast or absent
        $loadTime = (float)($q['loadTime'] ?? 0);
        if ($loadTime > 0) {
            if ($loadTime < 50)  $signals[] = 0.2;   // Unrealistically fast
            elseif ($loadTime > 60000) $signals[] = 0.3; // Extremely slow
            else $signals[] = 0.85;
        }

        // 4e. Dark mode preference — indicates real user customization
        $darkMode = $q['darkMode'] ?? '';
        if ($darkMode !== '') {
            $signals[] = 0.8; // Having any preference is a human signal
        }

        return $this->avg($signals);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    private function avg(array $values): float {
        if (empty($values)) return 0.5;
        return array_sum($values) / count($values);
    }
}
