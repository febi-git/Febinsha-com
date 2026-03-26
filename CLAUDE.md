# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Work — Required Reading

Before executing any design or UI work, **always** read these files in `taste-skills/skills/`:
- `taste-skills/skills/front-end.md` — frontend design philosophy
- `taste-skills/skills/taste-skill/SKILL.md`
- `taste-skills/skills/brutalist-skill/SKILL.md`
- `taste-skills/skills/minimalist-skill/SKILL.md`
- `taste-skills/skills/soft-skill/SKILL.md`
- `taste-skills/skills/stitch-skill/SKILL.md` (and `DESIGN.md`)
- `taste-skills/skills/output-skill/SKILL.md`
- `taste-skills/skills/redesign-skill/SKILL.md`


## What This Is

Personal brand site for febinsha.com — an "under construction" page with an interactive canvas-based pixel-art drift game. Pure vanilla HTML/CSS/JS, no frameworks, no build tools. Hosted on GitHub Pages with custom domain (CNAME).

## Development

No build step. Open `index.html` in a browser or serve with any static server:
```
npx serve .
```

## Architecture

Scripts load synchronously in order — **this order matters**:
1. `site.config.js` — defines global `SITE_CONFIG` object (all editable content, colors, game tuning)
2. `js/ui.js` — reads `SITE_CONFIG`, sets up DOM/input/overlays, exposes `window.UI`
3. `js/game.js` — reads `SITE_CONFIG.game` and `window.UI`, runs the canvas game loop

Communication between modules: `window.UI` and `window.Game` globals. Game calls `UI.openContact()`, UI calls `Game.freezeCar()` / `Game.resetCar()`.

SEO meta tags in `index.html <head>` must be kept in sync with `site.config.js` manually — crawlers don't execute JS.

## Game Engine

- **Always-on** — no start screen, no game over, no idle state
- **Fixed timestep physics** at 16.667ms — consistent across all refresh rates
- **World wrapping** on 4000px tile for infinite-feeling world
- **Swept-circle collision** — prevents car tunneling through cones at high speed
- **Desktop/mobile tuning** — separate accel, max speed in config; 11 cones desktop, 9 mobile
- **Pixel-art sprites** — cone is string array rendered pixel-by-pixel; F40 car drawn procedurally via `generateCarSprite()`

## Mobile

Body classes drive platform behavior: `is-ios`, `is-touch`, `in-app-browser`, `no-fullscreen`. Set by `ui.js`, consumed by CSS.

- **Portrait lock**: Android tap → fullscreen + landscape lock; iOS tilt animation; in-app browsers show tilt hint (no fullscreen API)
- **In-app browser detection**: UA regex for Instagram, Facebook, Twitter, LinkedIn, Snapchat, TikTok, Pinterest
- **Touch controls**: on-screen buttons visible only in landscape on touch devices

## Brand

| Token  | Value     | Usage                              |
|--------|-----------|------------------------------------|
| bg     | `#F3F1E8` | Warm cream background              |
| text   | `#121212` | Near-black body text               |
| accent | `#e06030` | Orange — buttons, contact node     |
| line   | `#DCD9C6` | Subtle grid and dividers           |
| Font   | Outfit    | All UI text (weights 100, 300, 400)|

## Contact

- **hello@febinsha.com** (email)
- **LinkedIn** — linkedin.com/in/febin-sha
- **Instagram** — instagram.com/kunjayoff
- **WhatsApp** — wa.me/917306062483

Triggered by driving into the orange node at world position (700, -400) or closed via Escape.

## File Conventions

- `taste-skills/skills/front-end.md` — design philosophy reference, consult before any UI work
- `taste-skills/` — design skill files, required reading before design work
- `Brand-Assets/` — logos, favicons, OG image; `favicon.ico` duplicated at root for Google Search discovery
- `Variant/` and `Mood-board/` — design references, not production code
