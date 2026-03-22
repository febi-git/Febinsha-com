/* ══════════════════════════════════════════════════
 *  UI — DOM interactions, input, overlays
 *  Reads from SITE_CONFIG (loaded before this file)
 * ══════════════════════════════════════════════════ */

(function () {
    const cfg = SITE_CONFIG;

    /* ── Apply brand colors to CSS custom properties ── */
    const root = document.documentElement.style;
    root.setProperty('--bg', cfg.brand.colors.bg);
    root.setProperty('--text', cfg.brand.colors.text);
    root.setProperty('--accent', cfg.brand.colors.accent);
    root.setProperty('--line', cfg.brand.colors.line);

    /* ── DOM refs ── */
    const contactOverlay = document.getElementById('contactOverlay');
    const closeContactBtn = document.getElementById('closeContact');
    const portraitLock = document.getElementById('portraitLock');
    const canvas = document.getElementById('gameCanvas');

    /* ── Device detection ── */
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isTouchDevice = hasTouch && isCoarsePointer;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        document.body.classList.add('is-ios');
    }
    if (isTouchDevice) {
        document.body.classList.add('is-touch');
    }

    /* Detect if fullscreen API is available (not in Instagram/in-app browsers) */
    var canFullscreen = !!(document.documentElement.requestFullscreen ||
                           document.documentElement.webkitRequestFullscreen);
    if (!canFullscreen && isTouchDevice) {
        document.body.classList.add('no-fullscreen');
    }

    /* ── Populate dynamic content from config ── */
    document.getElementById('statusText').innerHTML = cfg.ui.statusText;
    document.getElementById('contactTitle').textContent = cfg.contact.title;
    document.getElementById('contactBody').innerHTML = cfg.contact.body;
    var lockTextEl = document.getElementById('lockText');
    if (isIOS) {
        lockTextEl.textContent = cfg.ui.lockTextIOS;
    } else if (!canFullscreen) {
        /* In-app browsers (Instagram, etc.) can't do fullscreen — tell user to rotate */
        lockTextEl.textContent = cfg.ui.lockTextNoFullscreen || 'Rotate to landscape to drift';
    } else {
        lockTextEl.textContent = cfg.ui.lockTextDefault;
    }
    document.getElementById('portraitHeading').textContent = cfg.ui.portraitHeading;
    document.getElementById('portraitSubheading').textContent = cfg.ui.portraitSubheading;
    document.getElementById('controlsHintMobile').textContent = cfg.ui.controlsHintMobile;

    /* Populate contact links */
    const linksContainer = document.getElementById('contactLinks');
    cfg.contact.links.forEach(function (group) {
        const div = document.createElement('div');
        div.className = 'link-group';
        const h4 = document.createElement('h4');
        h4.textContent = group.label;
        div.appendChild(h4);
        group.items.forEach(function (item) {
            const a = document.createElement('a');
            a.href = item.href;
            a.textContent = item.text;
            if (item.external) a.target = '_blank';
            div.appendChild(a);
        });
        linksContainer.appendChild(div);
    });

    /* Set logo sources from config */
    var logos = document.querySelectorAll('.logo');
    logos.forEach(function (img) { img.src = cfg.brand.logo; });
    var portraitLogos = document.querySelectorAll('.portrait-lock-logo');
    portraitLogos.forEach(function (img) { img.src = cfg.brand.logo; });

    /* ── Portrait lock (mobile) ── */
    var isPortraitLocked = false;

    function requestFullAndLandscape() {
        var el = document.documentElement;
        var rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (rfs) {
            rfs.call(el).then(function () {
                var lockFn = screen.orientation && screen.orientation.lock;
                if (lockFn) {
                    screen.orientation.lock('landscape').catch(function () {});
                }
            }).catch(function () {});
        }
    }

    function onFirstTouch() {
        if (isTouchDevice && !document.fullscreenElement && canFullscreen) {
            requestFullAndLandscape();
        }
    }

    function dismissPortraitLock() {
        if (!canFullscreen && isTouchDevice) {
            /* In-app browsers (Instagram, etc.) — dismiss lock on tap so user can play */
            isPortraitLocked = false;
            portraitLock.classList.remove('visible');
            setTimeout(function () { portraitLock.style.display = 'none'; }, 400);
            if (touchControls) touchControls.style.display = 'block';
        } else {
            onFirstTouch();
        }
    }

    portraitLock.addEventListener('click', dismissPortraitLock);
    canvas.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });

    var touchControls = document.getElementById('touchControls');

    function checkOrientation() {
        var isMobile = window.innerWidth <= 900 || isTouchDevice;
        var isPortrait = window.innerHeight > window.innerWidth;

        if (isMobile && isPortrait) {
            if (!isPortraitLocked) {
                isPortraitLocked = true;
                portraitLock.style.display = 'flex';
                requestAnimationFrame(function () { portraitLock.classList.add('visible'); });
            }
            /* Hide touch controls in portrait */
            if (isTouchDevice) touchControls.style.display = 'none';
        } else {
            if (isPortraitLocked) {
                isPortraitLocked = false;
                portraitLock.classList.remove('visible');
                setTimeout(function () { portraitLock.style.display = 'none'; }, 400);
            }
            /* Show touch controls only on small-screen touch devices in landscape */
            if (isTouchDevice && window.innerWidth <= 900) {
                touchControls.style.display = 'block';
            } else {
                touchControls.style.display = '';
            }
        }
    }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', function () { setTimeout(checkOrientation, 100); });

    /* ── Input ── */
    var keys = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
        w: false, a: false, s: false, d: false,
        ' ': false
    };

    window.addEventListener('keydown', function (e) {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
        if (['w','a','s','d'].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
        if (e.key === ' ') { keys[' '] = true; e.preventDefault(); }
        if (e.key === 'Escape' && window.UI.isContactOpen) window.UI.closeContact();
    });

    window.addEventListener('keyup', function (e) {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
        if (['w','a','s','d'].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
        if (e.key === ' ') keys[' '] = false;
    });

    /* ── Touch controls ── */
    function bindTouch(btnId, keyName) {
        var btn = document.getElementById(btnId);
        var press = function (e) {
            e.preventDefault();
            keys[keyName] = true;
            btn.classList.add('active');
            if (canFullscreen && !document.fullscreenElement) requestFullAndLandscape();
        };
        var release = function (e) {
            e.preventDefault();
            keys[keyName] = false;
            btn.classList.remove('active');
        };
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
    }
    bindTouch('btnLeft', 'ArrowLeft');
    bindTouch('btnRight', 'ArrowRight');
    bindTouch('btnGas', 'ArrowUp');
    bindTouch('btnBrake', 'ArrowDown');
    bindTouch('btnHB', ' ');

    /* ── Contact overlay ── */
    function openContact() {
        window.UI.isContactOpen = true;
        contactOverlay.classList.add('active');
        if (window.Game) {
            window.Game.freezeCar();
        }
    }

    function closeContact() {
        window.UI.isContactOpen = false;
        contactOverlay.classList.remove('active');
        if (window.Game) {
            window.Game.resetCar();
        }
        if (isTouchDevice && canFullscreen && !document.fullscreenElement) {
            requestFullAndLandscape();
        }
    }

    closeContactBtn.addEventListener('click', closeContact);

    /* ── Expose UI interface for game.js ── */
    window.UI = {
        keys: keys,
        isContactOpen: false,
        isPortraitLocked: function () { return isPortraitLocked; },
        isTouchDevice: isTouchDevice,
        isIOS: isIOS,
        speedDisplay: document.getElementById('speedDisplay'),
        canvas: canvas,
        openContact: openContact,
        closeContact: closeContact,
        checkOrientation: checkOrientation,
        requestFullAndLandscape: requestFullAndLandscape,
    };
})();
