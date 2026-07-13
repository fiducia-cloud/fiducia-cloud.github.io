<!-- BEGIN k8s-cluster-submodule-notice -->
> [!NOTE]
> **Canonical source.** This repository is the source of truth for its code. It
> is also vendored as a **secondary** git submodule of
> [ORESoftware/k8s-cluster](https://github.com/ORESoftware/k8s-cluster) at
> `remote/deployments/fiducia-ui.web` — make changes here, not in that submodule checkout.
>
> On disk: source clone `~/codes/fiducia.cloud/fiducia-ui.web` · submodule checkout `~/codes/ores/k8s-cluster/remote/deployments/fiducia-ui.web`.
<!-- END k8s-cluster-submodule-notice -->

# fiducia-ui

The [Astro](https://astro.build) front-end for **fiducia.cloud** — the marketing
homepage for Raft-based consensus & coordination as a service.

This repository is static marketing only. Customer account/API-key workflows
belong to the Rust MASH server in `fiducia-backend.rs`; operator workflows belong
to the separate Rust MASH server in `fiducia-admin.rs`. Neither application is
compiled into this Astro site.

- Purple + navy theme, fully static output.
- Built behind a gateway path prefix, so `base` is `/fiducia` (override with
  `PUBLIC_BASE=/` to serve at a domain root).

## Develop

```bash
npm install
npm run dev        # http://localhost:4321/fiducia/
npm run build      # -> dist/
npm run sync       # build + copy dist/ into ../fiducia-backend.rs/static/
```

The Rust backend (`../fiducia-backend.rs`) serves the built site. `static/` is
gitignored in the backend repo — deployment builds this site in-pod (node
initContainer) from this repo's main and hands it to the backend via
`STATIC_DIR`, so nothing built is ever committed there. `npm run sync` only
refreshes the local dev copy; run it after changing anything here so local
serving matches source.

Everything in `public/` is copied verbatim into `dist/` and served, and every
non-underscore-prefixed file in `src/pages/` becomes a live route — don't put
anything in either place that shouldn't be published (directory intent docs in
`src/pages/` are named `_README.md` for this reason).

## Security posture

- **Fully static, no secrets in the bundle.** Output is static HTML/CSS/JS. The
  only build-time env is `PUBLIC_BASE` (a URL path prefix) — no API keys, tokens,
  or credentials are inlined. `npm audit --omit=dev` reports 0 vulnerabilities.
- **No user data / no request-derived XSS sinks.** The marketing pages render
  only static, author-controlled content; there is no
  `innerHTML`/`dangerouslySetInnerHTML` and no request-derived interpolation.
  The single `set:html` (the hero terminal snippet in `src/pages/index.astro`)
  renders a build-time string constant — keep it that way: never pass
  request- or user-derived values to `set:html`.
- **HTTP security headers are set by the serving layer.**
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a permissions policy, and
  a CSP are applied by `fiducia-backend.rs` in front of `dist/`. Note the CSP
  is currently just `upgrade-insecure-requests` (no source restrictions) so the
  backend's docs/diagram pages can load their CDN scripts — see the comment in
  `fiducia-backend.rs/src/main.rs`. The shell also carries
  `<meta name="referrer" content="strict-origin-when-cross-origin">`
  as defense-in-depth so full URLs don't leak to third-party origins.
