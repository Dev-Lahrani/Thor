# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.2] - 2026-09-17

### Changed
- **Docs rewritten for Thor** — `docs/` previously described the old weather
  app (Open-Meteo endpoints, `AnimatedWeatherIcon`, `RealWorldMap`, …). Every
  page is now accurate: architecture, feed API reference, components (with
  props), customization, troubleshooting, and getting started.
- **Package metadata** — added `description`, `repository`, `homepage`,
  `bugs`, `keywords`, `author`, and `license` to `package.json` for
  npm/GitHub tooling.
- **License** year range updated to 2024-2026.

## [3.0.1] - 2026-09-17

### Fixed
- **Dependencies** — `npm audit fix`: react-router 7.18.4 (open-redirect/XSS/RCE/DoS
  advisories), postcss, nanoid, picomatch, fflate. 0 known vulnerabilities remain.
- **Search** — clicking an IOC (IP/URL) result now navigates to the Threat Intel
  page with the indicator highlighted, instead of silently doing nothing.
- **Share links** — `?event=<id>` deep links are now honored: the referenced
  signal is selected on load and the parameter is stripped from the URL.
- **Map zoom** — wheel handler moved to a native non-passive listener; zoom no
  longer scrolls the page or logs passive-listener warnings.
- **CSV export** — cells are now formula-injection safe (`= + - @` prefixed)
  via a shared `buildCsv` helper; previously only quotes were escaped.
- **DShield feed** — response shape is validated before use; unexpected payloads
  no longer render as garbage rows.

### Changed
- **Settings persist** across reloads via localStorage (`thor_settings_v1`).
- **Feed status** — per-feed ok/error tracking with a visible degraded-mode
  banner when a feed fails silently (e.g. CORS relay outage).
- **Fake geo is labeled** — KEV/CVE hash-scatter markers render with a dashed
  stroke, an "approx" badge in the detail panel, and a legend note.
- **Header filter toggles and map legend** only show categories present in the
  current data (phishing/breach never produce map events).
- **Unknown routes** redirect to the map (catch-all route added).
- **Geo cache** is capped at 5,000 entries (stale-then-oldest eviction).
- Removed the non-functional Light theme option; fonts now load once (HTML link
  only); cleaned up dead code in helpers/Globe3D and a duplicated notification
  type; package version aligned with the UI (3.0.0).

### Added
- **Vitest** with unit tests for severity/date/number helpers, CSV escaping,
  and CVE/KEV feed normalization (`npm test`).

## [3.0.0] - 2026-09-17

### Changed
- **Full rebrand: GeoAlert → Thor** — the project is now a Cyber Threat Intelligence
  Dashboard. All weather and natural-disaster features are removed.

### Added
- **CVE feed** — recent vulnerabilities from NVD 2.0 with CVSS v3.1/v2 scoring,
  attack vectors, vendor extraction, and NVD reference links.
- **CISA KEV catalog** — Known Exploited Vulnerabilities (180-day window) with
  ransomware-campaign flags, required actions, and federal remediation due dates.
- **Malicious IP intel** — Feodo Tracker botnet C2 servers and DShield top attack
  sources, geolocated via ipwho.is (cached 7 days in localStorage).
- **Phishing URL feed** — OpenPhish community feed.
- **Data breaches** — HaveIBeenPwned catalog with pwn counts, data classes,
  verified/sensitive badges, and HIBP links.
- **ISC threat level strip** — live infocon status on the Threat Intel page.
- **Threat world map** — KEV/CVE hash-scatter ("global threat pressure") plus
  geolocated C2/attacker markers with CVSS-based severity pulses.
- **IP blocklist export** — one-click IOC text export for firewall/blocklist use.

### Removed
- Weather page, air-quality page, watchlist, weather comparison, animated weather
  icons, disaster feeds (USGS/EONET), and disaster-specific map/chart features.

---

## [1.0.0] - 2024-12-17

### Added

#### Core Features
- **Interactive World Map** - SVG-based map with real-time disaster markers
- **Multi-source Disaster Data** - Earthquakes (USGS), Natural Events (NASA EONET)
- **Real-time Updates** - Auto-refresh every 30 seconds
- **Disaster Details** - Comprehensive information popups

#### Weather Monitoring
- **Global Weather Page** - 76+ major cities worldwide
- **Region Filtering** - Filter by continent/region
- **City Search** - Find any monitored city
- **Weather Caching** - 30-minute cache to handle rate limits

#### Air Quality
- **AQI Monitoring Page** - 50+ cities with real-time data
- **Health Levels** - Color-coded AQI levels
- **Pollutant Data** - PM2.5, PM10, Ozone, NO₂
- **Health Recommendations** - Based on AQI

#### Visualization
- **3D Globe** - Interactive Three.js globe with disaster markers
- **Disaster Trends** - Charts showing disaster patterns
- **Animated Icons** - CSS-animated weather condition icons
- **Stats Overlay** - Real-time statistics display

#### User Features
- **Watchlist** - Save favorite cities with localStorage
- **Weather Comparison** - Compare up to 4 cities
- **Data Export** - Export to JSON/CSV
- **Settings** - Customize app behavior
- **Notifications** - Toast alerts for new disasters
- **Timeline View** - Chronological disaster timeline
- **Search** - Find locations and disasters

#### Design
- **Cyberpunk Aesthetic** - Dark theme with neon accents
- **Glassmorphism** - Modern glass panel effects
- **Responsive** - Works on all screen sizes
- **Smooth Animations** - Transitions and hover effects

### Technical

- React 19 with TypeScript
- Vite (Rolldown) build system
- Tailwind CSS v4 styling
- Three.js for 3D visualization
- Recharts for data charts
- React Router for navigation
