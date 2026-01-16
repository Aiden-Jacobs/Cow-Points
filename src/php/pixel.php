<?php
// pixel.php - A 1x1 Transparent GIF Tracking Pixel

// 1. Configuration
$logFile = 'visits.json'; // Ensure this file is writable by the web server (chmod 666)

// 2. Collect Data
$data = [
    'timestamp' => date('c'), // ISO 8601 date
    
    // Server-Side Info
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    'method' => $_SERVER['REQUEST_METHOD'] ?? null,
    'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? null,
    'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    'referrer' => $_SERVER['HTTP_REFERER'] ?? null,
    'headers' => getallheaders(),
    
    // Client-Side Info (Query Parameters)
    'query' => $_GET
];

// 3. Log Data (JSON Line)
$jsonEntry = json_encode($data) . PHP_EOL;

// Append to file
// Note: In a high-traffic production env, you'd use a database or async queue.
file_put_contents($logFile, $jsonEntry, FILE_APPEND | LOCK_EX);

// 4. Serve the 1x1 Transparent GIF
// Base64 of a 1x1 transparent GIF
$gifData = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

// Set Headers
header('Content-Type: image/gif');
header('Content-Length: ' . strlen($gifData));
// Prevent Caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

// Output Image
echo $gifData;
exit;
?>