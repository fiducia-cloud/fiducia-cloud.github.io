const APP_ORIGIN = "https://app.fiducia.cloud";
const REFRESH_PATH = "/auth/session/refresh";
const PERIODIC_SYNC_TAG = "account-session-refresh";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function refreshSession() {
  try {
    await fetch(`${APP_ORIGIN}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
      mode: "cors",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    // Background execution is opportunistic; foreground recovery retries.
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(refreshSession());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(refreshSession());
  }
});
