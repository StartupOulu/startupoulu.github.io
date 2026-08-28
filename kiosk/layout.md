# Kiosk DOM structure

Structural map of `kiosk/index.html`. For behaviour, constraints and tuning see
[KIOSK.md](./KIOSK.md).

`<body>` holds three sibling screens. Exactly one is `display: block` at a time;
`showScreen()` in `kiosk.js` toggles them.

```
body
├── div#screen-events.screen.kiosk      two-pane event slide
│   ├── div#text-side                   left pane
│   │   ├── img#startup-logo
│   │   ├── h2#coming-events
│   │   ├── hr
│   │   ├── div.badge-row
│   │   │   └── span.date-badge
│   │   ├── h1#event-title
│   │   ├── div.meta
│   │   │   ├── div#date
│   │   │   └── div#location
│   │   └── p#kuvaus
│   ├── div#image-side                  right pane
│   │   └── img#event-img
│   ├── div#countdown-box               bottom-pinned, NOT inside #text-side
│   │   ├── div.count-label
│   │   └── div#countdown-num
│   └── div.qr-row                      bottom-pinned
│       └── img.qr-code
│
├── div#screen-special.screen           full-bleed takeover (special: true)
│   ├── div#sp-bg                       cover image, 10% opacity
│   ├── div#sp-veil                     navy gradient wash
│   ├── div#sp-shape-a / div#sp-shape-b angled brand blocks
│   ├── div#sp-rail                     persistent top rail
│   │   ├── span#sp-rocket-ship ...     (see flyby below)
│   │   ├── img#sp-logo
│   │   └── div#sp-rail-count           split-flap countdown
│   ├── div#sp-stage                    exactly one act visible
│   │   ├── div#sp-act-hype.sp-act
│   │   ├── div#sp-act-count.sp-act
│   │   └── div#sp-act-cta.sp-act
│   ├── div#sp-fumes                    exhaust particle pool
│   ├── div#sp-rocket                   zero-size flyby anchor
│   │   └── span#sp-rocket-ship
│   │       └── img#sp-ride-img         rocket.svg / unicorn.svg
│   ├── div#sp-moon                     CTA act only
│   └── div#sp-ticker
│       └── div#sp-ticker-track
│
└── div#screen-welcome.screen           logo + sine scroller
    ├── img.welcome-logo
    └── div#sine-scroller
```

## Layout technique

No grid and no flexbox — neither is safe on the target Tizen browsers.

- `#screen-events` uses `display: table` with `#text-side` / `#image-side` as
  `table-cell`, which is what gives the two panes.
- `#countdown-box` and `.qr-row` are siblings of the panes, not children, and are
  pinned with `position: absolute`. Nesting them inside `#text-side` would put
  them in the table cell and break the pinning.
- Acts 0 and 1 centre vertically with the same table trick (`.sp-vcell` is a
  `table-cell` with `vertical-align: middle`), so those acts must be
  `display: table` when shown, not `display: block` — `SPECIAL_ACT_DISPLAY` in
  `kiosk.js` encodes that.
- Everything is sized in `vh` / `vw` so the same markup works at 720p, 1080p
  and 4K.
