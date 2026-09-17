# 🏗️ Architecture

Thor is a **fully client-side** cyber threat intelligence dashboard. There is
no backend, no build-time API keys, and no telemetry — the browser fetches a
handful of free public feeds, normalizes them into shared types, and renders
them as a live map, tables, and charts.

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                        │
│                                                                   │
│  ┌──────────┐   routes   ┌────────────────────────────────────┐  │
│  │ Router   │───────────▶│ Pages (Map, Vulns, Intel, Breaches) │  │
│  └──────────┘            └────────────────┬───────────────────┘  │
│                                           │ useThreat()          │
│                                ┌──────────▼───────────┐          │
│                                │  ThreatProvider      │          │
│                                │  (Context + state)   │          │
│                                └──────────┬───────────┘          │
│                                           │                      │
│                                ┌──────────▼───────────┐          │
│                                │  services/api.ts     │          │
│                                │  (fetch + normalize) │          │
│                                └──────────┬───────────┘          │
│                                           │ fetch()              │
│                              ┌────────────▼────────────┐         │
│                              │  Public threat feeds     │         │
│                              │  NVD · KEV · Feodo ·     │         │
│                              │  DShield · OpenPhish ·   │         │
│                              │  HIBP · ipwho.is         │         │
│                              └─────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Core ideas

1. **One source of truth.** `ThreatProvider` (in `src/context/ThreatContext.tsx`)
   owns all feed data, filters, selection, notifications, and settings. Pages
   and components consume it via the `useThreat()` hook and never fetch
   anything themselves.

2. **Normalize at the edge.** Every feed has its own raw shape. `services/api.ts`
   converts each one into shared types (`ThreatEvent`, `CveRecord`, `KevEntry`,
   `IocIndicator`, `BreachRecord`) defined in `src/types/index.ts`, so the UI
   layer only ever sees one vocabulary.

3. **Everything becomes a `ThreatEvent`.** The map doesn't care where data came
   from. KEV entries, C2 IPs, attack sources, and critical CVEs are all folded
   into a single `ThreatEvent[]` list with coordinates, severity, and category —
   then filtered and rendered uniformly.

4. **Client-side caching.** In-memory TTL caches smooth out feed refreshes, and
   IOC geolocation results are persisted in `localStorage` for a week so IPs
   aren't re-geolocated on every load (rate-limit friendly).

5. **Degradation is visible.** Every feed reports `ok` / `error` status into
   `feedStatus`, and the UI shows a degraded-mode banner when something fails —
   a missing feed never crashes the app.

## Data flow on load

1. `ThreatProvider` mounts and calls `fetchThreatFeeds()` once.
2. All six feeds are fetched **in parallel** (`Promise.all`), each wrapped in
   status tracking.
3. IP-based IOCs (Feodo C2 + DShield attackers) are geolocated through
   `geolocateIps()` — cache-first, then batched `ipwho.is` calls (10 per batch).
4. Feeds are assembled into the unified `ThreatEvent[]` list:
   - **KEV entries** → severity derived from age, coordinates from a
     deterministic per-CVE hash scatter (`approxLocation: true`).
   - **C2 / attacker IPs** → real coordinates from geolocation.
   - **Critical/high CVEs** → hash-scattered "global pressure" markers.
5. State updates; `filteredEvents` recomputes from active category filters.
6. A diff against the previous event set detects *new* signals and raises
   notifications (subject to `settings.minSeverityNotification`).

## Directory layout

```
src/
├── components/            # Presentational + interactive UI pieces
│   ├── ThreatMap.tsx      # SVG world map with markers, zoom, detail panel
│   ├── Globe3D.tsx        # Three.js globe (same signals, 3D)
│   ├── Sidebar.tsx        # Event list / detail pane
│   ├── TimelineView.tsx   # Time-filtered event timeline
│   ├── ThreatTrends.tsx   # Recharts analytics dashboard
│   ├── StatsOverlay.tsx   # Floating summary stats
│   ├── Header.tsx         # Nav + category filter toggles + refresh
│   ├── SearchBar.tsx      # CVE / vendor / IP / domain / breach search
│   ├── ExportModal.tsx    # JSON / CSV / IOC / blocklist export
│   ├── SettingsModal.tsx  # Notifications, sound, refresh interval
│   ├── NotificationToast.tsx
│   ├── LoadingScreen.tsx
│   ├── Footer.tsx         # Data-source links + credits
│   └── index.ts           # Barrel export
├── context/
│   └── ThreatContext.tsx  # ThreatProvider + useThreat() + settings persistence
├── pages/
│   ├── Layout.tsx         # Shell: header, sidebar, footer, modals
│   ├── MapView.tsx        # Route "/"
│   ├── VulnerabilitiesPage.tsx   # Route "/vulnerabilities"
│   ├── ThreatIntelPage.tsx       # Route "/threat-intel"
│   ├── DataBreachPage.tsx        # Route "/breaches"
│   └── index.ts
├── services/
│   ├── api.ts             # Feed layer: fetch, normalize, cache, geolocate
│   ├── api.test.ts        # Normalization + severity unit tests
│   └── api.test-helpers.ts
├── types/
│   └── index.ts           # Shared TypeScript types
├── utils/
│   ├── helpers.ts         # Category/severity styling, date + number formatting
│   ├── csv.ts             # Formula-injection-safe CSV building
│   ├── audio.ts           # Notification chime (embedded WAV)
│   └── *.test.ts
└── main.tsx               # Routes + provider wiring
```

## State management

Plain React state inside `ThreatContext` — no external state library. This is
deliberate: the state surface is small, and everything that touches it lives in
one file. The provider exposes:

- **Feed data** — `events`, `cves`, `kev`, `iocs`, `breaches`, `feedStatus`,
  `loading`, `error`, `lastUpdated`
- **Selection & filtering** — `selectedEvent`, `filters`, `filteredEvents`
- **Notifications & settings** — `notifications`, `settings` (persisted to
  `localStorage` under `thor_settings_v1`)
- **UI state** — modal open flags, sidebar view, trends/globe visibility,
  `mapFocusCoords`
- **Actions** — `selectEvent`, `toggleFilter`, `refresh`, notification
  dismissal, `updateSettings`, modal toggles, `focusMapLocation`

## Persistence

Two things survive a reload, both in `localStorage`:

| Key | Contents | Notes |
|-----|----------|-------|
| `thor_settings_v1` | User settings | Merged over defaults on load so new fields stay valid |
| `thor_geo_cache_v1` | IP → geolocation | 7-day TTL, capped at 5,000 entries |

## Key design decisions

- **No state library.** React context + hooks cover the whole surface.
- **No API keys anywhere.** Feeds were chosen for that property; see the
  [API reference](./api-reference.md) for the CORS relay used by the two feeds
  that don't send CORS headers.
- **Hash-scatter over fake geolocation.** KEV/CVE entries have no physical
  location, so they get *stable, deterministic* pseudo-coordinates (same CVE
  always lands in the same place) and are rendered with dashed strokes + an
  "approx" badge instead of pretending to be real geography.
- **Fail soft.** Every fetch has a fallback path or an empty-result contract;
  the worst outcome is an empty section plus a status badge, never a crash.
