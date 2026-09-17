# Contributing to Thor

First off — thank you! ⚡ Thor is a free, open-source cyber threat
intelligence dashboard, and every kind of contribution makes it better:
code, docs, design, bug reports, or just spreading the word.

This project follows the [all-contributors](https://allcontributors.org)
spirit: **all contributions are welcome, not just code.**

---

## 🚀 Quick start (local dev)

```bash
git clone https://github.com/Dev-Lahrani/Thor.git
cd Thor
npm install
npm run dev        # http://localhost:5173
```

Verify your setup:

```bash
npm run lint       # ESLint
npm test           # Vitest unit tests
npm run build      # TypeScript + production build
```

All three must pass before a PR can be merged (CI enforces this too).

---

## 🐛 Reporting bugs

Open a [bug report](https://github.com/Dev-Lahrani/Thor/issues/new?template=bug_report.yml) and include:

- What you expected vs. what happened
- Steps to reproduce (numbered)
- Browser + OS, and anything in the DevTools console
- Which feed (if any) looked wrong — see the degraded-feed banner

**Security issues:** please do **not** open a public issue.
Follow [SECURITY.md](SECURITY.md) instead.

---

## 💡 Proposing features

Check [ROADMAP.md](ROADMAP.md) first — your idea may already be planned or
discussed in [issues](https://github.com/Dev-Lahrani/Thor/issues). If it's new,
open a [feature request](https://github.com/Dev-Lahrani/Thor/issues/new?template=feature_request.yml)
describing the problem you're solving, not just the solution.

Good first issues are labeled **`good first issue`** — grab one and comment
"I'd like to work on this" so it can be assigned to you.

---

## 🔀 Pull requests

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/awesome-thing
   ```
   Branch naming: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
2. **Keep PRs focused.** One feature or fix per PR. If it's large, open an
   issue first so the design can be agreed on.
3. Make your changes, **add or update tests** for behavior changes.
4. Run `npm run lint && npm test && npm run build` locally.
5. Commit with clear messages (see style below) and **push** to your fork.
6. Open the PR using the template and link the issue it closes
   (`Closes #123`).

### Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add IOC copy-all button to intel page
fix(map): stop wheel zoom scrolling the page
docs: update feed cache table
chore(deps): bump react-router-dom to 7.18.4
```

### Code style

- TypeScript strict — the compiler will keep you honest
- Existing formatting: no semicolons are *not* a rule here; match the file
  you're editing (prettier config may arrive later)
- Pure logic belongs in `src/utils/` or `src/services/` and should have
  unit tests
- Components in `src/components/`, pages in `src/pages/`, state in
  `src/context/`

### What we look for in review

- Does it work offline-safe? (feeds fail gracefully, no hard crashes)
- Are external calls cached or capped? (be a good citizen to free APIs)
- No new runtime dependencies without discussion — this project's promise
  is *key-free and lean*
- No secrets, no telemetry, no tracking. Ever.

---

## 🧭 Project structure

See [docs/architecture.md](docs/architecture.md) for the tour, and
[docs/getting-started.md](docs/getting-started.md) for a deeper onboarding.

---

## 🏆 Recognition

Contributions are celebrated, not swallowed:

- Every merged PR gets you into the **Contributors** section of the README
  (via the all-contributors spec — comment `@all-contributors please add
  @username for <code|doc|design|bug|ideas|review|test>` in a PR or issue)
- Notable features ship with credit in the release notes
- Long-term contributors are invited as triagers/maintainers

---

## 📜 License

By contributing, you agree your contributions are licensed under the
[MIT License](LICENSE) alongside the rest of the project.

---

<div align="center">

**Questions?** Open a [discussion](https://github.com/Dev-Lahrani/Thor/discussions) — no question is too small. ⚡

</div>
