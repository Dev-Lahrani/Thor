# Security Policy

## Supported versions

Thor is a client-side application with **no backend, no accounts, and no
secrets** — which keeps the attack surface small, but not zero.

| Version | Supported |
|---------|-----------|
| 3.0.x   | ✅        |
| < 3.0   | ❌        |

## Reporting a vulnerability

If you find a security issue, **please do not open a public issue or PR.**

Use GitHub's private vulnerability reporting:

1. Go to the **Security** tab of this repository
2. Click **"Report a vulnerability"**
3. Include: description, affected version, reproduction steps, and (if
   possible) a proof of concept

If private reporting is unavailable, email the contact in
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) with the subject line
`[Thor Security]`.

### What counts as a security issue here?

Worth reporting:

- XSS vectors via feed-supplied data (CVE descriptions, IOC values, breach
  metadata are third-party data rendered in the DOM)
- CSV/formula injection escaping export protections
- Dependency compromises or malicious supply-chain changes
- Anything that executes code, exfiltrates data, or breaks the
  "no keys, no telemetry" promise

Not worth reporting:

- "The app fetches public threat feeds" — that's the whole point 🙂
- Missing CSP headers on a local-only dev server
- Rate-limit complaints against third-party APIs

## What to expect

- **Acknowledgment** within 72 hours
- **Triage & fix timeline** — critical issues patched within 7 days;
  others within 30 days
- **Credit** — if you'd like, you'll be credited in the release notes and
  README (opt-in)

## Disclosure policy

We follow coordinated disclosure: we ask that you keep the issue private
until a fix is released, and we'll publish an advisory with credit once a
patched version is available.
