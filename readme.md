# note-practice

A simple sight-reading trainer for the grand staff. Press **Start**, and a note appears on the treble or bass clef. Click
its letter name (A–G), or press the key on your keyboard, to move on to the next note. No points, no timer.

The app always opens in dark mode (white notation on black); the header toggle switches to light mode for the session.

## Stack

- **App shell:** Vite, React, HeroUI v3, Tailwind CSS v4
- **Game view:** [Phaser 4](https://phaser.io) — renders the grand staff, notes and answer buttons on a canvas
- **Clef glyphs:** Noto Music via `@fontsource/noto-music`

## Development

```sh
pnpm install
pnpm dev
```

## Layout

- `src/App.tsx` — app shell (start screen, header)
- `src/game/GameView.tsx` — mounts and tears down the Phaser game
- `src/game/PracticeScene.ts` — draws the staff, handles answers and feedback
- `src/game/notes.ts` — note model, practice range, ledger-line logic

Notes range from C2 to C6 (up to two ledger lines outside each staff). Sharps and flats are not included yet.
