/**
 * Daily.co transport - join, leave, mic
 * Uses inputSettings for echo cancellation and noise suppression to avoid echo/feedback.
 */
import Daily from "@daily-co/daily-js";
import { getDefaultAudioConstraints } from "./audio-constraints";

let call = null;
let userSpeechDetector = null;

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
    const silenceThreshold = 300;
    const volumeThreshold = 15;

    function detectSpeech() {
      if (!userSpeechDetector) return;
      
      analyzer.getByteFrequencyData(dataArray);
      
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
}

export async function join({ url, token, onStatus, onBotSpeaking, onBotStoppedSpeaking, onUserSpeaking, onUserStoppedSpeaking }) {
  if (!url) throw new Error("roomUrl required");

  call = Daily.createCallObject({
    videoSource: false,
    subscribeToTracksAutomatically: true,
  });

  call.on("joined-meeting", () => onStatus?.("connected"));
  call.on("left-meeting", () => onStatus?.("idle"));
  call.on("error", (e) => {
    console.error("VoiceNest:", e);
    onStatus?.("error");
  });

  // Bot speaking events
  call.on("active-speaker-change", (event) => {
    const { activeSpeaker } = event;
    if (activeSpeaker && activeSpeaker.local === false) {
      onBotSpeaking?.();
    } else if (!activeSpeaker) {
      onBotStoppedSpeaking?.();
    }
  });

  // Track events for user speech detection
  call.on("track-started", (event) => {
    const { track, participant } = event;
    if (track.kind === "audio" && participant?.local === true) {
      const stream = new MediaStream([track]);
      startUserSpeechDetection(stream, onUserSpeaking, onUserStoppedSpeaking);
    }
  });

  const audioConstraints = {
    ...getDefaultAudioConstraints(),
    channelCount: 1,
  };
  const joinOpts = {
    url,
    ...(token && { token }),
    startAudioOff: false,
    startVideoOff: true,
    inputSettings: {
      audio: {
        processor: { type: "noise-cancellation" },
        settings: audioConstraints,
      },
    },
  };

  onStatus?.("connecting");
  await call.join(joinOpts);
  await call.setLocalAudio(true);
  try {
    await call.updateInputSettings({
      audio: {
        processor: { type: "noise-cancellation" },
        settings: audioConstraints,
      },
    });
  } catch (_) {}

  return call;
}

export async function leave() {
  stopUserSpeechDetection();
  if (!call) return;
  const c = call;
  call = null;
  try {
    await Promise.race([
      c.leave(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("leave timeout")), 5000)),
    ]);
  } catch (e) {
    try {
      await c.leave();
    } catch (_) {}
  }
  try {
    c.destroy();
  } catch (_) {}
}

export function setMic(enabled) {
  if (call) call.setLocalAudio(Boolean(enabled));
}

export function muteRemoteAudio() {
  /* Daily manages its own audio */
}
