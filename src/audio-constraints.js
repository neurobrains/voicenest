/**
 * Default audio constraints for mic capture to reduce echo, noise, and feedback.
 * Use for getUserMedia / inputSettings so the same device can play and capture without echo.
 */

const AEC_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

function isMobile() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

/**
 * MediaTrackConstraints for microphone that enable echo cancellation, noise suppression, and auto gain.
 * Critical when the same device plays remote audio (speaker) and captures (mic) to avoid echo/feedback.
 * @returns {MediaTrackConstraints}
 */
export function getDefaultAudioConstraints() {
  const mobile = isMobile();
  const base = { ...AEC_CONSTRAINTS };
  if (mobile) {
    return { ...base, sampleRate: 16000 };
  }
  return base;
}

/**
 * Request microphone permission before connecting. Best practice: call in same user gesture as connect.
 * Stops all tracks immediately after permission is granted (transport will request its own stream).
 * @returns {Promise<void>} Resolves when granted, rejects with Error when denied.
 */
export async function requestMicPermission() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error("Microphone not supported. Use HTTPS or localhost.");
  }
  const constraints = getDefaultAudioConstraints();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
  stream.getTracks().forEach((t) => t.stop());
}

export { isMobile };

/**
 * Monkey-patch getUserMedia to force AEC constraints and save mic stream for SmallWebRTC.
 * Intercepts audio-only requests (from transport), applies full AEC/NS/AGC, saves stream ref for mute/unmute.
 */
export function installGetUserMediaPatch() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
  if (navigator.mediaDevices.__voicenestPatch) return;
  const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  const audioConstraints = {
    ...AEC_CONSTRAINTS,
    ...getDefaultAudioConstraints(),
  };

  navigator.mediaDevices.getUserMedia = async (constraints) => {
    // Only intercept audio-only requests from the transport
    if (constraints?.audio && !constraints.video) {
      const stream = await original({
        audio: audioConstraints,
        video: false,
      });
      if (typeof window !== "undefined") {
        if (window.__voicenest_mic_stream) {
          window.__voicenest_mic_stream.getTracks().forEach((t) => t.stop());
        }
        window.__voicenest_mic_stream = stream;
      }
      return stream;
    }
    if (constraints?.audio) {
      const audio = constraints.audio === true ? {} : { ...constraints.audio };
      constraints = { ...constraints, audio: { ...AEC_CONSTRAINTS, ...audio } };
    }
    return original(constraints);
  };
  navigator.mediaDevices.__voicenestPatch = true;
}
