# VoiceNest

**Turn Every Visitor Into a Conversation.**

Embeddable voice widget for Pipecat. Supports **Daily** and **SmallWebRTC** transports.

## Transport modes

| Transport | Use when |
|-----------|----------|
| `daily` | Pipecat Cloud with Daily (default). Most Pipecat Cloud agents use this. |
| `small-webrtc` | Pipecat SmallWebRTC (built-in). Agent must be deployed with SmallWebRTC transport. |

When using `startEndpoint`, call `stopSession` when the user ends the call. **Stop requires `privateApiKey`** (Settings → API Keys → Private). The public key returns 401.

## Usage

### Daily (default)

```html
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>
<script>
  VoiceNest.init({
    startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
    apiKey: "pk_...",
    privateApiKey: "sk_...",  // required for stop
    transport: "daily",
    position: "bottom-right",
    offset: { x: 24, y: 24 },
    color: "#2563eb",
    onStatusChange: (s) => console.log(s),
    onError: (e) => console.error(e),
  });
</script>
```

### SmallWebRTC (Pipecat Cloud)

For Pipecat Cloud agents deployed with SmallWebRTCTransport: one POST `/start` → sessionId + offer URL → PipecatClient (RTVI protocol) for agent communication.

```html
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>
<script>
  VoiceNest.init({
    startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
    apiKey: "pk_...",
    privateApiKey: "sk_...",  // required for stop
    transport: "small-webrtc",
    position: "bottom-right",
    offset: { x: 24, y: 24 },
    color: "#2563eb",
    onStatusChange: (s) => console.log(s),
    onError: (e) => console.error(e),
  });
</script>
```

### Direct URLs (no /start)

```javascript
// Daily room
VoiceNest.init({
  roomUrl: "https://your.daily.co/room",
  token: "optional-token",
});

// SmallWebRTC webrtcUrl
VoiceNest.init({
  webrtcUrl: "https://your-server.com/api/offer",
  transport: "small-webrtc",
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `startEndpoint` \| `startUrl` | string | — | Pipecat /start URL |
| `transport` | `"daily"` \| `"small-webrtc"` | `"daily"` | Transport type |
| `apiKey` | string | null | Pipecat Cloud public API key (for start, Daily, offer) |
| `privateApiKey` | string | null | Pipecat Cloud **private** API key (required for stop; public key returns 401) |
| `roomUrl` | string | — | Direct Daily room URL |
| `webrtcUrl` | string | — | Direct SmallWebRTC signaling URL |
| `token` | string | null | Daily token (with roomUrl) |
| `position` | string | `"bottom-right"` | Widget position |
| `offset` | object | `{x:20,y:20}` | Pixel offset |
| `color` | string | `"#2563eb"` | Call button color |

## CDN

```html
<!-- unpkg -->
<script src="https://unpkg.com/voicenest@0.1.0/dist/voicenest.min.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>
```

## Build

```bash
npm install
npm run build
```

Output: `dist/voicenest.min.js` + `dist/voicenest.min.js.LICENSE.txt`

## Publish to npm

```bash
npm run build
npm publish
```

## License

MIT
