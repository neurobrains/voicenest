/**
 * Daily.co transport - join, leave, mic
 * Uses inputSettings for echo cancellation and noise suppression to avoid echo/feedback.
 */
import Daily from "@daily-co/daily-js";
import { getDefaultAudioConstraints } from "./audio-constraints";

let call = null;

export async function join({ url, token, onStatus }) {
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
