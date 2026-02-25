
 Kiosk sivunn rakenne

body
└── div.kiosk                 (koko sivun kehys)
    ├── div#text-side         (Left side: tekstit)
    │   ├── img#startup-logo
    │   ├── h2#coming-events
    │   ├── hr
    │   ├── div.badge-row
    │   │   ├── span.date-badge
    │   │   └── span.status-badge
    │   ├── h1#event-title
    │   ├── div.meta
    │   │   ├── div#date
    │   │   └── div#location
    │   ├── p#kuvaus
    │   ├── div#countdown-box
    │   │   ├── div.count-label
    │   │   └── div#countdown-num
    │   └── footer
    │       ├── a (events-linkki)
    │       └── img.qr-code (QR)
    │
    └── div#image-side        (Right side: kuva)
        └── img#event-img

.kiosk (display: grid; 2 columns)
┌───────────────────────────────┬──────────────────────────────┐
│ #text-side (display: flex)    │ #image-side (flex center)    │
│ (column: ylhäältä alas)       │                              │
│                               │     ┌────────────────────┐   │
│  logo                         │     │     #event-img     │   │
│  Upcoming events + hr         │     │ (rounded corners)  │   │
│  badges                       │     └────────────────────┘   │
│  EVENT TITLE (iso)            │                              │
│  date + location              │                              │
│  short description            │                              │
│  countdown-box                │                              │
│  footer: link + QR            │                              │
└───────────────────────────────┴──────────────────────────────┘



