/* ============================================================
   NATIONAL DOCTORS' DAY TRIBUTE — SCRIPT.JS
   
   Single-page tribute with:
   - URL-param personalization
   - Tap-to-reveal gate
   - Typewriter effect
   - ECG hero animation (rAF-driven)
   - Full firework particle system (class-based)
   - Star field + floating orbs atmosphere
   - Glassmorphism UI
   - Live tribute counter (localStorage, simulated)
   - Screenshot card population
   - WhatsApp share + copy link
   - prefers-reduced-motion handling
   ============================================================ */

// ---- REDUCED MOTION CHECK ----
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ============================================================
// 1. PERSONALIZATION — parse URL params safely
// ============================================================
function getTributeParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    to: params.get("to")?.trim() || "Dear Doctor",
    from: params.get("from")?.trim() || "",
    // Clamp years between 0–60; NaN → 0
    years: Math.min(Math.max(parseInt(params.get("years"), 10) || 0, 0), 60),
  };
}

const tribute = getTributeParams();
const hasTo = tribute.to !== "Dear Doctor";
const hasFrom = tribute.from !== "";
const hasYears = tribute.years > 0;

// ============================================================
// 2. DOM REFERENCES
// ============================================================
const bloomOverlay = document.getElementById("bloom-overlay");
const gateOverlay = document.getElementById("gate-overlay");
const gateText = document.getElementById("gate-text");
const mainContent = document.getElementById("main-content");
const typewriterWrap = document.getElementById("typewriter-container");
const doctorNameEl = document.getElementById("doctor-name");
const caretEl = document.getElementById("caret");
const ecgContainer = document.getElementById("ecg-container");
const ecgPath = document.getElementById("ecg-path");
const caduceusEl = document.getElementById("caduceus-main");
const mainHeading = document.getElementById("main-heading");
const subHeading = document.getElementById("sub-heading");
const yearsLine = document.getElementById("years-line");
const tributeGlass = document.getElementById("tribute-glass");
const signOff = document.getElementById("sign-off");
const shareCta = document.getElementById("share-cta");
const whatsappBtn = document.getElementById("whatsapp-btn");
const copyLinkBtn = document.getElementById("copy-link-btn");
const copyToast = document.getElementById("copy-toast");
const screenshotHint = document.getElementById("screenshot-hint");
const screenshotCard = document.getElementById("screenshot-card");
const scDoctorName = document.getElementById("sc-doctor-name");
const scWatermark = document.getElementById("sc-watermark");
const counterPill = document.getElementById("counter-pill");
const counterNumber = document.getElementById("counter-number");
const starCanvas = document.getElementById("starCanvas");
const fireworkCanvas = document.getElementById("fireworkCanvas");
const orbsContainer = document.getElementById("orbs-container");

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
    gateText.textContent = "Tap to deliver your tribute";
  }

  // Years line
  if (hasYears) {
    yearsLine.textContent = `${tribute.years} years of healing. ${tribute.years} years of showing up.`;
  }

  // Sign-off
  if (hasFrom) {
    signOff.textContent = `With gratitude, ${tribute.from}`;
  }

  // Screenshot card — doctor name
  scDoctorName.textContent = tribute.to;

  // Screenshot card — watermark (site URL for traceability)
  scWatermark.textContent = window.location.host || "doctorsday2026.com";
})();

// ============================================================
// 4. LIVE TRIBUTE COUNTER (localStorage, client-side simulated)
//
// NOTE: This is a client-side simulated counter for perceived
// social proof. Replace with a real backend (e.g. a simple
// counter API) for an accurate global count.
// ============================================================
function getTributeCount() {
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem("tributeCounter") || "{}");
  if (stored.date !== today) {
    // New day: reseed deterministically
    const seed = today.split("-").reduce((a, c) => a + parseInt(c, 10), 0);
    const base = 1200 + ((seed * 37) % 600); // lands roughly 1200–1800
    const fresh = { date: today, count: base };
    localStorage.setItem("tributeCounter", JSON.stringify(fresh));
    return fresh.count;
  }
  return stored.count;
}

function incrementTributeCount() {
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem("tributeCounter") || "{}");
  const current = stored.count || getTributeCount();
  const next = current + (1 + Math.floor(Math.random() * 3));
  localStorage.setItem(
    "tributeCounter",
    JSON.stringify({ date: today, count: next }),
  );
  return next;
}

let displayedCount = 0;

function animateCountTo(target) {
  const start = displayedCount;
  const diff = target - start;
  if (diff <= 0) {
    counterNumber.textContent = target.toLocaleString();
    displayedCount = target;
    return;
  }
  const duration = 700; // ms
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out quad
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + diff * eased);
    counterNumber.textContent = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      displayedCount = target;
    }
  }

  requestAnimationFrame(tick);
}

function initCounter() {
  const count = getTributeCount();
  displayedCount = 0;
  animateCountTo(count);
}

// ============================================================
// 5. BLOOM IN — black screen fades to navy
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bloomOverlay.classList.add("faded");
    });
  });

  initStarField();
  initFloatingOrbs();
  resizeCanvases();

  if (prefersReducedMotion) {
    skipToFullContent();
    return;
  }
});

window.addEventListener("resize", resizeCanvases);

function resizeCanvases() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  fireworkCanvas.width = window.innerWidth;
  fireworkCanvas.height = window.innerHeight;
}

// ============================================================
// 6. GATE — tap/click/keypress to reveal
// ============================================================
let gateOpen = false;

function openGate() {
  if (gateOpen) return;
  gateOpen = true;
  gateOverlay.classList.add("dismissed");

  setTimeout(() => {
    gateOverlay.style.display = "none";
    mainContent.removeAttribute("aria-hidden");
    mainContent.classList.add("visible");
    startMainSequence();
  }, 420);
}

gateOverlay.addEventListener("click", openGate);
gateOverlay.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openGate();
  }
});

// Reduced-motion shortcut: show everything instantly
function skipToFullContent() {
  gateOverlay.style.display = "none";
  mainContent.removeAttribute("aria-hidden");
  mainContent.classList.add("visible");

  // Show name instantly (no typewriter)
  if (hasTo) {
    doctorNameEl.textContent = tribute.to;
    typewriterWrap.classList.add("visible");
  }
  caretEl.classList.add("hidden");

  ecgContainer.classList.add("visible");
  ecgPath.style.strokeDashoffset = "0";
  ecgPath.style.strokeDasharray = "none";
  ecgContainer.classList.add("settled");

  caduceusEl.classList.add("visible");
  mainHeading.classList.add("visible");
  subHeading.classList.add("visible");
  if (hasYears) yearsLine.classList.add("visible");
  tributeGlass.classList.add("visible");
  if (hasFrom) signOff.classList.add("visible");
  shareCta.classList.add("visible");
  screenshotHint.classList.add("visible");
  screenshotCard.classList.add("visible");
  counterPill.classList.add("visible");

  initCounter();
}

// ============================================================
// 7. MAIN SEQUENCE — orchestrated reveal after gate opens
// ============================================================
function startMainSequence() {
  let delay = 0;

  // Counter pill fades in immediately
  counterPill.classList.add("visible");
  initCounter();

  // 7a. Typewriter effect for doctor's name
  if (hasTo) {
    typewriterWrap.classList.add("visible");
    const chars = tribute.to.split("");
    const typeDelay = 60; // ms per character
    chars.forEach((ch, i) => {
      setTimeout(() => {
        doctorNameEl.textContent += ch;
      }, i * typeDelay);
    });
    delay = chars.length * typeDelay + 200;
  } else {
    delay = 100;
    caretEl.classList.add("hidden");
  }

  // 7b. ECG animation starts after typewriter
  setTimeout(() => {
    startECGAnimation();
  }, delay);

  // 7c. Content reveal stagger (at/after ECG peak)
  const contentStart = delay + 900; // at ECG peak

  setTimeout(() => {
    caretEl.classList.add("hidden");
    caduceusEl.classList.add("visible");
  }, contentStart);

  setTimeout(() => {
    mainHeading.classList.add("visible");
  }, contentStart + 200);

  setTimeout(() => {
    subHeading.classList.add("visible");
  }, contentStart + 400);

  setTimeout(() => {
    if (hasYears) yearsLine.classList.add("visible");
  }, contentStart + 600);

  setTimeout(() => {
    tributeGlass.classList.add("visible");
  }, contentStart + 750);

  setTimeout(() => {
    if (hasFrom) signOff.classList.add("visible");
  }, contentStart + 1100);

  // 7d. ECG settles to watermark
  setTimeout(() => {
    ecgContainer.classList.add("settled");
  }, delay + 1600);

  // 7e. Phase 2 grand finale + share CTA + screenshot card
  const finaleTime = contentStart + 1500;
  setTimeout(() => {
    firePhase2Finale();

    setTimeout(() => {
      shareCta.classList.add("visible");
    }, 600);

    setTimeout(() => {
      screenshotHint.classList.add("visible");
      screenshotCard.classList.add("visible");
    }, 1000);

    // Start ambient firework loop
    setTimeout(startAmbientLoop, 2000);
    // Enable tap-to-burst
    enableTapBurst();
  }, finaleTime);
}

// ============================================================
// 8. ECG ANIMATION — stroke-dashoffset via requestAnimationFrame
// ============================================================
function startECGAnimation() {
  ecgContainer.classList.add("visible");
  const path = ecgPath;
  const totalLength = path.getTotalLength();
  path.style.strokeDasharray = totalLength;
  path.style.strokeDashoffset = totalLength;

  const duration = 1400; // ms total
  const peakFraction = 900 / duration; // when to fire Phase 1 burst
  let peakFired = false;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out quad for smooth draw-in
    const eased = 1 - Math.pow(1 - progress, 2);
    path.style.strokeDashoffset = totalLength * (1 - eased);

    // Fire Phase 1 at ECG peak moment (~900ms)
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
// 9. FIREWORK PARTICLE SYSTEM (Canvas-based, class-based)
// ============================================================
const fwCtx = fireworkCanvas.getContext("2d");

// Particle color palette — warm gold/amber/white/rose theme
const FIREWORK_COLORS = [
  "#f0c75e",
  "#d4af37",
  "#f5f0e6",
  "#e8c56d",
  "#ffd700",
  "#c49b2a",
  "#fff5d6",
  "#e8a87c",
];
const ACCENT_COLORS = ["#e8967a", "#d4a0a7", "#f0c75e"]; // rose accent

// ---- Particle ----
class Particle {
  constructor(x, y, vx, vy, color, size, isSparkle = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.gravity = 0.05;
    this.friction = 0.98;
    this.life = 1.0;
    this.decay = 0.01 + Math.random() * 0.008; // 0.010–0.018
    this.size = size;
    this.color = color;
    this.trail = [];
    this.isSparkle = isSparkle;
    this.frame = Math.random() * 100; // offset for sine drift
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    // Sparkle horizontal drift
    if (this.isSparkle) {
      this.x += Math.sin(this.frame * 0.1) * 0.5;
    }
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 7) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.frame++;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life);

    // Trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * 0.25;
      ctx.lineWidth = this.size * 0.5;
      ctx.stroke();
    }

    // Glow circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = this.isSparkle ? 4 : 12;
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
// `intensity` is driven by `years` param: 1.0 base → 1.4 at years >= 30
class FireworkBurst {
  constructor(x, y, particleCount, colorPalette, intensity = 1.0) {
    this.x = x;
    this.y = y;
    // years-driven intensity scales particle count
    this.particleCount = Math.round(particleCount * intensity);
    this.colorPalette = colorPalette;
    this.particles = [];
    this.sparkleTimer = null;
  }

  explode() {
    for (let i = 0; i < this.particleCount; i++) {
      const angle =
        ((Math.PI * 2) / this.particleCount) * i + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color =
        this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
      const size = 1.5 + Math.random() * 2;
      this.particles.push(
        new Particle(this.x, this.y, vx, vy, color, size, false),
      );
    }

    // Delayed glitter trail (~100ms after main burst)
    this.sparkleTimer = setTimeout(() => {
      const sparkleCount = Math.round(this.particleCount * 0.3);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const p = new Particle(
          this.x,
          this.y,
          vx,
          vy,
          "#fff5d6",
          0.8 + Math.random(),
          true,
        );
        p.decay = 0.018 + Math.random() * 0.01;
        this.particles.push(p);
      }
      this.sparkleTimer = null; // mark done
    }, 100);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    this.particles.forEach((p) => p.draw(ctx));
  }

  get done() {
    return this.particles.length === 0 && this.sparkleTimer === null;
  }

  get particleCountCurrent() {
    return this.particles.length;
  }
}

// ---- Active bursts registry & single rAF loop ----
const activeBursts = [];
const MAX_PARTICLES = 400;
let fireworkLoopRunning = false;

function getTotalParticles() {
  let n = 0;
  for (const b of activeBursts) n += b.particleCountCurrent;
  return n;
}

function spawnBurst(x, y, count, palette, intensity) {
  if (getTotalParticles() > MAX_PARTICLES) return; // performance cap
  const burst = new FireworkBurst(
    x,
    y,
    count,
    palette || FIREWORK_COLORS,
    intensity || 1.0,
  );
  burst.explode();
  activeBursts.push(burst);
  if (!fireworkLoopRunning) startFireworkLoop();
}

function startFireworkLoop() {
  fireworkLoopRunning = true;
  function loop() {
    fwCtx.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);

    for (let i = activeBursts.length - 1; i >= 0; i--) {
      activeBursts[i].update();
      activeBursts[i].draw(fwCtx);
      if (activeBursts[i].done) activeBursts.splice(i, 1);
    }

    if (activeBursts.length > 0) {
      requestAnimationFrame(loop);
    } else {
      fireworkLoopRunning = false;
      fwCtx.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);
    }
  }
  requestAnimationFrame(loop);
}

// ---- Intensity from `years` param ----
// Base 1.0; linear scale to 1.4 at years >= 30
function getYearsIntensity() {
  if (!hasYears) return 1.0;
  return 1.0 + Math.min(tribute.years / 30, 1.0) * 0.4;
}

// ---- Phase 1: ECG peak — 2 simultaneous bursts ----
function firePhase1Burst() {
  if (prefersReducedMotion) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const intensity = getYearsIntensity();
  spawnBurst(w * 0.2, h * 0.2, 45, FIREWORK_COLORS, intensity);
  spawnBurst(w * 0.8, h * 0.25, 45, FIREWORK_COLORS, intensity);
}

// ---- Phase 2: Grand finale — 3 large + ground sparklers ----
function firePhase2Finale() {
  if (prefersReducedMotion) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const intensity = getYearsIntensity();
  const palette = [...FIREWORK_COLORS, ...ACCENT_COLORS];

  setTimeout(() => spawnBurst(w * 0.5, h * 0.15, 80, palette, intensity), 0);
  setTimeout(() => spawnBurst(w * 0.25, h * 0.28, 75, palette, intensity), 150);
  setTimeout(() => spawnBurst(w * 0.75, h * 0.22, 75, palette, intensity), 300);

  // Ground sparklers — short life, brighter, low velocity
  setTimeout(() => {
    const sparklerPalette = ["#fff5d6", "#f0c75e", "#ffffff", "#ffeebb"];
    const positions = [0.12, 0.3, 0.5, 0.7, 0.88];
    positions.forEach((px, i) => {
      setTimeout(() => {
        const burst = new FireworkBurst(
          w * px,
          h * 0.93,
          18,
          sparklerPalette,
          1.0,
        );
        burst.particles = []; // don't call explode, manual low-velocity burst
        for (let j = 0; j < 18; j++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
          const speed = 1 + Math.random() * 2.5;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const color =
            sparklerPalette[Math.floor(Math.random() * sparklerPalette.length)];
          const p = new Particle(
            w * px,
            h * 0.93,
            vx,
            vy,
            color,
            1 + Math.random() * 1.5,
            true,
          );
          p.decay = 0.025 + Math.random() * 0.015;
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
function startAmbientLoop() {
  if (prefersReducedMotion) return;
  function fireAmbient() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = Math.random() * w;
    const y = Math.random() * h * 0.6; // upper 60%
    spawnBurst(x, y, 15 + Math.floor(Math.random() * 6), FIREWORK_COLORS, 0.8);
    const nextDelay = 8000 + Math.random() * 4000;
    setTimeout(fireAmbient, nextDelay);
  }
  setTimeout(fireAmbient, 8000 + Math.random() * 4000);
}

// ---- Tap/click burst ----
function enableTapBurst() {
  if (prefersReducedMotion) return;

  function handleBurst(x, y) {
    spawnBurst(x, y, 25 + Math.floor(Math.random() * 6), FIREWORK_COLORS, 1.0);
  }

  if (window.PointerEvent) {
    document.addEventListener("pointerdown", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("#screenshot-card")
      )
        return;
      handleBurst(e.clientX, e.clientY);
    });
  } else {
    document.addEventListener(
      "touchstart",
      (e) => {
        if (
          e.target.closest("button") ||
          e.target.closest("a") ||
          e.target.closest("#screenshot-card")
        )
          return;
        const t = e.touches[0];
        handleBurst(t.clientX, t.clientY);
      },
      { passive: true },
    );
    document.addEventListener("mousedown", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("#screenshot-card")
      )
        return;
      handleBurst(e.clientX, e.clientY);
    });
  }
}

// ============================================================
// 10. STAR FIELD — twinkling dots on canvas
// ============================================================
const stars = [];
let starCtx;

function initStarField() {
  starCtx = starCanvas.getContext("2d");
  const count = 110;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      size: 0.4 + Math.random() * 1.4,
      speed: 0.3 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      baseAlpha: 0.25 + Math.random() * 0.5,
    });
  }
  if (!prefersReducedMotion) {
    animateStars();
  } else {
    drawStarsStatic();
  }
}

function animateStars() {
  const w = starCanvas.width;
  const h = starCanvas.height;
  if (w === 0 || h === 0) {
    requestAnimationFrame(animateStars);
    return;
  }
  starCtx.clearRect(0, 0, w, h);

  const now = performance.now() / 1000;
  for (const s of stars) {
    const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));
    starCtx.beginPath();
    starCtx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    starCtx.fillStyle = "#f5f0e6";
    starCtx.globalAlpha = alpha;
    starCtx.fill();
  }
  starCtx.globalAlpha = 1;
  requestAnimationFrame(animateStars);
}

function drawStarsStatic() {
  const w = starCanvas.width;
  const h = starCanvas.height;
  starCtx.clearRect(0, 0, w, h);
  for (const s of stars) {
    starCtx.beginPath();
    starCtx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
    starCtx.fillStyle = "#f5f0e6";
    starCtx.globalAlpha = s.baseAlpha * 0.5;
    starCtx.fill();
  }
  starCtx.globalAlpha = 1;
}

// ============================================================
// 11. FLOATING LIGHT ORBS — CSS radial-gradient divs
// ============================================================
function initFloatingOrbs() {
  if (prefersReducedMotion) return;

  const orbCount = 8;
  for (let i = 0; i < orbCount; i++) {
    const orb = document.createElement("div");
    orb.classList.add("floating-orb");
    const size = 100 + Math.random() * 220;
    const hue = 36 + Math.random() * 22; // warm gold range
    const startX = Math.random() * 100;
    const riseDuration = 16 + Math.random() * 20;
    const swayAmplitude = 20 + Math.random() * 40;
    const swaySpeed = 3 + Math.random() * 4;
    const orbOpacity = 0.06 + Math.random() * 0.09;

    orb.style.width = size + "px";
    orb.style.height = size + "px";
    orb.style.left = startX + "%";
    orb.style.bottom = "-" + size + "px";
    orb.style.opacity = orbOpacity;
    orb.style.background = `radial-gradient(circle, hsla(${hue}, 60%, 55%, 0.35) 0%, transparent 70%)`;
    orb.style.filter = `blur(${22 + Math.random() * 28}px)`;

    orbsContainer.appendChild(orb);
    animateOrb(orb, riseDuration, swayAmplitude, swaySpeed, size);
  }
}

function animateOrb(orb, riseDuration, swayAmp, swayFreq, size) {
  const totalHeight = window.innerHeight + size * 2;
  let startTime = performance.now() - Math.random() * riseDuration * 1000;

  function tick(now) {
    const elapsed = (now - startTime) / 1000;
    const progress = (elapsed % riseDuration) / riseDuration;
    const y = totalHeight * progress;
    const sway = Math.sin((elapsed / swayFreq) * Math.PI * 2) * swayAmp;
    orb.style.transform = `translate(${sway}px, -${y}px)`;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ============================================================
// 12. SHARE LOGIC — WhatsApp + Copy Link + counter increment
// ============================================================
whatsappBtn.addEventListener("click", () => {
  const shareUrl = buildShareUrl();
  const message = `🩺 Happy National Doctors' Day! Here's a personal tribute for you: ${shareUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");

  // Increment counter
  const next = incrementTributeCount();
  animateCountTo(next);
});

copyLinkBtn.addEventListener("click", () => {
  const shareUrl = buildShareUrl();
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      showCopyToast();
    })
    .catch(() => {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopyToast();
    });

  // Increment counter
  const next = incrementTributeCount();
  animateCountTo(next);
});

function buildShareUrl() {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  return params.toString() ? base + "?" + params.toString() : base;
}

function showCopyToast() {
  copyToast.classList.add("show");
  setTimeout(() => copyToast.classList.remove("show"), 2200);
}
