<?php
/**
 * ClusterDetector — Groups visitors by fingerprint composite key.
 *
 * Composite key = hash(canvasHash + gpuRenderer + ipPrefix/24)
 * Used for sockpuppet detection: multiple distinct sessions from the
 * same device cluster indicate a single operator.
 *
 * Single-Responsibility: this class owns *only* clustering logic.
 */

interface ClusterDetectorInterface {
    public function generateClusterKey(?string $canvasHash, ?string $gpuRenderer, string $ipPrefix): string;
    public function findClusters(array $visitors): array;
    public function detectSockpuppets(array $clusters, int $minSize): array;
}

class ClusterDetector implements ClusterDetectorInterface {

    private int $ipPrefixBits;
    private int $highSuspicionThreshold;

    public function __construct(array $config = []) {
        $this->ipPrefixBits = $config['ip_prefix_bits'] ?? 24;
        $this->highSuspicionThreshold = $config['high_suspicion_threshold'] ?? 8;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Extract the network prefix from an IPv4 address.
     *
     *  extractIPPrefix('192.168.1.42', 24) → '192.168.1'
     *  extractIPPrefix('10.0.0.7',     16) → '10.0'
     */
    public function extractIPPrefix(?string $ip, ?int $bits = null): string {
        if (!$ip) return 'unknown';
        $bits = $bits ?? $this->ipPrefixBits;

        // Handle IPv6-mapped IPv4
        if (preg_match('/::ffff:(\d+\.\d+\.\d+\.\d+)/', $ip, $m)) {
            $ip = $m[1];
        }

        $parts = explode('.', $ip);
        if (count($parts) !== 4) return $ip; // Not standard IPv4

        $octetsToKeep = intdiv($bits, 8);
        return implode('.', array_slice($parts, 0, $octetsToKeep));
    }

    /**
     * Build a deterministic cluster key from the three fingerprint axes.
     */
    public function generateClusterKey(?string $canvasHash, ?string $gpuRenderer, string $ipPrefix): string {
        $raw = implode('|', [
            $canvasHash  ?? 'none',
            $gpuRenderer ?? 'none',
            $ipPrefix,
        ]);
        return substr(md5($raw), 0, 12); // Short, collision-resistant ID
    }

    /**
     * Group a list of visitor records into clusters.
     *
     * @return array<string, array{
     *   id:string, fingerprint:array, visitors:array, visitCount:int,
     *   firstSeen:string, lastSeen:string, suspicionLevel:string
     * }>
     */
    public function findClusters(array $visitors): array {
        $clusters = [];

        foreach ($visitors as $v) {
            $q = $v['query'] ?? [];
            $ip = $v['ip'] ?? '';
            $prefix = $this->extractIPPrefix($ip);
            $key = $this->generateClusterKey(
                $q['canvasHash']  ?? null,
                $q['gpuRenderer'] ?? null,
                $prefix
            );

            if (!isset($clusters[$key])) {
                $clusters[$key] = [
                    'id'          => $key,
                    'fingerprint' => [
                        'canvasHash'  => $q['canvasHash']  ?? null,
                        'gpuRenderer' => $q['gpuRenderer'] ?? null,
                        'ipPrefix'    => $prefix,
                    ],
                    'visitors'    => [],
                    'visitCount'  => 0,
                    'firstSeen'   => $v['timestamp'] ?? '',
                    'lastSeen'    => $v['timestamp'] ?? '',
                ];
            }

            $clusters[$key]['visitors'][] = [
                'timestamp' => $v['timestamp'] ?? '',
                'ip'        => $ip,
                'userAgent' => $v['userAgent'] ?? '',
                'source'    => $q['source'] ?? 'web',
            ];
            $clusters[$key]['visitCount']++;

            // Update time bounds
            $ts = $v['timestamp'] ?? '';
            if ($ts < $clusters[$key]['firstSeen']) $clusters[$key]['firstSeen'] = $ts;
            if ($ts > $clusters[$key]['lastSeen'])  $clusters[$key]['lastSeen']  = $ts;
        }

        // Label suspicion level
        foreach ($clusters as &$c) {
            $c['suspicionLevel'] = $this->labelSuspicion($c['visitCount']);
        }

        return $clusters;
    }

    /**
     * Return only clusters with enough visits to be suspicious.
     */
    public function detectSockpuppets(array $clusters, int $minSize = 2): array {
        return array_filter($clusters, fn($c) => $c['visitCount'] >= $minSize);
    }

    /**
     * Compute similarity between two visitors (0–100).
     */
    public function calculateSimilarity(array $v1, array $v2): float {
        $q1 = $v1['query'] ?? [];
        $q2 = $v2['query'] ?? [];
        $score = 0;
        $factors = 0;

        // Canvas hash match (weight 40)
        $c1 = $q1['canvasHash'] ?? null;
        $c2 = $q2['canvasHash'] ?? null;
        if ($c1 && $c2) {
            $score += ($c1 === $c2) ? 40 : 0;
            $factors += 40;
        }

        // GPU renderer match (weight 30)
        $g1 = $q1['gpuRenderer'] ?? null;
        $g2 = $q2['gpuRenderer'] ?? null;
        if ($g1 && $g2) {
            $score += ($g1 === $g2) ? 30 : 0;
            $factors += 30;
        }

        // IP prefix match (weight 20)
        $ip1 = $this->extractIPPrefix($v1['ip'] ?? '');
        $ip2 = $this->extractIPPrefix($v2['ip'] ?? '');
        if ($ip1 !== 'unknown' && $ip2 !== 'unknown') {
            $score += ($ip1 === $ip2) ? 20 : 0;
            $factors += 20;
        }

        // Screen resolution match (weight 10)
        $r1 = ($q1['screenWidth'] ?? '') . 'x' . ($q1['screenHeight'] ?? '');
        $r2 = ($q2['screenWidth'] ?? '') . 'x' . ($q2['screenHeight'] ?? '');
        if ($r1 !== 'x' && $r2 !== 'x') {
            $score += ($r1 === $r2) ? 10 : 0;
            $factors += 10;
        }

        return $factors > 0 ? ($score / $factors) * 100 : 0;
    }

    /**
     * Persist current cluster state to a JSON file.
     */
    public function saveClusters(array $clusters, string $filePath): void {
        $out = [
            'clusters'    => array_values($clusters),
            'lastUpdated' => date('c'),
        ];
        file_put_contents($filePath, json_encode($out, JSON_PRETTY_PRINT), LOCK_EX);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    private function labelSuspicion(int $visits): string {
        if ($visits >= $this->highSuspicionThreshold) return 'high';
        if ($visits >= 4) return 'medium';
        if ($visits >= 2) return 'low';
        return 'none';
    }
}
