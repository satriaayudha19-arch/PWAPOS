# Indonesia Livestock — PRD

## Original Problem Statement
Build "Indonesia Livestock", a smart, **offline-first** livestock management **PWA** for
Indonesian field officers who scan NFC ear tags on Android phones to record health, weight,
quarantine and location. Android/Chrome only, Web NFC (NDEFReader), all UI in Indonesian.

## Architecture
- **NOT Expo/React Native.** Built exactly to the requested stack because Web NFC + PWA are browser-only.
- **Frontend:** React + Vite + TypeScript, served by Vite dev server on **port 3000** (Expo supervisor program stopped).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), mobile-first, high contrast, 48px+ touch targets.
- **PWA:** `vite-plugin-pwa` — service worker, offline runtime caching (static: StaleWhileRevalidate, /api/: NetworkFirst), installable manifest (id/Indonesian).
- **Local DB (primary):** Dexie.js / IndexedDB — tables: owners, pens, livestock (unique rfid_uid + register_number), healthLogs, schedules, quarantineLogs.
- **State:** Zustand (isOnline, pendingSync, isSyncing, lastSyncedAt, toast).
- **Sync:** `src/services/syncService.ts` reads `synced === false` rows, pushes to mock API, flips to `synced:true` on success; auto-sync on `online` event + manual Sync Now.
- **Mock backend:** `src/api/mockApi.ts` in-memory, Supabase-swappable (same signatures).
- Path map: routes `/`, `/scan`, `/add`, `/profile`, `/livestock/:id`.

## User Personas
- **Field officer / farmhand:** scans ear tags in low-connectivity farms, logs weight/health, manages quarantine.
- **Farm owner (Pak Budi):** reviews herd summary, sync status.

## Core Requirements (static)
1. Dashboard summary cards: total livestock, active pens, quarantine alerts, pending sync.
2. NFC scan (NDEFReader) of URI records `https://indolestock.com/scan/LIVESTOCK-0001` + manual fallback.
3. Livestock profile: breed, birth_date, weight history, sire/dam pedigree, status.
4. Health & weight log form (weight, temp, fertility, notes) → Dexie `synced:false`.
5. Quarantine module: status toggle, treatment log, pen lock.
6. Sync engine: pending counter, Sync Now, auto-sync online, offline-safe with toasts.

## Implemented (2026-09-02)
- ✅ Full Dexie schema + interfaces + one-time seed (1 owner, 3 pens, 5 livestock, health/quarantine/schedule logs).
- ✅ Layout: sticky header (online/offline badge + sync button + pending badge), prominent center Scan bottom nav, toast host.
- ✅ Dashboard with live-query summary cards, quarantine alert strip, tappable livestock list.
- ✅ Scan screen: NDEFReader flow (permission/abort/no-support handling), animated tap-to-scan UI, haptic (vibrate), manual dev fallback.
- ✅ Livestock detail: info, pedigree, health/weight history, quarantine history.
- ✅ Health log bottom-sheet form → Dexie synced:false, increments pending.
- ✅ Quarantine bottom-sheet: start (ACTIVE→QUARANTINED) / recover / deceased.
- ✅ Add Data form (new livestock, unique constraint handling).
- ✅ Profile: owner card, sync panel (status/pending/last-synced), Sync Now.
- ✅ Sync service + auto-sync on reconnect; success/error toasts.
- ✅ PWA manifest + service worker + PNG icons + README.
- ✅ Verified: `tsc` clean; testing agent 9/9 flows PASS.

## Backlog
- **P1:** Swap mock API → Supabase (auth, real persistence, multi-device).
- **P1:** Encode/write NFC tags from within the app (NDEFReader.write) for tag provisioning.
- **P2:** Weight-trend chart on livestock detail.
- **P2:** Schedules UI (feeding/vaccination/medical) with due reminders.
- **P2:** GPS pen location capture + map.
- **P2:** Search/filter herd list; SOLD lifecycle.

## Next Tasks
1. Supabase integration for real sync.
2. In-app NFC tag writing/provisioning.
3. Weight-history chart.
