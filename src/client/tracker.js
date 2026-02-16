/**
 * Tracking Pixel Client Script — Enhanced
 *
 * Collects device fingerprint, behavioral signals, and environmental
 * data, then fires a 1×1 pixel GET request.
 *
 * Behavioral additions over original:
 *   • Mouse-movement detection (first-move latency)
 *   • Font enumeration (bots have sparse font sets)
 *   • Plugin count
 *   • WebDriver / automation flag detection
 *   • Timing-based signals
 *
 * Usage:
 *   <script src="tracker.js"></script>
 *
 * Configuration:
 *   Change TRACKING_ENDPOINT to your hosted pixel URL.
 */

const CONFIG = {
    // For production, change to absolute URL: 'https://your-domain.com/src/php/pixel.php'
    TRACKING_ENDPOINT: 'src/php/pixel.php',
    // Delay (ms) before sending pixel — gives time for mouse/interaction
    SEND_DELAY: 1500,
};

(function () {
    'use strict';

    /* ────────────────────────────────────────────────────────────────── */
    /*  Helpers                                                          */
    /* ────────────────────────────────────────────────────────────────── */

    /** Simple DJB2-style hash → hex string. */
    const hashString = (str) => {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    };

    /** Strip null / undefined values from an object. */
    const cleanData = (obj) =>
        Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));

    /* ────────────────────────────────────────────────────────────────── */
    /*  Fingerprinting                                                   */
    /* ────────────────────────────────────────────────────────────────── */

    /** Canvas fingerprint (text + shapes → toDataURL → hash). */
    const getCanvasFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Hello World', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Hello World', 4, 17);
            return hashString(canvas.toDataURL());
        } catch { return null; }
    };

    /**
     * Font detection — probe a set of common fonts.
     * Bots / headless environments typically support very few fonts.
     */
    const detectFonts = () => {
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New',
            'Georgia', 'Trebuchet MS', 'Comic Sans MS', 'Impact',
            'Lucida Console', 'Tahoma', 'Palatino Linotype',
            'Segoe UI', 'Helvetica Neue', 'Roboto',
        ];

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const baseline = 'monospace';
            const testStr = 'mmmmmmmmmmlli';

            ctx.font = `72px ${baseline}`;
            const baselineWidth = ctx.measureText(testStr).width;

            const available = testFonts.filter(font => {
                ctx.font = `72px '${font}', ${baseline}`;
                return ctx.measureText(testStr).width !== baselineWidth;
            });

            return available.join(',');
        } catch { return ''; }
    };

    /** Detect automation / WebDriver flags that bots forget to hide. */
    const detectAutomation = () => {
        const flags = [];
        if (navigator.webdriver) flags.push('webdriver');
        if (window._phantom || window.__nightmare) flags.push('phantom');
        if (window.callPhantom || window._selenium_ide_export) flags.push('selenium');
        if (window.domAutomation || window.domAutomationController) flags.push('chrome_auto');
        if (document.__webdriver_evaluate || document.__selenium_evaluate) flags.push('webdriver_eval');
        // Headless Chrome detection
        if (/HeadlessChrome/.test(navigator.userAgent)) flags.push('headless_ua');
        if (navigator.plugins && navigator.plugins.length === 0) flags.push('no_plugins');
        return flags.join(',');
    };

    /* ────────────────────────────────────────────────────────────────── */
    /*  Behavioral Signals (collected over SEND_DELAY window)            */
    /* ────────────────────────────────────────────────────────────────── */

    const startTime = Date.now();
    let mouseMovements = 0;
    let timeToFirstMove = null;

    const onMouseMove = () => {
        if (mouseMovements === 0) {
            timeToFirstMove = Date.now() - startTime;
        }
        mouseMovements++;
    };

    document.addEventListener('mousemove', onMouseMove);

    /* ────────────────────────────────────────────────────────────────── */
    /*  Main Collection                                                  */
    /* ────────────────────────────────────────────────────────────────── */

    const collectData = async () => {
        const data = {
            // ── Screen & Window ───────────────────────────────────────
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,

            // ── Time & Location ───────────────────────────────────────
            timezoneOffset: new Date().getTimezoneOffset(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // ── Browser / System ──────────────────────────────────────
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(',') : '',
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,

            // ── Touch ─────────────────────────────────────────────────
            maxTouchPoints: navigator.maxTouchPoints,

            // ── Network ───────────────────────────────────────────────
            connectionType: navigator.connection ? navigator.connection.effectiveType : '',
            connectionRtt: navigator.connection ? navigator.connection.rtt : '',
            connectionSaveData: navigator.connection ? navigator.connection.saveData : '',

            // ── User Preferences ──────────────────────────────────────
            darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,

            // ── Fingerprinting ────────────────────────────────────────
            canvasHash: getCanvasFingerprint(),

            // ── Fonts (bot signal) ────────────────────────────────────
            availableFonts: detectFonts(),
            fontCount: 0, // filled below

            // ── Automation Detection ──────────────────────────────────
            automationFlags: detectAutomation(),

            // ── Plugins ───────────────────────────────────────────────
            pluginCount: navigator.plugins ? navigator.plugins.length : 0,

            // ── Tech ──────────────────────────────────────────────────
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,

            // ── Cookies ───────────────────────────────────────────────
            cookies: document.cookie,

            // ── Navigation / Page Context ─────────────────────────────
            referrer: document.referrer,
            pageTitle: document.title,
            url: window.location.href,

            // ── Behavioral (populated after delay) ────────────────────
            mouseActivity: mouseMovements,
            timeToFirstMove: timeToFirstMove,
        };

        // Fill fontCount from detected fonts
        data.fontCount = data.availableFonts ? data.availableFonts.split(',').length : 0;

        // ── Battery (async) ───────────────────────────────────────────
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                data.batteryLevel = battery.level;
                data.batteryCharging = battery.charging;
            }
        } catch { /* Not available on all platforms */ }

        // ── Performance Timing ────────────────────────────────────────
        if (window.performance) {
            const nav = window.performance.getEntriesByType('navigation')[0];
            if (nav) {
                data.loadTime = nav.loadEventEnd;
            }
        }

        // ── WebGL GPU ─────────────────────────────────────────────────
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
        } catch { /* WebGL not available */ }

        return data;
    };

    /* ────────────────────────────────────────────────────────────────── */
    /*  Send Pixel                                                       */
    /* ────────────────────────────────────────────────────────────────── */

    const sendPixel = async () => {
        // Wait for behavioral signals to accumulate
        await new Promise(resolve => setTimeout(resolve, CONFIG.SEND_DELAY));

        // Stop listening to avoid further overhead
        document.removeEventListener('mousemove', onMouseMove);

        const data = await collectData();
        const params = new URLSearchParams(cleanData(data));

        const img = new Image();
        img.src = `${CONFIG.TRACKING_ENDPOINT}?${params.toString()}`;
        img.style.display = 'none';

        if (document.body) {
            document.body.appendChild(img);
        } else {
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(img));
        }

        console.log('Tracking pixel fired:', data);
    };

    /* ────────────────────────────────────────────────────────────────── */
    /*  Init                                                             */
    /* ────────────────────────────────────────────────────────────────── */

    sendPixel();
})();
