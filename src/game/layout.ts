import type {Clef, Letter, Staves} from './notes';

export const SPACE = 18; // distance between staff lines

export type ButtonRect = {letter: Letter; x: number; y: number; w: number; h: number};

export type Layout = {
  width: number;
  height: number;
  staffLeft: number;
  staffRight: number;
  noteX: number;
  staffs: {clef: Clef; top: number}[];
  buttons: ButtonRect[];
};

// Answer buttons appear in musical-alphabet order starting from A.
const answerOrder: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Canvas geometry in game pixels; Phaser scales the whole canvas to fit its container. Compact layouts are narrow
// and put the answers in two rows, so buttons stay large enough to tap on a phone.
export function computeLayout(staves: Staves, compact: boolean): Layout {
  const width = compact ? 420 : 900;
  const staffLeft = compact ? 40 : 110;
  const staffRight = width - (compact ? 16 : 80);
  const clefEnd = staffLeft + 70;
  const noteX = Math.round((clefEnd + staffRight) / 2);

  // Leave three spaces above and below the staves for ledger-line notes and the clefs' overhang.
  const top = (compact ? 20 : 56) + 3 * SPACE;
  const staffs: Layout['staffs'] =
    staves === 'grand'
      ? [
          {clef: 'treble', top},
          {clef: 'bass', top: top + 8 * SPACE},
        ]
      : [{clef: staves, top}];
  const staffBottom = top + (staves === 'grand' ? 12 : 4) * SPACE;

  const rows = compact ? [answerOrder.slice(0, 4), answerOrder.slice(4)] : [answerOrder];
  const w = compact ? 90 : 88;
  const h = 64;
  const gap = compact ? 10 : 14;
  const buttonsTop = staffBottom + 3 * SPACE + (compact ? 24 : 48);
  const buttons = rows.flatMap((row, r) => {
    const startX = (width - (row.length * w + (row.length - 1) * gap)) / 2;
    return row.map((letter, i) => ({letter, x: startX + i * (w + gap), y: buttonsTop + r * (h + gap), w, h}));
  });

  const height = buttonsTop + rows.length * h + (rows.length - 1) * gap + (compact ? 20 : 40);
  return {width, height, staffLeft, staffRight, noteX, staffs, buttons};
}
