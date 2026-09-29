import {Button, Card} from '@heroui/react';
import {Moon, Music, Play, Square, Sun} from 'lucide-react';
import {Suspense, lazy, useEffect, useState} from 'react';
import type {Theme} from './game/PracticeScene';

const GameView = lazy(() => import('./game/GameView').then(m => ({default: m.GameView})));

export function App() {
  const [playing, setPlaying] = useState(false);
  // Every visit starts in dark mode; the toggle only lasts for the session.
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.dataset.theme = theme;
  }, [theme]);

  return (
    <div className='flex min-h-dvh flex-col text-foreground'>
      <header className='flex items-center justify-between border-b border-separator px-6 py-4'>
        <div className='flex items-center gap-2'>
          <Music className='size-5 text-accent' />
          <h1 className='text-lg font-semibold'>Note Practice</h1>
        </div>
        <div className='flex items-center gap-2'>
          {playing && (
            <Button
              variant='outline'
              onPress={() => setPlaying(false)}
            >
              <Square className='size-4' />
              End
            </Button>
          )}
          <Button
            isIconOnly
            variant='ghost'
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
          </Button>
        </div>
      </header>

      <main className='flex flex-1 items-center justify-center p-4 sm:p-8'>
        {playing ? (
          <div className='flex w-full max-w-4xl flex-col items-center gap-3'>
            <Suspense>
              <GameView theme={theme} />
            </Suspense>
            <p className='text-sm text-muted'>Click the letter that matches the note, or press A–G on your keyboard.</p>
          </div>
        ) : (
          <Card className='w-full max-w-md'>
            <Card.Header>
              <Card.Title>Sight-read the grand staff</Card.Title>
              <Card.Description>
                A note will appear on the treble or bass clef. Pick its letter name to move on to the next one. No
                points, no timer — just practice.
              </Card.Description>
            </Card.Header>
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
