# Security Policy

## Reporting a Vulnerability

If you discover a security issue, **please do not open a public issue**.

Instead, email: **jayhemnani992000@gmail.com** with:

- A description of the issue
- Steps to reproduce
- Impact assessment (what an attacker could do)

You can expect an acknowledgment within 7 days. Fixes will be prioritized based on severity.

## Scope

This project is a static browser-based PWA. It has no server component and stores data only in the user's browser (`localStorage`). Reports most relevant to us include:

- XSS vectors in the visualizer, timer, or import/export flows
- Malicious payloads in `data/leaderboard.json` or JSON imports
- Service-worker cache-poisoning scenarios
- Dependency vulnerabilities (Three.js, Chart.js, Vite)

Out of scope: issues requiring a compromised host or browser extension.
