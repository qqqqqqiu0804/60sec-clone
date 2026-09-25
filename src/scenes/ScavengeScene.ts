import Phaser from 'phaser';
import { CARRY_CAPACITY } from '../core/engine';
import { ITEM_DEFS, RESCUABLE_FAMILY, SCAVENGE_SPAWN } from '../core/content';
import type { ItemId } from '../core/types';

const INK = 0x2b2b2b;
const RED = 0xc0392b;

interface Pickup {
  obj: Phaser.GameObjects.Container;
  id: ItemId;
  x: number;
  y: number;
  taken: boolean;
}
interface FamPick {
  obj: Phaser.GameObjects.Container;
  id: string;
  name: string;
  x: number;
  y: number;
  taken: boolean;
}

export class ScavengeScene extends Phaser.Scene {
  private ted!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private timeLeft = 60;
  private timerText!: Phaser.GameObjects.Text;
  private target: Phaser.Math.Vector2 | null = null;
  private items: Pickup[] = [];
  private fams: FamPick[] = [];
  private carried: ItemId[] = [];
  private rescued: string[] = [];
  private slots: Phaser.GameObjects.Rectangle[] = [];
  private carryText!: Phaser.GameObjects.Text;
  private rescuedText!: Phaser.GameObjects.Text;
  private flashText!: Phaser.GameObjects.Text;
  private furniture: { x: number; y: number; w: number; h: number }[] = [];
  private ended = false;

  constructor() {
    super('Scavenge');
  }

  create() {
    this.ended = false;
    this.items = [];
    this.fams = [];
    this.carried = [];
    this.rescued = [];
    const { width, height } = this.scale;

    // 房间背景（AI 生成素材）
    const bg = this.add.image(width / 2, height / 2, 'room');
    bg.setDisplaySize(width, height);

    // 压暗保证 HUD 可读
    this.add.rectangle(width / 2, height / 2, width, height, 0x2b2b2b, 0.16);

    // 家具（装饰性障碍，略微挡路但不卡死）
    this.furniture = [
      { x: width * 0.28, y: height * 0.34, w: 96, h: 64 },
      { x: width * 0.72, y: height * 0.6, w: 84, h: 84 },
      { x: width * 0.5, y: height * 0.78, w: 120, h: 50 },
    ];
    for (const f of this.furniture) {
      this.add
        .rectangle(f.x, f.y, f.w, f.h, 0xcbb89c, 0.85)
        .setStrokeStyle(3, INK)
        .setDepth(1);
    }

    // 布置物资
    for (const sp of SCAVENGE_SPAWN) {
      for (let i = 0; i < sp.count; i++) {
        const p = this.freeSpot(width, height);
        const c = this.makeItem(sp.id, p.x, p.y);
        this.items.push({ obj: c, id: sp.id, x: p.x, y: p.y, taken: false });
      }
    }
    // 布置可救援家人
    for (const fid of RESCUABLE_FAMILY) {
      const p = this.freeSpot(width, height);
      const name = fid === 'dolores' ? '多洛雷斯' : fid === 'mary' ? '玛丽珍' : '蒂米';
      const c = this.makeFamily(fid, name, p.x, p.y);
      this.fams.push({ obj: c, id: fid, name, x: p.x, y: p.y, taken: false });
    }

    // Ted（玩家）
    this.ted = this.makeTed(width / 2, height / 2);

    // 顶部 HUD：倒计时
    this.timerText = this.add
      .text(14, 12, '⏱ 60', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '26px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setShadow(2, 2, '#2B2B2B')
      .setDepth(50);

    // 右上角提示
    this.add
      .text(width - 14, 16, '核警报！冲进避难所', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '13px',
        color: '#F4E9D8',
      })
      .setOrigin(1, 0)
      .setDepth(50);

    // 底部：搬运槽位 + 文字
    const slotW = 22;
    const gap = 4;
    const totalW = CARRY_CAPACITY * slotW + (CARRY_CAPACITY - 1) * gap;
    const startX = (width - totalW) / 2 + slotW / 2;
    const slotY = height - 56;
    for (let i = 0; i < CARRY_CAPACITY; i++) {
      const r = this.add
        .rectangle(startX + i * (slotW + gap), slotY, slotW, slotW, 0x3a3a3a)
        .setStrokeStyle(2, 0x6b6256)
        .setDepth(50);
      this.slots.push(r);
    }
    this.carryText = this.add
      .text(width / 2, slotY - 22, `已搬 0 / ${CARRY_CAPACITY}`, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#F4E9D8',
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.rescuedText = this.add
      .text(width / 2, height - 22, '家人：泰德', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#E8B04B',
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.flashText = this.add
      .text(width / 2, height / 2, '', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '22px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setShadow(2, 2, '#C0392B');

    // 输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.target = new Phaser.Math.Vector2(p.worldX, p.worldY);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.target = new Phaser.Math.Vector2(p.worldX, p.worldY);
    });

    // 60s 倒计时
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return;
        this.timeLeft--;
        this.timerText.setText('⏱ ' + this.timeLeft);
        if (this.timeLeft <= 0) this.finish();
      },
    });
  }

  private freeSpot(width: number, height: number): { x: number; y: number } {
    for (let tries = 0; tries < 60; tries++) {
      const x = 40 + Math.random() * (width - 80);
      const y = 120 + Math.random() * (height - 260);
      let ok = true;
      for (const f of this.furniture) {
        if (Math.abs(x - f.x) < f.w / 2 + 22 && Math.abs(y - f.y) < f.h / 2 + 22) {
          ok = false;
          break;
        }
      }
      if (ok) return { x, y };
    }
    return { x: width / 2, y: height / 2 };
  }

  private makeItem(id: ItemId, x: number, y: number): Phaser.GameObjects.Container {
    const def = ITEM_DEFS[id];
    const c = this.add.container(x, y).setDepth(5);
    const circ = this.add.circle(0, 0, 14, def.color).setStrokeStyle(2, INK);
    const t = this.add
      .text(0, 0, def.char, {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    c.add([circ, t]);
    return c;
  }

  private makeFamily(id: string, name: string, x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y).setDepth(6);
    const circ = this.add.circle(0, 0, 16, 0x7a5c99).setStrokeStyle(3, INK);
    const t = this.add
      .text(0, 0, name[0], {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const tag = this.add
      .text(0, 22, '救我', { fontFamily: 'sans-serif', fontSize: '11px', color: '#F4E9D8' })
      .setOrigin(0.5);
    c.add([circ, t, tag]);
    return c;
  }

  private makeTed(x: number, y: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y).setDepth(10);
    const circ = this.add.circle(0, 0, 18, RED).setStrokeStyle(3, INK);
    const eyeL = this.add.circle(-6, -3, 2.5, 0xffffff);
    const eyeR = this.add.circle(6, -3, 2.5, 0xffffff);
    const t = this.add
      .text(0, 2, '泰', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    c.add([circ, eyeL, eyeR, t]);
    return c;
  }

  private showFlash(msg: string) {
    this.flashText.setText(msg).setAlpha(1);
    this.tweens.add({ targets: this.flashText, alpha: 0, duration: 700, delay: 250 });
  }

  update(_t: number, dt: number) {
    if (this.ended) return;
    const speed = 0.26 * dt;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;

    if (dx || dy) {
      this.target = null;
      const len = Math.hypot(dx, dy);
      this.tryMove((dx / len) * speed, (dy / len) * speed);
    } else if (this.target) {
      const d = Phaser.Math.Distance.Between(this.ted.x, this.ted.y, this.target.x, this.target.y);
      if (d > 4) {
        const ang = Phaser.Math.Angle.Between(this.ted.x, this.ted.y, this.target.x, this.target.y);
        this.tryMove(Math.cos(ang) * Math.min(d, speed), Math.sin(ang) * Math.min(d, speed));
      } else {
        this.target = null;
      }
    }

    this.collect();
  }

  // 轴分离移动，遇到家具则沿边滑过（不卡死）
  private tryMove(mx: number, my: number) {
    const r = 18;
    const nx = this.ted.x + mx;
    if (!this.hitsFurniture(nx, this.ted.y, r)) this.ted.x = Phaser.Math.Clamp(nx, r, this.scale.width - r);
    const ny = this.ted.y + my;
    if (!this.hitsFurniture(this.ted.x, ny, r)) this.ted.y = Phaser.Math.Clamp(ny, r, this.scale.height - r);
  }

  private hitsFurniture(x: number, y: number, r: number): boolean {
    for (const f of this.furniture) {
      if (Math.abs(x - f.x) < f.w / 2 + r && Math.abs(y - f.y) < f.h / 2 + r) return true;
    }
    return false;
  }

  private collect() {
    const pr = 24;
    for (const it of this.items) {
      if (it.taken) continue;
      if (Phaser.Math.Distance.Between(this.ted.x, this.ted.y, it.x, it.y) < pr) {
        if (this.carried.length >= CARRY_CAPACITY) {
          this.showFlash('搬不动了！');
          continue;
        }
        it.taken = true;
        this.carried.push(it.id);
        this.tweens.add({
          targets: it.obj,
          scale: 0,
          alpha: 0,
          duration: 180,
          onComplete: () => it.obj.destroy(),
        });
        this.refreshCarry();
      }
    }
    for (const f of this.fams) {
      if (f.taken) continue;
      if (Phaser.Math.Distance.Between(this.ted.x, this.ted.y, f.x, f.y) < pr + 4) {
        f.taken = true;
        this.rescued.push(f.id);
        this.tweens.add({
          targets: f.obj,
          scale: 0,
          alpha: 0,
          duration: 180,
          onComplete: () => f.obj.destroy(),
        });
        this.rescuedText.setText('家人：泰德' + (this.rescued.length ? '、' + this.rescued.map(this.famName).join('、') : ''));
      }
    }
  }

  private famName(id: string): string {
    return id === 'dolores' ? '多洛雷斯' : id === 'mary' ? '玛丽珍' : '蒂米';
  }

  private refreshCarry() {
    this.carryText.setText(`已搬 ${this.carried.length} / ${CARRY_CAPACITY}`);
    for (let i = 0; i < this.slots.length; i++) {
      const filled = i < this.carried.length;
      this.slots[i].setFillStyle(filled ? 0xe8b04b : 0x3a3a3a);
    }
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.cameras.main.fadeOut(350, 43, 43, 43);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Shelter', { carried: this.carried.slice(), rescued: this.rescued.slice() });
    });
  }
}
