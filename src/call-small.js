/**
 * SmallWebRTC transport - PipecatClient + SmallWebRTCTransport
 * @see https://docs.pipecat.ai/client/js/transports/small-webrtc
 */
import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";

let client = null;
let audioEl = null;

function playRemoteTrack(track) {
  if (!track || track.kind !== "audio") return;
  if (!audioEl) {
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    audioEl.style.display = "none";
    document.body.appendChild(audioEl);
  }
  const cur = audioEl.srcObject;
  if (cur && cur.getAudioTracks().includes(track)) return;
  audioEl.pause();
  audioEl.srcObject = null;
  const stream = new MediaStream([track]);
  audioEl.srcObject = stream;
  audioEl.play().catch((e) => {
    if (e.name !== "AbortError") console.warn("VoiceNest: autoplay", e);
  });
}

export async function join({ webrtcUrl, apiKey, iceConfig, onStatus }) {
  if (!webrtcUrl) throw new Error("webrtcUrl required");

  let isConnected = false;
  const transport = new SmallWebRTCTransport();
  client = new PipecatClient({
    transport,
    enableCam: false,
    enableMic: true,
    callbacks: {
      onBotReady: () => {
        isConnected = true;
        onStatus?.("connected");
      },
      onTrackStarted: (track) => playRemoteTrack(track),
      onTransportStateChanged: (state) => {
        if (state === "connected" || state === "ready") {
          isConnected = true;
          onStatus?.("connected");
        } else if (state === "connecting" && !isConnected) {
          onStatus?.("connecting");
        } else if (state === "disconnected") {
          isConnected = false;
          onStatus?.("idle");
        }
      },
      onError: (e) => {
        console.error("VoiceNest:", e);
        onStatus?.("error");
      },
    },
  });

  onStatus?.("connecting");

  // Pipecat Cloud offer endpoint requires Authorization
  const connectParams = { iceConfig };
  if (apiKey) {
    connectParams.webrtcRequestParams = {
      endpoint: webrtcUrl,
      headers: new Headers({ Authorization: `Bearer ${apiKey}` }),
    };
  } else {
    connectParams.webrtcUrl = webrtcUrl;
  }

  await client.connect(connectParams);
  return client;
}

export async function leave() {
  if (!client) return;
  const c = client;
  client = null;
  try {
    if (typeof c.disconnectBot === "function") c.disconnectBot();
  } catch (_) {}
  try {
    await Promise.race([
      c.disconnect(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("disconnect timeout")), 5000)),
    ]);
  } catch (e) {
    try {
      await c.disconnect();
    } catch (_) {}
  }
  if (audioEl?.parentNode) {
    audioEl.srcObject = null;
    audioEl.parentNode.removeChild(audioEl);
  }
  audioEl = null;
}

export function setMic(enabled) {
  if (client) client.enableMic(Boolean(enabled));
}
