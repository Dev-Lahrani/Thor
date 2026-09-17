# ⚡ Thor — Cyber Threat Intelligence Dashboard

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)

**A live, key-free cyber threat intelligence dashboard — a real-time map of actively
exploited vulnerabilities, botnet C2 servers, attack sources, phishing infrastructure,
and data breaches, wrapped in a cyberpunk SOC-style interface.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Data Sources](#-data-sources)

</div>

---

## ✨ Features

### 🗺️ Live Threat Map
- **Real-time threat signals** on an interactive SVG world map
- **Geolocated C2 servers and attack sources** (ipwho.is, cached 7 days)
- **KEV/CVE "global threat pressure" scatter** — a deliberate visualization that
  vulnerability exposure is worldwide, not localized
- **Severity-pulsed markers** tied to CVSS bands (Low → Critical)
- **Clickable markers** with detail panels (CVSS, ASN, country, source links)
- **3D globe view** with the same live signals
- **Auto-refresh** loop with configurable interval

### 🛡️ Vulnerability Intelligence
- **NVD CVE feed** — recent CVEs with CVSS v3.1 scores, vectors, vendors, and CWE IDs
- **CISA KEV catalog** — Known Exploited Vulnerabilities with ransomware-campaign
  flags, CISA required actions, and federal remediation due dates
- **KEV ↔ CVE join** — every CVE row shows whether it is actively exploited
- Filter by severity, vendor, or CVE id

### 📡 Threat Intel Feeds
- **Feodo Tracker** — botnet command-and-control servers (malware family per IP)
- **DShield/SANS** — top network attack sources with attack counts
- **OpenPhish** — live phishing URL feed
- **ISC threat level strip** — current internet storm condition
- **Copy-as-IOC** — one click to copy any indicator

### 💥 Data Breaches
- **HaveIBeenPwned catalog** — 1,000+ breaches with exposed-account counts
- **Sensitive/verified badges** and data-class chips
- Filter by breach name, domain, sensitivity, or verification status

### 📊 Trends & Analytics
- Category distribution (KEV / Malicious IPs / Phishing / Breaches)
- Severity distribution and CVSS score bands
- 24-hour signal timeline

### 🔔 Notifications & Export
- **Toast notifications** for new high-severity signals (configurable threshold)
- Optional audio alerts for critical events
- **Export** to JSON/CSV, KEV catalog, IOC list, or a firewall-ready **IP blocklist**

---

## 🎨 Design

Cyberpunk/tech aesthetic carried over from the GeoAlert lineage:

- 🌑 Dark theme with glassmorphism panels
- 💜 Neon accents (cyan, purple, red, orange, pink)
- ✨ Smooth animations and severity pulses
- 📱 Responsive layout

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm

```bash
git clone https://github.com/Dev-Lahrani/Thor.git
cd Thor
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📖 Usage

### Navigation
- **Map** (`/`) — the main threat tracking dashboard
- **Vulns** (`/vulnerabilities`) — CVE table + KEV cards
- **Intel** (`/threat-intel`) — C2 / attacker / phishing IOC feeds
- **Breaches** (`/breaches`) — HIBP breach catalog

### Toolbar Controls
| Button | Function |
|--------|----------|
| ⏱ / ☰ | Toggle list vs timeline sidebar |
| 🌍 | Open 3D globe view |
| 📈 | Open threat trends dashboard |
| 📊 | Toggle stats overlay |
| 📤 | Export data |
| ⚙️ | Settings (notifications, refresh interval) |

### Searching
The search bar finds CVE ids, vendors, IPs, domains, and breaches. Selecting a CVE
opens its NVD entry; selecting a breach opens its HIBP page.

---

## 🔌 Data Sources

This application uses **free, no-API-key-required** data sources:

| Source | Data | Update |
|--------|------|--------|
| [NIST NVD](https://nvd.nist.gov/) | CVE records (3-day window) | ~15 min cache |
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Actively exploited vulns (180-day window) | 30 min cache |
| [abuse.ch Feodo Tracker](https://feodotracker.abuse.ch/) | Botnet C2 servers | 30 min cache |
| [DShield/ISC](https://isc.sans.edu/) | Attack sources + threat level | 60 min cache |
| [OpenPhish](https://openphish.com/) | Phishing URLs | 30 min cache |
| [HaveIBeenPwned](https://haveibeenpwned.com/) | Public breach catalog | 6 h cache |
| [ipwho.is](https://ipwho.is/) | IOC geolocation | 7-day localStorage cache |

Feeds without CORS headers (CISA KEV, Feodo) are fetched through a public read relay
with direct-fetch fallback. All data is consumed **client-side** — no backend, no keys,
nothing to leak.

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ThreatMap.tsx         # SVG world map with threat markers
│   ├── Header.tsx            # Brand + nav + category filters + stats
│   ├── Sidebar.tsx           # Threat list + detail panel
│   ├── StatsOverlay.tsx      # Threat statistics overlay
│   ├── SearchBar.tsx         # CVE / vendor / IP / domain search
│   ├── NotificationToast.tsx # Severity-based alert notifications
│   ├── TimelineView.tsx      # Chronological signal timeline
│   ├── ExportModal.tsx       # JSON/CSV/blocklist export
│   ├── SettingsModal.tsx     # Notifications + refresh settings
│   ├── ThreatTrends.tsx      # Charts and analytics
│   ├── Globe3D.tsx           # Three.js 3D threat globe
│   ├── LoadingScreen.tsx     # Boot animation
│   ├── Footer.tsx            # Data source credits
│   └── index.ts              # Component exports
├── context/
│   └── ThreatContext.tsx     # Shared state: feeds, filters, notifications
├── pages/
│   ├── Layout.tsx            # Persistent shell (header/footer/modals)
│   ├── MapView.tsx           # Main map dashboard
│   ├── VulnerabilitiesPage.tsx
│   ├── ThreatIntelPage.tsx
│   ├── DataBreachPage.tsx
│   └── index.ts
├── services/
│   └── api.ts                # Feed layer: NVD, KEV, Feodo, DShield, OpenPhish, HIBP
├── types/
│   └── index.ts              # TypeScript types
├── utils/
│   ├── helpers.ts            # Category/severity styling + formatters
│   └── audio.ts              # Notification chime
├── main.tsx                  # Routes + provider
└── index.css                 # Global styles (Tailwind v4)
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite (Rolldown)** | Build Tool |
| **Tailwind CSS v4** | Styling |
| **Three.js** | 3D Globe |
| **@react-three/fiber** | React Three.js bindings |
| **Recharts** | Data visualization |
| **Lucide React** | Icons |
| **React Router** | Navigation |

---

## ⚙️ Configuration

No API keys required — every feed is public and consumed client-side.

Theme tokens live in `src/index.css`:

```css
--neon-cyan: #00d4ff
--neon-purple: #a855f7
--neon-red: #ef4444
--neon-orange: #f97316
--neon-pink: #ec4899
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgments

- **CISA** for the Known Exploited Vulnerabilities catalog
- **NIST** for the National Vulnerability Database
- **abuse.ch**, **DShield/ISC**, and **OpenPhish** for IOC feeds
- **HaveIBeenPwned** for the breach catalog
- **Three.js** community for 3D visualization tools

---

## 📬 Contact

**Dev Lahrani** - [@Dev-Lahrani](https://github.com/Dev-Lahrani)

Project Link: [https://github.com/Dev-Lahrani/Thor](https://github.com/Dev-Lahrani/Thor)

---

<div align="center">

**⚡ Cyber Threat Intelligence, live and key-free. ⚡**

</div>
