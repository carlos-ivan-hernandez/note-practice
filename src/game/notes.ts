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

// Practice range: up to two ledger lines outside each staff, meeting at middle C.
const ranges: Record<Clef, {low: number; high: number}> = {
  treble: {low: step('C', 4), high: step('C', 6)},
  bass: {low: step('C', 2), high: step('C', 4)},
};

export const letterOf = (note: Note): Letter => letters[note.step % 7];

export function randomNote(previous?: Note): Note {
  for (;;) {
    const clef: Clef = Math.random() < 0.5 ? 'treble' : 'bass';
    const {low, high} = ranges[clef];
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
