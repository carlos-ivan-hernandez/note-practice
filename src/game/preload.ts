// Kept free of Phaser imports so the start screen can warm up the game without pulling it into the main bundle.

export const loadGameView = () => import('./GameView');

// Phaser draws the clefs and brace to canvas once, so their font must be ready before the game starts.
export const loadMusicFont = () => document.fonts.load('72px "Noto Music"', '\u{1D11E}\u{1D122}\u{1D114}');
