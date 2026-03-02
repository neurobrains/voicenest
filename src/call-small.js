/**
 * SmallWebRTC transport - PipecatClient + SmallWebRTCTransport
 * Uses track.enabled for mute/unmute (never recreate stream). Only plays REMOTE track.
 * @see https://docs.pipecat.ai/client/js/transports/small-webrtc
 */
import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { installGetUserMediaPatch } from "./audio-constraints";

let client = null;
let audioEl = null;
let pendingRemoteTrack = null;
let isReady = false;
let userSpeechDetector = null;
let currentOnUserSpeaking = null;
let currentOnUserStoppedSpeaking = null;

function ensureRemoteAudioElement() {
  if (audioEl && audioEl.parentNode) return audioEl;
  const el = document.createElement("audio");
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  el.autoplay = true;
  el.playsInline = true;
  el.volume = 1.0;
  el.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
  if (el.disableRemotePlayback !== undefined) el.disableRemotePlayback = true;
  document.body.appendChild(el);
  audioEl = el;
  return el;
}

function playRemoteTrack(track) {
  if (!track || track.kind !== "audio") return;
  const el = ensureRemoteAudioElement();
  const cur = el.srcObject;
  if (cur && cur.getAudioTracks().length && cur.getAudioTracks()[0] === track) return;
  el.volume = 1.0;
  el.autoplay = true;
  el.playsInline = true;
  el.setAttribute("playsinline", "");
  el.pause();
  el.srcObject = null;
  el.srcObject = new MediaStream([track]);
  el.play().catch(() => {});
}

function startUserSpeechDetection(stream, onUserSpeaking, onUserStoppedSpeaking) {
  if (!stream || userSpeechDetector) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;
    source.connect(analyzer);

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let isSpeaking = false;
    let silenceStart = 0;
    const silenceThreshold = 300; // ms of silence before stopping
    const volumeThreshold = 15; // adjust sensitivity

    function detectSpeech() {
      if (!userSpeechDetector) return;
      
      analyzer.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength;

      const now = Date.now();
      
      if (averageVolume > volumeThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          onUserSpeaking?.();
        }
        silenceStart = now;
      } else {
        if (isSpeaking && (now - silenceStart) > silenceThreshold) {
          isSpeaking = false;
          onUserStoppedSpeaking?.();
        }
      }

      requestAnimationFrame(detectSpeech);
    }

    userSpeechDetector = { audioContext, detectSpeech };
    detectSpeech();
    
    currentOnUserSpeaking = onUserSpeaking;
    currentOnUserStoppedSpeaking = onUserStoppedSpeaking;
  } catch (e) {
    console.warn("User speech detection failed:", e);
  }
}

function stopUserSpeechDetection() {
  if (userSpeechDetector) {
    try {
      userSpeechDetector.audioContext.close();
    } catch (e) {}
    userSpeechDetector = null;
  }
  currentOnUserSpeaking = null;
  currentOnUserStoppedSpeaking = null;
}

export async function join({ webrtcUrl, apiKey, iceConfig, onStatus, onBotSpeaking, onBotStoppedSpeaking, onUserSpeaking, onUserStoppedSpeaking }) {
  if (!webrtcUrl) throw new Error("webrtcUrl required");

  installGetUserMediaPatch();

  let isConnected = false;
  const transport = new SmallWebRTCTransport();
  client = new PipecatClient({
    transport,
    enableCam: false,
    enableMic: true,
    callbacks: {
      onTrackStarted: (track, participant) => {
        console.log("onTrackStarted:", track.kind, "readyState:", track.readyState, "participant:", participant?.local);
        if (track.kind !== "audio") return;
        
        if (participant?.local === true) {
          // Start user speech detection for local track
          const stream = new MediaStream([track]);
          startUserSpeechDetection(stream, onUserSpeaking, onUserStoppedSpeaking);
          return;
        }
        
        if (isReady) {
          console.log("playing track immediately, already ready");
          playRemoteTrack(track);
        } else {
          pendingRemoteTrack = track;
          console.log("pendingRemoteTrack saved, waiting for ready");
        }
      },
      onBotReady: () => {
        console.log("onBotReady fired");
        isReady = true;
        isConnected = true;
        onStatus?.("connected");
        if (pendingRemoteTrack) {
          playRemoteTrack(pendingRemoteTrack);
          pendingRemoteTrack = null;
        }
      },
      onBotStartedSpeaking: () => {
        console.log("bot started speaking");
        onBotSpeaking?.();
      },
      onBotStoppedSpeaking: () => {
        console.log("bot stopped speaking");
        onBotStoppedSpeaking?.();
      },
      onTransportStateChanged: (state) => {
        console.log("transport state:", state);
        if (state === "ready") {
          isReady = true;
          isConnected = true;
          onStatus?.("connected");
          if (pendingRemoteTrack) {
            console.log("playing pendingRemoteTrack on ready state");
            playRemoteTrack(pendingRemoteTrack);
            pendingRemoteTrack = null;
          }
        } else if (state === "connecting" && !isConnected) {
          onStatus?.("connecting");
        } else if (state === "disconnected") {
          doMuteRemoteAudio();
          isReady = false;
          isConnected = false;
          pendingRemoteTrack = null;
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

function doMuteRemoteAudio() {
  if (audioEl) {
    audioEl.muted = true;
    audioEl.volume = 0;
    audioEl.pause();
    audioEl.srcObject = null;
    if (audioEl.parentNode) audioEl.parentNode.removeChild(audioEl);
    audioEl = null;
  }
}

export function muteRemoteAudio() {
  doMuteRemoteAudio();
}

export async function leave() {
  doMuteRemoteAudio();
  stopUserSpeechDetection();
  if (typeof window !== "undefined" && window.__voicenest_mic_stream) {
    window.__voicenest_mic_stream.getTracks().forEach((t) => t.stop());
    window.__voicenest_mic_stream = null;
  }
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
}

export function setMic(enabled) {
  if (!client) return;

  // Prefer direct track manipulation to avoid transport recreating stream
  const stream = typeof window !== "undefined" ? window.__voicenest_mic_stream : null;
  if (stream) {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = Boolean(enabled);
    });
    return;
  }

  client.enableMic(Boolean(enabled));
}
