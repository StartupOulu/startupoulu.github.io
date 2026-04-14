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
var SCREEN_DURATION_MS = 15000; // each screen shows for 30 seconds
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
  }
};


/* ---- STARTUP ---- */

document.addEventListener('DOMContentLoaded', function () {
  screens.welcome.el = document.getElementById('screen-welcome');
  screens.events.el = document.getElementById('screen-events');

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

  // Always start with welcome
  playlist.push({ type: 'welcome' });

  // Interleave events: after each full pass through events, insert welcome again
  if (events.length > 0) {
    for (var i = 0; i < events.length; i++) {
      playlist.push({ type: 'events', eventIndex: i });
    }
  }
  // The playlist repeats cyclically, so after the last event
  // it wraps back to index 0 (welcome) automatically
}


/* ---- MAIN ROTATION LOOP ---- */

function startRotation() {
  if (playlist.length === 0) return;

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

// Parse "YYYY-MM-DDTHH:MM:SS" (or "YYYY-MM-DD HH:MM:SS") as local time.
// Built from components so DST and older WebKit parsers both behave
// correctly — avoids the ISO-without-offset ambiguity where some
// engines interpret the string as UTC.
function parseLocal(str) {
  if (!str) return new Date(NaN);
  var m = String(str).match(/(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return new Date(str);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

function filterUpcomingEvents(data) {
  var now = new Date();
  var cutoff = new Date(now.getTime() + THIRTY_DAYS_MS);
  var upcoming = [];
  var i, e, reference;

  for (i = 0; i < data.length; i++) {
    e = data[i];
    e.start = parseLocal(e.start_time);
    e.end = parseLocal(e.end_time);

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
  } else if (shortEvent && event.start.toDateString() === now.toDateString() && event.start > now) {
    state = 'today-upcoming';
  }

  if (countdownBox) {
    countdownBox.className = state === 'future' ? '' : state;
  }
}


/* ---- DATE FORMATTING ---- */

function formatShortDate(date) {
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  return day + '.' + month + '.' + year;
}

function formatTime(date) {
  return padTwo(date.getHours()) + ':' + padTwo(date.getMinutes());
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

function truncate(str, max) {
  if (str.length <= max) return str;
  var cut = str.lastIndexOf(' ', max);
  if (cut === -1) cut = max;
  return str.substring(0, cut) + '\u2026';
}
