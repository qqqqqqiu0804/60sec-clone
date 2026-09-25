import Phaser from 'phaser';
import {
  advanceDay,
  applyChoice,
  createInitialState,
  meetsRequire,
  nextEvent,
  resourceList,
} from '../core/engine';
import type { EventCard, GameState, ItemId } from '../core/types';
import { cnWrap } from '../ui/wrap';

const INK = 0x2b2b2b;
const CREAM = 0xf4e9d8;
const RED = 0xc0392b;
const YELLOW = 0xe8b04b;
const PURPLE = 0x7a5c99;

export class ShelterScene extends Phaser.Scene {
  private state!: GameState;
  private ui!: Phaser.GameObjects.Container;
  private noteBox!: Phaser.GameObjects.Container;
  private currentCard: EventCard | null = null;
  private awaitingNext = false;

  constructor() {
    super('Shelter');
  }

  init(data: { carried: ItemId[]; rescued: string[] }) {
    this.state = createInitialState(data.carried ?? [], data.rescued ?? []);
    this.currentCard = null;
    this.awaitingNext = false;
  }

  create() {
    const { width, height } = this.scale;

    // 避难所背景：深色 + 一家人立绘作淡淡背景（复用 AI 素材）
    this.add.rectangle(width / 2, height / 2, width, height, 0x23211e);
    const fam = this.add.image(width / 2, height * 0.52, 'family');
    fam.setDisplaySize(width * 1.1, width * 1.1).setAlpha(0.1).setTint(0x8a8a8a);

    this.add
      .text(14, 12, '避难所 · 生存中', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#9a9384',
      })
      .setDepth(5);

    this.ui = this.add.container(0, 0).setDepth(10);

    this.renderDay();
  }

  // 渲染当天（顶部信息 + 事件卡）
  private renderDay() {
    this.ui.removeAll(true);
    const { width } = this.scale;
    const s = this.state;

    // —— 顶栏：天数 + 救援进度 ——
    const dayText = this.add
      .text(14, 40, `第 ${s.day} / ${s.maxDays} 天`, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '22px',
        color: '#F4E9D8',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const dots = Array.from({ length: s.rescueNeeded }, (_, i) =>
      i < s.rescueProgress ? '●' : '○',
    ).join('');
    const rescueText = this.add
      .text(width - 14, 40, `救援 ${dots} ${s.rescueProgress}/${s.rescueNeeded}`, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#6fcf6f',
      })
      .setOrigin(1, 0.5);

    // —— 物资条 ——
    const chips = resourceList(s);
    let cx = 14;
    let cy = 70;
    const chipW = 52;
    const chipH = 24;
    const gap = 5;
    for (const c of chips) {
      if (cx + chipW > width - 6) {
        cx = 14;
        cy += chipH + gap;
      }
      const col = '#' + c.color.toString(16).padStart(6, '0');
      const r = this.add.rectangle(cx + chipW / 2, cy + chipH / 2, chipW, chipH, 0x322f2b).setStrokeStyle(1.5, c.color);
      const t = this.add
        .text(cx + chipW / 2, cy + chipH / 2, `${c.char} ${c.n}`, {
          fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: col,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.ui.add([r, t]);
      cx += chipW + gap;
    }

    // —— 家人状态 ——
    const famY = cy + chipH + 16;
    const cardW = (width - 28 - 3 * 6) / 4;
    s.members.forEach((m, i) => {
      const fx = 14 + i * (cardW + 6);
      const fy = famY;
      const card = this.add.rectangle(fx + cardW / 2, fy + 34, cardW, 68, m.alive ? 0x322f2b : 0x1c1b19).setStrokeStyle(1.5, m.alive ? 0x6b6256 : 0x333);
      const name = this.add
        .text(fx + cardW / 2, fy + 12, m.alive ? m.name : '✝ ' + m.name, {
          fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
          fontSize: '12px',
          color: m.alive ? '#F4E9D8' : '#6b6256',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const hb = this.add.rectangle(fx + 6, fy + 30, cardW - 12, 7, 0x4a1f1c).setOrigin(0, 0.5);
      const hfill = this.add.rectangle(fx + 6, fy + 30, ((cardW - 12) * m.health) / 100, 7, RED).setOrigin(0, 0.5);
      const mb = this.add.rectangle(fx + 6, fy + 44, cardW - 12, 7, 0x3a2a45).setOrigin(0, 0.5);
      const mfill = this.add.rectangle(fx + 6, fy + 44, ((cardW - 12) * m.mental) / 100, 7, PURPLE).setOrigin(0, 0.5);
      this.ui.add([card, name, hb, hfill, mb, mfill]);
    });

    this.ui.add([dayText, rescueText]);

    // —— 事件卡 ——
    if (!this.currentCard) {
      this.currentCard = nextEvent(s);
    }
    if (this.currentCard) {
      this.renderCard(this.currentCard);
    } else {
      // 没有可抽事件：直接给个提示并进入下一天
      this.showNote('地窖里只剩沉默。又是一天。');
    }
  }

  private renderCard(card: EventCard) {
    const { width } = this.scale;
    const panelX = 14;
    const panelW = width - 28;
    const top = 300;

    const kindColor =
      card.kind === 'radio' ? '#6fcf6f' : card.kind === 'disaster' ? '#e05a5a' : card.kind === 'story' ? '#e8b04b' : '#F4E9D8';
    const kindLabel = card.kind === 'radio' ? '📻 收音机' : card.kind === 'disaster' ? '⚠ 灾害' : card.kind === 'story' ? '✦ 往事' : '日常';

    const title = this.add
      .text(panelX + 14, top + 14, card.title, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '20px',
        color: '#F4E9D8',
        fontStyle: 'bold',
        ...cnWrap(panelW - 28),
      });
    const tag = this.add
      .text(panelX + 14, top + 44, kindLabel, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '13px',
        color: kindColor,
      });
    const body = this.add
      .text(panelX + 14, top + 66, card.text, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#d9cfbd',
        lineSpacing: 4,
        ...cnWrap(panelW - 28),
      });

    const bodyH = body.height + 90;
    const panelH = bodyH + card.choices.length * 64 + 20;
    const panel = this.add
      .rectangle(panelX + panelW / 2, top + panelH / 2, panelW, panelH, 0x2b2925)
      .setStrokeStyle(2, 0x6b6256);

    this.ui.add([panel, title, tag, body]);

    // 选项按钮
    let by = top + bodyH + 6;
    card.choices.forEach((ch, i) => {
      const enabled = meetsRequire(this.state, ch);
      const btn = this.makeButton(
        panelX + panelW / 2,
        by + 28,
        panelW - 24,
        56,
        enabled ? ch.label : ch.label + '\n(' + (ch.requiresText ?? '条件不足') + ')',
        enabled ? (card.kind === 'radio' ? 0x3a6b3a : RED) : 0x4a4a4a,
        () => this.choose(card, i),
        !enabled,
      );
      this.ui.add(btn);
      by += 64;
    });
  }

  private choose(card: EventCard, idx: number) {
    if (this.awaitingNext) return;
    const note = applyChoice(this.state, card, idx);
    this.currentCard = null;
    this.renderDay();
    this.showNote(note);
  }

  // 选择后的回显 + 下一天按钮
  private showNote(note: string) {
    const { width, height } = this.scale;
    this.awaitingNext = true;
    if (this.noteBox) this.noteBox.destroy();

    this.noteBox = this.add.container(0, 0).setDepth(20);
    const box = this.add.rectangle(width / 2, height - 120, width - 28, 96, 0x1f1d1a).setStrokeStyle(2, YELLOW);
    const t = this.add
      .text(width / 2, height - 150, note, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#F4E9D8',
        align: 'center',
        lineSpacing: 3,
        ...cnWrap(width - 56),
      })
      .setOrigin(0.5);
    const next = this.makeButton(
      width / 2,
      height - 78,
      width - 80,
      48,
      `进入第 ${this.state.day + 1} 天 ▶`,
      RED,
      () => this.toNextDay(),
    );
    this.noteBox.add([box, t, next]);
  }

  private toNextDay() {
    if (this.noteBox) this.noteBox.destroy();
    this.awaitingNext = false;
    const ending = advanceDay(this.state);
    if (ending) {
      this.state.ending = ending;
      this.cameras.main.fadeOut(350, 43, 43, 43);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Ending', { state: this.state });
      });
      return;
    }
    this.renderDay();
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
    disabled = false,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const r = this.add
      .rectangle(0, 0, w, h, color)
      .setStrokeStyle(2, INK)
      .setInteractive({ useHandCursor: !disabled });
    const t = this.add
      .text(0, 0, label, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
        ...cnWrap(w - 16),
      })
      .setOrigin(0.5);
    c.add([r, t]);
    if (!disabled) {
      r.on('pointerdown', onClick);
      r.on('pointerover', () => r.setFillStyle(Phaser.Display.Color.IntegerToColor(color).darken(12).color));
      r.on('pointerout', () => r.setFillStyle(color));
    }
    return c;
  }
}
