/**
 * VoiceNest UI - minimal call widget
 */
const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const PHONE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
const MIC_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';

export function render(config, { onStart, onStop, onToggleMic }) {
  const root = document.createElement("div");
  root.id = "voicenest-root";
  root.className = "voicenest";

  let active = false;
  let muted = false;

  const pos = config.position || "bottom-right";
  const offset = config.offset || { x: 20, y: 20 };
  const c = (v) => (typeof offset === "number" ? offset : offset[v] ?? 20);
  const theme = config.theme || "dark";
  const style = config.style || "card";
  root.classList.add("voicenest-theme-" + theme);
  root.classList.add("voicenest-style-" + style);

  root.innerHTML = `
    <div class="voicenest-card" style="
      position:fixed;${pos.includes("bottom") ? "bottom:" + c("y") + "px" : "top:" + c("y") + "px"};
      ${pos.includes("right") ? "right:" + c("x") + "px" : "left:" + c("x") + "px"};
      z-index:2147483647;
      display:flex;align-items:center;gap:10px;
      padding:12px 16px;
      border-radius:14px;
    ">
      <button class="voicenest-btn voicenest-call" aria-label="Call">${PHONE}</button>
      <button class="voicenest-btn voicenest-mic" aria-label="Mute" style="display:none">${MIC}</button>
      <span class="voicenest-status">idle</span>
    </div>
  `;

  const card = root.querySelector(".voicenest-card");
  const callBtn = root.querySelector(".voicenest-call");
  const micBtn = root.querySelector(".voicenest-mic");
  const status = root.querySelector(".voicenest-status");

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

  const revertUi = () => {
    active = false;
    muted = false;
    micBtn.style.display = "none";
    micBtn.style.removeProperty("background");
    micBtn.style.removeProperty("color");
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
      micBtn.style.display = "flex";
      micBtn.innerHTML = muted ? MIC_OFF : MIC;
      if (style === "circle-round" || style === "minimal") {
        micBtn.style.setProperty("background", color, "important");
        micBtn.style.setProperty("color", "#fff", "important");
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

  micBtn.onclick = async () => {
    muted = !muted;
    micBtn.innerHTML = muted ? MIC_OFF : MIC;
    if (style === "circle-round" || style === "minimal") {
      micBtn.style.setProperty("background", color, "important");
      micBtn.style.setProperty("color", "#fff", "important");
    }
    await onToggleMic?.(!muted);
  };

  document.body.appendChild(root);

  return {
    setStatus: (text) => {
      status.textContent = text;
      if (text === "connected") onToggleMic?.(!muted);
      if (text === "idle") revertUi();
    },
    setError: (msg) => { status.textContent = "error"; status.title = msg || ""; },
    revert: revertUi,
  };
}
