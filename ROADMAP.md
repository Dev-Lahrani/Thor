# 🗺️ Thor Roadmap

Where the project is heading. Stars, issues, and discussions steer these
priorities — if something here excites you, claim it!

> **Want to work on one of these?** Comment on the linked issue (or open one)
> and it'll be assigned to you. Items marked `good first issue` are the
> gentlest entry points.

---

## 🎯 Near-term (v3.1)

Focus: **performance & first-run experience**

- [ ] **Code-splitting** — lazy-load the 3D globe (Three.js) and charts
      (Recharts) so the initial bundle drops under ~500 kB
- [ ] **PWA support** — installable dashboard with offline shell
- [ ] **Feed health panel** — visualize per-feed status (already tracked
      internally) in the UI
- [ ] `good first issue` **Bookmarkable filters** — persist filter/category
      state in the URL
- [ ] `good first issue` **Dockerfile** — one-command self-hosting

## 🚀 Mid-term (v3.x – v4.0)

Focus: **depth for real analysts**

- [ ] **Self-hosted CORS proxy** (optional) — remove the r.jina.ai relay
      dependency for KEV/Feodo feeds
- [ ] **STIX/TAXII export** — IOC export in formats SOC tools ingest directly
- [ ] **Alert webhooks** — push new critical signals to Discord/Slack/generic
      endpoints via a tiny optional companion service
- [ ] **Multi-language UI** — i18n scaffold + first translations
- [ ] **Dark/light theming done right** — tokenized theme with a real light mode
- [ ] **Expandable CVE detail drawer** — EPSS scores, exploit references,
      affected-product timelines

## 🌌 Long-term ideas

- Optional backend mode for teams (caching proxy, watchlists, history graphs)
- Plugin system for community-contributed feeds
- Mobile companion layout / responsive globe
- Local LLM-assisted CVE summarization (opt-in, no cloud keys)

## 🚫 Non-goals

To keep Thor trustworthy and lean, we will **not** build:

- **Accounts or telemetry** — your usage stays on your machine
- **Paid API-key features as core paths** — key-free is the promise; key-based
  sources may only ever be optional plugins
- **Ad-ledger or crypto gimmicks** — yes, people ask

---

## ✅ Shipped

See [CHANGELOG.md](CHANGELOG.md) for the full history — highlights:

- **3.0.1** — dependency security pass, deep links, persisted settings,
  feed-status tracking, CSV injection hardening, 35 unit tests, CI
- **3.0.0** — the GeoAlert → Thor rebrand: CVE/KEV/IOC/breach feeds, threat
  map, 3D globe, exports
