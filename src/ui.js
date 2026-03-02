/**
 * VoiceNest UI - minimal call widget
 */
const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const PHONE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
const MIC_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';

const TAU = Math.PI * 2;

// ── Perfect Orb + Wave Animation Engine ──────────────────────────────────────
function createPerfectOrb(container, onToggleMic, muted) {
  const wrapper = document.createElement('div');
  wrapper.className = 'voicenest-orb-wrapper';
  
  const orbCanvas = document.createElement('canvas');
  orbCanvas.className = 'voicenest-orb-canvas';
  
  const waveCanvas = document.createElement('canvas');
  waveCanvas.className = 'voicenest-wave-canvas';
  
  container.innerHTML = '';
  wrapper.appendChild(orbCanvas);
  wrapper.appendChild(waveCanvas);
  container.appendChild(wrapper);

  let animId = null;
  let energy = 0;
  let targetEnergy = 0;
  let pulseScale = 1;
  let targetPulseScale = 1;
  let startTime = null;
  let isActive = false;

  // ── Wave Animation Variables ──
  const BARS = 9;
  const BAR_W = 4;
  const GAP = 5;
  const COLOR_TOP = '#5ab4ff';
  const COLOR_BTM = '#2d7cf6';
  const MAX_H = 32;
  const MIN_H = 3;
  let WAVE_SPEED = 0.4;

  function resize() {
    // Orb canvas
    const orbSize = Math.min(container.offsetWidth || 160, container.offsetHeight || 160);
    orbCanvas.width = orbSize * 2;
    orbCanvas.height = orbSize * 2;
    orbCanvas.style.width = orbSize + 'px';
    orbCanvas.style.height = orbSize + 'px';
    
    // Wave canvas
    const waveW = BARS * (BAR_W + GAP) - GAP;
    const waveH = MAX_H * 2 + 8;
    waveCanvas.width = waveW * 2;
    waveCanvas.height = waveH * 2;
    waveCanvas.style.width = waveW + 'px';
    waveCanvas.style.height = waveH + 'px';
  }

  function drawMicIcon(ctx, cx, cy, size, color, alpha, isMuted) {
    const s = size;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isMuted) {
      // Muted mic with slash
      const bw = s * .32, bh = s * .45, br = s * .16;
      const bx = cx - bw / 2, by = cy - s * .3;

      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.stroke();

      // Slash line
      ctx.beginPath();
      ctx.moveTo(cx - s * .35, cy - s * .35);
      ctx.lineTo(cx + s * .35, cy + s * .35);
      ctx.lineWidth = s * 0.08;
      ctx.stroke();
    } else {
      // Normal mic
      const bw = s * .32, bh = s * .45, br = s * .16;
      const bx = cx - bw / 2, by = cy - s * .3;

      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy + s * .05, s * .28, Math.PI, 0, true);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy + s * .05 + s * .28);
      ctx.lineTo(cx, cy + s * .35);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - s * .18, cy + s * .35);
      ctx.lineTo(cx + s * .18, cy + s * .35);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawOrb(t) {
    const W = orbCanvas.width, H = orbCanvas.height;
    if (!W || !H) return;
    
    const ctx = orbCanvas.getContext('2d');
    ctx.scale(2, 2);
    const size = W / 2;
    const cx = size / 2, cy = size / 2;
    
    ctx.clearRect(0, 0, size, size);

    // Apply pulse scaling
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-cx, -cy);

    const baseRadius = size * 0.35;
    const glowRadius = baseRadius + 8 + energy * 12;
    
    // Outer glow ring
    const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius - 5, cx, cy, glowRadius);
    outerGlow.addColorStop(0, `rgba(90, 180, 255, ${0.8 + energy * 0.4})`);
    outerGlow.addColorStop(0.3, `rgba(45, 124, 246, ${0.6 + energy * 0.3})`);
    outerGlow.addColorStop(0.7, `rgba(45, 124, 246, ${0.2 + energy * 0.2})`);
    outerGlow.addColorStop(1, 'rgba(45, 124, 246, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TAU);
    ctx.fill();

    // Main orb - dark center with bright ring
    const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
    orbGrad.addColorStop(0, '#0a0f1e');
    orbGrad.addColorStop(0.7, '#1a2332');
    orbGrad.addColorStop(0.85, `rgba(90, 180, 255, ${0.3 + energy * 0.4})`);
    orbGrad.addColorStop(1, `rgba(90, 180, 255, ${0.8 + energy * 0.6})`);
    
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, TAU);
    ctx.fill();

    // Bright ring highlight
    ctx.strokeStyle = `rgba(90, 180, 255, ${0.9 + energy * 0.3})`;
    ctx.lineWidth = 2 + energy * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius - 1, 0, TAU);
    ctx.stroke();

    // Mic icon
    const micColor = muted ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    drawMicIcon(ctx, cx, cy, baseRadius * 0.6, micColor, 1, muted);

    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
  }

  function drawWave(t) {
    const W = waveCanvas.width / 2, H = waveCanvas.height / 2;
    const ctx = waveCanvas.getContext('2d');
    ctx.scale(2, 2);
    
    ctx.clearRect(0, 0, W, H);
    
    if (!isActive) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }

    const cx = W / 2;
    const cy = H / 2;

    // Each bar has its own phase offset
    const barPhases = Array.from({ length: BARS }, (_, i) => {
      const distFromCenter = Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
      return {
        phase: (i / BARS) * Math.PI * 2,
        maxHeight: MAX_H * (1 - distFromCenter * 0.5),
      };
    });

    barPhases.forEach((bar, i) => {
      const x = i * (BAR_W + GAP);

      const wave =
        Math.sin(t * 2.8 * WAVE_SPEED + bar.phase) * 0.5 +
        Math.sin(t * 1.9 * WAVE_SPEED + bar.phase * 1.3) * 0.3 +
        Math.sin(t * 3.5 * WAVE_SPEED + bar.phase * 0.7) * 0.2;

      const normalised = (wave + 1) / 2;
      const h = MIN_H + normalised * (bar.maxHeight - MIN_H);

      const grad = ctx.createLinearGradient(0, cy - h, 0, cy + h);
      grad.addColorStop(0, COLOR_TOP);
      grad.addColorStop(1, COLOR_BTM);

      ctx.fillStyle = grad;
      roundRect(ctx, x, cy - h, BAR_W, h * 2, BAR_W / 2);
      ctx.fill();
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h < r * 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function loop(ts) {
    if (!startTime) startTime = ts;
    const t = (ts - startTime) / 1000;
    
    energy += (targetEnergy - energy) * 0.08;
    pulseScale += (targetPulseScale - pulseScale) * 0.12;
    
    drawOrb(t);
    drawWave(t);
    animId = requestAnimationFrame(loop);
  }

  function start() {
    if (animId) return;
    resize();
    startTime = null;
    isActive = true;
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    isActive = false;
    targetEnergy = 0;
    targetPulseScale = 1;
  }

  function setEnergy(val) {
    targetEnergy = Math.max(0, Math.min(1, val));
    WAVE_SPEED = 0.4 + val * 1.8; // Speed up wave when active
  }

  function setPulse(scale) {
    targetPulseScale = scale;
  }

  function setMuted(isMuted) {
    muted = isMuted;
  }

  // Make orb clickable
  orbCanvas.style.cursor = 'pointer';
  orbCanvas.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggleMic?.();
  });

  return { start, stop, setEnergy, setPulse, setMuted };
}

export function render(config, { onStart, onStop, onToggleMic }) {
  const root = document.createElement("div");
  root.id = "voicenest-root";
  root.className = "voicenest";

  let active = false;
  let muted = false;
  let crystalAura = null;

  const pos = config.position || "bottom-right";
  const offset = config.offset || { x: 20, y: 20 };
  const c = (v) => (typeof offset === "number" ? offset : offset[v] ?? 20);
  const theme = config.theme || "dark";
  const style = config.style || "card";
  root.classList.add("voicenest-theme-" + theme);
  root.classList.add("voicenest-style-" + style);

  // Create different layouts based on style
  let cardContent = '';

  if (style === 'wave') {
    cardContent = `
      <button class="voicenest-btn voicenest-call" aria-label="Call">${PHONE}</button>
      <button class="voicenest-btn voicenest-mic" aria-label="Mute" style="display:none">${MIC}</button>
      <div class="voicenest-wave-container">
        <div class="voicenest-wave-display">
          <div class="voicenest-wave-bar"></div>
          <div class="voicenest-wave-bar"></div>
          <div class="voicenest-wave-bar"></div>
          <div class="voicenest-wave-bar"></div>
          <div class="voicenest-wave-bar"></div>
        </div>
        <span class="voicenest-status">idle</span>
      </div>
    `;
  } else if (style === 'circle-mode') {
    cardContent = `
      <div class="voicenest-perfect-orb"></div>
      <div class="voicenest-controls">
        <button class="voicenest-btn voicenest-call" aria-label="Call">${PHONE}</button>
        <button class="voicenest-btn voicenest-mic" aria-label="Mute" style="display:none">${MIC}</button>
        <span class="voicenest-status">idle</span>
      </div>
    `;
  } else {
    // Default card, circle-round, minimal styles
    cardContent = `
      <button class="voicenest-btn voicenest-call" aria-label="Call">${PHONE}</button>
      <button class="voicenest-btn voicenest-mic" aria-label="Mute" style="display:none">${MIC}</button>
      <span class="voicenest-status">idle</span>
    `;
  }

  root.innerHTML = `
    <div class="voicenest-card" style="
      position:fixed;${pos.includes("bottom") ? "bottom:" + c("y") + "px" : "top:" + c("y") + "px"};
      ${pos.includes("right") ? "right:" + c("x") + "px" : "left:" + c("x") + "px"};
      z-index:2147483647;
      display:flex;align-items:center;gap:10px;
      padding:12px 16px;
      border-radius:14px;
    ">
      ${cardContent}
    </div>
  `;

  const card = root.querySelector(".voicenest-card");
  const callBtn = root.querySelector(".voicenest-call");
  const micBtn = root.querySelector(".voicenest-mic");
  const status = root.querySelector(".voicenest-status");
  const perfectOrbEl = root.querySelector(".voicenest-perfect-orb");

  const color = config.color || "#2563eb";
  callBtn.style.background = color;

  const hexToRgba = (hex, a) => {
    if (!hex || typeof hex !== "string") return `rgba(37,99,235,${a})`;
    let m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (m) return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${a})`;
    m = hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (m) return `rgba(${parseInt(m[1]+m[1],16)},${parseInt(m[2]+m[2],16)},${parseInt(m[3]+m[3],16)},${a})`;
    return `rgba(37,99,235,${a})`;
  };

  const getGlowAlpha = () => {
    const v = config.glowIntensity ?? 45;
    return Math.min(1, Math.max(0, typeof v === "number" ? (v > 1 ? v / 100 : v) : 0.45));
  };

  const applyShadow = () => {
    const s = config.shadow;
    if (s === false || s === "none" || s === "false") card.style.setProperty("box-shadow", "none", "important");
    else if (typeof s === "string" && s) card.style.setProperty("box-shadow", s, "important");
    else card.style.removeProperty("box-shadow");
  };
  const applyGlow = (btnColor) => {
    const g = config.glow;
    const alpha = getGlowAlpha();
    const blur = Math.max(0, config.glowBlur ?? 28);
    const spread = Math.max(0, config.glowSpread ?? 8);
    if (g === false || g === "none") callBtn.style.boxShadow = "";
    else if (typeof g === "string") callBtn.style.boxShadow = `0 0 ${blur}px ${spread}px ${hexToRgba(g, alpha)}`;
    else if (g === true) callBtn.style.boxShadow = `0 0 ${blur}px ${spread}px ${hexToRgba(btnColor, alpha)}`;
    else callBtn.style.boxShadow = "";
  };

  applyShadow();
  if (config.glow) applyGlow(color);

  // Initialize Perfect Orb canvas for circle-mode
  if (style === "circle-mode" && perfectOrbEl) {
    crystalAura = createPerfectOrb(perfectOrbEl, () => {
      // Orb click handler for mute/unmute
      muted = !muted;
      crystalAura?.setMuted(muted);
      onToggleMic?.(!muted);
    }, muted);
  }

  const stopAllAnimations = () => {
    root.classList.remove("voicenest-listening", "voicenest-bot-speaking", "voicenest-user-speaking", "voicenest-connected");
    crystalAura?.setEnergy(0.1);
    crystalAura?.setPulse(1.0);
  };

  const startListeningAnimation = () => {
    stopAllAnimations();
    root.classList.add("voicenest-listening");
    crystalAura?.setEnergy(0.4);
    crystalAura?.setPulse(1.02);
  };

  const startBotSpeakingAnimation = () => {
    stopAllAnimations();
    root.classList.add("voicenest-bot-speaking");
    crystalAura?.setEnergy(0.9);
    crystalAura?.setPulse(1.08);
  };

  const startUserSpeakingAnimation = () => {
    stopAllAnimations();
    root.classList.add("voicenest-user-speaking");
    crystalAura?.setEnergy(1.0);
    crystalAura?.setPulse(1.12);
  };

  const revertUi = () => {
    active = false;
    muted = false;
    stopAllAnimations();

    card.classList.remove("voicenest-active");
    crystalAura?.stop();
    crystalAura?.setMuted(false);

    if (micBtn && style !== "circle-mode") {
      micBtn.style.display = "none";
      micBtn.style.removeProperty("background");
      micBtn.style.removeProperty("color");
    }
    callBtn.innerHTML = PHONE;
    callBtn.style.background = color;
    if (config.glow) applyGlow(color);
    status.textContent = "idle";
  };

  let endCallInProgress = false;
  callBtn.onclick = async () => {
    if (active) {
      if (endCallInProgress) return;
      endCallInProgress = true;
      callBtn.disabled = true;
      try {
        await onStop?.();
      } finally {
        endCallInProgress = false;
        callBtn.disabled = false;
        revertUi();
      }
    } else {
      callBtn.innerHTML = PHONE_OFF;
      callBtn.style.background = "#dc2626";
      if (config.glow) applyGlow("#dc2626");
      active = true;

      // Show and start Perfect Orb canvas immediately
      if (style === "circle-mode") {
        card.classList.add("voicenest-active");
        // Small delay so container has layout dimensions
        requestAnimationFrame(() => crystalAura?.start());
      } else if (micBtn) {
        // Show mic button for other styles
        micBtn.style.display = "flex";
        micBtn.innerHTML = muted ? MIC_OFF : MIC;
        if (style === "circle-round" || style === "minimal") {
          micBtn.style.setProperty("background", color, "important");
          micBtn.style.setProperty("color", "#fff", "important");
        }
      }
      try {
        await onStart?.();
      } catch (e) {
        revertUi();
        status.textContent = "error";
        status.title = e?.message || "Error";
      }
    }
  };

  let micToggleInProgress = false;
  if (micBtn) {
    micBtn.onclick = async () => {
      if (micToggleInProgress || style === "circle-mode") return; // orb handles circle-mode
      micToggleInProgress = true;
      muted = !muted;
      micBtn.innerHTML = muted ? MIC_OFF : MIC;
      if (style === "circle-round" || style === "minimal") {
        micBtn.style.setProperty("background", color, "important");
        micBtn.style.setProperty("color", "#fff", "important");
      }
      crystalAura?.setMuted(muted);
      try {
        await onToggleMic?.(!muted);
      } finally {
        setTimeout(() => { micToggleInProgress = false; }, 150);
      }
    };
  }

  document.body.appendChild(root);

  return {
    setStatus: (text) => {
      status.textContent = text;
      if (text === "connected") {
        root.classList.add("voicenest-connected");
        startListeningAnimation();
        onToggleMic?.(!muted);
      }
      if (text === "idle") {
        root.classList.remove("voicenest-connected");
        revertUi();
      }
    },
    setError: (msg) => {
      status.textContent = "error";
      status.title = msg || "";
      stopAllAnimations();
    },
    revert: revertUi,
    startListening: startListeningAnimation,
    startBotSpeaking: startBotSpeakingAnimation,
    startUserSpeaking: startUserSpeakingAnimation,
    stopAnimations: stopAllAnimations,
  };
}
