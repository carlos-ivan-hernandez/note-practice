export const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof letters)[number];
export type Clef = 'treble' | 'bass';

// A note is identified by its diatonic step: octave * 7 + letter index (C4 = 28).
export type Note = {clef: Clef; step: number};

const step = (letter: Letter, octave: number) => octave * 7 + letters.indexOf(letter);

// Bottom and top staff lines for each clef.
export const staffLines: Record<Clef, {bottom: number; top: number}> = {
  treble: {bottom: step('E', 4), top: step('F', 5)},
  bass: {bottom: step('G', 2), top: step('A', 3)},
};

export type Staves = 'grand' | 'treble' | 'bass';

// Practice ranges reach two ledger lines outside each staff, except that the grand staff's two staves meet at
// middle C instead of overlapping.
const ranges: Record<Staves, {clef: Clef; low: number; high: number}[]> = {
  grand: [
    {clef: 'treble', low: step('C', 4), high: step('C', 6)},
    {clef: 'bass', low: step('C', 2), high: step('C', 4)},
  ],
  treble: [{clef: 'treble', low: step('A', 3), high: step('C', 6)}],
  bass: [{clef: 'bass', low: step('C', 2), high: step('E', 4)}],
};

export const letterOf = (note: Note): Letter => letters[note.step % 7];

export const inRange = (note: Note, staves: Staves) =>
  ranges[staves].some(r => r.clef === note.clef && note.step >= r.low && note.step <= r.high);

export function randomNote(staves: Staves, previous?: Note): Note {
  const options = ranges[staves];
  for (;;) {
    const {clef, low, high} = options[Math.floor(Math.random() * options.length)];
    const note = {clef, step: low + Math.floor(Math.random() * (high - low + 1))};
    if (!previous || letterOf(previous) !== letterOf(note)) return note;
  }
}

// Steps that need a ledger line drawn for this note (empty when it sits on the staff).
export function ledgerSteps({clef, step: s}: Note): number[] {
  const {bottom, top} = staffLines[clef];
  const out: number[] = [];
  for (let l = bottom - 2; l >= s; l -= 2) out.push(l);
  for (let l = top + 2; l <= s; l += 2) out.push(l);
  return out;
}
