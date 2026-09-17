# 🚀 Getting Started

Thor runs entirely in your browser — no backend, no accounts, no API keys.
This guide gets you from zero to a running dashboard in about a minute.

## Prerequisites

- **Node.js 18+** (CI uses Node 20)
- **npm 9+**
- A modern browser (Chrome, Firefox, Safari, Edge)

```bash
node -v   # ≥ 18
npm -v    # ≥ 9
```

## Install

```bash
git clone https://github.com/Dev-Lahrani/Thor.git
cd Thor
npm install
```

## Run

```bash
npm run dev
```

Open **http://localhost:5173**. On first load Thor fetches all six threat
feeds in parallel, geolocates the IOC IPs, and drops you on the live map.

## Build for production

```bash
npm run build   # typecheck (tsc -b) + bundle (vite)
npm run preview # serve the production build locally
```

The build output in `dist/` is pure static files. Because the app is
client-side only, you can deploy it anywhere static files are served:

- **GitHub Pages** — publish `dist/` from a branch or Actions artifact
- **Netlify / Vercel** — build command `npm run build`, output dir `dist`
- **Any static file server** — `nginx`, `serve`, a bucket, etc.

> ⚠️ Use hash routing or a server that rewrites unknown paths to `index.html`
> if you deploy to a host without SPA fallback support (React Router needs it
> for deep links like `/vulnerabilities`).

## Tests & lint

```bash
npm test           # Vitest, one-shot
npm run test:watch # Vitest in watch mode
npm run lint       # ESLint
```

CI runs `lint` + `test` + `build` on every push and PR.

## Next steps

- Read the [Architecture](./architecture.md) doc to understand data flow
- See the [API Reference](./api-reference.md) for the feed layer
- Check [Customization](./customization.md) to restyle or re-point feeds
- Read [CONTRIBUTING](../CONTRIBUTING.md) before your first PR
