/**
 * VoiceNest - Pipecat voice widget
 * Supports Daily and SmallWebRTC transports
 */
import "./styles.css";
import { render } from "./ui";
import * as callDaily from "./call-daily";
import * as callSmall from "./call-small";
import { startSession, stopSession } from "./session";

let config = null;
let ui = null;
let activeTransport = null;
let activeSession = null; // { stopUrl } for Pipecat Cloud

async function start() {
  if (!config) throw new Error("Call VoiceNest.init() first");

  if (!ui) ui = render(config, { onStart: start, onStop: stop, onToggleMic: setMic });

  const onStatus = (s) => {
    ui?.setStatus(s);
    config?.onStatusChange?.(s);
  };

  try {
    let session = { transport: config.transport };

    if (config.startEndpoint) {
      onStatus("connecting");
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

    if (transport === "small-webrtc") {
      activeTransport = "small";
      await callSmall.join({
        webrtcUrl: session.webrtcUrl,
        apiKey: config.apiKey,
        iceConfig: session.iceConfig,
        onStatus,
      });
    } else {
      activeTransport = "daily";
      await callDaily.join({
        url: session.roomUrl,
        token: session.token,
        onStatus,
      });
    }
  } catch (err) {
    console.error("VoiceNest:", err);
    onStatus("error");
    ui?.setError(err?.message);
    ui?.revert?.();
    config?.onError?.(err);
  }
}

async function stop() {
  if (activeTransport === "small") {
    await callSmall.leave();
  } else {
    await callDaily.leave();
  }
  // Stop Pipecat Cloud session (requires privateApiKey - public key returns 401)
  const stopKey = config?.privateApiKey;
  if (activeSession?.stopUrl && stopKey) {
    await stopSession({ stopUrl: activeSession.stopUrl, apiKey: stopKey });
  } else if (activeSession?.stopUrl && config?.apiKey && !config?.privateApiKey) {
    console.warn("VoiceNest: Stop requires privateApiKey. Session may remain active.");
  }
  activeTransport = null;
  activeSession = null;
  ui?.setStatus("idle");
}

function setMic(enabled) {
  if (activeTransport === "small") {
    callSmall.setMic(enabled);
  } else {
    callDaily.setMic(enabled);
  }
}

function init(opts = {}) {
  const hasStart = opts?.startEndpoint || opts?.startUrl;
  const hasRoom = opts?.roomUrl;
  const hasWebrtc = opts?.webrtcUrl;

  if (!hasStart && !hasRoom && !hasWebrtc) {
    throw new Error("VoiceNest.init: startEndpoint, roomUrl, or webrtcUrl required");
  }

  config = {
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
    onStatusChange: opts.onStatusChange || null,
    onError: opts.onError || null,
  };

  ui = render(config, { onStart: start, onStop: stop, onToggleMic: setMic });

  const VoiceNest = { init, start, stop };
  if (typeof window !== "undefined") window.VoiceNest = VoiceNest;
  return VoiceNest;
}

export default { init, start, stop };
