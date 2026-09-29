import {AUTO, Game, Scale} from 'phaser';
import {useEffect, useRef} from 'react';
import {HEIGHT, PracticeScene, type Theme, WIDTH, paperColor} from './PracticeScene';

export function GameView({theme}: {theme: Theme}) {
  const parent = useRef<HTMLDivElement>(null);
  const game = useRef<Game>(null);
  const initialTheme = useRef(theme);

  useEffect(() => {
    let cancelled = false;

    // Phaser renders text to canvas once, so the clef glyphs' font must be ready first.
    void document.fonts.load('72px "Noto Music"', '\u{1D11E}\u{1D122}\u{1D114}').finally(() => {
      if (cancelled || !parent.current) return;
      game.current = new Game({
        type: AUTO,
        parent: parent.current,
        width: WIDTH,
        height: HEIGHT,
        scale: {mode: Scale.FIT, autoCenter: Scale.CENTER_HORIZONTALLY},
        callbacks: {preBoot: g => g.registry.set('theme', initialTheme.current)},
        scene: [PracticeScene],
      });
    });

    return () => {
      cancelled = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => {
    initialTheme.current = theme;
    game.current?.registry.set('theme', theme);
  }, [theme]);

  return (
    <div
      ref={parent}
      className='w-full overflow-hidden rounded-xl border border-border'
      style={{aspectRatio: `${WIDTH} / ${HEIGHT}`, backgroundColor: paperColor(theme)}}
    />
  );
}
