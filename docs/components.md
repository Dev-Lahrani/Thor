# 🧩 Components

Every React component in Thor, what it does, and its props. All components
live in `src/components/` and are re-exported from `index.ts`.

## Pages & shell

| Component | Purpose | Location |
|-----------|---------|----------|
| `Layout` | App shell: header, sidebar, footer, global modals, loading screen | `pages/Layout.tsx` |
| `MapView` | Route `/` — threat map + toolbar wiring | `pages/MapView.tsx` |
| `VulnerabilitiesPage` | Route `/vulnerabilities` — CVE table + KEV cards | `pages/VulnerabilitiesPage.tsx` |
| `ThreatIntelPage` | Route `/threat-intel` — C2 / attacker / phishing IOC tables | `pages/ThreatIntelPage.tsx` |
| `DataBreachPage` | Route `/breaches` — HIBP breach catalog | `pages/DataBreachPage.tsx` |

## Core components

### `Header`

Top navigation bar: brand, nav links (Map / Vulns / Intel / Breaches),
category filter toggles, manual refresh, last-updated timestamp.

```ts
interface HeaderProps {
  filters: FilterState;
  onFilterChange: (category: ThreatCategory) => void;
  onRefresh: () => void;
  lastUpdated: Date | null;
  loading: boolean;
  events: ThreatEvent[];
  kevCount: number;
}
```

Filter toggles only render for categories that actually appear in the loaded
events — phishing/breach entries are never emitted as map events, so their
toggles would be dead UI.

### `ThreatMap`

The centerpiece — an interactive SVG world map (equirectangular projection,
TopoJSON land from `world-atlas`, viewBox `1000×500`):

- Zoom/pan with native non-passive wheel handling
- Category-colored, severity-pulsed markers
- Hash-scatter "approx" markers (dashed stroke + badge) for KEV/CVE events
- Clickable markers → detail panel (CVSS, ASN, country, source links)
- `mapFocusCoords` support for cross-page "show on map" jumps

```ts
interface ThreatMapProps {
  events: ThreatEvent[];
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent) => void;
  mapFocusCoords?: [number, number] | null;
}
```

### `Globe3D`

Three.js (@react-three/fiber + drei) rotating globe with the same signals:
lat/lon → 3D vector conversion, glowing threat markers, stars + grid. Lazy
mounted from a toolbar toggle to keep the initial bundle lean.

```ts
interface Globe3DProps {
  events: ThreatEvent[];
  onClose: () => void;
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent) => void;
}
```

### `Sidebar`

The right-hand event list: category-filtered signals, severity badges,
click-to-select, count summary. Toggles with `TimelineView`.

```ts
interface SidebarProps {
  events: ThreatEvent[];
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent) => void;
  searchResults?: ThreatEvent[];
}
```

### `TimelineView`

Time-bucketed view of events (24h / 7d / 30d / all) replacing the list when
the timeline toggle is active.

```ts
interface TimelineViewProps {
  events: ThreatEvent[];
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent) => void;
}
```

### `ThreatTrends`

Recharts analytics dashboard: category/severity distributions, CVSS bands,
24-hour signal timeline. Wrapped in a modal-style overlay.

```ts
interface ThreatTrendsProps {
  isOpen: boolean;
  onClose: () => void;
  events: ThreatEvent[];
  cves: CveRecord[];
  breaches: BreachRecord[];
}
```

### `StatsOverlay`

Floating summary: total signals, critical count, active C2 servers, KEV
entries, breach count.

```ts
interface StatsOverlayProps {
  events: ThreatEvent[];
  kev: KevEntry[];
  iocs: IocIndicator[];
  isVisible: boolean;
}
```

## Interaction components

### `SearchBar`

Global search across CVEs, vendors, IPs, domains, and breaches. Selecting a
result navigates: CVE → NVD entry, breach → HIBP page, IOC → Intel page with
the row highlighted.

```ts
interface SearchBarProps {
  events: ThreatEvent[];
  cves: CveRecord[];
  iocs: IocIndicator[];
  breaches: BreachRecord[];
  onSelectEvent: (event: ThreatEvent) => void;
  onSelectIoc: (ioc: IocIndicator) => void;
}
```

### `ExportModal`

Export options: JSON, CSV, KEV catalog, IOC list, and a firewall-ready IP
blocklist. All CSV paths go through `utils/csv.ts` (`buildCsv`) for
formula-injection-safe output.

```ts
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ThreatEvent[];
  cves: CveRecord[];
  kev: KevEntry[];
  iocs: IocIndicator[];
  breaches: BreachRecord[];
}
```

### `SettingsModal`

Notification toggles, sound on/off, auto-refresh switch, refresh interval
(1 / 5 / 15 min), and minimum severity for notifications.

```ts
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}
```

### `NotificationToast`

Transient toast stack for new high-severity signals (configurable threshold,
capped at 50). Click to select the event; per-toast and dismiss-all actions.

```ts
interface NotificationToastProps {
  notifications: ThreatNotification[];
  onSelect: (event: ThreatEvent) => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}
```

## Chrome components

| Component | Purpose |
|-----------|---------|
| `Footer` | Data-source links (NVD, CISA, abuse.ch, DShield, OpenPhish, HIBP), credits, license |
| `LoadingScreen` | Full-screen boot animation while the first fetch runs (`LoadingScreenProps: { message?: string }`) |
