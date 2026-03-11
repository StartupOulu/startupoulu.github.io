# Kiosk Display

The `kiosk/` directory contains a standalone page for Samsung SmartTVs that rotates between different content screens. It runs on older Tizen browsers (2018+) in landscape mode.

## Files

- `kiosk/index.html` – HTML structure (Jekyll front matter `layout: null`)
- `kiosk/style.css` – Styles using `display: table` / `table-cell` layout for the event screen
- `kiosk/kiosk.js` – Screen rotation system, event display, sine scroller animation

## Multi-Screen Rotation System

All screens are sibling `<div>`s inside `<body>`. Only one is visible at a time (toggled via `display: block` / `display: none`). A central rotation loop cycles through a playlist.

```
body
  ├── #screen-events   (two-pane event display)
  └── #screen-welcome  (logo + sine-scrolling text)
```

### Playlist order

```
Welcome → Event 0 → Event 1 → … → Event N → Welcome → Event 0 → …
```

Each screen shows for 30 seconds. The welcome screen appears once per full cycle through all events.

### Adding a new screen

1. Add `<div id="screen-foo" class="screen">` in `index.html`
2. Add CSS for it in `style.css`
3. Register it in the `screens` object in `kiosk.js` with `activate` / `deactivate` functions
4. Add it to the playlist in `buildPlaylist()`

### Current screens

**Welcome screen** (`#screen-welcome`): Displays the StartupOulu logo with a demoscene-style sine-wave text scroller. The text scrolls right-to-left with each character's Y-coordinate animated via `Math.sin()`. Animation starts on activate, cleans up on deactivate.

**Events screen** (`#screen-events`): Two-pane layout showing event details (title, date, location, description, countdown) on the left and the event cover image with a QR code on the right.

## Technical Constraints

- **ES5 only** – no `const`/`let`, arrow functions, template literals, `fetch`, or Promises
- **CSS 2.1 + viewport units** – no flexbox, no grid, no `gap`, no `min()`, no `object-fit`
- Two-pane event layout uses `display: table` / `table-cell` with `position: absolute` for bottom-pinned elements
- All sizes use `vh`/`vw` units for resolution independence (720p, 1080p, 4K)
- All animation done via JS `setInterval` + `element.style` updates (no CSS animations)
- No responsive breakpoints – layout is always landscape

## Analytics

- Uses the same Umami website ID as the main site but with `data-auto-track="false"` to avoid inflating pageview stats
- Tracks a custom `kiosk-heartbeat` event on each page load (every 30 min auto-refresh)
- Each screen is identified via URL parameter: `/kiosk/?s=lobby`
- If `?s=` is not set, no analytics are tracked (useful for local testing)

## Testing

1. `bundle exec jekyll serve` → open `/kiosk/`
2. Welcome screen appears first with sine-scrolling text
3. After 30s, transitions to first event
4. Events rotate, then back to welcome
5. Test at 1280×720 and 1920×1080
