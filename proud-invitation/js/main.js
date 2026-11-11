/* PROUD _ sweet bar — invitation choreography */
(() => {
  const cfg = window.PROUD_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const chrome = $('.chrome'), soundBtn = $('.chrome__sound');
  const video = $('.film'), filmVelvet = $('.film__velvet'), blade = $('.blade'), tray = $('.tray'), heroGlint = $('.tray .glint');
  const titleLines = $$('.tray__title .line > span'), orangeLine = $('.line--orange > span');
  const trayBrand = $('.tray__brand'), trayMark = $('.tray__brand .wordmark'), trayWhen = $('.tray__when');
  const cue = $('.scroll-cue'), sticky = $('.hero__sticky');

  const TURN_START = 3.0;   // film: tray edge-on
  const TURN_END = 5.5;     // film: tray fully front, before the push-in
  const HANDOFF_LEAD = 0.22;

  let introDone = false, filmBusy = false;
  const soundPref = cfg.sound !== false;   // sound by default; browsers may still block it until the first tap
  let soundBlocked = false;

  /* ── config → DOM ─────────────────────────────────────── */
  const name = (() => {
    const hp = new URLSearchParams(location.hash.replace(/^#/, '')), sp = new URLSearchParams(location.search);
    const h = hp.get('to') || hp.get('name') || sp.get('to') || sp.get('name');
    return h ? h.trim().slice(0, 40) : '';
  })();
  const day = cfg.dayLabel || 'sunday', dateLabel = cfg.dateLabel || '15.11.2026';
  const dayTime = cfg.time ? `${day} · ${cfg.time}` : day;
  $$('[data-day]').forEach(el => el.textContent = day);
  $$('[data-daytime]').forEach(el => el.textContent = dayTime);
  $$('[data-date]').forEach(el => el.textContent = dateLabel);
  if (cfg.time) $('[data-time-big]').textContent = cfg.time; else $('[data-time-wrap]').hidden = true;
  const details = $('[data-details]');
  if (cfg.venue) { $('[data-venue]').textContent = cfg.venue; $('[data-row="venue"]').hidden = false; details.hidden = false; } else details.hidden = true;
  // the white square on the card carries the location QR and opens the same link when tapped
  const square = $('[data-square]');
  if (cfg.mapUrl) { square.href = cfg.mapUrl; square.addEventListener('click', e => e.stopPropagation()); }
  else { square.removeAttribute('href'); square.removeAttribute('target'); const im = $('img', square); if (im) im.remove(); }
  const rsvp = $('[data-rsvp]');
  rsvp.textContent = cfg.rsvpLabel || 'rsvp';
  if (cfg.rsvpUrl) { rsvp.href = cfg.rsvpUrl; rsvp.target = '_blank'; rsvp.hidden = false; } else rsvp.hidden = true;   // no rsvp link = no rsvp button
  const map = $('[data-map]');
  if (cfg.mapUrl) { map.href = cfg.mapUrl; map.hidden = false; }
  const cal = $('[data-calendar]');
  if (cfg.calendar === false || !cfg.date) cal.hidden = true;
  else {
    const d = cfg.date.replace(/-/g, '');
    let dates;
    if (cfg.timeStart) {
      const s = cfg.timeStart.replace(':', '') + '00';
      let end;
      if (cfg.timeEnd) end = `${d}T${cfg.timeEnd.replace(':', '')}00`;
      else {   // default length: 3 hours, rolling past midnight when the start is late
        const [y, mo, da] = cfg.date.split('-').map(Number), [hh, mm] = cfg.timeStart.split(':').map(Number);
        end = new Date(Date.UTC(y, mo - 1, da, hh + 3, mm)).toISOString().slice(0, 19).replace(/[-:]/g, '');
      }
      dates = `${d}T${s}/${end}`;
    } else {
      const next = new Date(cfg.date + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
      dates = `${d}/${next.toISOString().slice(0, 10).replace(/-/g, '')}`;
    }
    const q = new URLSearchParams({ action: 'TEMPLATE', text: cfg.eventTitle || 'PROUD _ sweet bar', dates, details: "we're proud. are you?", location: cfg.venue || cfg.mapUrl || '' });
    if (cfg.timeStart) q.set('ctz', 'Asia/Riyadh');
    cal.href = 'https://calendar.google.com/calendar/render?' + q.toString();
  }
  if (name) { const n = $('[data-name]'); n.textContent = `for ${name}`; n.hidden = false; }

  /* ── helpers ──────────────────────────────────────────── */
  const sweep = (el, dur = 0.75) => {
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { opacity: 1, '--gx': '-130%' });
    gsap.to(el, { '--gx': '260%', duration: dur, ease: 'power2.inOut', onComplete: () => gsap.set(el, { opacity: 0 }) });
  };
  const showChrome = () => { chrome.classList.add('is-on'); gsap.to(chrome, { opacity: 1, duration: 1.2, ease: 'power2.out' }); };

  /* ── film plumbing ────────────────────────────────────── */
  function seekTo(t, timeout = 1600) {
    return new Promise(res => {
      let done = false;
      const finish = ok => { if (!done) { done = true; res(ok); } };
      const trySeek = () => { try { video.currentTime = t; } catch (e) { finish(false); } };
      video.addEventListener('seeked', () => finish(video.readyState >= 2), { once: true });
      video.addEventListener('error', () => finish(false), { once: true });
      if (video.readyState >= 1) trySeek(); else video.addEventListener('loadedmetadata', trySeek, { once: true });
      setTimeout(() => finish(false), timeout);
    });
  }
  function watchFilm(onHandoff) {
    let fired = false, velvetOn = false;
    const check = (now, meta) => {
      const t = meta && typeof meta.mediaTime === 'number' ? meta.mediaTime : video.currentTime;
      if (!velvetOn && t >= 4.25) { velvetOn = true; gsap.to(filmVelvet, { opacity: 1, duration: 0.5, ease: 'power1.in' }); }
      if (!fired && t < TURN_START - 0.6 && t > 0.2) { fired = true; dbg('film running from start — bailing'); onHandoff(); return; }
      if (!fired && t >= TURN_END - HANDOFF_LEAD) { fired = true; onHandoff(); return; }
      if (!fired && !video.paused) {
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(check); else requestAnimationFrame(check);
      }
    };
    check();
    video.addEventListener('ended', () => { if (!fired) { fired = true; onHandoff(); } }, { once: true });
  }

  /* ── hero reveal (crisp tray + engraving) ─────────────── */
  function reveal() {
    const tl = gsap.timeline({ __intro: true });
    tl.fromTo(tray, { scale: 1.035 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0);          // the last settle
    tl.fromTo(titleLines, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.32 }, 0.2);
    tl.fromTo(orangeLine, { letterSpacing: '0.09em' }, { letterSpacing: '0em', duration: 1.4, ease: 'power3.out' }, 0.5);
    tl.set(trayBrand, { opacity: 1 }, 1.75);
    tl.fromTo(trayMark, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.inOut' }, 1.75);   // signed
    tl.fromTo($('.tray__bar'), { opacity: 0, x: 6 }, { opacity: 1, x: 0, duration: 0.35 }, 2.1);
    tl.fromTo(trayWhen, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 2.3);
    tl.call(() => { introDone = true; }, null, 2.8);
    // stillness: nothing moves 2.8 → 4.1
    tl.call(showChrome, null, 4.1);
    tl.set(cue, { opacity: 1 }, 4.1);
    tl.fromTo($('.scroll-cue i'), { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'expo.out' }, 4.1);
    return tl;
  }

  function handoff(withSound) {
    sweep(heroGlint, 0.7);
    gsap.to(tray, { opacity: 1, duration: 0.22, delay: 0.2, ease: 'power1.inOut' });
    // hard guarantee (independent of the animation ticker): the footage is gone and the crisp tray is up
    setTimeout(() => { gsap.set([video, filmVelvet], { opacity: 0 }); gsap.set(tray, { opacity: 1 }); if (video.muted) { video.pause(); filmBusy = false; } }, 800);
    gsap.to(filmVelvet, { opacity: 0, duration: 0.2, delay: 0.34 });
    gsap.to(video, { opacity: 0, duration: 0.2, delay: 0.34, onComplete: () => {
      if (video.muted) { video.pause(); filmBusy = false; }
      else video.addEventListener('ended', () => { filmBusy = false; soundBtn.classList.remove('is-playing'); }, { once: true });
    } });
  }

  async function playTurn({ withSound = false } = {}) {
    if (filmBusy) return false;
    filmBusy = true;
    video.muted = !withSound; video.volume = 1;
    const ok = await seekTo(TURN_START, withSound ? 2500 : 1500);
    if (!ok) { filmBusy = false; return false; }
    try { await video.play(); } catch (e) { filmBusy = false; return false; }
    gsap.to(video, { opacity: 1, duration: 0.16, ease: 'power1.in' });
    watchFilm(() => handoff(withSound));
    return true;
  }

  /* fallback when the film is not ready in time: the blade unfolds into the tray */
  function fallbackTurn() {
    gsap.set(tray, { opacity: 1, clipPath: 'inset(0 49.5% 0 49.5%)', scaleX: 0.55 });
    const tl = gsap.timeline();
    tl.to(tray, { clipPath: 'inset(0 0% 0 0%)', scaleX: 1, duration: 1.25, ease: 'expo.out' }, 0);
    tl.to(blade, { opacity: 0, duration: 0.35 }, 0.1);
    tl.call(() => sweep(heroGlint, 0.75), null, 0.65);
    tl.call(() => gsap.set(tray, { clearProps: 'clipPath,scaleX' }), null, 1.3);
    tl.call(() => reveal(), null, 0.9);
  }

  function finishIntro() {
    dbg('finishIntro called', new Error().stack.split('\n')[2]);
    if (introDone) return;
    introDone = true;
    gsap.globalTimeline.getChildren(true, true, true).forEach(t => { if (t.vars && t.vars.__intro) t.kill(); });
    gsap.killTweensOf([blade, video, filmVelvet, tray, titleLines, orangeLine, trayBrand, trayMark, trayWhen, cue, chrome, $('.tray__bar'), $('.scroll-cue i')]);
    gsap.set(blade, { opacity: 0 });
    gsap.set([video, filmVelvet], { opacity: 0 }); if (video.muted) video.pause();
    gsap.set(tray, { opacity: 1, scale: 1, clearProps: 'clipPath,scaleX' });
    gsap.set(titleLines, { yPercent: 0 }); gsap.set(orangeLine, { letterSpacing: '0em' });
    gsap.set([trayBrand, trayWhen, $('.tray__bar')], { opacity: 1, x: 0, y: 0 }); gsap.set(trayMark, { clipPath: 'inset(0 0% 0 0)' });
    gsap.set(cue, { opacity: 1 }); gsap.set($('.scroll-cue i'), { scaleY: 1 }); showChrome();
    filmBusy = false;
  }

  const DEBUG = /[?&]debug/.test(location.search);
  const dbg = (...a) => { if (DEBUG) console.log('[proud]', ...a); };
  async function intro() {
    dbg('intro start', { rs: video.readyState });
    if (reduce) {
      document.documentElement.classList.add('reduced');
      gsap.set([tray, chrome, cue, trayBrand, trayWhen], { opacity: 1 }); chrome.classList.add('is-on');
      introDone = true; return;
    }
    // hidden states are owned by GSAP from here on (CSS transforms would be re-parsed as pixels)
    gsap.set(titleLines, { transform: 'none', yPercent: 115 });
    // the blade — first image on screen
    const bladeTl = gsap.timeline();
    bladeTl.fromTo(blade, { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.75, ease: 'expo.out' }, 0.12);
    bladeTl.to(blade, { boxShadow: '0 0 14px 2px rgba(255,255,255,.6), 0 0 90px 10px rgba(200,205,210,.22)', duration: 0.5, ease: 'sine.inOut' }, 0.55);

    // skip only on a deliberate scroll (a stray trackpad tick or a touch must not cut the turn)
    let wheelSum = 0, touchY = null;
    let skipped = false;
    const skip = (why) => { if (skipped || introDone) return; skipped = true; dbg('skip', why); finishIntro(); };
    addEventListener('wheel', e => { wheelSum += Math.abs(e.deltaY); if (wheelSum > 40) skip('wheel'); }, { passive: true });
    addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', e => { if (touchY !== null && Math.abs(e.touches[0].clientY - touchY) > 14) skip('touch'); }, { passive: true });
    addEventListener('keydown', e => { if ([' ', 'ArrowDown', 'PageDown', 'End'].includes(e.key)) skip('key'); });
    // first real tap/click/key = user activation: let the sound in while the turn is still running
    const unlock = () => {
      if (!soundPref) return;
      if (!video.paused && video.muted && video.currentTime < 7.6) { video.muted = false; dbg('unmuted on gesture'); }
      soundBlocked = false;
      removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock);
    };
    addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
    // if the guest leaves the tab mid-intro (app switch, notification), resolve to the rest state at once
    document.addEventListener('visibilitychange', () => { if (document.hidden && !introDone) { dbg('hidden mid-intro'); finishIntro(); } });

    const ready = seekTo(TURN_START, 1500);
    ready.then(v => dbg('seek result', v, 'ct', video.currentTime));
    await Promise.all([ready, new Promise(r => setTimeout(r, 900))]);
    if (introDone) { dbg('introDone before play'); return; }
    const ok = await ready;
    let played = false;
    if (ok) {
      filmBusy = true;
      try {
        video.muted = !soundPref;
        try {
          await Promise.race([video.play(), new Promise((_, rej) => setTimeout(() => rej(new Error('play timeout')), 1200))]);
        } catch (e) {
          if (video.muted) throw e;
          // autoplay with sound refused — run it muted and unmute on the first tap
          dbg('sound autoplay blocked', e && e.name); soundBlocked = true; video.muted = true;
          await Promise.race([video.play(), new Promise((_, rej) => setTimeout(() => rej(new Error('play timeout')), 1200))]);
        }
        // the film must be running from the edge-on frame; otherwise re-seek once, then give up on it
        if (video.currentTime < TURN_START - 0.4) {
          video.currentTime = TURN_START;
          await new Promise(r => setTimeout(r, 180));
        }
        played = video.currentTime >= TURN_START - 0.4 && !video.paused;
        dbg('playing from', video.currentTime, played);
      } catch (e) { played = false; dbg('play failed', e && e.message); }
      if (!played) { filmBusy = false; video.pause(); gsap.set(video, { opacity: 0 }); }
    }
    if (introDone) { dbg('introDone after play'); video.pause(); return; }
    let settled = false;
    if (played) {
      gsap.to(video, { opacity: 1, duration: 0.16, ease: 'power1.in' });
      gsap.to(blade, { opacity: 0, duration: 0.22, delay: 0.06 });
      watchFilm(() => { dbg('handoff at', video.currentTime, 'introDone', introDone); if (settled) return; settled = true; if (introDone) return; handoff(false); reveal(); });
      // safety: the garbled footage must never linger — force the cut if the frame callback never arrives
      setTimeout(() => { if (!settled && !introDone) { settled = true; dbg('safety handoff'); handoff(false); reveal(); } }, (TURN_END - TURN_START) * 1000 + 900);
    } else {
      settled = true;
      fallbackTurn();
    }
  }

  /* ── sound replay ─────────────────────────────────────── */
  async function replayWithSound() {
    if (filmBusy) return;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 0.9 });
    soundBtn.classList.add('is-playing');
    // hide the crisp tray under a sweep, then run the turn with sound
    sweep(heroGlint, 0.6);
    gsap.to(tray, { opacity: 0, duration: 0.25, delay: 0.25 });
    await new Promise(r => setTimeout(r, 450));
    const ok = await playTurn({ withSound: true });
    if (!ok) { gsap.to(tray, { opacity: 1, duration: 0.3 }); soundBtn.classList.remove('is-playing'); }
  }
  soundBtn.addEventListener('click', replayWithSound);
  async function replayTurn() {
    if (filmBusy || !introDone || reduce) return;
    sweep(heroGlint, 0.6);
    gsap.to(tray, { opacity: 0, duration: 0.25, delay: 0.25 });
    await new Promise(r => setTimeout(r, 450));
    const ok = await playTurn({ withSound: soundPref });
    if (!ok) gsap.to(tray, { opacity: 1, duration: 0.3 });
  }
  $('.stage').addEventListener('click', e => { if (!e.target.closest('.chrome')) replayTurn(); });

  /* ── scroll ───────────────────────────────────────────── */
  function scrollFx() {
    gsap.registerPlugin(ScrollTrigger);
    if (fine && !reduce && window.Lenis) {
      const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    if (reduce) return;
    // hero recedes as the lines slide over it
    gsap.to(sticky, { scale: 0.94, opacity: 0.18, ease: 'none', scrollTrigger: { trigger: '.hero', start: '45% top', end: 'bottom top', scrub: true } });
    gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '2% top', end: '14% top', scrub: true } });

    $$('.lines__line').forEach(line => {
      const span = $('.mask > span', line);
      gsap.to(span, { yPercent: 0, ease: 'expo.out', duration: 1.3, scrollTrigger: { trigger: line, start: 'top 86%', once: true } });
    });
    $$('.mask > span').forEach(s => gsap.set(s, { transform: 'none', yPercent: 112 }));

    const when = gsap.timeline({ scrollTrigger: { trigger: '.when', start: 'top 72%', once: true } });
    when.to('.when__day .mask > span', { yPercent: 0, duration: 1, ease: 'expo.out' }, 0);
    when.to('.when__date .mask > span', { yPercent: 0, duration: 1.3, ease: 'expo.out' }, 0.12);
    when.to('.when__time .mask > span', { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 0.3);
    when.to('.when__rule', { scaleX: 1, duration: 1.2, ease: 'expo.out' }, 0.5);
    when.from(['.when__details', '.when__actions'], { opacity: 0, y: 14, duration: 1, ease: 'power2.out', stagger: 0.12 }, 0.7);

    const cardEl = $('.card__tray'), cardGlint = $('.card .glint');
    const card = gsap.timeline({ scrollTrigger: { trigger: '.card', start: 'top 70%', once: true } });
    card.to(cardEl, { y: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }, 0);
    card.call(() => sweep(cardGlint, 0.9), null, 0.55);
    const polish = () => sweep(cardGlint, 0.8);
    cardEl.addEventListener('click', polish);
    cardEl.addEventListener('keydown', e => { if (e.target !== cardEl) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); polish(); } });

    gsap.from('.end > *', { opacity: 0, y: 12, duration: 1.1, ease: 'power2.out', stagger: 0.1, scrollTrigger: { trigger: '.end', start: 'top 80%', once: true } });
  }

  /* ── boot ─────────────────────────────────────────────── */
  const boot = () => {
    if (!window.gsap) { document.documentElement.classList.add('reduced'); return; }
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve();
    fontsReady.then(() => { intro(); scrollFx(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
