<?php
/**
 * send_friend_request_email.php
 *
 * Sends an email notification to a user when they receive a friend request.
 * Queries public.users table for the recipient's email using the Anon Key.
 */

require_once __DIR__ . '/config.php';
$config = require __DIR__ . '/config.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$recipientUserId = $input['recipient_user_id'] ?? null;
$senderUsername  = $input['sender_username'] ?? null;

if (!$recipientUserId || !$senderUsername) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Supabase Configuration
$supabaseUrl = $config['supabase']['url'] ?? '';
$anonKey     = $config['supabase']['anon_key'] ?? '';

if (!$supabaseUrl || !$anonKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

// Fetch Recipient Email from public.users
// Endpoint: /rest/v1/users?UID=eq.<UID>&select=email
$url = trim($supabaseUrl, '/') . "/rest/v1/users?UID=eq." . urlencode($recipientUserId) . "&select=email";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $anonKey",
    "Authorization: Bearer $anonKey",
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user data', 'details' => $response]);
    exit;
}

$data = json_decode($response, true);

// Expecting an array with one object
if (empty($data) || !isset($data[0]['email'])) {
    http_response_code(404);
    echo json_encode(['error' => 'Recipient email not found or not accessible']);
    exit;
}

$recipientEmail = $data[0]['email'];

// Send Email
$subject = "New Friend Request from $senderUsername";
$message = "Hello,\n\nYou have received a new friend request from $senderUsername in Cow I Win!\n\nLog in to accept the request.";
$headers = "From: notifications@cowpoints.com\r\n";
$headers .= "Reply-To: notifications@cowpoints.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

if (mail($recipientEmail, $subject, $message, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
