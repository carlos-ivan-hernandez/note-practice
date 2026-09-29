import {Button, Card, Spinner, ToggleButton, ToggleButtonGroup} from '@heroui/react';
import {Moon, Play, Square, Sun} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {GameView as GameViewComponent} from './game/GameView';
import type {Staves} from './game/notes';
import type {Theme} from './game/PracticeScene';
import {loadGameView, loadMusicFont} from './game/preload';
import {load, save} from './session';

const stavesOptions: {id: Staves; label: string}[] = [
  {id: 'grand', label: 'Grand staff'},
  {id: 'treble', label: 'Treble'},
  {id: 'bass', label: 'Bass'},
];

const themeColors: Record<Theme, string> = {dark: '#121212', light: '#f5f5f5'};

export function App() {
  const [playing, setPlaying] = useState(() => load('playing', false));
  // New tabs start in dark mode; the toggle only lasts for the tab's session.
  const [theme, setTheme] = useState<Theme>(() => load('theme', 'dark'));

  const [staves, setStaves] = useState<Staves>(() => load('staves', 'grand'));

  useEffect(() => save('playing', playing), [playing]);
  useEffect(() => save('staves', staves), [staves]);
  useEffect(() => save('theme', theme), [theme]);

  // Fetch the game (Phaser is most of the app's weight) and its font while the start screen is up, so Start is instant.
  // Holding the loaded component in state, rather than React.lazy, avoids React's ~300ms Suspense reveal throttle.
  const [GameView, setGameView] = useState<typeof GameViewComponent>();
  useEffect(() => {
    void loadGameView().then(m => setGameView(() => m.GameView));
    void loadMusicFont();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }, [theme]);

  return (
    <div className='flex min-h-dvh flex-col text-foreground'>
      <header className='flex items-center justify-between border-b border-separator px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4 sm:pt-[max(1rem,env(safe-area-inset-top))]'>
        <Button
          isIconOnly
          variant='ghost'
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
        </Button>
        {playing && (
          <Button
            variant='outline'
            onPress={() => {
              save('note', null);
              setPlaying(false);
            }}
          >
            <Square className='size-4' />
            End
          </Button>
        )}
      </header>

      <main className='flex flex-1 items-center justify-center p-4 sm:p-8'>
        {playing ? (
          <div className='flex w-full max-w-4xl justify-center'>
            {GameView ? (
              <GameView
                theme={theme}
                staves={staves}
              />
            ) : (
              <Spinner />
            )}
          </div>
        ) : (
          <Card className='w-full max-w-md'>
            <Card.Header>
              <Card.Title>Sight-reading practice</Card.Title>
              <Card.Description>
                A note will appear on the staff. Pick its letter name, or press A–G, to move on to the next one. No
                points, no timer — just practice.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <ToggleButtonGroup
                aria-label='Staff'
                fullWidth
                selectionMode='single'
                disallowEmptySelection
                selectedKeys={[staves]}
                onSelectionChange={keys => {
                  const next = stavesOptions.find(o => keys.has(o.id));
                  if (next) setStaves(next.id);
                }}
              >
                {stavesOptions.map(option => (
                  <ToggleButton
                    key={option.id}
                    id={option.id}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Card.Content>
            <Card.Footer>
              <Button
                variant='primary'
                fullWidth
                onPress={() => setPlaying(true)}
              >
                <Play className='size-4' />
                Start
              </Button>
            </Card.Footer>
          </Card>
        )}
      </main>
    </div>
  );
}
