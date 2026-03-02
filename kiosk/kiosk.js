/*
 * ============================================================
 *  StartupOulu Kiosk – Event Display for Samsung SmartTV
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
 * ============================================================
 */

var EVENTS_URL = '/events.json';
var EVENT_ROTATE_MS = 30000; // rotate to next event every 30 seconds
var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

var currentIndex = 0;
var countdownTimer = null;


/* ---- STARTUP ---- */

document.addEventListener('DOMContentLoaded', function () {
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
    var events = filterUpcomingEvents(data);

    if (events.length === 0) return;

    showEvent(events, 0);

    if (events.length > 1) {
      setInterval(function () {
        currentIndex = (currentIndex + 1) % events.length;
        showEvent(events, currentIndex);
      }, EVENT_ROTATE_MS);
    }
  };

  xhr.send();
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

function showEvent(events, index) {
  var e = events[index];
  if (!e) return;
  currentIndex = index;

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
