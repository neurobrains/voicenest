/**
 * VoiceNest - Pipecat voice widget
 * Supports Daily and SmallWebRTC transports
 */
import "./styles.css";
import { installGetUserMediaPatch } from "./audio-constraints";

// Patch MUST run before any transport/userMedia; SmallWebRTC is timing-sensitive
installGetUserMediaPatch();

import { render } from "./ui";
import { startSession, stopSession } from "./session";
import { requestMicPermission } from "./audio-constraints";

// Transport modules are lazy-loaded on first call to keep the main bundle small.
// Each is cached after the first dynamic import so subsequent calls are instant.
let _callDaily = null;
let _callSmall = null;

async function getCallDaily() {
  if (!_callDaily) _callDaily = await import(/* webpackChunkName: "transport-daily" */ "./call-daily");
  return _callDaily;
}

async function getCallSmall() {
  if (!_callSmall) _callSmall = await import(/* webpackChunkName: "transport-small" */ "./call-small");
  return _callSmall;
}

let config = null;
let ui = null;
let activeTransport = null;
let activeSession = null; // { stopUrl } for Pipecat Cloud
let isStopping = false;

function normalizeError(err) {
  const msg = err?.message || String(err || "");
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Connection failed. Check network or try HTTPS.";
  }
  if (msg.includes("CORS") || msg.includes("Access-Control")) {
    return "Connection blocked. Use HTTPS or localhost.";
  }
  if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
    return "Microphone access denied. Allow mic in browser settings.";
  }
  if (msg.includes("NotFound") || msg.includes("not found")) {
    return "Microphone not found.";
  }
  if (msg.includes("NotSupported") || msg.includes("secure")) {
    return "Microphone requires HTTPS or localhost.";
  }
  if (msg.includes("504") || msg.includes("Gateway Timeout")) {
    return "Server timeout. Try again shortly.";
  }
  return msg || "Connection failed. Try again.";
}

// ── Test mode: simulate a live call for UI development ───────────────────────
let _testIntervalId = null;

async function _runTestMode(onStatus, onBotSpeaking, onBotStoppedSpeaking, onUserSpeaking, onUserStoppedSpeaking) {
  onStatus("connecting");
  await new Promise(r => setTimeout(r, 1400));
  onStatus("connected");

  // Cycle through bot-speaking → listening → user-speaking → listening every ~2.5 s
  const phases = [
    () => { onBotSpeaking(); },
    () => { onBotStoppedSpeaking(); },
    () => { onUserSpeaking(); },
    () => { onUserStoppedSpeaking(); },
  ];
  let phase = 0;
  _testIntervalId = setInterval(() => {
    phases[phase % phases.length]();
    phase++;
  }, 2500);
}

async function start() {
  if (!config) throw new Error("Call VoiceNest.init() first");

  if (!ui) ui = render(config, { onStart: start, onStop: stop, onToggleMic: setMic });

  const onStatus = (s) => {
    ui?.setStatus(s);
    config?.onStatusChange?.(s);
    if (s === "idle" && (activeTransport || activeSession) && !isStopping) {
      stop();
    }
  };

  const onBotSpeaking = () => {
    ui?.startBotSpeaking();
  };

  const onBotStoppedSpeaking = () => {
    ui?.startListening();
  };

  const onUserSpeaking = () => {
    ui?.startUserSpeaking();
  };

  const onUserStoppedSpeaking = () => {
    ui?.startListening();
  };

  // ── Test mode — bypass real transport ──────────────────────────────────────
  if (config.testStartEndpoint) {
    console.info("VoiceNest: testStartEndpoint active — running in UI test mode (no real call).");
    await _runTestMode(onStatus, onBotSpeaking, onBotStoppedSpeaking, onUserSpeaking, onUserStoppedSpeaking);
    return;
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    const msg = "Microphone requires HTTPS or localhost.";
    onStatus("error");
    ui?.setError(msg);
    ui?.revert?.();
    config?.onError?.(new Error(msg));
    return;
  }

  try {
    onStatus("connecting");
    let session = { transport: config.transport };

    if (config.startEndpoint) {
      session = await startSession({
        endpoint: config.startEndpoint,
        apiKey: config.apiKey,
        transport: config.transport,
      });
    } else if (config.roomUrl) {
      session = {
        transport: "daily",
        roomUrl: config.roomUrl,
        token: config.token,
      };
    } else if (config.webrtcUrl) {
      session = { transport: "small-webrtc", webrtcUrl: config.webrtcUrl };
    }

    const transport = session.transport || "daily";
    activeSession = session.stopUrl ? { stopUrl: session.stopUrl } : null;

    // Skip permission warmup for SmallWebRTC — it can break sender attachment
    if (transport !== "small-webrtc") {
      try {
        await requestMicPermission();
      } catch (permErr) {
        const msg = normalizeError(permErr);
        console.error("VoiceNest:", permErr);
        onStatus("error");
        ui?.setError(msg);
        ui?.revert?.();
        config?.onError?.(new Error(msg));
        return;
      }
    }

    if (transport === "small-webrtc") {
      activeTransport = "small";
      const callSmall = await getCallSmall();
      await callSmall.join({
        webrtcUrl: session.webrtcUrl,
        apiKey: config.apiKey,
        iceConfig: session.iceConfig,
        onStatus,
        onBotSpeaking,
        onBotStoppedSpeaking,
        onUserSpeaking,
        onUserStoppedSpeaking,
      });
    } else {
      activeTransport = "daily";
      const callDaily = await getCallDaily();
      await callDaily.join({
        url: session.roomUrl,
        token: session.token,
        onStatus,
        onBotSpeaking,
        onBotStoppedSpeaking,
        onUserSpeaking,
        onUserStoppedSpeaking,
      });
    }
  } catch (err) {
    const msg = normalizeError(err);
    console.error("VoiceNest:", err);
    onStatus("error");
    ui?.setError(msg);
    ui?.revert?.();
    config?.onError?.(new Error(msg));
  }
}

async function stop() {
  if (isStopping) return;
  isStopping = true;

  // Clean up test mode cycle if running
  if (_testIntervalId) {
    clearInterval(_testIntervalId);
    _testIntervalId = null;
  }

  const transport = activeTransport;
  const session = activeSession;
  activeTransport = null;
  activeSession = null;

  _callSmall?.muteRemoteAudio?.();
  _callDaily?.muteRemoteAudio?.();

  try {
    const stopKey = config?.privateApiKey;
    if (session?.stopUrl && stopKey) {
      await stopSession({ stopUrl: session.stopUrl, apiKey: stopKey });
    } else if (session?.stopUrl && config?.apiKey && !config?.privateApiKey) {
      console.warn("VoiceNest: Stop requires privateApiKey. Session may remain active.");
    }
    if (transport === "small") {
      await _callSmall?.leave();
    } else if (transport === "daily") {
      await _callDaily?.leave();
    }
  } finally {
    isStopping = false;
    ui?.setStatus("idle");
  }
}

function setMic(enabled) {
  if (activeTransport === "small") {
    _callSmall?.setMic(enabled);
  } else {
    _callDaily?.setMic(enabled);
  }
}

function init(opts = {}) {
  const hasStart = opts?.startEndpoint || opts?.startUrl;
  const hasRoom = opts?.roomUrl;
  const hasWebrtc = opts?.webrtcUrl;
  const hasTest = opts?.testStartEndpoint;

  if (!hasStart && !hasRoom && !hasWebrtc && !hasTest) {
    throw new Error("VoiceNest.init: startEndpoint, roomUrl, webrtcUrl, or testStartEndpoint required");
  }

  config = {
    testStartEndpoint: opts.testStartEndpoint || false,
    startEndpoint: opts.startEndpoint || opts.startUrl || "",
    apiKey: opts.apiKey || null,
    privateApiKey: opts.privateApiKey || null,
    roomUrl: opts.roomUrl || "",
    token: opts.token || null,
    webrtcUrl: opts.webrtcUrl || "",
    transport: opts.transport || "daily",
    position: opts.position || "bottom-right",
    offset: opts.offset || { x: 20, y: 20 },
    color: opts.color || "#2563eb",
    theme: opts.theme || "dark",
    style: opts.style || "card",
    shadow: opts.shadow,
    glow: opts.glow,
    glowIntensity: opts.glowIntensity ?? 45,
    glowSpread: opts.glowSpread ?? 8,
    glowBlur: opts.glowBlur ?? 28,
    onStatusChange: opts.onStatusChange || null,
    onError: opts.onError || null,
  };

  ui = render(config, { onStart: start, onStop: stop, onToggleMic: setMic });

  const VoiceNest = { init, start, stop };
  if (typeof window !== "undefined") window.VoiceNest = VoiceNest;
  return VoiceNest;
}

export default { init, start, stop };
