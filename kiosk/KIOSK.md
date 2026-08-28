# Kiosk Display

The `kiosk/` directory contains a standalone page for Samsung SmartTVs that rotates between different content screens. It runs on older Tizen browsers (2018+) in landscape mode.

## Files

- `kiosk/index.html` – HTML structure (Jekyll front matter `layout: null`)
- `kiosk/rocket.svg`, `kiosk/unicorn.svg`, `kiosk/moon.svg` – special-screen artwork (square viewBox; rocket faces right, unicorn faces left)
- `kiosk/style.css` – Styles using `display: table` / `table-cell` layout for the event screen
- `kiosk/kiosk.js` – Screen rotation system, event display, sine scroller animation

## Multi-Screen Rotation System

All screens are sibling `<div>`s inside `<body>`. Only one is visible at a time (toggled via `display: block` / `display: none`). A central rotation loop cycles through a playlist.

```
body
  ├── #screen-events   (two-pane event display)
  ├── #screen-special  (full-bleed takeover for major events)
  └── #screen-welcome  (logo + sine-scrolling text)
```

### Playlist order

With no special events, the playlist is:

```
Welcome → Event 0 → Event 1 → … → Event N → Welcome → Event 0 → …
```

When one or more events are flagged `special: true`, those events are pulled out
of the normal rotation and one takeover *act* is interleaved after each remaining
event:

```
Welcome → Event 0 → Special(act 0) → Event 1 → Special(act 1) → Event 2 → Special(act 2) → …
```

Each screen shows for 15 seconds (`SCREEN_DURATION_MS`). The welcome screen appears once per full cycle.

### Adding a new screen

1. Add `<div id="screen-foo" class="screen">` in `index.html`
2. Add CSS for it in `style.css`
3. Register it in the `screens` object in `kiosk.js` with `activate` / `deactivate` functions
4. Add it to the playlist in `buildPlaylist()`

### Current screens

**Welcome screen** (`#screen-welcome`): Displays the StartupOulu logo with a demoscene-style sine-wave text scroller. The text scrolls right-to-left with each character's Y-coordinate animated via `Math.sin()`. Animation starts on activate, cleans up on deactivate.

**Events screen** (`#screen-events`): Two-pane layout showing event details (title, date, location, description, countdown) on the left and the event cover image with a QR code on the right.

**Special takeover** (`#screen-special`): Full-bleed screen for major events, used
for any event with `special: true` in its front matter. Designed to be readable
by someone walking past, so it leans on colour, scale and motion.

Persistent across every act:

- A passion→knowledge gradient wash over two angled brand-colour blocks
- The cover image far back at 10% opacity, zoomed to 175% — event posters carry
  their own headline, date and sponsor logos, and at any higher opacity or
  without the zoom those ghost through and read as a printing error
- A **live countdown** in the top rail, so the "when" is on screen whichever act
  you catch. It is a **split-flap board** — days / hours / minutes as
  individual digit tiles, each with a hinge line across the middle. A tile flips
  only when its own digit changes, so the minutes tile flaps once a minute and
  the rest sit still: the motion means something rather than running constantly.
  The flip is a vertical squash to nothing and back (`updateFlaps`), swapping the
  digit at the midpoint while the tile is edge-on — a true 3D card flip would
  need `rotateX` / `transform-style: preserve-3d`, which is not safe here.
  There is deliberately **no seconds tile**: seconds would flip every tick and
  turn the board back into ambient motion. Once there is nothing left to count
  down the board gives way to a single pill: green `NYT MENOSSA · LIVE NOW`
  while running, pink with the date once finished
- **The act wipe** — a skewed brand-gradient panel covers the screen at the start
  of every act, then whips away to reveal it. This is the screen's main
  attention device: continuous motion gets tuned out within seconds, but the
  onset of a fast change is caught in peripheral vision, and firing once per act
  keeps it from becoming wallpaper
- **The flyby** — a 🚀 or a 🦄 crosses the screen on its own schedule: once
  ~0.9s after the screen appears, then every 3–5s (randomised), so several
  crossings per act. The ride **alternates every crossing** (`wipeCount % 2`,
  `RIDES`), flies **left-to-right or right-to-left at random**, climbs as it
  goes, and takes a slightly different path each time so repeat crossings don't
  trace the same line.
  Orientation is worked out from the combination of ride and direction: 🚀 points
  right by default and 🦄 points left, so exactly one of (is-unicorn, going-left)
  needs mirroring — `flightShipEl.className = (isUnicorn !== flightGoingLeft) ?
  'is-flipped' : ''`. The exhaust reverses to match (`backSign`), and the tail is
  read off the trailing side of the glyph box (`tailFrac`). It trails a plume of rainbow
  particles in the welcome screen's `RAINBOW` palette. A 🌙 shows in the corner
  during crossings on the CTA act only.
  The rocket emoji already points up-and-right so it needs no rotation; the
  unicorn faces left and is mirrored with `scaleX(-1)` to face its direction of
  travel.
  Particles come from a **fixed recycled pool of 46 divs** (`ensureFumePool`) —
  creating and destroying elements every frame is the expensive part on this
  hardware, so nothing is added to the DOM after the first crossing. When the
  pool is exhausted the extra particle is skipped rather than the pool growing.
  The plume keeps burning after the ship exits so it does not blink out mid-air.
  The flyby runs off `specialBgTimer`, not its own interval
- A quiet animated backdrop: seven slowly drifting brand-colour orbs plus a
  faint diagonal light sweep. Orb glow comes from a `radial-gradient`, never
  `filter: blur()` — blurring elements this large would cripple the TV's
  compositor. Sweep and all seven orbs share one interval (`specialBgTimer`)
- A solid Fame-orange ticker along the bottom carrying the title and date

One DOM, three acts swapped by JS, each opening with a short entry animation:

| Act | Content |
|-----|---------|
| 0 | **Hype** – giant uppercase title over a gradient rule. The headline is split into one span per character and twinkles: ~7% of letters are lit in a brand colour at any moment, the rest stay Canvas white. Characters are grouped into `.sp-word` nowrap wrappers so lines still break between words, not mid-word |
| 1 | **Countdown** – days / hours / min cards with a solid orange ticking seconds chip, or `NYT MENOSSA · LIVE NOW` while running |
| 2 | **CTA** – large scannable QR built from the event's own `cta_link`, with `cta_title` as the headline |

Timers used: `specialCountdownTimer` (act 1), `specialRailTimer` (rail pill),
`specialTickerTimer`, `specialBgTimer` (sweep + orbs), `specialTwinkleTimer`
(headline), `specialWipeTimer` (act wipe), `specialEntryTimer`. All are cleared in
`deactivateSpecial`, which runs on every screen transition — which also force-hides
the wipe panel, so a transition mid-wipe can never leave it stuck over the screen.

### Tuning the motion

The screen is deliberately calm between wipes; earlier revisions had five
continuous effects competing and the headline twinkle read as constant flashing.
If it needs rebalancing, these are the knobs (all in `kiosk.js`):

| Constant | Now | Effect |
|---|---|---|
| `TWINKLE_PER_TICK` / `TWINKLE_LIFE` / `TWINKLE_FPS` | 1 / 4 / 240 | How many headline letters are lit at once (~7%) |
| `WIPE_STEPS` | 19 | Act wipe duration (~630 ms) |
| `FLIGHT_GAP_MIN_MS` / `FLIGHT_GAP_MAX_MS` | 3000 / 5000 | Gap between flybys |
| `FLAP_HALF` | 4 | Frames per half-flip on the countdown board (~265 ms total) |
| `FLIGHT_FRAMES_MIN` / `FLIGHT_FRAMES_VAR` | 56 / 26 | Crossing duration (~1.8–2.7 s) |
| `FUME_PER_FRAME` / `FUME_POOL` | 3 / 46 | Exhaust density and pool ceiling |

The ride flies **behind** the act content: `#sp-rocket` and `#sp-fumes` sit at
`z-index: 1`, below the stage at `2`, so a crossing never obscures the headline.
Raising them above `2` would put the ride in front.

The emoji is 30vh. Its size is declared twice — `font-size` on
`#sp-rocket-ship` in the stylesheet and `SHIP_VH` in `kiosk.js`, which is where
the exhaust spawn point is derived from. **Change both together**, or the plume
detaches from the tail. The flight path is also tuned to that height: a 30vh
ride on a steeper path would dip into the ticker band along the bottom.
| `SWEEP_SPEED` | 2.5 | Light-sweep speed |
| `ORB_COUNT`, orb `speed` | 7, 0.12–0.46 | Backdrop orb density and drift |

Prefer adding weight to the wipe over adding more ambient motion — ambient
motion habituates, onset does not.

This screen uses the brand palette (Knowledge `#070540`, Passion `#FF3296`,
Fame `#FF4600`, Canvas `#EDF2F5`) and Hanken Grotesk. The webfont is loaded
globally but applied only under `#screen-special`, so the other screens are
unaffected.

**A finished event loses its special treatment.** `hasEnded()` gates the flag, so
once `end_time` has passed the event is partitioned as an ordinary event and
shows the normal two-pane slide — a finished event should not still be taking
over the screen with a hype countdown. The playlist is only rebuilt every
`EVENTS_REFRESH_MS`, so `activateSpecial` re-checks and rebuilds on the spot if
an event finished while it still held special slots.

To make an event use this screen, add to its front matter:

```yaml
special: true
```

`events.json.liquid` must emit the flag (it does) or the kiosk cannot see it.

## Technical Constraints

- **ES5 only** – no `const`/`let`, arrow functions, template literals, `fetch`, or Promises
- **CSS 2.1 + viewport units** – no flexbox, no grid, no `gap`, no `min()`, no `object-fit`
- Two-pane event layout uses `display: table` / `table-cell` with `position: absolute` for bottom-pinned elements
- All sizes use `vh`/`vw` units for resolution independence (720p, 1080p, 4K)
- Animation is done via JS `setInterval` + `element.style` updates. CSS `@keyframes` are used only for the small state pulses (`live-pulse`, `sp-live-pulse`, `sp-sec-pulse`, `sp-kicker-pulse`). The special
  screen also uses `transform: rotate()` (prefixed) for its angled blocks; if a
  display ignores it they render as flat bars, which still reads fine
- **Cache-bust every asset** – `index.html` appends `?v=<build revision>` to both
  `style.css` and `kiosk.js`. The TV caches aggressively and does not reload on its
  own; if only one of the two is versioned, a deploy lands new JS against old CSS
  and screens render unstyled
- Logo `<img>` tags carry explicit `width`/`height` attributes. The logo SVG is
  viewBox-only, so without them a legacy engine sizes it from its container
- **No emoji** – the TV's system fonts carry no emoji glyphs, so an emoji text
  node renders as nothing at all. Anything pictorial ships as an SVG file
  (`rocket.svg`, `unicorn.svg`, `moon.svg`) drawn with an `<img>`
- No responsive breakpoints – layout is always landscape

## Analytics

- Uses the same Umami website ID as the main site but with `data-auto-track="false"` to avoid inflating pageview stats
- Tracks a custom `kiosk-heartbeat` event on each page load (every 30 min auto-refresh)
- Each screen is identified via URL parameter: `/kiosk/?s=lobby`
- If `?s=` is not set, no analytics are tracked (useful for local testing)

## Testing

1. `bundle exec jekyll serve` → open `/kiosk/`
2. Welcome screen appears first with sine-scrolling text
3. After 15s, transitions to first event
4. Events rotate, then back to welcome
5. Test at 1280×720 and 1920×1080

### Pinning a single screen

Waiting out the rotation to check one screen is painful, so `?only=` pins one:

```
/kiosk/?only=welcome
/kiosk/?only=special&act=0     # act 0, 1 or 2
/kiosk/?only=events&i=2        # event at index 2
```

Without `?only=` the kiosk rotates normally.
