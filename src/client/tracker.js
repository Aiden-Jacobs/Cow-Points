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
    // Helper: Clean object data
    const cleanData = (obj) => {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
    };

    const collectData = () => {
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

            // Tech
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,

            // Navigation
            referrer: document.referrer,
            pageTitle: document.title,
            url: window.location.href,
        };

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

    const sendPixel = () => {
        const data = collectData();
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
