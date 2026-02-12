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

  root.innerHTML = `
    <div class="voicenest-card" style="
      position:fixed;${pos.includes("bottom") ? "bottom:" + c("y") + "px" : "top:" + c("y") + "px"};
      ${pos.includes("right") ? "right:" + c("x") + "px" : "left:" + c("x") + "px"};
      z-index:2147483647;
      display:flex;align-items:center;gap:10px;
      padding:12px 16px;
      background:#1a1a1e;
      border-radius:14px;
      box-shadow:0 4px 24px rgba(0,0,0,.25);
      border:1px solid rgba(255,255,255,.06);
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

  callBtn.onclick = async () => {
    if (active) {
      await onStop?.();
      active = false;
      muted = false;
      micBtn.style.display = "none";
      callBtn.innerHTML = PHONE;
      callBtn.style.background = color;
      status.textContent = "idle";
    } else {
      callBtn.innerHTML = PHONE_OFF;
      callBtn.style.background = "#dc2626";
      active = true;
      micBtn.style.display = "flex";
      micBtn.innerHTML = muted ? MIC_OFF : MIC;
      try {
        await onStart?.();
      } catch (e) {
        active = false;
        micBtn.style.display = "none";
        callBtn.innerHTML = PHONE;
        callBtn.style.background = color;
        status.textContent = "error";
        status.title = e?.message || "Error";
      }
    }
  };

  micBtn.onclick = async () => {
    muted = !muted;
    micBtn.innerHTML = muted ? MIC_OFF : MIC;
    await onToggleMic?.(!muted);
  };

  document.body.appendChild(root);

  return {
    setStatus: (text) => {
      status.textContent = text;
      if (text === "connected") onToggleMic?.(!muted);
    },
    setError: (msg) => { status.textContent = "error"; status.title = msg || ""; },
    revert: () => {
      active = false;
      micBtn.style.display = "none";
      callBtn.innerHTML = PHONE;
      callBtn.style.background = color;
      status.textContent = "idle";
    },
  };
}
