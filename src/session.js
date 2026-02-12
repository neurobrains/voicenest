/**
 * Pipecat REST /start - fetch session
 * Supports Daily (dailyRoom, dailyToken) and SmallWebRTC (webrtcUrl)
 * @see https://docs.pipecat.ai/deployment/pipecat-cloud/rest-reference/endpoint/start
 */
export async function startSession({ endpoint, apiKey, transport }) {
  const body =
    transport === "small-webrtc"
      ? { transport: "webrtc", enableDefaultIceServers: true }
      : { createDailyRoom: true };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Start failed: ${res.status}`);
  }

  const data = await res.json();

  const sessionId = data.sessionId;
  const base = endpoint.replace(/\/start\/?$/, "");

  // Stop: DELETE /v1/agents/{agentName}/sessions/{sessionId} (not /public/)
  const stopMatch = endpoint.match(/^(https?:\/\/[^/]+\/v1)\/public\/([^/]+)/);
  const stopUrl =
    sessionId && stopMatch
      ? `${stopMatch[1]}/agents/${stopMatch[2]}/sessions/${sessionId}`
      : null;

  // Daily: dailyRoom, dailyToken
  if (data.dailyRoom || data.room_url) {
    return {
      transport: "daily",
      roomUrl: data.dailyRoom || data.room_url,
      token: data.dailyToken ?? data.token ?? null,
      sessionId,
      stopUrl,
    };
  }

  // SmallWebRTC: webrtcUrl, connection_url, or connectionUrl (Pipecat variants)
  let webrtcUrl = data.webrtcUrl || data.connection_url || data.connectionUrl;

  // Pipecat Cloud: when transport=webrtc, response may only have sessionId
  // Session API: /v1/public/{agentName}/sessions/{sessionId}/api/offer
  if (!webrtcUrl && data.sessionId && transport === "small-webrtc") {
    webrtcUrl = `${base}/sessions/${data.sessionId}/api/offer`;
  }

  if (webrtcUrl) {
    return {
      transport: "small-webrtc",
      webrtcUrl,
      iceConfig: data.iceConfig || undefined,
      sessionId,
      stopUrl,
    };
  }

  throw new Error("Response missing dailyRoom or webrtcUrl");
}

/**
 * Stop Pipecat Cloud session via REST DELETE
 * @see https://docs.pipecat.ai/deployment/pipecat-cloud/rest-reference/endpoint/stop
 */
export async function stopSession({ stopUrl, apiKey }) {
  if (!stopUrl || !apiKey) return;
  try {
    await fetch(stopUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (e) {
    console.warn("VoiceNest: stopSession failed", e);
  }
}
