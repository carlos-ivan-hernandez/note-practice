# note-practice

A simple sight-reading trainer. Pick the grand staff, treble clef or bass clef, press **Start**, and a note appears. Click
its letter name (A–G), or press the key on your keyboard, to move on to the next note. No points, no timer.

The app always opens in dark mode (white notation on black); the header toggle switches to light mode for the session.

## Stack

- **App shell:** Vite, React, HeroUI v3, Tailwind CSS v4
- **Game view:** [Phaser 4](https://phaser.io) (canvas renderer) — renders the staff, notes and answer buttons
- **PWA:** `vite-plugin-pwa`, icons from `@vite-pwa/assets-generator`
- **Clef glyphs:** Noto Music via `@fontsource/noto-music`

## Development

```sh
pnpm install
pnpm dev
```

The dev server ships unminified dependencies (Phaser alone is ~21MB), so it is slow on a phone. To try it on a phone,
use a production build instead:

```sh
pnpm build
pnpm preview --host
```

## PWA

The app is installable and works offline: the service worker precaches everything, including the Phaser chunk and the
music font. Icons are generated from `public/app-icon.svg` with `pnpm generate-pwa-assets`.

## Layout

- `src/App.tsx` — app shell (start screen, header)
- `src/game/GameView.tsx` — mounts and tears down the Phaser game
- `src/game/PracticeScene.ts` — draws the staff, handles answers and feedback
- `src/game/layout.ts` — canvas geometry; a compact two-row layout is used below 640px wide
- `src/game/notes.ts` — note model, practice ranges, ledger-line logic

Notes reach up to two ledger lines outside each staff: C4–C6 and C2–C4 on the grand staff, A3–C6 treble only, C2–E4 bass only. Sharps and flats are not included yet.
