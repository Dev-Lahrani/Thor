# 🔧 Troubleshooting

Common issues with Thor and how to fix them.

## Feeds

### A section is empty / the status banner says a feed failed

The status banner (top of the page, "degraded mode") reports per-feed health.
Empty data with an `error` status almost always means one of:

- **The CORS relay (`r.jina.ai`) is down or rate-limited.** KEV and Feodo go
  through it. The fetch layer automatically falls back to a direct request —
  if both fail, the feed reports `error`. Wait a few minutes and refresh.
- **NVD rate limits.** NVD allows a handful of unauthenticated requests per
  rolling window. Thor fetches once per 15 minutes per session, but multiple
  tabs or frequent manual refreshes can trip it. Close extra tabs, wait, retry.
- **An ad blocker or privacy extension blocked the request.** The feeds are
  benign security data, but some blocklists flag tracker/feodo domains.
  Temporarily disable the extension to confirm.
- **Offline / corporate proxy.** Everything is a browser `fetch` — if the
  network blocks the feed domains, nothing will load.

### Geo markers are missing while the Intel page has IPs

Geolocation failures are silent and partial:

- `ipwho.is` free tier rate-limits (Thor batches 10 at a time).
- IPs already cached (7-day `thor_geo_cache_v1`) need no network at all.

Fix: clear the cache in DevTools → Application → Local Storage (key
`thor_geo_cache_v1`) and refresh — or just wait; only *new* IPs need lookups.

### Cached data looks stale

Feed TTLs are per-feed (15 min–6 h). Use the manual refresh button in the
header, or `localStorage.removeItem('thor_geo_cache_v1')` for geo data.

## Build & tooling

### `npm install` fails on the `vite` override

Thor pins Vite to the rolldown build (`"vite": "npm:rolldown-vite@7.2.5"`).
This requires npm ≥ 9 or a resolver that understands npm alias overrides.

```bash
npm install -g npm@latest
rm -rf node_modules package-lock.json
npm install
```

### `npm run build` fails with a TypeScript error

The build runs `tsc -b` first. Fix errors in order — they're almost always
real type bugs, not toolchain noise. CI runs the same command, so a local
green build is what matters.

### Node version errors

Thor requires **Node.js 18+** (CI runs Node 20). Check with `node -v`; use
[nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm)
to switch versions if needed.

## Browser quirks

### The map zooms the page instead of the map

Fixed in 3.0.1 via a native non-passive wheel listener. If you still see it,
you're on an old build — `npm run build` and redeploy.

### 3D globe is slow on old GPUs

The globe is Three.js WebGL. On weak hardware, stick to the SVG map (default
view) — the globe is optional and lazy-loaded only when you click 🌍.

### No sound on notifications

Sound is **off by default** (autoplay policies). Enable it in ⚙️ Settings;
the chime only plays after you've interacted with the page at least once.

## Where things live

| Symptom | File |
|---------|------|
| Feed URLs, TTLs, relay logic | `src/services/api.ts` |
| Settings defaults + persistence | `src/context/ThreatContext.tsx` |
| Colors / fonts | `src/index.css` + `src/utils/helpers.ts` |
| Routes | `src/main.tsx` |
| Export / CSV | `src/components/ExportModal.tsx` + `src/utils/csv.ts` |

Still stuck? Open an issue with the browser + console output
(DevTools → Console, filter for `[Thor]`).
