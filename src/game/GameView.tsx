import {AUTO, Game, Scale} from 'phaser';
import {useEffect, useMemo, useRef, useSyncExternalStore} from 'react';
import {computeLayout} from './layout';
import type {Staves} from './notes';
import {PracticeScene, type Theme, paperColor} from './PracticeScene';

// Below this viewport width the game switches to its narrow, two-row layout.
const compactQuery = '(max-width: 639px)';
const subscribeCompact = (onChange: () => void) => {
  const query = matchMedia(compactQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const isCompact = () => matchMedia(compactQuery).matches;

// Render at the screen's pixel density (capped to keep phones fast) so notation isn't blurry when scaled up.
const zoom = Math.min(Math.ceil(window.devicePixelRatio || 1), 3);

export function GameView({theme, staves}: {theme: Theme; staves: Staves}) {
  const parent = useRef<HTMLDivElement>(null);
  const game = useRef<Game>(null);
  const initialTheme = useRef(theme);
  const compact = useSyncExternalStore(subscribeCompact, isCompact);
  const layout = useMemo(() => computeLayout(staves, compact), [staves, compact]);

  // The canvas size is fixed per game, so a new layout means a new game; the current note survives via session state.
  useEffect(() => {
    let cancelled = false;

    // Phaser renders text to canvas once, so the clef glyphs' font must be ready first.
    void document.fonts.load('72px "Noto Music"', '\u{1D11E}\u{1D122}\u{1D114}').finally(() => {
      if (cancelled || !parent.current) return;
      game.current = new Game({
        type: AUTO,
        parent: parent.current,
        width: layout.width * zoom,
        height: layout.height * zoom,
        scale: {mode: Scale.FIT, autoCenter: Scale.CENTER_HORIZONTALLY},
        callbacks: {
          preBoot: g => {
            g.registry.set('theme', initialTheme.current);
            g.registry.set('staves', staves);
            g.registry.set('layout', layout);
            g.registry.set('zoom', zoom);
          },
        },
        scene: [PracticeScene],
      });
    });

    return () => {
      cancelled = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, [layout, staves]);

  useEffect(() => {
    initialTheme.current = theme;
    game.current?.registry.set('theme', theme);
  }, [theme]);

  // Fit within the viewport height as well as its width, so landscape phones see the answer buttons.
  return (
    <div
      ref={parent}
      style={{
        aspectRatio: `${layout.width} / ${layout.height}`,
        width: `min(100%, calc((100dvh - 120px) * ${layout.width / layout.height}))`,
        backgroundColor: paperColor(theme),
        touchAction: 'manipulation',
      }}
    />
  );
}
