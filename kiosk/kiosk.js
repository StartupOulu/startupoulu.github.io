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
  xhr.open('GET', EVENTS_URL, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status !== 200) return;

    var data = JSON.parse(xhr.responseText);
    events = filterUpcomingEvents(data);

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


/* ---- WELCOME SCREEN (sine scroller) ---- */

var sineTimer = null;
var SINE_TEXT = 'Tervetuloa  \u00B7  Welcome  \u00B7  Tervetuloa  \u00B7  Welcome';
var SINE_FREQUENCY = 0.15;
var SINE_AMPLITUDE = 0; // set dynamically based on scroller height
var SINE_SPEED = 3;     // pixels per frame of horizontal scroll
var SINE_FPS = 33;      // ~30fps interval in ms

function activateWelcome() {
  var container = document.getElementById('sine-scroller');
  if (!container) return;

  // Clear any leftover spans
  container.innerHTML = '';

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

  var containerWidth = container.offsetWidth;
  var offset = containerWidth; // start from right edge
  var time = 0;

  sineTimer = setInterval(function () {
    offset -= SINE_SPEED;

    // Reset when entire text has scrolled off the left edge
    if (offset < -textWidth) {
      offset = containerWidth;
    }

    var j, x, y;
    for (j = 0; j < spans.length; j++) {
      x = offset + positions[j];
      y = Math.sin(j * SINE_FREQUENCY + time) * SINE_AMPLITUDE;
      spans[j].style.left = x + 'px';
      spans[j].style.top = (SINE_AMPLITUDE + y) + 'px';
    }
    time += 0.07;
  }, SINE_FPS);
}

function deactivateWelcome() {
  if (sineTimer) {
    clearInterval(sineTimer);
    sineTimer = null;
  }

  var container = document.getElementById('sine-scroller');
  if (container) {
    container.innerHTML = '';
  }
}


/* ---- EVENT FILTERING ---- */

function filterUpcomingEvents(data) {
  var now = new Date();
  var cutoff = new Date(now.getTime() + THIRTY_DAYS_MS);
  var upcoming = [];
  var i, e;

  for (i = 0; i < data.length; i++) {
    e = data[i];
    e.start = new Date(e.start_time);
    e.end = new Date(e.end_time);

    if (e.start > now && e.start <= cutoff) {
      upcoming.push(e);
    }
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
  var statusBadge = document.querySelector('.status-badge');
  var now = new Date();
  var daysUntil = Math.floor((event.start - now) / (24 * 60 * 60 * 1000));

  if (dateBadge) {
    dateBadge.textContent = formatShortDate(event.start);
  }

  if (statusBadge) {
    if (daysUntil === 0) {
      statusBadge.textContent = 'Today';
      statusBadge.style.display = '';
    } else if (daysUntil === 1) {
      statusBadge.textContent = 'Tomorrow';
      statusBadge.style.display = '';
    } else {
      statusBadge.style.display = 'none';
    }
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
  var diff = event.start - new Date();

  if (diff <= 0) {
    labelEl.textContent = 'Event started';
    numEl.textContent = '';
    return;
  }

  var d = Math.floor(diff / (24 * 60 * 60 * 1000));
  var h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  var m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  var s = Math.floor((diff % (60 * 1000)) / 1000);

  labelEl.textContent = 'Starts in';
  if (d > 0) {
    numEl.textContent = d + 'd  ' + padTwo(h) + 'h  ' + padTwo(m) + 'm  ' + padTwo(s) + 's';
  } else {
    numEl.textContent = padTwo(h) + 'h  ' + padTwo(m) + 'm  ' + padTwo(s) + 's';
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
