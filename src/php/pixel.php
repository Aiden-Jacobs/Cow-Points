<?php
/**
 * pixel.php — Enhanced 1×1 Tracking Pixel
 *
 * Collects visitor data, then enriches each record with:
 *   • Bot score + classification   (BotScorer)
 *   • Cluster key + IP prefix      (ClusterDetector)
 *   • Enhanced geolocation         (GeolocationService)
 *
 * Serves a 1×1 transparent GIF with no-cache headers.
 */

// ── Bootstrap ──────────────────────────────────────────────────────────
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/bot-scorer.php';
require_once __DIR__ . '/cluster-detector.php';
require_once __DIR__ . '/geolocation-service.php';

$config  = require __DIR__ . '/config.php';
$logFile = __DIR__ . '/visits.json';
$clusterFile = __DIR__ . '/clusters.json';

// ── 1. Collect Raw Data ────────────────────────────────────────────────
$data = [
    'timestamp' => date('c'),

    // Server-side
    'ip'        => $_SERVER['REMOTE_ADDR'] ?? null,
    'method'    => $_SERVER['REQUEST_METHOD'] ?? null,
    'protocol'  => $_SERVER['SERVER_PROTOCOL'] ?? null,
    'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    'referrer'  => $_SERVER['HTTP_REFERER'] ?? null,
    'headers'   => getallheaders(),

    // Client-side (query string from tracker.js)
    'query'     => $_GET,
];

// ── 2. Geolocation Enrichment ──────────────────────────────────────────
$geoService = new GeolocationService($config['geolocation'] ?? []);
$data['location'] = $geoService->locate(
    $data['ip'] ?? '',
    $data['query']['timezone']  ?? '',
    $data['query']['language']  ?? '',
    $data['headers']
);

// ── 3. Bot Score Enrichment ────────────────────────────────────────────
$scorer = new BotScorer($config['bot_detection'] ?? []);

// Load recent history for entropy comparison (capped for performance)
$historyWindow = $config['bot_detection']['history_window'] ?? 1000;
$recentVisits  = loadRecentVisits($logFile, $historyWindow);

$scoreResult = $scorer->score($data, $recentVisits);
$data['botScore']          = $scoreResult['score'];
$data['botClassification'] = $scoreResult['classification'];
$data['botBreakdown']      = $scoreResult['breakdown'];

// ── 4. Cluster Key Enrichment ──────────────────────────────────────────
$detector = new ClusterDetector($config['clustering'] ?? []);
$data['ipPrefix']   = $detector->extractIPPrefix($data['ip']);
$data['clusterKey'] = $detector->generateClusterKey(
    $data['query']['canvasHash']  ?? null,
    $data['query']['gpuRenderer'] ?? null,
    $data['ipPrefix']
);

// ── 5. Persist ─────────────────────────────────────────────────────────
$jsonEntry = json_encode($data) . PHP_EOL;
file_put_contents($logFile, $jsonEntry, FILE_APPEND | LOCK_EX);

// ── 6. Periodic Cluster Update (1 in 10 requests) ─────────────────────
if (mt_rand(1, 10) === 1) {
    $allVisits = loadRecentVisits($logFile, 5000);
    $clusters  = $detector->findClusters($allVisits);
    $suspects  = $detector->detectSockpuppets($clusters, $config['clustering']['min_cluster_size'] ?? 2);
    $detector->saveClusters($suspects, $clusterFile);
}

// ── 7. Serve 1×1 Transparent GIF ──────────────────────────────────────
$gifData = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

header('Content-Type: image/gif');
header('Content-Length: ' . strlen($gifData));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

echo $gifData;
exit;

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Load the last N visit records from the JSON-lines log file.
 */
function loadRecentVisits(string $path, int $limit): array {
    if (!file_exists($path)) return [];

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) return [];

    // Take only the tail
    $tail = array_slice($lines, -$limit);
    $visits = [];
    foreach ($tail as $line) {
        $decoded = json_decode($line, true);
        if ($decoded) $visits[] = $decoded;
    }
    return $visits;
}