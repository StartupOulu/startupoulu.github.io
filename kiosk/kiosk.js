/*
 * ============================================================
 *  StartupOulu Kiosk – Multi-Screen Rotation System
 * ============================================================
 *
 *  This code is intentionally written in old-school ES5 JavaScript.
 *
 *  The kiosk runs on a Samsung SmartTV whose built-in browser
 *  is based on an older version of Chromium / Tizen WebKit.
 *  It does NOT support modern JavaScript features such as:
 *
 *    - const / let        (we use var)
 *    - arrow functions     (we use function)
 *    - template literals   (we use string concatenation)
 *    - fetch API           (we use XMLHttpRequest)
 *    - Promise             (we use callbacks)
 *    - spread operator     (we copy properties manually)
 *    - padStart            (we wrote a helper)
 *
 *  Please keep all future changes ES5-compatible.
 *
 *  SCREEN ROTATION SYSTEM
 *  ----------------------
 *  Screens are sibling <div>s inside <body>, only one visible
 *  at a time. A central playlist cycles through them.
 *
 *  Playlist: Welcome → Event 0 → Event 1 → … → Welcome → …
 *  Each slot shows for 30 seconds.
 *
 *  To add a new screen:
 *    1. Add <div id="screen-foo" class="screen"> in HTML
 *    2. Add CSS for it
 *    3. Register it in the screens object below with
 *       activate / deactivate functions
 * ============================================================
 */

var EVENTS_URL = '/events.json';
var SCREEN_DURATION_MS = 15000; // each screen shows for 15 seconds
var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
var EVENTS_REFRESH_MS = 10 * 60 * 1000; // re-fetch events.json every 10 min

var events = [];
var currentEventIndex = 0;
var playlist = [];       // array of screen slot objects
var playlistIndex = 0;
var rotationTimer = null;
var countdownTimer = null;


/* ---- SCREEN REGISTRY ---- */

var screens = {
  welcome: {
    el: null,
    activate: activateWelcome,
    deactivate: deactivateWelcome
  },
  events: {
    el: null,
    activate: activateEvents,
    deactivate: deactivateEvents
  },
  special: {
    el: null,
    activate: activateSpecial,
    deactivate: deactivateSpecial
  }
};


/* ---- STARTUP ---- */

document.addEventListener('DOMContentLoaded', function () {
  screens.welcome.el = document.getElementById('screen-welcome');
  screens.events.el = document.getElementById('screen-events');
  screens.special.el = document.getElementById('screen-special');

  loadEvents();
  setInterval(loadEvents, EVENTS_REFRESH_MS);

  // Fire custom Umami event (does not count as a pageview)
  // Use ?s=name in the URL to identify each display
  var parts = window.location.search.split('s=');
  var screen = parts.length > 1 ? parts[1].split('&')[0] : '';
  if (screen && typeof umami !== 'undefined') {
    umami.track('kiosk-heartbeat', { screen: screen });
  }
});


/* ---- DATA LOADING ---- */

function loadEvents() {
  var xhr = new XMLHttpRequest();
  // Append a timestamp so neither the browser nor a CDN serves a stale copy
  xhr.open('GET', EVENTS_URL + '?t=' + new Date().getTime(), true);
  xhr.setRequestHeader('Cache-Control', 'no-cache');

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status !== 200) return;

    var data = JSON.parse(xhr.responseText);
    events = filterUpcomingEvents(data);

    // Stop any in-flight rotation, rebuild playlist from fresh data,
    // and start over so the kiosk reflects additions/removals immediately
    if (rotationTimer) {
      clearInterval(rotationTimer);
      rotationTimer = null;
    }
    buildPlaylist();
    startRotation();
  };

  xhr.send();
}


/* ---- PLAYLIST BUILDER ---- */

function buildPlaylist() {
  playlist = [];

  // Events flagged `special: true` are pulled out of the normal rotation
  // and get the takeover screen instead. They are NOT also shown as
  // ordinary slides -- that would undercut the whole point.
  var regular = [];
  var specials = [];
  var i;
  for (i = 0; i < events.length; i++) {
    if (events[i].special && !hasEnded(events[i])) {
      specials.push(i);
    } else {
      regular.push(i);
    }
  }

  // Always start with welcome
  playlist.push({ type: 'welcome' });

  if (specials.length === 0) {
    // No special events: exactly the playlist this kiosk has always had.
    for (i = 0; i < regular.length; i++) {
      playlist.push({ type: 'events', eventIndex: regular[i] });
    }
    return;
  }

  // A special takes every other slot:
  //   welcome, special, event, special, event, special, ...
  // The playlist starts on a non-special and ends on a special, so the
  // alternation holds across the wrap back to index 0 as well.
  //
  // Which act each slot shows is deliberately NOT baked in here -- it is
  // handed out at display time from a running cursor, so the acts keep
  // advancing across playlist repeats however many slots a cycle happens
  // to have.
  var s = 0;
  playlist.push({ type: 'special', eventIndex: specials[s % specials.length] });
  s++;
  for (i = 0; i < regular.length; i++) {
    playlist.push({ type: 'events', eventIndex: regular[i] });
    playlist.push({ type: 'special', eventIndex: specials[s % specials.length] });
    s++;
  }
}


/* ---- MAIN ROTATION LOOP ---- */

function startRotation() {
  if (playlist.length === 0) return;

  // Dev hook: ?only=special&act=1 pins a single screen so you can work on
  // it without waiting out the rotation. No params => normal behaviour.
  var pinned = getPinnedSlot();
  if (pinned) {
    showScreen(pinned);
    return;
  }

  playlistIndex = 0;
  showScreen(playlist[0]);

  rotationTimer = setInterval(function () {
    playlistIndex = (playlistIndex + 1) % playlist.length;
    showScreen(playlist[playlistIndex]);
  }, SCREEN_DURATION_MS);
}

function showScreen(slot) {
  // Deactivate all screens
  var key;
  for (key in screens) {
    if (screens.hasOwnProperty(key)) {
      screens[key].el.style.display = 'none';
      screens[key].deactivate();
    }
  }

  // Activate the target screen
  var target = screens[slot.type];
  if (!target) return;

  target.el.style.display = 'block';
  target.activate(slot);
}


/* ---- EVENT SCREEN ---- */

function activateEvents(slot) {
  if (events.length === 0) return;
  var idx = slot.eventIndex !== undefined ? slot.eventIndex : 0;
  showEvent(events, idx);
}

function deactivateEvents() {
  clearInterval(countdownTimer);
  countdownTimer = null;
}


/* ---- SPECIAL TAKEOVER SCREEN ---- */

/*
 * Shown for events with `special: true` in their front matter.
 * One DOM, three acts swapped by JS:
 *   0 HYPE      giant title, animated entry
 *   1 COUNTDOWN days / hours / min / sec, or LIVE while running
 *   2 CTA       big scannable QR built from the event's own cta_link
 * The backdrop, top rail and bottom ticker persist across all three.
 */

var SPECIAL_ACT_COUNT = 3;
// Acts are handed out at display time rather than fixed in the playlist, so
// they keep advancing across playlist repeats no matter how many special
// slots a cycle contains.
var specialActCursor = 0;
var SPECIAL_ACT_IDS = ['sp-act-hype', 'sp-act-count', 'sp-act-cta'];
// Acts 0 and 1 centre their content vertically with the CSS 2.1 table
// trick, so they must be display:table when shown, not display:block.
var SPECIAL_ACT_DISPLAY = ['table', 'table', 'block'];

var EVENTS_FALLBACK_URL = 'https://www.startupoulu.com/events.html';
var QR_ENDPOINT = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=';

var specialCountdownTimer = null;
var specialTickerTimer = null;
var specialEntryTimer = null;
var specialRailTimer = null;
var specialBgTimer = null;
var specialTwinkleTimer = null;

var TICKER_SPEED = 2;    // px per frame
var TICKER_FPS = 33;     // ~30fps, matches the welcome scroller
var tickerX = 0;
var tickerCopyWidth = 0;

var ENTRY_STEPS = 20;    // ~650ms at TICKER_FPS

function activateSpecial(slot) {
  // No index (e.g. pinned via ?only=special) => first special event we have.
  var idx = slot.eventIndex !== undefined ? slot.eventIndex : firstSpecialIndex();
  var e = events[idx];
  if (!e) return;

  // The playlist is only rebuilt every EVENTS_REFRESH_MS, so an event can
  // finish while it still holds special slots. Rebuild on the spot rather
  // than showing a takeover for something that is already over.
  if (hasEnded(e)) {
    buildPlaylist();
    playlistIndex = 0;
    showScreen(playlist[0]);
    return;
  }
  // A pinned slot (?act=N) names its act; otherwise take the next one.
  var act;
  if (slot.act !== undefined) {
    act = slot.act;
  } else {
    act = specialActCursor % SPECIAL_ACT_COUNT;
    specialActCursor++;
  }
  showSpecial(e, act);
}

function deactivateSpecial() {
  // Called on every transition for every screen, including ones that were
  // never activated -- so every teardown here must be null-safe.
  if (specialCountdownTimer) {
    clearInterval(specialCountdownTimer);
    specialCountdownTimer = null;
  }
  if (specialTickerTimer) {
    clearInterval(specialTickerTimer);
    specialTickerTimer = null;
  }
  if (specialEntryTimer) {
    clearInterval(specialEntryTimer);
    specialEntryTimer = null;
  }
  if (specialRailTimer) {
    clearInterval(specialRailTimer);
    specialRailTimer = null;
  }
  if (specialBgTimer) {
    clearInterval(specialBgTimer);
    specialBgTimer = null;
  }
  if (specialTwinkleTimer) {
    clearInterval(specialTwinkleTimer);
    specialTwinkleTimer = null;
  }
  var rocketEl = document.getElementById('sp-rocket');
  if (rocketEl) rocketEl.style.display = 'none';
  var moonEl = document.getElementById('sp-moon');
  if (moonEl) moonEl.style.display = 'none';
  var fumeEl = document.getElementById('sp-fumes');
  if (fumeEl) {
    resetFumes();
    fumeEl.style.display = 'none';
  }
  flightStep = -1;
  flightWait = 0;
  flapState = {};
}

function firstSpecialIndex() {
  for (var i = 0; i < events.length; i++) {
    if (events[i].special) return i;
  }
  return 0;
}

function showSpecial(e, act) {
  var i, el;

  // Persistent backdrop
  el = document.getElementById('sp-bg');
  if (el) {
    el.style.backgroundImage = e.cover_image ? 'url(' + e.cover_image + ')' : 'none';
  }

  // Show only the requested act
  for (i = 0; i < SPECIAL_ACT_IDS.length; i++) {
    el = document.getElementById(SPECIAL_ACT_IDS[i]);
    if (el) el.style.display = (i === act) ? SPECIAL_ACT_DISPLAY[i] : 'none';
  }

  if (act === 0) {
    showSpecialHype(e);
    startSpecialEntry('sp-hype-body');
  } else if (act === 1) {
    showSpecialCountdown(e);
    startSpecialEntry('sp-count-body');
  } else {
    showSpecialCta(e);
    startSpecialEntry('sp-cta-inner');
  }

  startSpecialTicker(e);
  startSpecialBackdrop();
  startRailCountdown(e);
  currentSpecialAct = act;
}

// The ride alternates every crossing. A unicorn trailing rainbows is the
// better joke; the rocket keeps it from becoming one-note.
// These are SVG files, not emoji: #screen-special leads its font stack with
// a webfont and the TV will not fall back to a system emoji font from there,
// so an emoji glyph renders as nothing at all.
var RIDES = ['rocket.svg', 'unicorn.svg'];
var rideCount = 0;

/* ---- RAINBOW EXHAUST ---- */

var FUME_POOL = 46;        // recycled elements, never grows
var FUME_PER_FRAME = 3;
var FUME_TAIL = 12;        // frames the plume keeps burning after the ship exits
var fumes = [];

function ensureFumePool(parent) {
  if (fumes.length > 0) return;
  var i, el;
  for (i = 0; i < FUME_POOL; i++) {
    el = document.createElement('div');
    el.className = 'sp-fume';
    el.style.display = 'none';
    parent.appendChild(el);
    fumes.push({ el: el, live: 0, maxLife: 1, x: 0, y: 0, vx: 0, vy: 0 });
  }
}

function spawnFume(x, y, size, backSign) {
  var i, f;
  for (i = 0; i < fumes.length; i++) {
    if (fumes[i].live > 0) continue;
    f = fumes[i];
    f.x = x + (Math.random() - 0.5) * size * 0.6;
    f.y = y + (Math.random() - 0.5) * size * 0.6;
    // Thrown backwards and slightly down -- the ship is climbing away.
    // backSign is +1/-1 so the plume blows opposite the direction of travel.
    f.vx = backSign * (2.4 + Math.random() * 4.2);
    f.vy = 0.5 + Math.random() * 1.9 + (Math.random() - 0.5) * 1.6;
    f.maxLife = 11 + Math.floor(Math.random() * 11);
    f.live = f.maxLife;

    var d = size * (0.16 + Math.random() * 0.22);
    f.el.style.width = d + 'px';
    f.el.style.height = d + 'px';
    f.el.style.background = RAINBOW[Math.floor(Math.random() * RAINBOW.length)];
    f.el.style.display = 'block';
    return;
  }
  // Pool exhausted: skip this particle rather than growing the DOM.
}

function updateFumes() {
  var i, f, alive = 0;
  for (i = 0; i < fumes.length; i++) {
    f = fumes[i];
    if (f.live <= 0) continue;

    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.07;          // drifts downward as it dissipates
    f.vx *= 0.97;
    f.live--;

    if (f.live <= 0) {
      f.el.style.display = 'none';
      continue;
    }
    alive++;
    f.el.style.left = f.x + 'px';
    f.el.style.top = f.y + 'px';
    f.el.style.opacity = '' + (f.live / f.maxLife);
  }
  return alive;
}

function resetFumes() {
  var i;
  for (i = 0; i < fumes.length; i++) {
    fumes[i].live = 0;
    fumes[i].el.style.display = 'none';
  }
}

/* ---- FLYBY ---- */

/*
 * The ride crosses the screen on its own schedule, recurring every few
 * seconds. Driven from specialBgTimer -- no extra interval.
 */
var FLIGHT_FRAMES_MIN = 56;    // ~1.85s crossing at TICKER_FPS
var FLIGHT_FRAMES_VAR = 26;
var FLIGHT_GAP_MIN_MS = 3000;
var FLIGHT_GAP_MAX_MS = 5000;
var FLIGHT_FIRST_MS = 900;     // after the screen appears
var SHIP_VH = 0.30;            // must match #sp-rocket-ship font-size
var FLIGHT_OFF_LEFT = -18;     // % -- fully clear of the left edge
var FLIGHT_OFF_RIGHT = 118;    // % -- fully clear of the right edge

var flightStep = -1;           // -1 = idle, counting down to the next launch
var flightFrames = 0;
var flightWait = 0;            // frames until the next launch
var flightTopFrom = 60;
var flightTopTo = 26;
var flightFromPct = 0;
var flightToPct = 0;
var flightGoingLeft = false;
var currentSpecialAct = 0;

var flightRocketEl = null;
var flightShipEl = null;
var flightRideImg = null;
var flightMoonEl = null;
var flightFumeEl = null;

function scheduleFlight(isFirst) {
  var ms = isFirst
    ? FLIGHT_FIRST_MS
    : FLIGHT_GAP_MIN_MS + Math.random() * (FLIGHT_GAP_MAX_MS - FLIGHT_GAP_MIN_MS);
  flightWait = Math.round(ms / TICKER_FPS);
  flightStep = -1;
}

function startFlight() {
  if (!flightRocketEl || !flightShipEl) return;

  // Alternate the ride on every crossing, and pick a direction.
  var isUnicorn = (rideCount % 2) === 1;
  rideCount++;
  flightGoingLeft = Math.random() < 0.5;

  flightFromPct = flightGoingLeft ? FLIGHT_OFF_RIGHT : FLIGHT_OFF_LEFT;
  flightToPct = flightGoingLeft ? FLIGHT_OFF_LEFT : FLIGHT_OFF_RIGHT;

  if (flightRideImg) flightRideImg.src = RIDES[isUnicorn ? 1 : 0];
  // rocket.svg points right, unicorn.svg points left, so exactly one of
  // (unicorn, going-left) needs the mirror for the ride to face its
  // direction of travel.
  flightShipEl.className = (isUnicorn !== flightGoingLeft) ? 'is-flipped' : '';

  // Vary the path so repeat crossings don't trace the same line.
  // The ride is 30vh tall, so the path is kept shallow enough that it
  // never dips into the ticker band along the bottom.
  flightTopFrom = 40 + Math.random() * 16;
  flightTopTo = flightTopFrom - (18 + Math.random() * 16);
  flightFrames = FLIGHT_FRAMES_MIN + Math.floor(Math.random() * FLIGHT_FRAMES_VAR);
  flightStep = 0;

  if (flightFumeEl) {
    ensureFumePool(flightFumeEl);
    flightFumeEl.style.display = 'block';
  }
  flightRocketEl.style.display = 'block';
  // The moon is only worth it on the call-to-action act.
  if (flightMoonEl) {
    flightMoonEl.style.display = (currentSpecialAct === 2) ? 'block' : 'none';
  }
}

function updateFlight() {
  if (flightStep < 0) {
    flightWait--;
    if (flightWait <= 0) startFlight();
    return;
  }

  flightStep++;
  var t = flightStep / flightFrames;

  if (t >= 1) {
    // The ship leaves; its plume keeps burning via updateFumes().
    if (flightRocketEl) flightRocketEl.style.display = 'none';
    if (flightMoonEl) flightMoonEl.style.display = 'none';
    scheduleFlight(false);
    return;
  }

  var screenW = window.innerWidth || document.documentElement.clientWidth;
  var screenH = window.innerHeight || document.documentElement.clientHeight;
  var shipPx = screenH * SHIP_VH;

  var x = flightFromPct + (flightToPct - flightFromPct) * t;
  var topVh = flightTopFrom - (flightTopFrom - flightTopTo) * t;

  flightRocketEl.style.left = x + '%';
  flightRocketEl.style.top = topVh + 'vh';

  // The ride always faces its direction of travel, so its tail is always
  // on the trailing side of the glyph box whichever way it is going.
  var tailFrac = flightGoingLeft ? 0.80 : 0.20;
  var nx = x / 100 * screenW + shipPx * tailFrac;
  var ny = topVh / 100 * screenH + shipPx * 0.74;
  var backSign = flightGoingLeft ? 1 : -1;
  var n;
  for (n = 0; n < FUME_PER_FRAME; n++) {
    spawnFume(nx, ny, shipPx, backSign);
  }
}


function showSpecialHype(e) {
  setText('sp-hype-date', formatDate(e.start, e.end));
  setText('sp-hype-location', e.location || '');

  var titleEl = document.getElementById('sp-hype-title');
  if (titleEl) {
    buildTwinkleTitle(titleEl, e.title);
    startTwinkle();
  }
}

/*
 * The headline is split into one span per character so individual letters
 * can twinkle. Characters are grouped into nowrap word wrappers first --
 * without them the browser is free to break a line between any two
 * character spans, which would split words mid-word.
 */
function buildTwinkleTitle(el, titleHtml) {
  var parts = String(titleHtml || '').split(/<br\s*\/?>/i);
  var p, words, w, i, ch, wordEl, charEl;

  el.innerHTML = '';
  twinkleChars = [];

  for (p = 0; p < parts.length; p++) {
    if (p > 0) el.appendChild(document.createElement('br'));

    words = decodeTitleText(parts[p]).split(' ');
    for (w = 0; w < words.length; w++) {
      if (words[w] === '') continue;

      wordEl = document.createElement('span');
      wordEl.className = 'sp-word';

      for (i = 0; i < words[w].length; i++) {
        ch = words[w].charAt(i);
        charEl = document.createElement('span');
        charEl.className = 'sp-ch';
        charEl.style.color = TWINKLE_BASE;
        charEl.appendChild(document.createTextNode(ch));
        wordEl.appendChild(charEl);
        twinkleChars.push({ el: charEl, life: 0 });
      }

      el.appendChild(wordEl);
      if (w < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    }
  }
}

// Strips any remaining markup AND decodes HTML entities. Characters are
// inserted as text nodes, so an entity left encoded here would show up
// literally as "&amp;" on screen.
function decodeTitleText(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = String(html || '');
  var text = tmp.textContent || tmp.innerText || '';
  return text.replace(/\s+/g, ' ');
}

/*
 * Twinkle: most letters stay Canvas white so the headline is still
 * readable across a room, while a shifting handful light up in brand
 * colours and decay back. Only a few DOM writes per tick.
 */
var TWINKLE_BASE = '#EDF2F5';
var TWINKLE_COLORS = ['#FF3296', '#FF4600', '#D2FACD', '#E9DEFF'];
// Deliberately sparse. Lighting ~3 of 50 letters at a time reads as an
// occasional glint; at 3 new every 110ms it read as constant flashing.
var TWINKLE_FPS = 240;   // ms between ticks
var TWINKLE_LIFE = 4;    // ticks a lit letter stays lit
var TWINKLE_PER_TICK = 1;
var twinkleChars = [];

function startTwinkle() {
  if (specialTwinkleTimer) {
    clearInterval(specialTwinkleTimer);
    specialTwinkleTimer = null;
  }
  if (twinkleChars.length === 0) return;

  specialTwinkleTimer = setInterval(function () {
    var i, n, c;

    // Fade the currently lit letters back to base
    for (i = 0; i < twinkleChars.length; i++) {
      c = twinkleChars[i];
      if (c.life > 0) {
        c.life--;
        if (c.life === 0) c.el.style.color = TWINKLE_BASE;
      }
    }

    // Light a few fresh ones
    for (n = 0; n < TWINKLE_PER_TICK; n++) {
      c = twinkleChars[Math.floor(Math.random() * twinkleChars.length)];
      if (c && c.life === 0) {
        c.life = TWINKLE_LIFE;
        c.el.style.color = TWINKLE_COLORS[Math.floor(Math.random() * TWINKLE_COLORS.length)];
      }
    }
  }, TWINKLE_FPS);
}

/*
 * Entry animation, run at the start of every act: one short setInterval
 * walking opacity/offset on the act body (and width on the hype rule),
 * then it clears itself. Every act opens with movement, which is what
 * catches someone walking past mid-slot.
 */
function startSpecialEntry(bodyId) {
  var body = document.getElementById(bodyId);
  if (!body) return;
  // Only the hype act has a rule to draw in.
  var rule = document.getElementById('sp-hype-rule');

  if (specialEntryTimer) {
    clearInterval(specialEntryTimer);
    specialEntryTimer = null;
  }

  var step = 0;
  body.style.opacity = '0';
  body.style.top = '5vh';
  if (rule) rule.style.width = '0%';

  specialEntryTimer = setInterval(function () {
    step++;
    var t = step / ENTRY_STEPS;
    if (t >= 1) {
      body.style.opacity = '1';
      body.style.top = '0';
      if (rule) rule.style.width = '100%';
      clearInterval(specialEntryTimer);
      specialEntryTimer = null;
      return;
    }
    // ease-out so it settles rather than stopping dead
    var eased = 1 - (1 - t) * (1 - t);
    body.style.opacity = '' + eased;
    body.style.top = (5 - 5 * eased) + 'vh';
    if (rule) rule.style.width = (eased * 100) + '%';
  }, TICKER_FPS);
}

/*
 * The pill in the top rail counts down on every act, so whichever act a
 * passer-by happens to catch, the "when" is on screen. Flips to a green
 * LIVE pill once the event is running.
 */
function startRailCountdown(e) {
  var el = document.getElementById('sp-rail-count');
  if (!el) return;

  if (specialRailTimer) {
    clearInterval(specialRailTimer);
    specialRailTimer = null;
  }

  updateRailCountdown(e, el);
  specialRailTimer = setInterval(function () {
    updateRailCountdown(e, el);
  }, 1000);
}

function updateRailCountdown(e, el) {
  var now = new Date();
  var diff = e.start - now;
  var textEl = document.getElementById('sp-rc-text');

  if (diff <= 0) {
    // Nothing left to count down, so the board gives way to a single pill.
    if (hasEnded(e)) {
      el.className = 'is-over';
      if (textEl) textEl.textContent = formatShortDate(e.start);
    } else {
      el.className = 'is-live';
      if (textEl) textEl.textContent = 'NYT MENOSSA \u00b7 LIVE NOW';
    }
    return;
  }

  el.className = '';

  var d = Math.floor(diff / (24 * 60 * 60 * 1000));
  var h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  var m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  var dd = padTwo(d), hh = padTwo(h), mm = padTwo(m);
  setFlap('sp-f-d0', dd.charAt(0));
  setFlap('sp-f-d1', dd.charAt(1));
  setFlap('sp-f-h0', hh.charAt(0));
  setFlap('sp-f-h1', hh.charAt(1));
  setFlap('sp-f-m0', mm.charAt(0));
  setFlap('sp-f-m1', mm.charAt(1));
}


/* ---- SPLIT-FLAP TILES ---- */

/*
 * Each tile flips only when its own digit changes, which is the whole point:
 * the minutes tile flaps once a minute and the rest sit still, so the motion
 * means something instead of running constantly.
 *
 * The flip is a vertical squash to nothing and back, swapping the digit at
 * the midpoint -- a full 3D card flip would need transform-style/rotateX,
 * which is not safe on this hardware. Driven from specialBgTimer.
 */
var FLAP_HALF = 4;             // frames per half of the flip (~265ms total)
var flapState = {};            // tile id -> { el, numEl, shown, next, step }

function setFlap(id, ch) {
  var st = flapState[id];

  if (!st) {
    var el = document.getElementById(id);
    if (!el) return;
    var numEl = el.getElementsByTagName('span')[0];
    if (!numEl) return;
    st = { el: el, numEl: numEl, shown: numEl.firstChild ? numEl.firstChild.nodeValue : '', next: ch, step: 0 };
    flapState[id] = st;
  }

  if (st.next === ch && st.step === 0 && st.shown === ch) return;
  st.next = ch;
  if (st.step === 0 && st.shown !== ch) st.step = 1;
}

function updateFlaps() {
  var id, st, scale, total = FLAP_HALF * 2 + 1;

  for (id in flapState) {
    if (!flapState.hasOwnProperty(id)) continue;
    st = flapState[id];
    if (st.step === 0) continue;

    if (st.step <= FLAP_HALF) {
      // closing
      scale = 1 - (st.step / FLAP_HALF);
    } else if (st.step === FLAP_HALF + 1) {
      // swap at the midpoint, while the tile is edge-on
      st.numEl.innerHTML = '';
      st.numEl.appendChild(document.createTextNode(st.next));
      st.shown = st.next;
      scale = 0;
    } else {
      // opening
      scale = (st.step - FLAP_HALF - 1) / FLAP_HALF;
    }

    if (scale < 0) scale = 0;
    st.numEl.style.webkitTransform = 'scaleY(' + scale + ')';
    st.numEl.style.transform = 'scaleY(' + scale + ')';

    st.step++;
    if (st.step > total) {
      st.step = 0;
      st.numEl.style.webkitTransform = 'scaleY(1)';
      st.numEl.style.transform = 'scaleY(1)';
      // A change that landed mid-flip gets its own flip next tick.
      if (st.shown !== st.next) st.step = 1;
    }
  }
}


/*
 * Per-frame driver for the special screen: the flyby, its exhaust and the
 * countdown flaps, all off a single interval.
 *
 * This used to also walk a full-height gradient light band across the screen
 * and drift seven large radial-gradient orbs. On the TV that meant
 * recompositing eight oversized semi-transparent gradient layers 30x a
 * second, which made the whole screen crawl. The backdrop is now static --
 * the veil and the angled brand shapes carry the look on their own, and they
 * are painted once.
 */

function startSpecialBackdrop() {
  var screenEl = document.getElementById('screen-special');
  if (!screenEl) return;

  if (specialBgTimer) {
    clearInterval(specialBgTimer);
    specialBgTimer = null;
  }

  // Cached once per activation -- these are read every frame by the flyby.
  flightRocketEl = document.getElementById('sp-rocket');
  flightShipEl = document.getElementById('sp-rocket-ship');
  flightRideImg = document.getElementById('sp-ride-img');
  flightMoonEl = document.getElementById('sp-moon');
  flightFumeEl = document.getElementById('sp-fumes');
  scheduleFlight(true);

  specialBgTimer = setInterval(function () {
    updateFlight();
    updateFumes();
    updateFlaps();
  }, TICKER_FPS);
}

function showSpecialCountdown(e) {
  var titleEl = document.getElementById('sp-count-title');
  if (titleEl) titleEl.innerHTML = e.title;
  setText('sp-count-meta', formatDate(e.start, e.end) + '  ·  ' + (e.location || ''));

  updateSpecialCountdown(e);
  specialCountdownTimer = setInterval(function () {
    updateSpecialCountdown(e);
  }, 1000);
}

function updateSpecialCountdown(e) {
  var now = new Date();
  var diff = e.start - now;
  var actEl = document.getElementById('sp-act-count');

  if (diff <= 0) {
    // Running (or just finished): swap the whole body for the LIVE statement.
    var endValid = isValidDate(e.end);
    var shortEvent = endValid && (e.end - e.start) <= 24 * 60 * 60 * 1000;
    var isLive = shortEvent && now < e.end;
    if (actEl) actEl.className = isLive ? 'sp-act is-live' : 'sp-act';
    if (!isLive) {
      setText('sp-d', '0');
      setText('sp-h', '0');
      setText('sp-m', '0');
      setText('sp-s', '0');
    }
    return;
  }

  if (actEl) actEl.className = 'sp-act';

  var d = Math.floor(diff / (24 * 60 * 60 * 1000));
  var h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  var m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  var sec = Math.floor((diff % (60 * 1000)) / 1000);

  setText('sp-d', '' + d);
  setText('sp-h', padTwo(h));
  setText('sp-m', padTwo(m));
  setText('sp-s', padTwo(sec));
}

function showSpecialCta(e) {
  var link = e.cta_link || EVENTS_FALLBACK_URL;
  var title = e.cta_title || 'Ilmoittaudu · Sign up';

  setText('sp-cta-title', title);
  setText('sp-cta-meta', formatDate(e.start, e.end) + '\n' + (e.location || ''));

  var qr = document.getElementById('sp-qr');
  if (qr) qr.src = QR_ENDPOINT + encodeURIComponent(link);
}

/*
 * Bottom ticker: the event title repeated, scrolling forever. Two copies
 * of the text sit end to end so the wrap is seamless -- when the first
 * copy has fully scrolled off, reset to 0 and it looks continuous.
 * One element moved per frame, so it is cheaper than the welcome-screen
 * scroller which moves one element per character.
 */
function startSpecialTicker(e) {
  var track = document.getElementById('sp-ticker-track');
  if (!track) return;

  if (specialTickerTimer) {
    clearInterval(specialTickerTimer);
    specialTickerTimer = null;
  }

  var plain = stripTags(e.title) + '   ◆   ' + formatShortDate(e.start) + '   ◆   ';
  var copy = plain + plain + plain;
  track.innerHTML = '';
  track.appendChild(document.createTextNode(copy + copy));

  // Half the full track is one complete repetition of `copy`
  tickerCopyWidth = track.offsetWidth / 2;
  tickerX = 0;
  track.style.left = '0px';

  specialTickerTimer = setInterval(function () {
    tickerX -= TICKER_SPEED;
    if (tickerCopyWidth > 0 && -tickerX >= tickerCopyWidth) {
      tickerX += tickerCopyWidth;
    }
    track.style.left = tickerX + 'px';
  }, TICKER_FPS);
}


/* ---- WELCOME SCREEN (sine scroller + flying unicorns) ---- */

var sineTimer = null;
var unicornTimer = null;
var SINE_TEXT = '★ Onko sinulla bisnes-idea? ★ Tule juttelemaan meille! ★';
var SINE_FREQUENCY = 0.15;
var SINE_AMPLITUDE = 0; // set dynamically based on scroller height
var SINE_SPEED = 7;     // pixels per frame of horizontal scroll
var SINE_FPS = 33;      // ~30fps interval in ms

var UNICORN_COUNT = 8;
var unicorns = [];       // array of { el, x, y, speed, bobPhase, bobAmp, size }

// Rainbow colors for sine text
var RAINBOW = [
  '#FF0055', '#FF4600', '#FFD500', '#00FF88',
  '#00CCFF', '#7B2FFF', '#FF3198', '#FF6600'
];

function activateWelcome() {
  var container = document.getElementById('sine-scroller');
  var welcomeEl = document.getElementById('screen-welcome');
  if (!container || !welcomeEl) return;

  // Clear any leftover content
  container.innerHTML = '';
  clearUnicorns(welcomeEl);

  SINE_AMPLITUDE = container.offsetHeight * 0.3;

  // Create spans as inline elements first so the browser lays out
  // natural proportional spacing, then measure positions
  var i, span;
  for (i = 0; i < SINE_TEXT.length; i++) {
    span = document.createElement('span');
    span.className = 'sine-char-inline';
    span.textContent = SINE_TEXT.charAt(i);
    container.appendChild(span);
  }

  // Measure each character's position relative to the first character
  var spans = container.getElementsByTagName('span');
  var firstLeft = spans[0].offsetLeft;
  var positions = [];
  for (i = 0; i < spans.length; i++) {
    positions.push(spans[i].offsetLeft - firstLeft);
  }
  // Total text width = last char position + last char width
  var textWidth = positions[positions.length - 1] + spans[spans.length - 1].offsetWidth;

  // Switch all spans to absolute positioning
  for (i = 0; i < spans.length; i++) {
    spans[i].className = 'sine-char';
  }

  // Spawn flying unicorns
  spawnUnicorns(welcomeEl);

  var containerWidth = container.offsetWidth;
  var offset = containerWidth; // start from right edge
  var time = 0;

  sineTimer = setInterval(function () {
    offset -= SINE_SPEED;

    // Reset when entire text has scrolled off the left edge
    if (offset < -textWidth) {
      offset = containerWidth;
    }

    var j, x, y, hue;
    for (j = 0; j < spans.length; j++) {
      x = offset + positions[j];
      y = Math.sin(j * SINE_FREQUENCY + time) * SINE_AMPLITUDE;
      spans[j].style.left = x + 'px';
      spans[j].style.top = (SINE_AMPLITUDE + y) + 'px';

      // Rainbow color cycle: each char picks a color based on position + time
      spans[j].style.color = RAINBOW[Math.floor((j + time * 3) % RAINBOW.length)];
    }
    time += 0.07;
  }, SINE_FPS);

  // Animate unicorns on the same tick rate
  unicornTimer = setInterval(function () {
    animateUnicorns();
  }, SINE_FPS);
}

function deactivateWelcome() {
  if (sineTimer) {
    clearInterval(sineTimer);
    sineTimer = null;
  }
  if (unicornTimer) {
    clearInterval(unicornTimer);
    unicornTimer = null;
  }

  var container = document.getElementById('sine-scroller');
  if (container) {
    container.innerHTML = '';
  }

  var welcomeEl = document.getElementById('screen-welcome');
  if (welcomeEl) {
    clearUnicorns(welcomeEl);
  }
}


/* ---- FLYING UNICORNS ---- */

function spawnUnicorns(parent) {
  unicorns = [];
  var screenW = window.innerWidth || document.documentElement.clientWidth;
  var screenH = window.innerHeight || document.documentElement.clientHeight;

  for (var i = 0; i < UNICORN_COUNT; i++) {
    var size = 6 + (Math.random() * 14); // 4vh–10vh
    var el = document.createElement('span');
    el.className = 'flying-unicorn';
    el.textContent = '\uD83E\uDD84'; // 🦄
    el.style.fontSize = size + 'vh';
    el.style.position = 'absolute';
    parent.appendChild(el);

    var u = {
      el: el,
      x: Math.random() * screenW,
      y: screenH * 0.1 + Math.random() * screenH * 0.5,
      speed: 2.5 + Math.random() * 3,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 10 + Math.random() * 30,
      size: size
    };
    unicorns.push(u);
  }
}

function animateUnicorns() {
  var screenW = window.innerWidth || document.documentElement.clientWidth;
  var i, u, yOffset;

  for (i = 0; i < unicorns.length; i++) {
    u = unicorns[i];
    u.x -= u.speed;
    u.bobPhase += 0.04;

    // Wrap around when off the left edge
    if (u.x < -150) {
      u.x = screenW + 50;
    }

    yOffset = Math.sin(u.bobPhase) * u.bobAmp;
    u.el.style.left = u.x + 'px';
    u.el.style.top = (u.y + yOffset) + 'px';
  }
}

function clearUnicorns(parent) {
  var els = parent.getElementsByClassName('flying-unicorn');
  // Remove in reverse since it's a live collection
  while (els.length > 0) {
    els[0].parentNode.removeChild(els[0]);
  }
  unicorns = [];
}


/* ---- EVENT FILTERING ---- */

// ---- Europe/Helsinki timezone handling ----
//
// The kiosk TV may run on a device whose system timezone is not Helsinki
// (e.g. UTC on some Samsung displays). We can't rely on the browser's
// local-time methods (getHours, new Date(y,m,d,...)) to represent
// Helsinki wall-clock time. So all event times are treated explicitly as
// Helsinki wall-clock, converted to a real UTC instant for any time
// math, and formatted back to Helsinki wall-clock for display.

// Day-of-month of the last Sunday in a given month. month is 1-12.
function lastSundayOfMonth(year, month) {
  // Date.UTC(y, month, 0) gives the last day of month (month-1 as 0-indexed),
  // which is month (1-indexed).
  var d = new Date(Date.UTC(year, month, 0));
  return d.getUTCDate() - d.getUTCDay();
}

// Is the given Helsinki wall-clock moment in EEST (summer, UTC+3)?
// DST starts: last Sunday of March, 03:00 local jumps to 04:00 local
// DST ends:   last Sunday of October, 04:00 local falls back to 03:00 local
function isHelsinkiSummer(year, month, day, hour) {
  if (month < 3 || month > 10) return false;
  if (month > 3 && month < 10) return true;
  if (month === 3) {
    var springDay = lastSundayOfMonth(year, 3);
    if (day > springDay) return true;
    if (day === springDay && hour >= 3) return true;
    return false;
  }
  var fallDay = lastSundayOfMonth(year, 10);
  if (day < fallDay) return true;
  if (day === fallDay && hour < 4) return true;
  return false;
}

// Parse "YYYY-MM-DDTHH:MM:SS" as Helsinki wall-clock and return the
// corresponding real UTC Date.
function parseHelsinki(str) {
  if (!str) return new Date(NaN);
  var m = String(str).match(/(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return new Date(NaN);
  var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], s = +m[6];
  var offsetMin = isHelsinkiSummer(y, mo, d, h) ? 180 : 120;
  // Wall = UTC + offset, so UTC ms = Date.UTC(wall components) - offset
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s) - offsetMin * 60000);
}

// Given a real Date, return Helsinki wall-clock components.
// Used for display (can't trust getHours on a non-Helsinki device).
function helsinkiWall(date) {
  var ms = date.getTime();
  // Determine the offset in effect at this UTC instant.
  // Spring forward in Helsinki happens at 01:00 UTC on last Sun March.
  // Fall back happens at 01:00 UTC on last Sun October.
  var y = date.getUTCFullYear();
  var springUtc = Date.UTC(y, 2, lastSundayOfMonth(y, 3), 1, 0, 0);
  var fallUtc = Date.UTC(y, 9, lastSundayOfMonth(y, 10), 1, 0, 0);
  var offsetMin = (ms >= springUtc && ms < fallUtc) ? 180 : 120;
  var shifted = new Date(ms + offsetMin * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes()
  };
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

// Has the event finished? Once it has, `special: true` is ignored and the
// event is treated like any other -- a finished event should not still be
// taking over the screen with a hype countdown.
function hasEnded(event) {
  var now = new Date();
  if (isValidDate(event.end)) return now >= event.end;
  if (isValidDate(event.start)) return now >= event.start;
  return false;
}

function sameHelsinkiDay(a, b) {
  var wa = helsinkiWall(a);
  var wb = helsinkiWall(b);
  return wa.year === wb.year && wa.month === wb.month && wa.day === wb.day;
}

function filterUpcomingEvents(data) {
  var now = new Date();
  var cutoff = new Date(now.getTime() + THIRTY_DAYS_MS);
  var upcoming = [];
  var i, e, reference;

  for (i = 0; i < data.length; i++) {
    e = data[i];
    e.start = parseHelsinki(e.start_time);
    e.end = parseHelsinki(e.end_time);

    if (!isValidDate(e.start)) continue;
    if (e.start > cutoff) continue;

    // Short events (≤24h) stay visible until they end — so a "LIVE"
    // event keeps its slot while it's running. Long-running programs
    // (multi-day/week courses) disappear once they've started, since
    // they clutter the upcoming-events rotation.
    var shortEvent = isValidDate(e.end) && (e.end - e.start) <= 24 * 60 * 60 * 1000;
    reference = shortEvent ? e.end : e.start;
    if (reference <= now) continue;

    upcoming.push(e);
  }

  upcoming.sort(function (a, b) {
    return a.start - b.start;
  });

  return upcoming;
}


/* ---- DISPLAY ---- */

function showEvent(evts, index) {
  var e = evts[index];
  if (!e) return;
  currentEventIndex = index;

  document.getElementById('event-title').innerHTML = e.title;
  document.getElementById('date').textContent = formatDate(e.start, e.end);
  document.getElementById('location').textContent = e.location || '';
  document.getElementById('kuvaus').innerHTML = truncate(e.description || '', 150);
  document.getElementById('event-img').src = e.cover_image;

  updateBadges(e);
  startCountdown(e);
}

function updateBadges(event) {
  var dateBadge = document.querySelector('.date-badge');
  var countdownBox = document.getElementById('countdown-box');
  var now = new Date();

  if (dateBadge) {
    dateBadge.textContent = formatShortDate(event.start);
  }

  var endValid = event.end instanceof Date && !isNaN(event.end.getTime());
  // Only single-day-ish events get the visual state treatment.
  // A months-long programme shouldn't pulse "LIVE" or wear the yellow
  // "Today" badge — those indicators are for things starting imminently.
  var shortEvent = endValid && (event.end - event.start) <= 24 * 60 * 60 * 1000;
  var state = 'future';
  if (shortEvent && event.start <= now && now < event.end) {
    state = 'happening-now';
  } else if (shortEvent && sameHelsinkiDay(event.start, now) && event.start > now) {
    state = 'today-upcoming';
  }

  if (countdownBox) {
    countdownBox.className = state === 'future' ? '' : state;
  }
}


/* ---- DATE FORMATTING ---- */

function formatShortDate(date) {
  var w = helsinkiWall(date);
  return w.day + '.' + w.month + '.' + w.year;
}

function formatTime(date) {
  var w = helsinkiWall(date);
  return padTwo(w.hour) + ':' + padTwo(w.minute);
}

function formatDate(start, end) {
  var date = formatShortDate(start);
  var startTime = formatTime(start);
  var endTime = formatTime(end);
  return date + ' \u00B7 ' + startTime + '\u2013' + endTime;
}


/* ---- COUNTDOWN ---- */

function startCountdown(event) {
  clearInterval(countdownTimer);

  var labelEl = document.querySelector('#countdown-box .count-label');
  var numEl = document.getElementById('countdown-num');

  updateCountdown(event, labelEl, numEl);

  countdownTimer = setInterval(function () {
    updateCountdown(event, labelEl, numEl);
  }, 1000);
}

function updateCountdown(event, labelEl, numEl) {
  var now = new Date();
  var diff = event.start - now;

  if (diff <= 0) {
    var endValid = event.end instanceof Date && !isNaN(event.end.getTime());
    var shortEvent = endValid && (event.end - event.start) <= 24 * 60 * 60 * 1000;
    var isLive = shortEvent && now < event.end;
    labelEl.textContent = '';
    numEl.textContent = isLive ? 'LIVE' : '';
    updateBadges(event);
    return;
  }

  var d = Math.floor(diff / (24 * 60 * 60 * 1000));
  var h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  var m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  var s = Math.floor((diff % (60 * 1000)) / 1000);

  labelEl.textContent = 'Starts in';
  if (d > 0) {
    numEl.textContent = d + 'd ' + h + 'h ' + m + 'min';
  } else if (h > 0) {
    numEl.textContent = h + 'h ' + m + 'min';
  } else if (m > 0) {
    numEl.textContent = m + 'min ' + s + 's';
  } else {
    numEl.textContent = s + 's';
  }
}


/* ---- HELPERS ---- */

function padTwo(num) {
  return num < 10 ? '0' + num : '' + num;
}

function getPinnedSlot() {
  var only = getQueryParam('only');
  if (!only || !screens[only]) return null;
  var slot = { type: only };
  var act = getQueryParam('act');
  if (act) slot.act = parseInt(act, 10) || 0;
  var idx = getQueryParam('i');
  if (idx) slot.eventIndex = parseInt(idx, 10) || 0;
  return slot;
}

function getQueryParam(name) {
  var parts = window.location.search.split(name + '=');
  return parts.length > 1 ? parts[1].split('&')[0] : '';
}

function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Event titles may contain markup (e.g. <br/>). The ticker is plain text,
// so strip tags rather than rendering them literally.
function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

function truncate(str, max) {
  if (str.length <= max) return str;
  var cut = str.lastIndexOf(' ', max);
  if (cut === -1) cut = max;
  return str.substring(0, cut) + '\u2026';
}
