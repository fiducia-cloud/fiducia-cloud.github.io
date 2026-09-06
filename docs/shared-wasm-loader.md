# Shared WebAssembly loader pilot

Fiducia's Astro site participates in the `ores-wasm-loaders` pilot. The bootstrap is aware of the configurable `/fiducia/` gateway base path. It loads the shared coordinator and independent interface contract but does not start product, Flutter, Leptos, or Dioxus code during ordinary page load.

Existing “Get started” links trigger fetch-only preparation after 150 ms of sustained intent. The public canary is 8 bytes. Only explicit diagnostics call `globalThis.__ORES_WASM_LOADER__.activateProbe()`.

Pinned inputs:

- `owls-interfaces`: `b0e687c88b652d25964c041e2fdd0222f512fddd`
- `owls-web-loader`: `3b92396e34ffd0ba6411261957e47dd62cf3b4a4`
- probe SHA-256: `93a44bbb96c751218e4c00d479e4c14358122a389acca16205b1e4d0dc5f9476`

Requests are credentialless and contain no account state or private data. The pilot validates coordinator integration, verified intent preparation, cancellation, and base-path deployment. It does not promise a cross-site universal cache or a runtime that survives navigation.
