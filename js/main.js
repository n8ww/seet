/* =========================================================
   SEET — main
   GSAP + ScrollTrigger + SplitText · Lenis · Three.js
   ========================================================= */
const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const html = document.documentElement;
const LANG = html.lang === 'en' ? 'en' : 'ar';
const RTL = LANG === 'ar';
const DICT = window.SEET_I18N[LANG];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mm = gsap.matchMedia();

/* ---------- i18n ---------- */
function applyI18n() {
  document.title = DICT['meta.title'];
  $$('[data-i18n]').forEach(el => { const v = DICT[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
  $('#sealText').textContent = DICT.seal.repeat(2);
  $('#langBtn').textContent = LANG === 'ar' ? 'EN' : 'عربي';
  try { localStorage.setItem('seet-lang', LANG); } catch (e) {}
}
applyI18n();

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!REDUCED) {
  lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = (target, opts = {}) => lenis ? lenis.scrollTo(target, { duration: 1.6, ...opts }) : $(target)?.scrollIntoView({ behavior: 'smooth' });

$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2 || !$(id)) return;
  e.preventDefault();
  if (document.body.classList.contains('menu-open')) { closeMenu(); setTimeout(() => scrollTo(id, { offset: 0 }), 650); }
  else scrollTo(id);
}));
$('#toTop').addEventListener('click', () => scrollTo(0, { duration: 2.2 }));

/* ---------- Cursor ---------- */
const cursor = $('#cursor');
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
if (FINE) {
  const dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
  const dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: .55, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .55, ease: 'power3' });
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
  document.addEventListener('mouseover', e => {
    const lab = e.target.closest('[data-cursor-label]');
    const hov = e.target.closest('a,button,[data-cursor],label,input,textarea');
    cursor.classList.toggle('is-label', !!lab);
    cursor.classList.toggle('is-hover', !lab && !!hov);
    if (lab) label.textContent = lab.dataset.cursorLabel === 'seet' ? (RTL ? 'صيت' : 'SEET') : lab.dataset.cursorLabel;
  });
} else cursor.remove();

/* ---------- Magnetic ---------- */
if (FINE) $$('[data-magnetic]').forEach(el => {
  const k = parseFloat(el.dataset.magnetic) || .3;
  const xTo = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1,.4)' }), yTo = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1,.4)' });
  el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * k); yTo((e.clientY - r.top - r.height / 2) * k); });
  el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
});

/* ---------- Spotlight + tilt ---------- */
$$('.scard,.ccard').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
}));
if (FINE) $$('[data-tilt]').forEach(el => {
  const rX = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' }), rY = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' });
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); rY(((e.clientX - r.left) / r.width - .5) * 14); rX(-((e.clientY - r.top) / r.height - .5) * 14); });
  el.addEventListener('pointerleave', () => { rX(0); rY(0); });
});

/* ---------- Header ---------- */
const hd = $('#hd');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => {
    const y = self.scroll();
    hd.classList.toggle('is-scrolled', y > 40);
    if (!document.body.classList.contains('menu-open')) hd.classList.toggle('is-hidden', y > lastY && y > innerHeight * .8);
    lastY = y;
    gsap.set('#progress', { scaleX: self.progress });
  }
});

/* ---------- Menu ---------- */
const menu = $('#menu');
const menuOrigin = () => { const r = $('#burger').getBoundingClientRect(); return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`; };
const menuTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } })
  .set(menu, { visibility: 'visible' })
  .fromTo(menu, { clipPath: () => `circle(0px at ${menuOrigin()})` }, { clipPath: () => `circle(${Math.hypot(innerWidth, innerHeight) * 1.05}px at ${menuOrigin()})`, duration: 1.1, immediateRender: false })
  .fromTo('.menu__link .txt', { yPercent: 120, rotate: RTL ? -4 : 4 }, { yPercent: 0, rotate: 0, stagger: .06, duration: 1, ease: 'expo.out', immediateRender: true }, .35)
  .fromTo('.menu__link .mono', { opacity: 0 }, { opacity: 1, stagger: .06, duration: .6 }, .5)
  .to('.menu__reveal', { opacity: 1, y: 0, stagger: .08, duration: .8, ease: 'expo.out' }, .6);
$$('.menu__link .txt').forEach(t => { const w = document.createElement('span'); w.className = 'split-line'; t.parentNode.insertBefore(w, t); w.appendChild(t); });
function openMenu() { document.body.classList.add('menu-open'); hd.classList.remove('is-hidden'); lenis?.stop(); menuTl.timeScale(1).play(); }
function closeMenu() { document.body.classList.remove('menu-open'); lenis?.start(); menuTl.timeScale(1.6).reverse(); }
$('#burger').addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMenu() : openMenu());
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu(); });

/* ---------- Language switch (curtain) ---------- */
$('#langBtn').addEventListener('click', () => {
  const next = LANG === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('seet-lang', next); sessionStorage.setItem('seet-seen', '1'); } catch (e) {}
  gsap.to('.curtain', { scaleY: 1, transformOrigin: 'bottom', duration: .7, ease: 'expo.inOut', onComplete: () => {
    const u = new URL(location.href); u.searchParams.set('lang', next); u.hash = ''; location.replace(u);
  } });
});

/* ---------- Clock (Al-Khobar) ---------- */
const clock = $('#clock');
const tick = () => { clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); };
tick(); setInterval(tick, 1000);

/* ---------- Brief → WhatsApp ---------- */
$('#briefForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget;
  const services = $$('#chips input:checked').map(i => DICT[i.value]).join('، ');
  const L = RTL
    ? ['مرحبًا صيت 👋', `الاسم: ${f.name.value}`, `الجوال: ${f.phone.value}`, `العلامة: ${f.company.value}`, `الخدمات: ${services}`, `التفاصيل: ${f.msg.value}`]
    : ['Hello SEET 👋', `Name: ${f.name.value}`, `Phone: ${f.phone.value}`, `Brand: ${f.company.value}`, `Services: ${services}`, `Details: ${f.msg.value}`];
  if (!f.name.value.trim()) { f.name.focus(); gsap.fromTo(f.name.parentNode, { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); return; }
  window.open('https://wa.me/966533347092?text=' + encodeURIComponent(L.filter(l => !/: $/.test(l)).join('\n')), '_blank', 'noopener');
});

/* =========================================================
   HERO — WebGL video shader (Three.js)
   ========================================================= */
const heroGL = { prog: 0, vel: 0, reveal: 0, hover: 0, ok: false };
async function initHeroGL() {
  const video = $('#heroVideo'), canvas = $('#heroGL'), media = $('#heroMedia');
  video.play().catch(() => {});
  if (location.protocol === 'file:') return; // browsers block video→WebGL on file://
  let THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'); } catch (e) { return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tex = new THREE.VideoTexture(video); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const u = {
    uTex: { value: tex }, uRes: { value: new THREE.Vector2() }, uTexRes: { value: new THREE.Vector2(640, 1138) },
    uMouse: { value: new THREE.Vector2(.5, .5) }, uTime: { value: 0 }, uVel: { value: 0 }, uProg: { value: 0 }, uHover: { value: 0 }, uReveal: { value: 0 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTex; uniform vec2 uRes, uTexRes, uMouse;
      uniform float uTime, uVel, uProg, uHover, uReveal;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      vec2 cover(vec2 uv){
        float rs = uRes.x/uRes.y, ri = uTexRes.x/uTexRes.y;
        vec2 s = rs > ri ? vec2(1., ri/rs) : vec2(rs/ri, 1.);
        return (uv - .5) * s + .5;
      }
      float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
      void main(){
        vec2 uv = vUv;
        // intro + scroll zoom
        float z = 1. - .18*(1.-uReveal) - uProg*.14;
        uv = (uv - .5) * z + .5;
        vec2 asp = vec2(uRes.x/uRes.y, 1.);
        float d = distance(uv*asp, uMouse*asp);
        float lens = smoothstep(.38, 0., d) * uHover;
        uv -= normalize(uv - uMouse + 1e-5) * lens * .045;
        uv.y += sin(uv.x*9. + uTime*.7) * .0025 * (1. + abs(uVel)*6.);
        uv.x += sin(uv.y*7. - uTime*.5) * .0015 * (1. + abs(uVel)*6.);
        vec2 t = cover(uv);
        float sh = .0015 + abs(uVel)*.018 + lens*.012;
        float lr = lum(texture2D(uTex, t + vec2(sh, 0.)).rgb);
        float lg = lum(texture2D(uTex, t).rgb);
        float lb = lum(texture2D(uTex, t - vec2(sh, 0.)).rgb);
        float l = smoothstep(.04, .96, lg);
        vec3 sh0 = vec3(.05,.035,.025), mid = vec3(.40,.27,.17), hi = vec3(.95,.91,.85);
        vec3 col = l < .5 ? mix(sh0, mid, l*2.) : mix(mid, hi, (l-.5)*2.);
        col += vec3(lr - lg, 0., lb - lg) * vec3(.9, 0., 1.4);       // chromatic fringe
        col = mix(col, col*vec3(.78,.9,1.12) + vec3(0.,.015,.05), lens*.7); // cool lens tint
        float v = smoothstep(1.25, .25, length((vUv - .5)*vec2(1., 1.15))*1.5);
        col *= mix(.42, 1., v);
        col *= 1. - uProg*.55;
        col += (hash(vUv*uRes + fract(uTime*7.)) - .5) * .07;     // film grain
        col *= uReveal;
        gl_FragColor = vec4(col, 1.);
      }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const size = () => { const w = media.clientWidth, h = media.clientHeight; renderer.setSize(w, h, false); u.uRes.value.set(w, h); };
  size(); addEventListener('resize', size);
  video.addEventListener('loadedmetadata', () => u.uTexRes.value.set(video.videoWidth, video.videoHeight));
  if (video.videoWidth) u.uTexRes.value.set(video.videoWidth, video.videoHeight);

  const m = { x: .5, y: .5 };
  media.addEventListener('pointermove', e => { const r = media.getBoundingClientRect(); m.x = (e.clientX - r.left) / r.width; m.y = 1 - (e.clientY - r.top) / r.height; gsap.to(heroGL, { hover: 1, duration: .6, overwrite: 'auto' }); });
  media.addEventListener('pointerleave', () => gsap.to(heroGL, { hover: 0, duration: 1 }));

  let visible = true;
  new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(media);
  gsap.ticker.add((time) => {
    if (!visible) return;
    u.uTime.value = time;
    u.uMouse.value.x += (m.x - u.uMouse.value.x) * .08;
    u.uMouse.value.y += (m.y - u.uMouse.value.y) * .08;
    heroGL.vel += ((lenis ? gsap.utils.clamp(-1, 1, lenis.velocity / 40) : 0) - heroGL.vel) * .1;
    u.uVel.value = heroGL.vel; u.uProg.value = heroGL.prog; u.uHover.value = heroGL.hover; u.uReveal.value = heroGL.reveal;
    try { renderer.render(scene, cam); } catch (e) { media.classList.remove('gl-on'); visible = false; }
  });
  media.classList.add('gl-on');
  heroGL.ok = true;
}

/* =========================================================
   FOREST — 5,000 trees grow with scroll
   ========================================================= */
function initForest() {
  const cv = $('#forest'), ctx = cv.getContext('2d');
  const N = 5000, trees = [];
  let W, H, dpr;
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < N; i++) {
    const depth = Math.pow(Math.random(), .7);               // 0 far → 1 near
    trees.push({ x: Math.random(), d: depth, j: rnd(-.5, .5), t: Math.random(), hue: Math.random() });
  }
  trees.sort((a, b) => a.d - b.d);                             // paint far → near
  const order = trees.map((t, i) => i).sort((a, b) => trees[a].t - trees[b].t);
  order.forEach((ti, k) => trees[ti].at = k / N);              // appearance threshold
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; draw(state.p); };
  const state = { p: 0 };
  function draw(p) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const horizon = H * (W < 900 ? .76 : .6);
    const k = gsap.utils.clamp(.45, 1, W / 1400);
    // horizon glow
    const g = ctx.createLinearGradient(0, horizon - 40, 0, H);
    g.addColorStop(0, 'rgba(216,196,166,0)'); g.addColorStop(.05, `rgba(216,196,166,${.05 + p * .06})`); g.addColorStop(1, 'rgba(13,9,7,0)');
    ctx.fillStyle = g; ctx.fillRect(0, horizon - 40, W, H - horizon + 40);
    for (const t of trees) {
      if (t.at > p) continue;
      const grow = Math.min(1, (p - t.at) / .06);
      const e = 1 - Math.pow(1 - grow, 3);
      const y = horizon + Math.pow(t.d, 1.6) * (H - horizon) * 1.02;
      const s = (1.6 + t.d * t.d * 15) * e * k;
      const x = t.x * W + t.j * s;
      const a = (.25 + t.d * .65) * e;
      // olive → sand palette
      const c = t.hue < .55 ? `rgba(143,163,112,${a})` : t.hue < .85 ? `rgba(216,196,166,${a})` : `rgba(169,199,232,${a * .9})`;
      ctx.fillStyle = c;
      // trunk
      ctx.fillRect(x - s * .05, y - s * 1.1, Math.max(.6, s * .1), s * 1.1);
      // crown — diamond (logo motif)
      ctx.beginPath();
      ctx.moveTo(x, y - s * 2.5); ctx.lineTo(x + s * .55, y - s * 1.6); ctx.lineTo(x, y - s * .95); ctx.lineTo(x - s * .55, y - s * 1.6);
      ctx.closePath(); ctx.fill();
    }
  }
  resize(); addEventListener('resize', resize);
  const countEl = $('#treeCount');
  const fmt = n => n.toLocaleString(LANG === 'ar' ? 'ar-SA' : 'en-US');
  ScrollTrigger.create({
    trigger: '#impact', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: self => {
      const p = gsap.utils.clamp(0, 1, self.progress / .85);
      state.p = p; draw(p);
      countEl.textContent = fmt(Math.round(p * 5000));
    }
  });
  countEl.textContent = fmt(0);
  gsap.from('.impact__a > *, .impact__b > *', { y: 50, opacity: 0, stagger: .08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#impact', start: 'top 60%' } });
}

/* =========================================================
   WAVES — Gulf coastline (live sine paths)
   ========================================================= */
function initWaves() {
  const w1 = $('#wave1'), w2 = $('#wave2');
  let on = false;
  new IntersectionObserver(([e]) => on = e.isIntersecting).observe($('.waves'));
  const path = (t, amp, off, y) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 600; x += 12) d += ` L${x} ${(y + Math.sin(x * .018 + t + off) * amp + Math.sin(x * .041 - t * 1.3) * amp * .4).toFixed(2)}`;
    return d;
  };
  gsap.ticker.add(t => { if (!on) return; w1.setAttribute('d', path(t * .8, 12, 0, 38)); w2.setAttribute('d', path(t * .6, 9, 1.8, 54)); });
}

/* =========================================================
   SCROLL CHOREOGRAPHY
   ========================================================= */
function initScroll() {
  // generic reveals
  $$('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // headline line-mask reveals
  $$('[data-split]').forEach(el => {
    const sp = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.from(sp.lines, { yPercent: 115, rotate: RTL ? -3 : 3, transformOrigin: RTL ? '100% 0' : '0 0', stagger: .1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // manifesto word scrub
  const man = SplitText.create('#manifesto', { type: 'words', wordsClass: 'w' });
  gsap.to(man.words, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: '#manifesto', start: 'top 78%', end: 'bottom 45%', scrub: 1 } });

  // hero exit: media shrinks into a framed card, title splits apart
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('#heroMedia', { '--ht': '6%', '--hs': '4%', '--hb': '18%', '--hr': '28px', ease: 'none' }, 0)
    .to(heroGL, { prog: 1, ease: 'none' }, 0)
    .to('.hero__title .t1', { xPercent: RTL ? 30 : -30, ease: 'none' }, 0)
    .to('.hero__title .t2', { xPercent: RTL ? -30 : 30, ease: 'none' }, 0)
    .to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none' }, 0);

  // marquee driven by scroll velocity
  const track = $('#marquee');
  const half = () => track.scrollWidth / 2;
  let x = 0, dir = -1;
  gsap.ticker.add(() => {
    const v = lenis ? lenis.velocity : 0;
    if (v) dir = v > 0 ? -1 : 1;
    x += dir * (1.1 + Math.min(Math.abs(v) * .35, 14));
    const h = half(); if (x <= -h) x += h; if (x > 0) x -= h;
    gsap.set(track, { x, skewX: gsap.utils.clamp(-8, 8, -v * .25) });
  });

  // services horizontal pin (desktop)
  mm.add('(min-width: 761px)', () => {
    const tr = $('#servicesTrack');
    const dist = () => tr.scrollWidth - innerWidth;
    const tw = gsap.to(tr, { x: () => (RTL ? 1 : -1) * dist(), ease: 'none' });
    const st = ScrollTrigger.create({
      trigger: '#servicesPin', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, animation: tw, invalidateOnRefresh: true,
      onUpdate: self => {
        gsap.set('#svcBar', { scaleX: self.progress });
        $('#svcNow').textContent = String(Math.min(6, 1 + Math.floor(self.progress * 6))).padStart(2, '0');
      }
    });
    $$('.scard').forEach(c => gsap.from(c.querySelector('h3'), { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: RTL ? 'right 5%' : 'left 95%', end: RTL ? 'right 55%' : 'left 45%', horizontal: true, scrub: true } }));
    return () => st.kill();
  });

  // tech mock parallax
  gsap.timeline({ scrollTrigger: { trigger: '#mock', start: 'top bottom', end: 'bottom top', scrub: true } })
    .fromTo('.mock__win', { yPercent: 8 }, { yPercent: -6, ease: 'none' }, 0)
    .fromTo('#mockPanel', { yPercent: 40, opacity: .3 }, { yPercent: -20, opacity: 1, ease: 'none' }, 0)
    .fromTo('#mockChip', { yPercent: 120 }, { yPercent: -80, ease: 'none' }, 0);
  if (FINE) {
    const mk = $('#mock'), win = $('.mock__win');
    const ry = gsap.quickTo(win, 'rotationY', { duration: 1, ease: 'power3' }), rx = gsap.quickTo(win, 'rotationX', { duration: 1, ease: 'power3' });
    mk.addEventListener('pointermove', e => { const r = mk.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 16); rx(6 - ((e.clientY - r.top) / r.height - .5) * 12); });
    mk.addEventListener('pointerleave', () => { ry(RTL ? 12 : -12); rx(6); });
  }

  // growth chart
  const curve = $('#chartCurve'), len = curve.getTotalLength();
  gsap.set(curve, { strokeDasharray: len, strokeDashoffset: len });
  gsap.timeline({ scrollTrigger: { trigger: '#chart', start: 'top 75%', end: 'bottom 45%', scrub: 1 } })
    .to(curve, { strokeDashoffset: 0, ease: 'none' })
    .to('#chartArea', { opacity: 1, ease: 'none' }, .3)
    .to('.chart .pt', { opacity: 1, stagger: .15, ease: 'none' }, .2)
    .to('#chartGlow', { opacity: .9, ease: 'none' }, .8)
    .to('#chartArrow', { scale: 1, ease: 'back.out(2)' }, .85);
  $$('.gstep').forEach((g, i) => gsap.to(g, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '#growth .gsteps', start: `top ${80 - i * 6}%`, end: `top ${45 - i * 6}%`, scrub: true } }));

  // values: stacking cards scale back
  const cards = $$('.vcard');
  cards.forEach((c, i) => {
    if (i === cards.length - 1) return;
    gsap.to(c, { scale: .9 + i * .02, filter: 'brightness(.55)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 15%', scrub: true } });
  });
  cards.forEach(c => gsap.from(c.querySelector('.vcard__bgword'), { xPercent: RTL ? -25 : 25, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // process
  gsap.to('#stepsLine', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  $$('.step').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', toggleClass: 'is-active' }));

  // showreel expand
  gsap.timeline({ scrollTrigger: { trigger: '#reel', start: 'top top', end: 'bottom bottom', scrub: true } })
    .to('#reelFrame', { '--ct': '0%', '--cs': '0%', '--cr': '0px', ease: 'none' }, 0)
    .to('#reelFrame video', { scale: 1, ease: 'none' }, 0)
    .fromTo('.reel__words .r1', { xPercent: 0 }, { xPercent: -40, opacity: .0, ease: 'power1.in' }, .1)
    .fromTo('.reel__words .r2', { xPercent: 0 }, { xPercent: 40, opacity: .0, ease: 'power1.in' }, .1)
    .to('#reelCap', { opacity: 1, ease: 'none' }, .7);

  // tiers bars
  $$('.tier__bar').forEach((b, i) => gsap.to(b, { scaleY: 1, duration: 1.6, delay: i * .15, ease: 'expo.out', scrollTrigger: { trigger: '.tiers__grid', start: 'top 75%' } }));

  // footer logo
  gsap.from('#ftLogo', { yPercent: 40, opacity: 0, scale: .92, ease: 'none', scrollTrigger: { trigger: '#ft', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('#ftInner', { yPercent: -25, ease: 'none', scrollTrigger: { trigger: '#ft', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // pause offscreen videos
  $$('video').forEach(v => new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause(), { rootMargin: '200px' }).observe(v));
}

/* =========================================================
   PRELOADER → INTRO
   ========================================================= */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const t1 = $('.hero__title .t1'), t2 = $('.hero__title .t2');
  const type = RTL ? 'words' : 'chars';
  const s1 = SplitText.create(t1, { type, mask: type }), s2 = SplitText.create(t2, { type, mask: type });
  tl.to(heroGL, { reveal: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .from('#heroMedia', { scale: 1.15, duration: 2.6, ease: 'expo.out' }, 0)
    .from(s1[type], { yPercent: 110, stagger: .05, duration: 1.4 }, .25)
    .from(s2[type], { yPercent: 110, stagger: .05, duration: 1.4 }, .45)
    .from('.hero__eyebrow', { opacity: 0, y: 20, duration: 1.2 }, .5)
    .from('.hero__row', { opacity: 0, y: 30, duration: 1.2 }, .75)
    .from('.hero__row', { borderTopColor: 'rgba(216,196,166,0)', duration: 1.5 }, .9)
    .from('#hd > *', { opacity: 0, y: -20, stagger: .08, duration: 1 }, .6);
  return tl;
}

function preload() {
  const quick = (() => { try { return sessionStorage.getItem('seet-seen') === '1'; } catch (e) { return false; } })();
  const counter = $('#loaderCount');
  const fmt = n => RTL ? n.toLocaleString('ar-SA') : String(n);
  counter.textContent = fmt(0);
  const st = { v: 0 };
  const tl = gsap.timeline();
  if (quick) {
    gsap.set('.loader__inner,.loader__count,.loader__word', { opacity: 0 });
    gsap.set('.curtain', { scaleY: 1, transformOrigin: 'top' });
    tl.to('.curtain', { scaleY: 0, duration: .9, ease: 'expo.inOut' })
      .set('#loader', { display: 'none' }, 0);
  } else {
    tl.to('.loader__logo', { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut' })
      .to(st, { v: 100, duration: 2.2, ease: 'power2.inOut', onUpdate: () => counter.textContent = fmt(Math.round(st.v)) }, .1)
      .to('.loader__bar span', { scaleX: 1, duration: 2.2, ease: 'power2.inOut' }, .1)
      .to('.loader__inner,.loader__count,.loader__word', { opacity: 0, y: -30, duration: .7, ease: 'power3.in' }, '+=.15')
      .to('.loader__panel--t', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=.2')
      .to('.loader__panel--b', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
      .set('#loader', { display: 'none' });
  }
  try { sessionStorage.setItem('seet-seen', '1'); } catch (e) {}
  tl.add(() => { html.classList.remove('is-loading'); lenis?.start(); }, quick ? .2 : '-=1.0');
  tl.add(intro(), quick ? .15 : '-=1.05');
  return tl;
}

/* ---------- Boot ---------- */
(async () => {
  initHeroGL();
  await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]);
  if (REDUCED) {
    $('#loader').remove(); html.classList.remove('is-loading');
    heroGL.reveal = 1; $$('.manifesto__text .w').forEach(w => w.style.opacity = 1);
    initForest(); initWaves(); return;
  }
  preload();
  initScroll();
  initForest();
  initWaves();
  addEventListener('load', () => ScrollTrigger.refresh());
})();
