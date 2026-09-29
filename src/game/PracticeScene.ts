import {type GameObjects, type Input, Scene} from 'phaser';
import {load, save} from '../session';
import {type ButtonRect, type Layout, SPACE} from './layout';
import {
  type Clef,
  type Letter,
  type Note,
  type Staves,
  inRange,
  ledgerSteps,
  letterOf,
  letters,
  randomNote,
  staffLines,
} from './notes';

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

const HALF = SPACE / 2; // one diatonic step
const CLEF_FONT = '"Noto Music", serif';
const glyphs: Record<Clef, string> = {treble: '\u{1D11E}', bass: '\u{1D122}'};

type AnswerButton = ButtonRect & {bg: GameObjects.Graphics; hovered: boolean};

export class PracticeScene extends Scene {
  private note?: Note;
  private noteLayer!: GameObjects.Container;
  private buttons: AnswerButton[] = [];
  private locked = false;
  private theme: Theme = 'dark';
  private colors: Palette = palettes.dark;
  private staves: Staves = 'grand';
  private layout!: Layout;
  private zoom = 1;

  constructor() {
    super('practice');
  }

  // A theme change restarts the scene to redraw everything, carrying the current note over.
  create(data: {note?: Note}) {
    this.theme = this.registry.get('theme') === 'light' ? 'light' : 'dark';
    this.colors = palettes[this.theme];
    this.staves = this.registry.get('staves');
    this.layout = this.registry.get('layout');
    // The canvas is `zoom` times the layout size so it stays sharp on high-density screens.
    this.zoom = this.registry.get('zoom');
    this.cameras.main
      .setBackgroundColor(this.colors.paper)
      .setZoom(this.zoom)
      .centerOn(this.layout.width / 2, this.layout.height / 2);

    const onTheme = () => this.scene.restart({note: this.note});
    this.registry.events.on('changedata-theme', onTheme);
    this.events.once('shutdown', () => this.registry.events.off('changedata-theme', onTheme));

    this.drawStaves();
    this.noteLayer = this.add.container(0, 0);
    // Staff lines are drawn again above the note so they show through the whole-note hole.
    this.drawStaffLines(this.add.graphics());
    this.drawButtons();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const letter = letters.find(l => l === event.key.toUpperCase());
      if (letter) this.answer(letter);
    });

    const note = data.note ?? load<Note | null>('note', null);
    if (note && inRange(note, this.staves)) {
      this.note = note;
      this.drawNote(this.colors.ink);
      this.locked = false;
    } else {
      this.nextNote();
    }
  }

  private yOf(clef: Clef, step: number) {
    const top = this.layout.staffs.find(s => s.clef === clef)?.top ?? 0;
    return top + (staffLines[clef].top - step) * HALF;
  }

  private drawStaves() {
    const {staffLeft, staffRight, staffs} = this.layout;
    const g = this.add.graphics();
    this.drawStaffLines(g);

    const top = staffs[0].top;
    const bottom = staffs[staffs.length - 1].top + 4 * SPACE;
    g.lineStyle(1.5, this.colors.ink).lineBetween(staffRight, top, staffRight, bottom);
    if (this.staves === 'grand') {
      // System barline and brace joining both staves.
      g.lineStyle(2, this.colors.ink).lineBetween(staffLeft, top, staffLeft, bottom);
      this.drawBrace(staffLeft - 6, top, bottom);
    }

    for (const {clef} of staffs) this.drawClef(clef, staffLeft + 12);
  }

  // Noto Music follows SMuFL conventions: the glyph baseline sits on the bottom staff line and one staff space is
  // 0.225em. Drawing to our own canvas keeps that baseline exact, which Phaser's Text box metrics do not.
  private drawClef(clef: Clef, x: number) {
    const size = (SPACE / 0.225) * this.zoom;
    const above = size * 1.4;
    const key = `clef-${clef}-${this.theme}-${this.zoom}`;
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, size, size * 1.8);
      const ctx = texture?.getContext();
      if (!texture || !ctx) return;
      ctx.font = `${size}px ${CLEF_FONT}`;
      ctx.fillStyle = css(this.colors.ink);
      ctx.fillText(glyphs[clef], 0, above);
      texture.refresh();
    }
    this.add
      .image(x, this.yOf(clef, staffLines[clef].bottom), key)
      .setOrigin(0, above / (size * 1.8))
      .setScale(1 / this.zoom);
  }

  private drawStaffLines(g: GameObjects.Graphics) {
    const {staffLeft, staffRight, staffs} = this.layout;
    g.lineStyle(1.5, this.colors.ink);
    for (const {top} of staffs) {
      for (let i = 0; i < 5; i++) g.lineBetween(staffLeft, top + i * SPACE, staffRight, top + i * SPACE);
    }
  }

  // The font's brace glyph is cropped to its ink and stretched to span both staves.
  private drawBrace(x: number, top: number, bottom: number) {
    const key = `brace-${this.theme}-${this.zoom}`;
    if (!this.textures.exists(key)) {
      const probe = document.createElement('canvas').getContext('2d');
      if (!probe) return;
      probe.font = `${100 * this.zoom}px ${CLEF_FONT}`;
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
    this.buttons = this.layout.buttons.map(rect => {
      const button: AnswerButton = {...rect, bg: this.add.graphics(), hovered: false};
      const {letter, x, y, w, h} = button;
      this.paintButton(button);

      this.add
        .text(x + w / 2, y + h / 2, letter, {
          fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: '600',
          color: css(this.colors.ink),
        })
        .setOrigin(0.5)
        .setResolution(this.zoom);

      this.add
        .zone(x, y, w, h)
        .setOrigin(0)
        .setInteractive({useHandCursor: true})
        .on('pointerover', (pointer: Input.Pointer) => {
          // Touch has no hover; a tap would otherwise leave the button stuck in its hover color.
          if (pointer.wasTouch) return;
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
    const {x, y, w, h} = button;
    const fill = flash ?? (button.hovered ? this.colors.buttonHover : this.colors.button);
    button.bg
      .clear()
      .fillStyle(fill)
      .fillRoundedRect(x, y, w, h, 10)
      .lineStyle(1.5, flash ?? this.colors.buttonBorder)
      .strokeRoundedRect(x, y, w, h, 10);
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
    const {noteX} = this.layout;
    const y = this.yOf(note.clef, note.step);
    const head = this.add.graphics({x: noteX, y});
    head.fillStyle(color).fillEllipse(0, 0, 26, SPACE);
    const hole = this.add.graphics({x: noteX, y}).setRotation(-0.9);
    hole.fillStyle(this.colors.paper).fillEllipse(0, 0, 13, 9);

    const ledgers = this.add.graphics().lineStyle(1.5, this.colors.ink);
    for (const ledger of ledgerSteps(note)) {
      const ly = this.yOf(note.clef, ledger);
      ledgers.lineBetween(noteX - 22, ly, noteX + 22, ly);
    }
    this.noteLayer.add([head, hole, ledgers]);
  }

  private nextNote() {
    this.note = randomNote(this.staves, this.note);
    save('note', this.note);
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
