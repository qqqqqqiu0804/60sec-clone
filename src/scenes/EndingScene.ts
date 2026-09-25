import Phaser from 'phaser';
import type { EndingKind, GameState } from '../core/types';
import { cnWrap } from '../ui/wrap';

const INK = 0x2b2b2b;
const RED = 0xc0392b;

const KIND_COLOR: Record<EndingKind, number> = {
  rescue: 0x6fcf6f,
  survivor: 0xe8b04b,
  lone: 0xd98a4a,
  wipeout: 0x9a9384,
};

export class EndingScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super('Ending');
  }

  init(data: { state: GameState }) {
    this.state = data.state;
  }

  create() {
    const { width, height } = this.scale;
    const s = this.state;
    const ending = s.ending!;
    const color = KIND_COLOR[ending.kind];

    this.cameras.main.fadeIn(350, 43, 43, 43);

    this.add.rectangle(width / 2, height / 2, width, height, 0x23211e);

    const fam = this.add.image(width / 2, height * 0.3, 'family');
    fam.setDisplaySize(width * 0.7, width * 0.7).setAlpha(0.12).setTint(color);

    this.add
      .text(width / 2, 90, ending.title, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '34px',
        color: '#' + color.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000');

    this.add
      .text(width / 2, 170, ending.text, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '16px',
        color: '#F4E9D8',
        align: 'center',
        lineSpacing: 6,
        ...cnWrap(width - 64),
      })
      .setOrigin(0.5, 0);

    // 战绩
    const alive = s.members.filter((m) => m.alive).map((m) => m.name);
    const dead = s.members.filter((m) => !m.alive).map((m) => m.name);
    const stats = [
      `坚持天数：第 ${s.day} 天`,
      `救援信号：${s.rescueProgress} / ${s.rescueNeeded}`,
      `生还：${alive.length ? alive.join('、') : '无'}`,
      `离世：${dead.length ? dead.join('、') : '——'}`,
    ];
    this.add
      .text(width / 2, 360, stats.join('\n'), {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#d9cfbd',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    this.makeButton(width / 2, height - 110, width - 90, 54, '再来一局', RED, () => {
      this.scene.start('Menu');
    });
    this.add
      .text(width / 2, height - 60, '手机点按即可重开', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '12px',
        color: '#9a9384',
      })
      .setOrigin(0.5);
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const r = this.add.rectangle(0, 0, w, h, color).setStrokeStyle(2, INK).setInteractive({ useHandCursor: true });
    const t = this.add
      .text(0, 0, label, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    c.add([r, t]);
    r.on('pointerdown', onClick);
    r.on('pointerover', () => r.setFillStyle(Phaser.Display.Color.IntegerToColor(color).darken(12).color));
    r.on('pointerout', () => r.setFillStyle(color));
    return c;
  }
}
