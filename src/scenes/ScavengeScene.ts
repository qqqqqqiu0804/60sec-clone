import Phaser from 'phaser';

// 搜刮阶段：俯视房间（AI 生成房间背景）+ Ted 跑动抓取物品/家人 + 60s 倒计时。
// 本期房间背景与家人立绘已接入；Ted 与物资暂用占位图形，下一轮切片为独立精灵。
export class ScavengeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private timeLeft = 60;
  private timerText!: Phaser.GameObjects.Text;
  private target: Phaser.Math.Vector2 | null = null;

  constructor() {
    super('Scavenge');
  }

  create() {
    const { width, height } = this.scale;

    // 房间背景（AI 生成）
    const bg = this.add.image(width / 2, height / 2, 'room');
    bg.setDisplaySize(width, height);

    // 半透明压暗，保证 HUD 可读
    this.add.rectangle(width / 2, height / 2, width, height, 0x2b2b2b, 0.18);

    // 家具占位（障碍，后续用真实家具精灵替换）
    this.add.rectangle(width * 0.3, height * 0.38, 90, 60, 0xcbb89c, 0.9).setStrokeStyle(2, 0x2b2b2b);
    this.add.rectangle(width * 0.7, height * 0.62, 80, 80, 0xb8a888, 0.9).setStrokeStyle(2, 0x2b2b2b);

    // 物资占位
    for (let i = 0; i < 10; i++) {
      this.add.circle(40 + Math.random() * (width - 80), 130 + Math.random() * (height - 300), 11, 0xe8b04b).setStrokeStyle(2, 0x2b2b2b);
    }
    // 家人占位
    for (let i = 0; i < 4; i++) {
      this.add.circle(40 + Math.random() * (width - 80), 130 + Math.random() * (height - 300), 13, 0x7a5c99).setStrokeStyle(2, 0x2b2b2b);
    }

    // 玩家 Ted（占位，待切片为角色精灵）
    this.player = this.add.circle(width / 2, height / 2, 16, 0xc0392b).setStrokeStyle(3, 0x2b2b2b);

    // HUD
    this.timerText = this.add
      .text(16, 16, '⏱ 60s', { fontFamily: 'sans-serif', fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold' })
      .setShadow(2, 2, '#2B2B2B')
      .setDepth(10);

    // 输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.target = new Phaser.Math.Vector2(p.worldX, p.worldY);
    });

    // 60s 倒计时
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText('⏱ ' + this.timeLeft + 's');
        if (this.timeLeft <= 0) {
          this.scene.start('Menu'); // 暂回菜单，下一轮接入避难所阶段
        }
      },
    });
  }

  update(_t: number, dt: number) {
    const speed = 0.22 * dt;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;

    if (dx || dy) {
      this.target = null;
      const len = Math.hypot(dx, dy);
      this.player.x += (dx / len) * speed;
      this.player.y += (dy / len) * speed;
    } else if (this.target) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
      if (d > 4) {
        const ang = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.target.x, this.target.y);
        this.player.x += Math.cos(ang) * Math.min(d, speed);
        this.player.y += Math.sin(ang) * Math.min(d, speed);
      } else {
        this.target = null;
      }
    }
  }
}
