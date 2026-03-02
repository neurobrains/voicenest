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
- **🎉 NEW: Real-time voice animations**
  - Wave animations when user speaks
  - OpenAI-style circular animations when bot speaks
  - Listening state with gentle wave pulse
  - Connected state with glow effects
  - Theme-aware animation colors
  - Mobile responsive design

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
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.2.0/dist/voicenest.min.js"></script>
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
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.2.0/dist/voicenest.min.js"></script>
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
| `style` | `"card"` \| `"circle-round"` \| `"minimal"` \| `"wave"` \| `"circle-mode"` | `"card"` | Widget style. `card` = card with status; `circle-round` = circular buttons, no card; `minimal` = buttons only, no card; `wave` = card with wave animations; `circle-mode` = OpenAI-style circular interface |
| `shadow` | `false` \| `true` \| string | — | Card shadow. `false` = none; `true` = theme default; string = custom CSS box-shadow |
| `glow` | `false` \| `true` \| string | — | Call button glow. `true` = glow using `color`; string = glow color (e.g. `"#2563eb"`) |
| `glowIntensity` | 0–100 (or 0–1) | 45 | Glow opacity. 0 = invisible, 100 = full |
| `glowSpread` | number (px) | 8 | How far the glow extends from the button |
| `glowBlur` | number (px) | 28 | Glow softness. Higher = softer, larger halo |

## Voice Animations

VoiceNest now includes stunning real-time voice animations that provide visual feedback during conversations:

### Animation Types

- **Wave Style**: Animated wave bars integrated into the card where status text normally appears
- **Circle Mode**: OpenAI-inspired interface with large circular button and gradient ring animations
- **Listening State**: Gentle animations when waiting for user input
- **Speaking States**: Dynamic animations that respond to both user and bot voice activity

### Animation Features

- Automatic voice activity detection for both user and bot
- Smooth transitions between different speaking states
- Theme-aware colors that match your chosen theme
- Mobile responsive with optimized sizes for smaller screens
- Professional, modern design inspired by leading voice AI interfaces

The animations work automatically once you initialize VoiceNest - no additional configuration required!

### New Animation Styles

#### Wave Style
Card layout with animated wave bars next to status text. Waves only animate when someone is speaking:

```javascript
VoiceNest.init({
  startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
  apiKey: "pk_...",
  privateApiKey: "sk_...",
  style: "wave",
  theme: "dark"
});
```

**Wave Features:**
- Waves animate only during speech (user = blue, bot = green)
- Status text appears next to the wave display
- Smooth, responsive animations that react to voice activity

#### Circle Mode (OpenAI Style)
Compact interface that expands to show an animated orb when active, just like OpenAI's Advanced Voice Mode:

```javascript
VoiceNest.init({
  startEndpoint: "https://api.pipecat.daily.co/v1/public/YOUR-AGENT/start",
  apiKey: "pk_...",
  privateApiKey: "sk_...",
  style: "circle-mode",
  theme: "white"
});
```

**Circle Mode Features:**
- **Initially compact**: Black rounded widget with buttons at bottom, no circle visible
- **Empty space above**: Reserved space for orb that appears when active
- **Expands on call**: When call button clicked, widget expands upward and orb appears
- **Fluid orb animation**: Professional gradient sphere with glow, ripples, and specular highlights
- **Voice-reactive**: Orb changes color and scale (blue for user, green for bot speaking)
- **OpenAI-inspired design**: Matches Advanced Voice Mode's exact behavior and visual language

## CDN Installation

You can load VoiceNest using either CDN provider.

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.2.0/dist/voicenest.min.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/voicenest@0.2.0/dist/voicenest.min.js"></script>
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
