<?php
/**
 * Configuration for Pixel Analytics System
 * 
 * Provides centralized settings for bot detection, clustering,
 * and geolocation services.
 */

return [
    'geolocation' => [
        'provider'         => 'ipapi.co',
        'api_key'          => '',          // Leave empty for free tier (1,000/day)
        'cache_ttl_hours'  => 24,
        'fallback_enabled' => true,
        // Rate limiting: ipapi.co free = 1,000/day ≈ 41/hour
        'rate_limit' => [
            'max_requests'   => 900,       // Stay under 1,000 with safety margin
            'window_seconds' => 86400,     // 24-hour window
        ],
    ],
    'bot_detection' => [
        'min_human_score'     => 70,
        'min_suspicious_score'=> 30,
        'history_window'      => 1000,     // Recent visitors to compare against
        'weights' => [
            'entropy'     => 0.30,
            'behavioral'  => 0.25,
            'consistency' => 0.25,
            'human'       => 0.20,
        ],
    ],
    'clustering' => [
        'min_cluster_size'          => 2,
        'high_suspicion_threshold'  => 8,
        'ip_prefix_bits'            => 24,  // /24 subnet grouping
    ],
    'supabase' => [
        'url'      => 'https://sagwqkyampwcuzvllbvm.supabase.co',
        'anon_key' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc',
    ],
];
