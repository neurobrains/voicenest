# VoiceNest

**Turn Every Visitor Into a Conversation.**

VoiceNest is a lightweight, embeddable voice widget delivered via CDN that enables websites and web applications to instantly connect users with Pipecat-powered voice agents. It eliminates complex frontend work and allows developers to add real-time voice interaction with just a few lines of code.

The widget is customizable, easy to deploy, and supports multiple transport modes used by Pipecat Cloud. Developers can quickly configure endpoints, style the widget, and enable live conversations through a simple call interface.

VoiceNest is ideal for customer support, AI assistants, onboarding flows, lead qualification, and interactive web experiences.

---

## Features

- Easy CDN integration (no build step required)
- Supports Pipecat Cloud voice agents
- Multiple transport modes
- Simple configuration
- Customizable position and styling
- Built-in start and stop session handling
- Production-ready voice interaction

---

## Supported Transport Modes

| Transport | Recommended Use |
|-----------|-----------------|
| `daily` | Default option for Pipecat Cloud agents using Daily transport. |
| `small-webrtc` | For agents deployed with Pipecat SmallWebRTC transport. |

When using a `startEndpoint`, you **must call `stopSession`** when the call ends.  
Stopping a session requires a **private API key**. Public keys will return `401 Unauthorized`.

---

## Quick Start

Add VoiceNest to your page via CDN and initialize it with your agent configuration.

---

## Usage

### 1. Daily Transport (Default)

Most Pipecat Cloud agents use Daily transport.

```html
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>
<script>
  VoiceNest.init({
    startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
    apiKey: "pk_...",
    privateApiKey: "sk_...", // Required for stopping sessions
    transport: "daily",

    position: "bottom-right",
    offset: { x: 24, y: 24 },
    color: "#2563eb",

    onStatusChange: (status) => console.log(status),
    onError: (error) => console.error(error),
  });
</script>
```

### SmallWebRTC

Use this when your Pipecat agent is deployed with SmallWebRTC transport.

```html
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>
<script>
  VoiceNest.init({
    startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
    apiKey: "pk_...",
    privateApiKey: "sk_...",
    transport: "small-webrtc",

    position: "bottom-right",
    offset: { x: 24, y: 24 },
    color: "#2563eb",

    onStatusChange: (status) => console.log(status),
    onError: (error) => console.error(error),
  });
</script>
```

VoiceNest automatically handles session setup, offer exchange, and communication via RTVI protocol.

### Direct Connection (Without /start Endpoint)

You can also connect directly to existing Daily or WebRTC URLs.

## Daily Room

```javascript
VoiceNest.init({
  roomUrl: "https://your.daily.co/room",
  token: "optional-room-token",
});
```


## SmallWebRTC Signaling

```javascript
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
| `theme` | `"dark"` \| `"white"` \| `"device"` | `"dark"` | Widget theme. `device` follows system preference |
| `style` | `"card"` \| `"circle-round"` \| `"minimal"` | `"card"` | Widget style. `card` = card with status; `circle-round` = circular buttons, no card; `minimal` = buttons only, no card |
| `shadow` | `false` \| `true` \| string | — | Card shadow. `false` = none; `true` = theme default; string = custom CSS box-shadow |
| `glow` | `false` \| `true` \| string | — | Call button glow. `true` = glow using `color`; string = glow color (e.g. `"#2563eb"`) |
| `glowIntensity` | 0–100 (or 0–1) | 45 | Glow opacity. 0 = invisible, 100 = full |
| `glowSpread` | number (px) | 8 | How far the glow extends from the button |
| `glowBlur` | number (px) | 28 | Glow softness. Higher = softer, larger halo |

## CDN Installation

You can load VoiceNest using either CDN provider.

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.1.0/dist/voicenest.min.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/voicenest@0.1.0/dist/voicenest.min.js"></script>
```

## Typical Use Cases

VoiceNest can power:

- Customer support agents  
- AI assistants  
- Lead qualification bots  
- Booking and onboarding assistants  
- Product support voice agents  
- Interactive website experiences  

---

## Summary

VoiceNest makes adding voice AI to your website fast and effortless. With minimal configuration, developers can deploy production-ready voice interactions powered by Pipecat Cloud.

**Just embed, configure, and start talking.**
