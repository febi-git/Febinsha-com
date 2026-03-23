# Febinsha.com

Personal brand website currently serving as an **"under construction"** page with an interactive pixel-art drift game built into it. Live at [febinsha.com](https://febinsha.com).

---

## Overview

Instead of a generic coming-soon page, visitors get an always-on canvas-based drift game. Drive a pixel-art F40, slide around traffic cones, and find the orange contact node to reach out.

## Tech Stack

- **Pure vanilla HTML / CSS / JS** — no frameworks, no build tools
- Canvas 2D rendering with world-space camera
- Google Fonts (Outfit: weights 100, 300, 400)
- Google Analytics (`G-14HS6XMM7P`)
- Hosted on GitHub Pages with custom domain (CNAME)

## Project Structure

```
├── index.html              # Main entry — loads config, UI, game
├── site.config.js          # All editable content, colors, game tuning
├── css/
│   └── style.css           # All styles — UI, overlays, touch controls, portrait lock
├── js/
│   ├── ui.js               # DOM interactions, input handling, overlays, device detection
│   └── game.js             # Physics, rendering, sprites, game loop
├── 404.html                # Custom 404 page ("This page drifted off course")
├── robots.txt              # Search engine directives
├── front-end.md            # Design quality guidelines (reference)
├── Brand-Assets/
│   ├── logo.png            # "Feb." bold logo (orange-red on transparent)
│   ├── favicon.png         # Browser tab icon (PNG)
│   ├── favicon.ico         # ICO format for broad compatibility
│   ├── Logo white.svg      # White logo used on the in-game contact node
│   ├── Logo white fill.svg # White filled SVG favicon variant
│   └── og-image.png        # Open Graph social share image
├── Variant/                # Design reference file
├── Mood-board/             # Visual inspiration references
├── favicon.ico             # Root-level duplicate for Google Search favicon discovery
└── CNAME                   # GitHub Pages custom domain → febinsha.com
```

## Brand

| Token   | Value       | Usage                     |
|---------|-------------|---------------------------|
| bg      | `#F3F1E8`   | Warm cream background     |
| text    | `#121212`   | Near-black body text      |
| accent  | `#e06030`   | Orange — buttons, contact node, highlights |
| line    | `#DCD9C6`   | Subtle grid and dividers  |
| Font    | Outfit      | All UI text               |

## Game Mechanics

- **Always-on** — no start screen, no game over, no idle state. The car is always ready to drive.
- **Controls**: WASD + Arrow keys (desktop), on-screen touch buttons (mobile), Space / HB button for handbrake
- **Drift physics**: acceleration, friction, drift blending with slip detection, skid marks and tire trails
- **Traffic cones**: procedurally spawned around the car (9 on mobile, 11 on desktop), hitting one triggers a 1-second crash freeze with dark flash + car blink, then respawn
- **Contact node**: orange pulsing circle at world position (700, -400) with the logo inside — driving into it opens the contact overlay
- **World wrapping**: environment text, lines, and contact node wrap around a 4000px tile so the world feels infinite
- **Fixed timestep physics** at 16.667ms intervals for consistent behavior across frame rates

## Mobile Support

- **Portrait lock screen**: on mobile portrait, a fullscreen overlay prompts the user to rotate/tap/tilt
  - Android: tap animation with ripple → requests fullscreen + landscape lock
  - iOS: "Rotate to drift" tilt animation (no fullscreen API) → user manually rotates
  - In-app browsers (Instagram, Facebook, Twitter, LinkedIn, Snapchat, TikTok, Pinterest): detected via UA string, adds `in-app-browser` class — shows tilt hint instead of tap, disables tap-to-fullscreen since the API is unavailable
- **Touch controls**: left/right steer buttons + gas/brake/handbrake, visible only in landscape on touch devices
- **Reduced physics**: lower acceleration, max speed, and cone count on mobile for performance

## Contact Overlay

Full-screen orange overlay with:
- **hello@febinsha.com** (direct email)
- **LinkedIn** — linkedin.com/in/febin-sha
- **Instagram** — instagram.com/kunjayoff
- **WhatsApp** — wa.me/917306062483

Triggered by driving into the orange node or pressing Escape to close.

## Configuration

All editable content lives in [`site.config.js`](site.config.js):
- Meta/SEO tags (also mirrored in `index.html` `<head>` for crawlers)
- Brand colors and logo paths
- Contact overlay text and links
- UI copy (status text, portrait lock messages, control hints)
- Game engine tuning (car physics, cone behavior, world layout, environment text)

## Development Timeline

Built and iterated over March 21–23, 2026:

| Phase | Key Changes |
|-------|-------------|
| **Day 1** (Mar 21) | Initial push — pixel-art car, drift physics, single-file HTML app |
| **Day 1 evening** | New car sprite, speed reduction, mobile optimization (3 rounds), breakpoint fixes |
| **Day 2 morning** (Mar 22) | Production-ready — favicon, CNAME setup, hello section, mobile perfection pass |
| **Day 2 afternoon** | iPhone/Android specific fixes, button tuning, text sizing, iOS lock screen |
| **Day 2 evening** | Final polish — Google Analytics, Instagram link fix, code audit, cone density tuning for mobile |
| **Day 3** (Mar 23) | Refresh rate fix, split into multi-file architecture (config/ui/game/css), in-app browser detection with UA-based class toggling (Instagram/Facebook/Twitter/LinkedIn/Snapchat/TikTok/Pinterest), mobile cone count tuned to 9, iOS lock text changed to "Rotate to drift", contact close button padding simplified, favicon.ico added at root + Brand-Assets for Google Search discovery, apple-touch-icon added |

## Architecture Decisions

1. **Split from single-file to multi-file** — originally all inline in `index.html`, later separated into `site.config.js`, `js/ui.js`, `js/game.js`, `css/style.css` for maintainability
2. **Config-driven content** — all text, colors, links, and game tuning in one config file so non-code changes don't touch logic
3. **No game states** — removed idle/gameover/score in favor of pure always-on interactivity
4. **Swept-circle collision** — prevents car from tunneling through cones at high speed
5. **Fixed timestep** — physics runs at consistent 16.667ms steps regardless of display refresh rate (fixes 120Hz+ screens)
6. **In-app browser fallback** — detects in-app browsers via User-Agent regex (Instagram, Facebook, Twitter, LinkedIn, Snapchat, TikTok, Pinterest) and adds an `in-app-browser` body class. CSS uses this class to show the tilt hint and hide the tap animation, since fullscreen API is unavailable in these webviews. Touch device detection also widened to include screens ≤ 900px even without coarse pointer media query match
