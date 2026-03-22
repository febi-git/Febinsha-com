/* ══════════════════════════════════════════════════
 *  GAME — Physics, rendering, sprites, game loop
 *  Reads from SITE_CONFIG and window.UI
 * ══════════════════════════════════════════════════ */

(function () {
    var cfg = SITE_CONFIG.game;
    var ui  = window.UI;

    /* ── Canvas setup ── */
    var canvas = ui.canvas;
    var ctx = canvas.getContext('2d', { alpha: false });
    var dpr = window.devicePixelRatio || 1;
    var width, height;
    var frameCount = 0;
    var crashTimer = 0;
    var contactCooldown = 0;
    var lastTime = 0;
    var gameTime = 0;
    var physicsAccum = 0;
    var PHYSICS_STEP = 16.667;

    /* ── Palette ── */
    var PALETTE = cfg.palette;
    var PIXEL_SCALE = cfg.pixelScale;
    var W = cfg.worldTileSize;
    var MAX_SKIDS = cfg.maxSkids;

    /* ── Camera ── */
    var camera = { x: 0, y: 0 };

    /* ── Pixel-art sprites ── */
    var sprCone = [
        "  11  ",
        " 1221 ",
        " 1441 ",
        " 1221 ",
        "122221",
        "111111"
    ];

    /* F40 car sprite (pre-rendered canvas) */
    var CAR_SPR_W = 24;
    var CAR_SPR_H = 52;
    var CAR_SCALE = 0.8;
    var carSpriteCanvas = document.createElement('canvas');
    carSpriteCanvas.width = CAR_SPR_W;
    carSpriteCanvas.height = CAR_SPR_H;

    function generateCarSprite() {
        var cc = carSpriteCanvas.getContext('2d');
        cc.clearRect(0, 0, CAR_SPR_W, CAR_SPR_H);
        var dr = function (x, y, w, h, c) { cc.fillStyle = c; cc.fillRect(x, y, w, h); };

        var body   = PALETTE.accent;
        var dark   = '#8B2500';
        var blk    = PALETTE.dark;
        var yellow = '#FBE790';
        var orange = '#e06030';

        dr(2, 4, 20, 44, body);
        dr(4, 0, 16, 4, body);
        dr(6, -2, 12, 2, dark);
        dr(4, 18, 16, 12, body);
        cc.fillStyle = blk;
        cc.beginPath();
        cc.moveTo(4, 18); cc.lineTo(20, 18); cc.lineTo(18, 12); cc.lineTo(6, 12);
        cc.fill();
        dr(3, 19, 2, 10, blk);
        dr(19, 19, 2, 10, blk);
        dr(4, 30, 16, 12, blk);
        dr(5, 32, 14, 1, '#1A1114');
        dr(5, 35, 14, 1, '#1A1114');
        dr(5, 38, 14, 1, '#1A1114');
        dr(1, 44, 2, 6, dark);
        dr(21, 44, 2, 6, dark);
        dr(0, 48, 24, 4, body);
        dr(3, 49, 3, 2, dark);
        dr(7, 49, 3, 2, orange);
        dr(14, 49, 3, 2, orange);
        dr(18, 49, 3, 2, dark);
        dr(9, 51, 6, 2, '#888');
        dr(5, 4, 4, 3, dark);
        dr(15, 4, 4, 3, dark);
        dr(4, 2, 3, 1, yellow);
        dr(17, 2, 3, 1, yellow);
    }

    function drawSpriteArray(c, arr, x, y, scale, angle, alpha) {
        angle = angle || 0;
        alpha = alpha != null ? alpha : 1;
        c.save();
        c.translate(x, y);
        c.rotate(angle);
        c.globalAlpha = alpha;

        var w = arr[0].length, h = arr.length;
        var ox = -(w * scale) / 2, oy = -(h * scale) / 2;

        for (var r = 0; r < h; r++) {
            for (var col = 0; col < w; col++) {
                var ch = arr[r][col];
                if (ch === ' ') continue;
                switch (ch) {
                    case '1': c.fillStyle = PALETTE.dark; break;
                    case '2': c.fillStyle = PALETTE.accent; break;
                    case '3': c.fillStyle = PALETTE.light; break;
                    case '4': c.fillStyle = PALETTE.cream; break;
                }
                c.fillRect(Math.floor(ox + col * scale), Math.floor(oy + r * scale), scale, scale);
            }
        }
        c.restore();
    }

    /* ── Car ── */
    var carCfg = cfg.car;
    var tuning = ui.isTouchDevice ? carCfg.mobile : carCfg.desktop;
    var car = {
        x: carCfg.startX,
        y: carCfg.startY,
        width: CAR_SPR_W * CAR_SCALE,
        height: CAR_SPR_H * CAR_SCALE,
        angle: -Math.PI / 2,
        velocity: { x: 0, y: 0 },
        accel: tuning.accel,
        friction: carCfg.friction,
        turnSpeed: tuning.turnSpeed,
        maxSpeed: tuning.maxSpeed,
        driftFactor: carCfg.driftFactor,
        score: 0
    };

    /* ── World objects ── */
    var obstacles = [];
    var skidMarks = [];
    var tireTrailCounter = 0;

    var contactNode = {
        x: cfg.contactNode.x,
        y: cfg.contactNode.y,
        radius: cfg.contactNode.radius,
        pulse: 0
    };

    var nodeLogo = new Image();
    nodeLogo.src = SITE_CONFIG.brand.nodeLogoSvg;

    var mobileScale = ui.isTouchDevice ? 0.5 : 1;
    var envText = cfg.envText.map(function (t) {
        var s = t.mobileScale ? mobileScale : 1;
        return {
            text: t.text,
            x: t.x,
            y: t.y * s,
            size: (ui.isTouchDevice && t.sizeTouch) ? t.sizeTouch : t.size * s,
            weight: t.weight,
            align: t.align,
            tracking: (t.tracking || 0) * s,
            color: t.color || null
        };
    });

    var envLines = cfg.envLines;

    /* ── Resize ── */
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);

    /* ── Respawn ── */
    function respawn() {
        car.x = carCfg.startX;
        car.y = carCfg.startY;
        car.angle = -Math.PI / 2;
        car.velocity = { x: 0, y: 0 };
        car.score = 0;
        obstacles = [];
        skidMarks = [];
        for (var i = 0; i < 4; i++) spawnObstacle();
    }

    function spawnObstacle() {
        var ox, oy, tries = 0;
        var fwdBias = 0.6;
        var fwdX = Math.cos(car.angle);
        var fwdY = Math.sin(car.angle);
        var minConeDist = ui.isTouchDevice ? 80 : 120;
        do {
            var a = Math.random() * Math.PI * 2;
            var d = ui.isTouchDevice ? (150 + Math.random() * 300) : (250 + Math.random() * 500);
            ox = car.x + Math.cos(a) * d + fwdX * d * fwdBias;
            oy = car.y + Math.sin(a) * d + fwdY * d * fwdBias;
            tries++;
            var tooClose = obstacles.some(function (o) { return Math.hypot(o.x - ox, o.y - oy) < minConeDist; });
            var inLandingZone = ui.isTouchDevice && Math.hypot(ox, oy - carCfg.startY) < 300;
            if (Math.hypot(car.x - ox, car.y - oy) >= (ui.isTouchDevice ? 100 : 150) && !tooClose && !inLandingZone) break;
        } while (tries < 30);

        obstacles.push({ x: ox, y: oy, radius: 3 * PIXEL_SCALE });
    }

    function cullAndSpawnCones() {
        var cullDist = ui.isTouchDevice ? 500 : 1200;
        for (var i = obstacles.length - 1; i >= 0; i--) {
            if (Math.hypot(car.x - obstacles[i].x, car.y - obstacles[i].y) > cullDist) {
                obstacles.splice(i, 1);
            }
        }
        var target = 10;
        while (obstacles.length < target) {
            spawnObstacle();
        }
    }

    /* ── Physics ── */
    function updatePhysics(dt, elapsed) {
        if (ui.isContactOpen) return;

        gameTime += elapsed;

        if (crashTimer > 0) {
            crashTimer -= elapsed;
            if (crashTimer <= 0) { crashTimer = 0; respawn(); }
            return;
        }

        var keys = ui.keys;
        var isLeft  = keys.ArrowLeft  || keys.a;
        var isRight = keys.ArrowRight || keys.d;
        var isGas   = keys.ArrowUp    || keys.w;
        var isBrake = keys.ArrowDown  || keys.s;
        var isHandbrake = keys[' '];

        if (isLeft)  car.angle -= car.turnSpeed * dt;
        if (isRight) car.angle += car.turnSpeed * dt;

        var fwdX = Math.cos(car.angle);
        var fwdY = Math.sin(car.angle);

        if (isGas) {
            car.velocity.x += fwdX * car.accel * dt;
            car.velocity.y += fwdY * car.accel * dt;
            /* Subtle auto-drift weave while accelerating */
            var weave = Math.sin(gameTime * 0.0012) * car.turnSpeed * 0.3 * dt;
            car.angle += weave;
        }
        if (isBrake) {
            car.velocity.x -= fwdX * car.accel * 0.4 * dt;
            car.velocity.y -= fwdY * car.accel * 0.4 * dt;
        }

        var speed = Math.hypot(car.velocity.x, car.velocity.y);
        if (speed > car.maxSpeed) {
            var r = car.maxSpeed / speed;
            car.velocity.x *= r;
            car.velocity.y *= r;
            speed = car.maxSpeed;
        }

        /* Drift blending */
        if (speed > 0.1) {
            var vnx = car.velocity.x / speed;
            var vny = car.velocity.y / speed;
            var nx = vnx * car.driftFactor + fwdX * (1 - car.driftFactor);
            var ny = vny * car.driftFactor + fwdY * (1 - car.driftFactor);
            var len = Math.hypot(nx, ny);
            car.velocity.x = (nx / len) * speed;
            car.velocity.y = (ny / len) * speed;

            var slip = Math.abs(fwdX * vny - fwdY * vnx);
            if (slip > 0.3 && speed > 3) {
                var driftDrag = Math.pow(0.97, dt);
                car.velocity.x *= driftDrag;
                car.velocity.y *= driftDrag;
                var rd = CAR_SPR_H * 0.4;
                var wo = CAR_SPR_W * 0.4;
                var rx = car.x - fwdX * rd;
                var ry = car.y - fwdY * rd;
                var px = Math.cos(car.angle - Math.PI / 2);
                var py = Math.sin(car.angle - Math.PI / 2);

                skidMarks.push(
                    { x: rx + px * wo, y: ry + py * wo, life: 1.0 },
                    { x: rx - px * wo, y: ry - py * wo, life: 1.0 }
                );
                if (skidMarks.length > MAX_SKIDS) skidMarks.splice(0, 2);
                car.score += slip * 0.5;
            }

            if (slip <= 0.3 && speed > 1.5) {
                tireTrailCounter++;
                if (tireTrailCounter % 3 === 0) {
                    var rd2 = CAR_SPR_H * 0.4;
                    var wo2 = CAR_SPR_W * 0.38;
                    var rx2 = car.x - fwdX * rd2;
                    var ry2 = car.y - fwdY * rd2;
                    var px2 = Math.cos(car.angle - Math.PI / 2);
                    var py2 = Math.sin(car.angle - Math.PI / 2);
                    skidMarks.push(
                        { x: rx2 + px2 * wo2, y: ry2 + py2 * wo2, life: 0.45, trail: true },
                        { x: rx2 - px2 * wo2, y: ry2 - py2 * wo2, life: 0.45, trail: true }
                    );
                    if (skidMarks.length > MAX_SKIDS) skidMarks.splice(0, 2);
                }
            }
        }

        /* Friction */
        var fr = isHandbrake ? 0.94 : (isBrake ? 0.92 : car.friction);
        var frDt = Math.pow(fr, dt);

        if (isHandbrake && speed > 2) {
            car.driftFactor = carCfg.handbrakeGrip;
        } else {
            car.driftFactor = carCfg.driftFactor;
        }
        car.velocity.x *= frDt;
        car.velocity.y *= frDt;

        /* Move */
        car.x += car.velocity.x * dt;
        car.y += car.velocity.y * dt;

        /* HUD */
        ui.speedDisplay.innerText = Math.round(speed * 8) + ' km/h';

        /* Cones */
        cullAndSpawnCones();

        /* Collision */
        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            if (Math.hypot(car.x - obs.x, car.y - obs.y) < car.width / 2 + obs.radius) {
                car.velocity.x = 0;
                car.velocity.y = 0;
                crashTimer = cfg.crashDuration;
                return;
            }
        }

        /* Contact node */
        contactNode.pulse += 0.05 * dt;
        if (contactCooldown > 0) contactCooldown -= elapsed;
        var cnWrapX = contactNode.x + Math.round((car.x - contactNode.x) / W) * W;
        var cnWrapY = contactNode.y + Math.round((car.y - contactNode.y) / W) * W;
        if (Math.hypot(car.x - cnWrapX, car.y - cnWrapY) < contactNode.radius + 15 && !ui.isContactOpen && contactCooldown <= 0) {
            ui.openContact();
        }

        /* Camera lerp */
        var camSmooth = 1 - Math.pow(0.9, dt);
        camera.x += (car.x - width / 2 - camera.x) * camSmooth;
        camera.y += (car.y - height / 2 - camera.y) * camSmooth;

        /* Skid decay */
        for (var j = skidMarks.length - 1; j >= 0; j--) {
            skidMarks[j].life -= 0.003 * dt;
            if (skidMarks[j].life <= 0) skidMarks.splice(j, 1);
        }
    }

    /* ── Text with letter-spacing ── */
    function drawSpacedText(c, text, x, y, spacing) {
        var total = 0;
        for (var i = 0; i < text.length; i++) total += c.measureText(text[i]).width + spacing;
        total -= spacing;

        var saved = c.textAlign;
        var sx = x;
        if (saved === 'center') sx = x - total / 2;
        else if (saved === 'right') sx = x - total;

        c.textAlign = 'left';
        var cx = sx;
        for (var i = 0; i < text.length; i++) {
            c.fillText(text[i], cx, y);
            cx += c.measureText(text[i]).width + spacing;
        }
        c.textAlign = saved;
    }

    /* ── Draw ── */
    function draw() {
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        /* Grid */
        ctx.strokeStyle = 'rgba(220, 217, 198, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var gs = 200;
        var vx0 = camera.x, vx1 = camera.x + width;
        var vy0 = camera.y, vy1 = camera.y + height;
        for (var gx = Math.floor(vx0 / gs) * gs; gx <= vx1; gx += gs) { ctx.moveTo(gx, vy0); ctx.lineTo(gx, vy1); }
        for (var gy = Math.floor(vy0 / gs) * gs; gy <= vy1; gy += gs) { ctx.moveTo(vx0, gy); ctx.lineTo(vx1, gy); }
        ctx.stroke();

        /* Wrap helper */
        function wrapCoord(wx, wy) {
            var cx = camera.x + width / 2;
            var cy = camera.y + height / 2;
            var dx = wx - cx, dy = wy - cy;
            return {
                x: wx - Math.round(dx / W) * W,
                y: wy - Math.round(dy / W) * W
            };
        }

        /* Environment lines */
        ctx.strokeStyle = PALETTE.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        envLines.forEach(function (l) {
            var midX = (l.x1 + l.x2) / 2, midY = (l.y1 + l.y2) / 2;
            var w = wrapCoord(midX, midY);
            var offX = w.x - midX, offY = w.y - midY;
            ctx.moveTo(l.x1 + offX, l.y1 + offY);
            ctx.lineTo(l.x2 + offX, l.y2 + offY);
        });
        ctx.stroke();

        /* Environment text */
        envText.forEach(function (t) {
            var w = wrapCoord(t.x, t.y);
            ctx.font = t.weight + ' ' + t.size + "px 'Outfit', sans-serif";
            ctx.fillStyle = t.color || PALETTE.dark;
            ctx.textAlign = t.align;
            ctx.textBaseline = 'middle';
            if (t.tracking > 0) {
                ctx.save();
                drawSpacedText(ctx, t.text, w.x, w.y, t.tracking);
                ctx.restore();
            } else {
                ctx.fillText(t.text, w.x, w.y);
            }
        });

        /* Contact node */
        var cw = wrapCoord(contactNode.x, contactNode.y);
        var pr = contactNode.radius + Math.sin(contactNode.pulse) * 5;
        ctx.beginPath();
        ctx.arc(cw.x, cw.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#e06030';
        ctx.fill();

        if (nodeLogo.complete && nodeLogo.naturalWidth > 0) {
            var logoSize = pr * 1.6;
            ctx.drawImage(nodeLogo, cw.x - logoSize / 2, cw.y - logoSize / 2, logoSize, logoSize);
        }

        /* Skid marks & tire trails */
        skidMarks.forEach(function (s) {
            ctx.beginPath();
            if (s.trail) {
                ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(18,18,18,' + (s.life * 0.35) + ')';
            } else {
                ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(18,18,18,' + (s.life * 0.8) + ')';
            }
            ctx.fill();
        });

        /* Cones */
        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            ctx.save();
            ctx.translate(obs.x + 2, obs.y + 6);
            ctx.scale(1, 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(18, 18, 18, 0.15)';
            ctx.fill();
            ctx.restore();
            drawSpriteArray(ctx, sprCone, obs.x, obs.y, PIXEL_SCALE);
        }

        /* Car shadow */
        ctx.fillStyle = PALETTE.shadow;
        ctx.save();
        ctx.translate(car.x + 3, car.y + 6);
        ctx.rotate(car.angle + Math.PI / 2);
        ctx.scale(CAR_SCALE, CAR_SCALE);
        ctx.fillRect(-CAR_SPR_W / 2, -CAR_SPR_H / 2, CAR_SPR_W, CAR_SPR_H);
        ctx.restore();

        /* F40 sprite (blink during crash) */
        if (crashTimer <= 0 || frameCount % 10 < 5) {
            ctx.save();
            ctx.translate(car.x, car.y);
            ctx.rotate(car.angle + Math.PI / 2);
            ctx.scale(CAR_SCALE, CAR_SCALE);
            ctx.drawImage(carSpriteCanvas, -CAR_SPR_W / 2, -CAR_SPR_H / 2);
            ctx.restore();
        }

        ctx.restore(); /* camera */

        /* Crash flash overlay */
        if (crashTimer > 0) {
            var fade = crashTimer / cfg.crashDuration;
            ctx.fillStyle = PALETTE.dark;
            ctx.globalAlpha = fade * 0.4;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        }

        frameCount++;
    }

    /* ── Loop ── */
    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var frameTime = Math.min(timestamp - lastTime, 50);
        lastTime = timestamp;

        if (!ui.isPortraitLocked()) {
            physicsAccum += frameTime;
            while (physicsAccum >= PHYSICS_STEP) {
                updatePhysics(1.0, PHYSICS_STEP);
                physicsAccum -= PHYSICS_STEP;
            }
            draw();
        }
        requestAnimationFrame(loop);
    }

    /* ── Game interface for UI ── */
    window.Game = {
        freezeCar: function () {
            car.velocity.x = 0;
            car.velocity.y = 0;
        },
        resetCar: function () {
            contactCooldown = cfg.contactCooldown;
            car.x = carCfg.startX;
            car.y = carCfg.startY;
            car.angle = -Math.PI / 2;
            car.velocity = { x: 0, y: 0 };
            camera.x = car.x - width / 2;
            camera.y = car.y - height / 2;
            skidMarks = [];
        }
    };

    /* ── Init ── */
    generateCarSprite();
    resize();
    camera.x = car.x - width / 2;
    camera.y = car.y - height / 2;
    for (var i = 0; i < 4; i++) spawnObstacle();

    ui.checkOrientation();
    document.fonts.ready.then(function () { requestAnimationFrame(loop); });
})();
