const EVENTS_URL = '/events.json'; // For running this, go to CMD and paste this "bundle exec jekyll serve". The site will be at /kiosk. 
let events = [];
let currentIndex = 0;
let eventChangeinSec = 30000;//Change this to whatever the refresh time needs to be, currently 30seconds.
let rotationTimer = null;
let countdownTimer = null;

//Get the data from Jekyll made JSON.
function init() {
  fetch(EVENTS_URL)
    .then(r => r.ok ? r.json() : Promise.reject("Failed to fetch events"))
    .then(data => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);//If wanted to change the ammount of days shown, change the first number in days, currently 30.

      events = data
        .map(e => ({...e, start: new Date(e.start_time), end: new Date(e.end_time)}))
        .filter(e => e.start > now && e.start <= thirtyDaysLater)  // Fitler so that only coming events will be shown. 
        .sort((a, b) => a.start - b.start);

      if (events.length > 0) {//Change event, currently every 30 seconds.
        showEvent(0);
        if (events.length > 1) setInterval(() => showEvent((currentIndex + 1) % events.length), eventChangeinSec);
      }
    })
    .catch(console.error);
}

function showEvent(i) {//Show the event data in HTML.
  const e = events[i];
  if (!e) return;
  currentIndex = i;

  document.getElementById('event-title').innerHTML = e.title;
  document.getElementById('date').textContent = formatDate(e.start, e.end);
  document.getElementById('location').textContent = e.location || '';
  document.getElementById('kuvaus').innerHTML = e.description || '';
  document.getElementById('event-img').src = (e.cover_image);

  const dateBadge = document.querySelector('.date-badge');
  const statusBadge = document.querySelector('.status-badge');
  const now = new Date();
  const daysUntil = Math.floor((e.start - now) / (24 * 60 * 60 * 1000));
  
  if (dateBadge) dateBadge.textContent = e.start.toLocaleDateString('fi-FI');
  if (statusBadge) {
    statusBadge.textContent = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : '';
    statusBadge.style.display = daysUntil <= 1 ? '' : 'none';
  }

  startCountdown(e);
}

function formatDate(start, end) {// Date formatting so things wont hopefully break.
  const d = start.toLocaleDateString('fi-FI');
  const s = start.toLocaleTimeString('fi-FI', {hour: '2-digit', minute: '2-digit'});
  const e = end.toLocaleTimeString('fi-FI', {hour: '2-digit', minute: '2-digit'});
  return `${d} · ${s}–${e}`;
}

//Countdown box
function startCountdown(event) {
  clearInterval(countdownTimer);
  const labelEl = document.querySelector('#countdown-box .count-label');
  const numEl = document.getElementById('countdown-num');

  //Show hours in case event is within 2 days, else show in days for the next 30 days, otherwise it will be skipped, so wont be shown.
  const tick = () => {
    const diff = event.start - new Date();
    if (diff <= 0) {
      labelEl.textContent = 'Event started';
      numEl.textContent = '';
      return;
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days > 2) {
      labelEl.textContent = 'Days to start';
      numEl.textContent = `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      const h = Math.floor(diff / (60 * 60 * 1000));
      const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((diff % (60 * 1000)) / 1000);
      labelEl.textContent = 'Starts in';
      numEl.textContent = `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);