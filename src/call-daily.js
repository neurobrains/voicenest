/**
 * Daily.co transport - join, leave, mic
 */
import Daily from "@daily-co/daily-js";

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

  onStatus?.("connecting");
  await call.join({ url, ...(token && { token }) });
  await call.setLocalAudio(true);

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
