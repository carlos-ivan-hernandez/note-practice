import {type GameObjects, Scene} from 'phaser';
import {type Clef, type Letter, type Note, ledgerSteps, letterOf, letters, randomNote, staffLines} from './notes';

export const WIDTH = 900;
export const HEIGHT = 540;

export type Theme = 'light' | 'dark';

// Dark mode inverts the page: white ink on black paper.
const palettes = {
  light: {
    paper: 0xf7f5ef,
    ink: 0x1f2328,
    button: 0xffffff,
    buttonHover: 0xece9df,
    buttonBorder: 0xd3cfc3,
    correct: 0x2f9e5b,
    wrong: 0xd64545,
  },
  dark: {
    paper: 0x000000,
    ink: 0xf5f5f5,
    button: 0x161616,
    buttonHover: 0x262626,
    buttonBorder: 0x3a3a3a,
    correct: 0x3fbf6f,
    wrong: 0xe25c5c,
  },
};
type Palette = (typeof palettes)[Theme];

export const paperColor = (theme: Theme) => css(palettes[theme].paper);
const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

const SPACE = 18; // distance between staff lines
const HALF = SPACE / 2; // one diatonic step
const STAFF_LEFT = 110;
const STAFF_RIGHT = 820;
const TREBLE_TOP = 120;
const BASS_TOP = TREBLE_TOP + 8 * SPACE;
const NOTE_X = 520;
const CLEF_FONT = '"Noto Music", serif';

// Answer buttons appear in musical-alphabet order starting from A.
const answerOrder: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const BUTTON_W = 88;
const BUTTON_H = 64;
const BUTTON_GAP = 14;
const BUTTON_Y = 440;

type AnswerButton = {letter: Letter; bg: GameObjects.Graphics; x: number; hovered: boolean};

const staffTop = (clef: Clef) => (clef === 'treble' ? TREBLE_TOP : BASS_TOP);
const yOf = (clef: Clef, step: number) => staffTop(clef) + (staffLines[clef].top - step) * HALF;

export class PracticeScene extends Scene {
  private note?: Note;
  private noteLayer!: GameObjects.Container;
  private buttons: AnswerButton[] = [];
  private locked = false;
  private theme: Theme = 'dark';
  private colors: Palette = palettes.dark;

  constructor() {
    super('practice');
  }

  // A theme change restarts the scene to redraw everything, carrying the current note over.
  create(data: {note?: Note}) {
    this.theme = this.registry.get('theme') === 'light' ? 'light' : 'dark';
    this.colors = palettes[this.theme];
    this.cameras.main.setBackgroundColor(this.colors.paper);

    const onTheme = () => this.scene.restart({note: this.note});
    this.registry.events.on('changedata-theme', onTheme);
    this.events.once('shutdown', () => this.registry.events.off('changedata-theme', onTheme));

    this.drawGrandStaff();
    this.noteLayer = this.add.container(0, 0);
    // Staff lines are drawn again above the note so they show through the whole-note hole.
    this.drawStaffLines(this.add.graphics());
    this.drawButtons();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const letter = letters.find(l => l === event.key.toUpperCase());
      if (letter) this.answer(letter);
    });

    if (data.note) {
      this.note = data.note;
      this.drawNote(this.colors.ink);
      this.locked = false;
    } else {
      this.nextNote();
    }
  }

  private drawGrandStaff() {
    const g = this.add.graphics();
    this.drawStaffLines(g);

    // System barline and brace joining both staves.
    const top = TREBLE_TOP;
    const bottom = BASS_TOP + 4 * SPACE;
    g.lineStyle(2, this.colors.ink).lineBetween(STAFF_LEFT, top, STAFF_LEFT, bottom);
    g.lineStyle(1.5, this.colors.ink).lineBetween(STAFF_RIGHT, top, STAFF_RIGHT, bottom);
    this.drawBrace(STAFF_LEFT - 6, top, bottom);

    this.drawClef('treble', '\u{1D11E}', STAFF_LEFT + 12);
    this.drawClef('bass', '\u{1D122}', STAFF_LEFT + 12);
  }

  // Noto Music follows SMuFL conventions: the glyph baseline sits on the bottom staff line and one staff space is
  // 0.225em. Drawing to our own canvas keeps that baseline exact, which Phaser's Text box metrics do not.
  private drawClef(clef: Clef, glyph: string, x: number) {
    const size = SPACE / 0.225;
    const above = size * 1.4;
    const key = `clef-${clef}-${this.theme}`;
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, size, size * 1.8);
      const ctx = texture?.getContext();
      if (!texture || !ctx) return;
      ctx.font = `${size}px ${CLEF_FONT}`;
      ctx.fillStyle = css(this.colors.ink);
      ctx.fillText(glyph, 0, above);
      texture.refresh();
    }
    this.add.image(x, yOf(clef, staffLines[clef].bottom), key).setOrigin(0, above / (size * 1.8));
  }

  private drawStaffLines(g: GameObjects.Graphics) {
    g.lineStyle(1.5, this.colors.ink);
    for (const clef of ['treble', 'bass'] as const) {
      for (let i = 0; i < 5; i++) {
        const y = staffTop(clef) + i * SPACE;
        g.lineBetween(STAFF_LEFT, y, STAFF_RIGHT, y);
      }
    }
  }

  // The font's brace glyph is cropped to its ink and stretched to span both staves.
  private drawBrace(x: number, top: number, bottom: number) {
    const key = `brace-${this.theme}`;
    if (!this.textures.exists(key)) {
      const probe = document.createElement('canvas').getContext('2d');
      if (!probe) return;
      probe.font = `100px ${CLEF_FONT}`;
      const m = probe.measureText('\u{1D114}');
      const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
      const texture = this.textures.createCanvas(key, w, h);
      const ctx = texture?.getContext();
      if (!texture || !ctx) return;
      ctx.font = probe.font;
      ctx.fillStyle = css(this.colors.ink);
      ctx.fillText('\u{1D114}', m.actualBoundingBoxLeft, m.actualBoundingBoxAscent);
      texture.refresh();
    }
    this.add
      .image(x, top, key)
      .setOrigin(1, 0)
      .setDisplaySize(SPACE * 1.1, bottom - top);
  }

  private drawButtons() {
    const total = answerOrder.length * BUTTON_W + (answerOrder.length - 1) * BUTTON_GAP;
    const startX = (WIDTH - total) / 2;

    this.buttons = answerOrder.map((letter, i) => {
      const x = startX + i * (BUTTON_W + BUTTON_GAP);
      const button: AnswerButton = {letter, x, bg: this.add.graphics(), hovered: false};
      this.paintButton(button);

      this.add
        .text(x + BUTTON_W / 2, BUTTON_Y + BUTTON_H / 2, letter, {
          fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: '600',
          color: css(this.colors.ink),
        })
        .setOrigin(0.5);

      this.add
        .zone(x, BUTTON_Y, BUTTON_W, BUTTON_H)
        .setOrigin(0)
        .setInteractive({useHandCursor: true})
        .on('pointerover', () => {
          button.hovered = true;
          this.paintButton(button);
        })
        .on('pointerout', () => {
          button.hovered = false;
          this.paintButton(button);
        })
        .on('pointerdown', () => this.answer(letter));

      return button;
    });
  }

  private paintButton(button: AnswerButton, flash?: number) {
    const fill = flash ?? (button.hovered ? this.colors.buttonHover : this.colors.button);
    button.bg
      .clear()
      .fillStyle(fill)
      .fillRoundedRect(button.x, BUTTON_Y, BUTTON_W, BUTTON_H, 10)
      .lineStyle(1.5, flash ?? this.colors.buttonBorder)
      .strokeRoundedRect(button.x, BUTTON_Y, BUTTON_W, BUTTON_H, 10);
  }

  private flashButton(letter: Letter, color: number) {
    const button = this.buttons.find(b => b.letter === letter);
    if (!button) return;
    this.paintButton(button, color);
    this.time.delayedCall(350, () => this.paintButton(button));
  }

  private drawNote(color: number) {
    const note = this.note;
    if (!note) return;
    this.noteLayer.removeAll(true);

    // Whole note: a wide oval with a tilted oval hole cut out of it.
    const y = yOf(note.clef, note.step);
    const head = this.add.graphics({x: NOTE_X, y});
    head.fillStyle(color).fillEllipse(0, 0, 26, SPACE);
    const hole = this.add.graphics({x: NOTE_X, y}).setRotation(-0.9);
    hole.fillStyle(this.colors.paper).fillEllipse(0, 0, 13, 9);

    const ledgers = this.add.graphics().lineStyle(1.5, this.colors.ink);
    for (const ledger of ledgerSteps(note)) {
      const ly = yOf(note.clef, ledger);
      ledgers.lineBetween(NOTE_X - 22, ly, NOTE_X + 22, ly);
    }
    this.noteLayer.add([head, hole, ledgers]);
  }

  private nextNote() {
    this.note = randomNote(this.note);
    this.drawNote(this.colors.ink);
    this.noteLayer.setAlpha(0).setX(12);
    this.tweens.add({targets: this.noteLayer, alpha: 1, x: 0, duration: 180, ease: 'Cubic.easeOut'});
    this.locked = false;
  }

  private answer(letter: Letter) {
    if (!this.note || this.locked) return;

    if (letter === letterOf(this.note)) {
      this.locked = true;
      this.flashButton(letter, this.colors.correct);
      this.drawNote(this.colors.correct);
      this.time.delayedCall(450, () => this.nextNote());
    } else {
      this.flashButton(letter, this.colors.wrong);
      this.tweens.add({targets: this.noteLayer, x: {from: -6, to: 0}, duration: 60, yoyo: true, repeat: 2});
    }
  }
}
