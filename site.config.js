/*
 * ═══════════════════════════════════════════════════
 *  SITE CONFIG — Edit values below to update content
 *  Do not change the structure or variable names
 * ═══════════════════════════════════════════════════
 */

const SITE_CONFIG = {

    /* ── Meta & SEO ─────────────────────────────────
       NOTE: Also update the <head> tags in index.html
       (crawlers don't execute JS) */
    meta: {
        title: "Febinsha | Under Construction — Drift While You Wait",
        description: "The full experience is currently being assembled. In the meantime, feel free to reach out directly or keep drifting.",
        url: "https://febinsha.com",
        ogImage: "https://febinsha.com/Brand-Assets/og-image.png",
    },

    /* ── Analytics ── */
    analytics: {
        googleId: "G-14HS6XMM7P",
    },

    /* ── Brand ── */
    brand: {
        logo: "Brand-Assets/logo.png",
        favicon: "Brand-Assets/favicon.png",
        faviconSvg: "Brand-Assets/Logo white fill.svg",
        nodeLogoSvg: "Brand-Assets/Logo white.svg",
        colors: {
            bg:     "#F3F1E8",
            text:   "#121212",
            accent: "#e06030",
            line:   "#DCD9C6",
        },
    },

    /* ── Contact Overlay ── */
    contact: {
        title: "Hello",
        body: "The full experience is currently being assembled.<br>In the meantime, feel free to reach out directly or keep drifting.",
        links: [
            {
                label: "Direct",
                items: [
                    { text: "hello@febinsha.com", href: "mailto:febinshapa123@gmail.com" },
                ],
            },
            {
                label: "Connect",
                items: [
                    { text: "LinkedIn", href: "https://www.linkedin.com/in/febin-sha", external: true },
                    { text: "Instagram", href: "https://www.instagram.com/kunjayoff/", external: true },
                ],
            },
            {
                label: "Quick Chat",
                items: [
                    { text: "WhatsApp", href: "https://wa.me/917306062483", external: true },
                ],
            },
        ],
    },

    /* ── UI Text ── */
    ui: {
        statusText: 'Find the <span style="color:#e06030;">orange</span> node if you can\'t wait, or drift',
        portraitHeading: "febinsha.com",
        portraitSubheading: "Site Under Construction",
        lockTextDefault: "Tap to drift",
        lockTextIOS: "Rotate to drift",
        lockTextNoFullscreen: "Rotate to landscape to drift",
        controlsHintMobile: "Use on-screen buttons to drift",
    },

    /* ── Game Engine ── */
    game: {
        palette: {
            bg:     "#F3F1E8",
            dark:   "#121212",
            accent: "#c9553a",
            light:  "#d4765e",
            cream:  "#FFFFFF",
            line:   "#DCD9C6",
            shadow: "rgba(18, 18, 18, 0.25)",
        },
        pixelScale: 4,
        worldTileSize: 4000,
        maxSkids: 1200,
        crashDuration: 1000,
        contactCooldown: 2000,
        contactNode: { x: 700, y: -400, radius: 60 },
        car: {
            desktop: { accel: 0.5, maxSpeed: 14, turnSpeed: 0.07 },
            mobile:  { accel: 0.3, maxSpeed: 8,  turnSpeed: 0.07 },
            friction: 0.96,
            driftFactor: 0.90,
            handbrakeGrip: 0.96,
            startX: 0,
            startY: 150,
        },
        envText: [
            { text: "FEBINSHA.COM",             x: 0, y: -80,  size: 180, weight: 100, align: "center", tracking: 8,  mobileScale: true },
            { text: "SITE UNDER CONSTRUCTION",  x: 0, y: 60,   size: 32,  weight: 300, align: "center", tracking: 4,  mobileScale: true },
            { text: "While you wait, drift around.", x: 0, y: 250, size: 16, sizeTouch: 14, weight: 400, align: "center", tracking: 2, color: "#c9553a" },
        ],
        envLines: [
            { x1: -1200, y1: 180,  x2: 1200, y2: 180 },
            { x1: -1200, y1: -500, x2: 1200, y2: -500 },
            { x1: 400,   y1: -800, x2: 400,  y2: 800 },
        ],
    },
};
