/* ============================================================
   NATIONAL DOCTORS' DAY TRIBUTE — SCRIPT.JS
   Single-page tribute with personalization, ECG animation,
   firework particle system, and ambient atmosphere.
   ============================================================ */

// ---- REDUCED MOTION CHECK ----
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// 1. PERSONALIZATION — parse URL params safely
// ============================================================
function getTributeParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    to:    params.get('to')?.trim()   || 'Dear Doctor',
    from:  params.get('from')?.trim() || '',
    // Clamp years between 0–60; NaN → 0
    years: Math.min(Math.max(parseInt(params.get('years'), 10) || 0, 0), 60)
  };
}

const tribute = getTributeParams();
// Determine if we have real personalized names (not defaults)
const hasTo   = tribute.to !== 'Dear Doctor';
const hasFrom = tribute.from !== '';
const hasYears = tribute.years > 0;

// ============================================================
// 2. DOM REFERENCES
// ============================================================
const bloomOverlay     = document.getElementById('bloom-overlay');
const gateOverlay      = document.getElementById('gate-overlay');
const gateText         = document.getElementById('gate-text');
const mainContent      = document.getElementById('main-content');
const typewriterWrap   = document.getElementById('typewriter-container');
const doctorNameEl     = document.getElementById('doctor-name');
const caretEl          = document.getElementById('caret');
const ecgContainer     = document.getElementById('ecg-container');
const ecgPath          = document.getElementById('ecg-path');
const caduceusEl       = document.getElementById('caduceus-main');
const mainHeading      = document.getElementById('main-heading');
const subHeading       = document.getElementById('sub-heading');
const yearsLine        = document.getElementById('years-line');
const tributeMessage   = document.getElementById('tribute-message');
const signOff          = document.getElementById('sign-off');
const shareCta         = document.getElementById('share-cta');
const whatsappBtn      = document.getElementById('whatsapp-btn');
const copyLinkBtn      = document.getElementById('copy-link-btn');
const copyToast        = document.getElementById('copy-toast');
const starCanvas       = document.getElementById('starCanvas');
const fireworkCanvas   = document.getElementById('fireworkCanvas');
const orbsContainer    = document.getElementById('orbs-container');

// ============================================================
// 3. POPULATE PERSONALIZED CONTENT (safe via textContent)
// ============================================================
(function populateContent() {
  // Gate text
  if (hasTo && hasFrom) {
    gateText.textContent = `A tribute for ${tribute.to}, from ${tribute.from}`;
  } else if (hasTo) {
    gateText.textContent = `A tribute for ${tribute.to}`;
  } else {
    gateText.textContent = 'Tap to deliver your tribute';
  }

  // Years line
  if (hasYears) {
    yearsLine.textContent = `${tribute.years} years of healing. ${tribute.years} years of showing up.`;
  }

  // Sign-off
  if (hasFrom) {
    signOff.textContent = `With gratitude, ${tribute.from}`;
  }
})();

// ============================================================
// 4. BLOOM IN — black screen fades to reveal navy bg
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Tiny delay to ensure repaint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bloomOverlay.classList.add('faded');
    });
  });

  // Initialize atmospherics
  initStarField();
  initFloatingOrbs();
  resizeCanvases();

  // If reduced motion, skip gate and show everything immediately
  if (prefersReducedMotion) {
    skipToFullContent();
    return;
  }
});

window.addEventListener('resize', resizeCanvases);

function resizeCanvases() {
  starCanvas.width  = window.innerWidth;
  starCanvas.height = window.innerHeight;
  fireworkCanvas.width  = window.innerWidth;
  fireworkCanvas.height = window.innerHeight;
}

// ============================================================
// 5. GATE — tap/click/keypress to reveal
// ============================================================
let gateOpen = false;

function openGate() {
  if (gateOpen) return;
  gateOpen = true;
  gateOverlay.classList.add('dismissed');
  // After gate animates out, start main sequence
  setTimeout(() => {
    gateOverlay.style.display = 'none';
    mainContent.removeAttribute('aria-hidden');
    mainContent.classList.add('visible');
    startMainSequence();
  }, 420);
}

gateOverlay.addEventListener('click', openGate);
gateOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openGate();
  }
});

// Reduced-motion shortcut: show everything at once
function skipToFullContent() {
  gateOverlay.style.display = 'none';
  mainContent.removeAttribute('aria-hidden');
  mainContent.classList.add('visible');

  // Show name instantly
  if (hasTo) {
    doctorNameEl.textContent = tribute.to;
    typewriterWrap.classList.add('visible');
  }
  caretEl.classList.add('hidden');
  ecgContainer.classList.add('visible');
  ecgPath.style.strokeDashoffset = '0';
  ecgPath.style.strokeDasharray = 'none';
  ecgContainer.classList.add('settled');
  caduceusEl.classList.add('visible');
  mainHeading.classList.add('visible');
  subHeading.classList.add('visible');
  if (hasYears) yearsLine.classList.add('visible');
  tributeMessage.classList.add('visible');
  if (hasFrom) signOff.classList.add('visible');
  shareCta.classList.add('visible');
}

// ============================================================
// 6. MAIN SEQUENCE — orchestrated reveal after gate opens
// ============================================================
function startMainSequence() {
  let delay = 0;

  // 6a. Typewriter effect for doctor's name
  if (hasTo) {
    typewriterWrap.classList.add('visible');
    const chars = tribute.to.split('');
    const typeDelay = 60; // ms per character
    chars.forEach((ch, i) => {
      setTimeout(() => {
        doctorNameEl.textContent += ch;
      }, i * typeDelay);
    });
    delay = chars.length * typeDelay + 200;
  } else {
    delay = 100;
    caretEl.classList.add('hidden');
  }

  // 6b. ECG animation starts after typewriter
  setTimeout(() => {
    startECGAnimation();
  }, delay);

  // 6c. Content reveal stagger (after ECG peak)
  const ecgDuration = 1400; // total ECG draw time
  const contentStart = delay + 900; // at ECG peak

  setTimeout(() => {
    caretEl.classList.add('hidden');
    caduceusEl.classList.add('visible');
  }, contentStart);

  setTimeout(() => {
    mainHeading.classList.add('visible');
  }, contentStart + 200);

  setTimeout(() => {
    subHeading.classList.add('visible');
  }, contentStart + 400);

  setTimeout(() => {
    if (hasYears) yearsLine.classList.add('visible');
  }, contentStart + 600);

  setTimeout(() => {
    tributeMessage.classList.add('visible');
  }, contentStart + 750);

  setTimeout(() => {
    if (hasFrom) signOff.classList.add('visible');
  }, contentStart + 1100);

  // 6d. ECG settles to watermark
  setTimeout(() => {
    ecgContainer.classList.add('settled');
  }, delay + ecgDuration + 200);

  // 6e. Phase 2 grand finale + share CTA
  const finaleTime = contentStart + 1500;
  setTimeout(() => {
    firePhase2Finale();
    setTimeout(() => {
      shareCta.classList.add('visible');
    }, 800);
    // Start ambient loop
    setTimeout(startAmbientLoop, 2000);
    // Enable tap-to-burst
    enableTapBurst();
  }, finaleTime);
}

// ============================================================
// 7. ECG ANIMATION — stroke-dashoffset via rAF
// ============================================================
function startECGAnimation() {
  ecgContainer.classList.add('visible');
  const path = ecgPath;
  const totalLength = path.getTotalLength();
  path.style.strokeDasharray  = totalLength;
  path.style.strokeDashoffset = totalLength;

  const duration = 1400; // ms
  const peakFraction = 900 / duration; // fraction at which peak fires
  let peakFired = false;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out quad
    const eased = 1 - Math.pow(1 - progress, 2);
    path.style.strokeDashoffset = totalLength * (1 - eased);

    // Fire Phase 1 burst at peak
    if (!peakFired && progress >= peakFraction) {
      peakFired = true;
      firePhase1Burst();
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

// ============================================================
// 8. FIREWORK PARTICLE SYSTEM (Canvas-based)
// ============================================================
const ctx = fireworkCanvas.getContext('2d');

// Particle color palette — warm gold/amber/white theme
const FIREWORK_COLORS = [
  '#f0c75e', '#d4af37', '#f5f0e6', '#e8c56d',
  '#ffd700', '#c49b2a', '#fff5d6', '#e8a87c'
];
const ACCENT_COLORS = ['#c97b84', '#d4a0a7', '#f0c75e']; // occasional rose

// ---- Particle class ----
class Particle {
  constructor(x, y, vx, vy, color, size, isSparkle = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.gravity = 0.05;
    this.friction = 0.98;
    this.life = 1.0;
    this.decay = 0.010 + Math.random() * 0.008; // 0.010–0.018
    this.size = size;
    this.color = color;
    this.trail = [];
    this.isSparkle = isSparkle;
    this.frame = Math.random() * 100; // offset for sine wave
  }

  update() {
    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;
    // Apply gravity
    this.vy += this.gravity;
    // Sparkle horizontal drift
    if (this.isSparkle) {
      this.x += Math.sin(this.frame * 0.1) * 0.5;
    }
    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    // Move
    this.x += this.vx;
    this.y += this.vy;
    // Decay life
    this.life -= this.decay;
    this.frame++;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life);

    // Draw trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = this.size * 0.5;
      ctx.stroke();
    }

    // Draw glow circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = this.isSparkle ? 4 : 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  get dead() {
    return this.life <= 0;
  }
}

// ---- Burst class ----
// `intensity` is driven by the `years` param: 1.0 base, up to 1.4 at years >= 30
class FireworkBurst {
  constructor(x, y, particleCount, colorPalette, intensity = 1.0) {
    this.x = x;
    this.y = y;
    this.particleCount = Math.round(particleCount * intensity);
    this.colorPalette = colorPalette;
    this.particles = [];
    this.sparkleTimer = null;
  }

  explode() {
    // Main radial burst
    for (let i = 0; i < this.particleCount; i++) {
      const angle = (Math.PI * 2 / this.particleCount) * i + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
      const size = 1.5 + Math.random() * 2;
      this.particles.push(new Particle(this.x, this.y, vx, vy, color, size, false));
    }

    // Delayed sparkle micro-particles (~100ms after)
    this.sparkleTimer = setTimeout(() => {
      const sparkleCount = Math.round(this.particleCount * 0.3);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const color = '#fff5d6';
        const size = 0.8 + Math.random() * 1;
        const p = new Particle(this.x, this.y, vx, vy, color, size, true);
        p.decay = 0.018 + Math.random() * 0.01;
        this.particles.push(p);
      }
      // Mark timer as completed so `done` getter works correctly
      this.sparkleTimer = null;
    }, 100);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].dead) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  get done() {
    return this.particles.length === 0 && this.sparkleTimer === null;
  }

  get particleCountCurrent() {
    return this.particles.length;
  }
}

// ---- Active bursts registry & animation loop ----
const activeBursts = [];
const MAX_PARTICLES = 400;
let fireworkLoopRunning = false;

function getTotalParticles() {
  let count = 0;
  for (const b of activeBursts) count += b.particleCountCurrent;
  return count;
}

function spawnBurst(x, y, count, palette, intensity) {
  // Performance cap: skip if too many particles
  if (getTotalParticles() > MAX_PARTICLES) return;
  const burst = new FireworkBurst(x, y, count, palette || FIREWORK_COLORS, intensity || 1.0);
  burst.explode();
  activeBursts.push(burst);
  if (!fireworkLoopRunning) startFireworkLoop();
}

function startFireworkLoop() {
  fireworkLoopRunning = true;
  function loop() {
    ctx.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);

    for (let i = activeBursts.length - 1; i >= 0; i--) {
      activeBursts[i].update();
      activeBursts[i].draw(ctx);
      if (activeBursts[i].done) {
        activeBursts.splice(i, 1);
      }
    }

    if (activeBursts.length > 0) {
      requestAnimationFrame(loop);
    } else {
      fireworkLoopRunning = false;
      ctx.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);
    }
  }
  requestAnimationFrame(loop);
}

// ---- Intensity scale from `years` param ----
// Base 1.0; scales up to 1.4 at years >= 30
function getYearsIntensity() {
  if (!hasYears) return 1.0;
  // Linear scale: 0 → 1.0, 30+ → 1.4
  return 1.0 + Math.min(tribute.years / 30, 1.0) * 0.4;
}

// ---- Phase 1: ECG peak burst — 2 simultaneous upper-left & upper-right ----
function firePhase1Burst() {
  if (prefersReducedMotion) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const intensity = getYearsIntensity();
  spawnBurst(w * 0.2, h * 0.2, 45, FIREWORK_COLORS, intensity);
  spawnBurst(w * 0.8, h * 0.25, 45, FIREWORK_COLORS, intensity);
}

// ---- Phase 2: Grand finale — 3 large bursts staggered, then ground sparklers ----
function firePhase2Finale() {
  if (prefersReducedMotion) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const intensity = getYearsIntensity();
  const palette = [...FIREWORK_COLORS, ...ACCENT_COLORS];

  setTimeout(() => spawnBurst(w * 0.5, h * 0.18, 80, palette, intensity), 0);
  setTimeout(() => spawnBurst(w * 0.25, h * 0.3, 75, palette, intensity), 150);
  setTimeout(() => spawnBurst(w * 0.75, h * 0.25, 75, palette, intensity), 300);

  // Ground sparklers — short life, brighter, low velocity
  setTimeout(() => {
    const sparklerPalette = ['#fff5d6', '#f0c75e', '#ffffff', '#ffeebb'];
    const positions = [0.15, 0.3, 0.5, 0.7, 0.85];
    positions.forEach((px, i) => {
      setTimeout(() => {
        const burst = new FireworkBurst(w * px, h * 0.92, 18, sparklerPalette, 1.0);
        // Override explode to create low-velocity upward particles
        burst.particles = [];
        for (let j = 0; j < 18; j++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
          const speed = 1 + Math.random() * 2.5;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const color = sparklerPalette[Math.floor(Math.random() * sparklerPalette.length)];
          const p = new Particle(w * px, h * 0.92, vx, vy, color, 1 + Math.random() * 1.5, true);
          p.decay = 0.025 + Math.random() * 0.015; // shorter life
          p.gravity = 0.03;
          burst.particles.push(p);
        }
        activeBursts.push(burst);
        if (!fireworkLoopRunning) startFireworkLoop();
      }, i * 80);
    });
  }, 500);
}

// ---- Ambient loop: small burst every 8–12s ----
let ambientInterval = null;

function startAmbientLoop() {
  if (prefersReducedMotion) return;
  function fireAmbient() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Random position in upper 60%
    const x = Math.random() * w;
    const y = Math.random() * h * 0.6;
    spawnBurst(x, y, 15 + Math.floor(Math.random() * 6), FIREWORK_COLORS, 0.8);
    // Schedule next at 8–12s
    const nextDelay = 8000 + Math.random() * 4000;
    ambientInterval = setTimeout(fireAmbient, nextDelay);
  }
  const firstDelay = 8000 + Math.random() * 4000;
  ambientInterval = setTimeout(fireAmbient, firstDelay);
}

// ---- Tap/click burst ----
function enableTapBurst() {
  if (prefersReducedMotion) return;

  function handleBurst(x, y) {
    spawnBurst(x, y, 25 + Math.floor(Math.random() * 6), FIREWORK_COLORS, 1.0);
  }

  // Use pointerdown for unified handling, fallback to touch/mouse
  if (window.PointerEvent) {
    document.addEventListener('pointerdown', (e) => {
      // Don't fire on buttons
      if (e.target.closest('button') || e.target.closest('a')) return;
      handleBurst(e.clientX, e.clientY);
    });
  } else {
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const t = e.touches[0];
      handleBurst(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      handleBurst(e.clientX, e.clientY);
    });
  }
}

// ============================================================
// 9. STAR FIELD — twinkling dots on separate canvas
// ============================================================
const stars = [];
let starCtx;

function initStarField() {
  starCtx = starCanvas.getContext('2d');
  const count = 100;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      speed: 0.3 + Math.random() * 2, // twinkle speed
      phase: Math.random() * Math.PI * 2,
      baseAlpha: 0.3 + Math.random() * 0.5
    });
  }
  if (!prefersReducedMotion) {
    animateStars();
  } else {
    // Draw once statically
    drawStarsStatic();
  }
}

function animateStars() {
  const w = starCanvas.width;
  const h = starCanvas.height;
  starCtx.clearRect(0, 0, w, h);

  const now = performance.now() / 1000;
  stars.forEach(s => {
    const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));
    starCtx.beginPath();
    starCtx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    starCtx.fillStyle = '#f5f0e6';
    starCtx.globalAlpha = alpha;
    starCtx.fill();
  });
  starCtx.globalAlpha = 1;
  requestAnimationFrame(animateStars);
}

function drawStarsStatic() {
  const w = starCanvas.width;
  const h = starCanvas.height;
  starCtx.clearRect(0, 0, w, h);
  stars.forEach(s => {
    starCtx.beginPath();
    starCtx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    starCtx.fillStyle = '#f5f0e6';
    starCtx.globalAlpha = s.baseAlpha * 0.6;
    starCtx.fill();
  });
  starCtx.globalAlpha = 1;
}

// ============================================================
// 10. FLOATING LIGHT ORBS — CSS divs with radial gradient
// ============================================================
function initFloatingOrbs() {
  if (prefersReducedMotion) return;

  const orbCount = 8;
  for (let i = 0; i < orbCount; i++) {
    const orb = document.createElement('div');
    orb.classList.add('floating-orb');
    const size = 80 + Math.random() * 200;
    const hue = 38 + Math.random() * 20; // warm gold range
    const opacity = 0.06 + Math.random() * 0.08;
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = 15 + Math.random() * 20; // seconds to rise
    const swayAmplitude = 20 + Math.random() * 40;
    const swaySpeed = 3 + Math.random() * 4;

    orb.style.width = size + 'px';
    orb.style.height = size + 'px';
    orb.style.left = startX + '%';
    orb.style.bottom = '-' + size + 'px';
    orb.style.opacity = opacity;
    orb.style.background = `radial-gradient(circle, hsla(${hue}, 60%, 60%, 0.4) 0%, transparent 70%)`;
    orb.style.filter = `blur(${20 + Math.random() * 30}px)`;

    orbsContainer.appendChild(orb);

    // Animate with JS for sine-wave sway
    animateOrb(orb, startX, duration, swayAmplitude, swaySpeed, size);
  }
}

function animateOrb(orb, baseX, riseDuration, swayAmp, swayFreq, size) {
  const totalHeight = window.innerHeight + size * 2;
  let startTime = performance.now() - Math.random() * riseDuration * 1000; // stagger start

  function tick(now) {
    const elapsed = (now - startTime) / 1000;
    const progress = (elapsed % riseDuration) / riseDuration; // 0 → 1 loop
    const y = totalHeight * progress;
    const sway = Math.sin(elapsed / swayFreq * Math.PI * 2) * swayAmp;

    orb.style.transform = `translate(${sway}px, -${y}px)`;

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ============================================================
// 11. SHARE LOGIC — WhatsApp + Copy Link
// ============================================================
whatsappBtn.addEventListener('click', () => {
  const shareUrl = buildShareUrl();
  const message = `🩺 Happy National Doctors' Day! Here's a personal tribute for you: ${shareUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
});

copyLinkBtn.addEventListener('click', () => {
  const shareUrl = buildShareUrl();
  navigator.clipboard.writeText(shareUrl).then(() => {
    showCopyToast();
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopyToast();
  });
});

function buildShareUrl() {
  // Preserve current params so the shared link stays personalized
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  // If no params at all, still share the clean URL
  if (params.toString()) {
    return base + '?' + params.toString();
  }
  return base;
}

function showCopyToast() {
  copyToast.classList.add('show');
  setTimeout(() => {
    copyToast.classList.remove('show');
  }, 2200);
}
