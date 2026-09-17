# 🎨 Customization

Thor is designed to be easy to restyle and re-point. Most customizations are
one-file changes.

## Theme colors

All colors are Tailwind CSS v4 `@theme` tokens in `src/index.css`:

```css
@theme {
  --color-cyber-dark: #080810;        /* page background */
  --color-cyber-darker: #040408;      /* deeper panels */
  --color-cyber-card: rgba(12, 12, 20, 0.85);
  --color-cyber-border: rgba(120, 120, 180, 0.15);
  --color-cyber-surface: rgba(18, 18, 30, 0.9);

  --color-neon-cyan: #00d4ff;         /* primary accent */
  --color-neon-purple: #a855f7;       /* secondary accent */
  --color-neon-red: #ef4444;
  --color-neon-orange: #f97316;
  --color-neon-yellow: #eab308;
  --color-neon-green: #22c55e;
  --color-neon-blue: #3b82f6;
  --color-neon-pink: #ec4899;
}
```

Change a token and every `bg-neon-cyan`, `text-neon-red`, `border-*` utility
updates automatically.

**Typography** — font stacks are tokens too:

```css
--font-family-sans: 'Space Grotesk', 'Inter', system-ui, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
```

## Threat category colors

Map markers, badges, and filter chips share one source of truth:
`CATEGORY_INFO` in `src/utils/helpers.ts`.

```ts
export const CATEGORY_INFO: Record<ThreatCategory, CategoryInfo> = {
  kev:         { id: 'kev',         label: 'KEV Exploits', color: '#ef4444', ... },
  maliciousIp: { id: 'maliciousIp', label: 'Malicious IPs', color: '#f97316', ... },
  phishing:    { id: 'phishing',    label: 'Phishing',    color: '#ec4899', ... },
  breach:      { id: 'breach',      label: 'Breaches',    color: '#a855f7', ... },
};
```

The same module holds severity colors (`SEVERITY_COLORS`), map marker styles
(`SEVERITY_MAP_COLORS`, pulse speeds in `ALERT_PULSE_SPEEDS`), and toast colors
(`ALERT_COLORS`).

> Note: category colors are also mirrored as CSS variables in `@theme`
> (`--color-kev`, `--color-malicious-ip`, …) for utility-class use — keep the
> two in sync if you change one.

## Data feeds

Every feed URL lives at the top of `src/services/api.ts`:

```ts
const NVD_API      = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const KEV_FEED     = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const FEODO_FEED   = 'https://feodotracker.abuse.ch/downloads/ipblocklist.json';
const OPENPHISH_FEED = 'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt';
const HIBP_API     = 'https://haveibeenpwned.com/api/v3/breaches';
const DSHIELD_SOURCES = 'https://isc.sans.edu/api/topips/records/200?json';
const GEO_API      = 'https://ipwho.is';
const CORS_RELAY   = 'https://r.jina.ai/';
```

Adjust the knobs in the same file:

| What | Where |
|------|-------|
| NVD window / result cap | `fetchRecentCves(days, maxResults)` — default `3` days, `150` results |
| KEV recency window | `KEV_MAX_AGE_DAYS` — default `180` |
| Phishing URL cap | `fetchPhishingUrls(limit)` — default `40` |
| Feed cache TTLs | each fetch's `cached(key, ttlMs, ...)` call |
| Geo cache TTL / size | `GEO_CACHE_TTL`, `GEO_CACHE_MAX_ENTRIES` |
| KEV/CVE marker caps | `kev.slice(0, 120)` and the CVE `slice(0, 60)` in `fetchThreatFeeds` |

## Settings defaults

Defaults (and the persistence key) live at the top of
`src/context/ThreatContext.tsx`:

```ts
export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: false,
  autoRefresh: true,
  refreshInterval: 300,            // seconds
  minSeverityNotification: 'high',
};
```

Stored settings are merged over defaults on load, so adding a new setting
field later won't break existing users' saved state.

## Layout & structure

- **Pages** — add a new route in `src/main.tsx` and a nav item in
  `Header.tsx` (`NAV_ITEMS`).
- **Sidebar toggle** — the list/timeline view switcher is `sidebarView` in
  context (`'list' | 'timeline'`).
- **Toolbar** — buttons live in `pages/MapView.tsx` (globe, trends, stats,
  export, settings toggles), all driven by context state.

## Notification chime

The alert sound is an embedded base64 WAV in `src/utils/audio.ts`
(`NOTIFICATION_SOUND`). Replace the data-URL with any small audio asset; the
provider preloads it once at mount.

## App identity

- **HTML shell** — title/meta/favicon in `index.html`.
- **App name** — `package.json` + the `Header` brand.
- **Docs** — this folder; keep it in sync with code when you customize.
