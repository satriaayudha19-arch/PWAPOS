# Indonesia Livestock 🐄

Smart, **offline-first** livestock management **PWA** for field officers in Indonesia.
Scan NFC ear tags on Android phones to record health, weight, quarantine, and location — even without internet.

## Tech Stack
- **React + Vite + TypeScript**
- **Tailwind CSS v4** (mobile-first, high contrast, large touch targets)
- **vite-plugin-pwa** — service worker, offline caching, installable
- **Dexie.js** (IndexedDB) — the **primary, offline-first data store**
- **Zustand** — sync + online/offline state
- **Web NFC (`NDEFReader`)** — reads NTAG213/215 NDEF URI records on Android Chrome
- **Mock in-memory API** (`src/api/mockApi.ts`) — structured to swap to Supabase later

## Run locally
```bash
npm install      # or: yarn
npm run dev       # starts Vite on http://localhost:3000
npm run build     # type-check + production build
npm run preview   # preview the production build
```

## Test NFC on Android (real hardware)
Web NFC **only** works in **Chrome on Android** over a **secure context** (`https://` or `http://localhost`).

1. Deploy the app over HTTPS (or use `localhost` with USB port-forwarding via Chrome DevTools).
2. Enable **NFC** in Android settings.
3. Open the app in Chrome, go to **Pindai** (center button), tap **Ketuk untuk Pindai**, grant the NFC permission.
4. Tap the phone to an NTAG213/215 tag encoded with an NDEF **URI** record:
   `https://indolestock.com/scan/LIVESTOCK-0001`
5. The app extracts `LIVESTOCK-0001`, looks it up in Dexie, and opens the animal profile.

> **Desktop / no NFC?** A **manual ID input** ("Mode Uji") appears on the Scan screen for development testing. Type e.g. `LIVESTOCK-0001` and tap **Cari**.

## Install as a PWA
1. Open the app in Chrome (Android or desktop).
2. Menu ⋮ → **Install app** / **Add to Home screen**.
3. Launches standalone, works offline (cached shell + IndexedDB data).

## Offline-first & Sync
- Every write (health log, quarantine, etc.) saves to **Dexie immediately** with `synced: false`.
- A **pending sync counter** (Zustand) shows unsynced records in the header.
- **Sync Now** button + **automatic sync** when `navigator.onLine` becomes `true`.
- Sync reads all `synced === false` rows, pushes to the mock API, and flips them to `synced: true` on success. On failure they stay `false` and a toast appears — they retry next sync.

## Swapping the mock API for Supabase
Replace the bodies of `pushHealthLogs` / `pushSchedules` / `pushQuarantineLogs` in
`src/api/mockApi.ts` with Supabase upserts (e.g. `supabase.from('health_logs').upsert(rows)`).
Signatures and return shapes stay identical, so `src/services/syncService.ts` needs no changes.

## Data model (Dexie tables)
`owners`, `pens`, `livestock` (unique `rfid_uid` + `register_number`), `healthLogs`, `schedules`, `quarantineLogs`.
The `synced: boolean` flag on logs drives the offline sync queue.

## Known limitations
- **Android Chrome only** for NFC (by design — no iOS fallback). Other platforms use the manual input.
- Backend is an in-memory mock (resets on reload) — intended for MVP demo before wiring Supabase.
- IndexedDB cannot index booleans, so `synced` is queried via `.filter()` rather than an indexed `.where()`.
