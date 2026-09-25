import Phaser from 'phaser';

const RED = 0xc0392b;
const INK = 0x2b2b2b;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    // 一家人立绘（AI 生成素材）作主视觉
    const fam = this.add.image(width / 2, height * 0.30, 'family');
    fam.setDisplaySize(width * 0.82, width * 0.82);

    // 标题
    this.add
      .text(width / 2, height * 0.56, '60秒生存', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '52px',
        color: '#C0392B',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(3, 3, '#E8B04B', 0, true, true);

    this.add
      .text(width / 2, height * 0.56 + 50, '复刻版 · 核警报拉响，你只有 60 秒', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#F4E9D8',
      })
      .setOrigin(0.5);

    // 开始按钮
    const btn = this.add
      .rectangle(width / 2, height * 0.72, 220, 64, RED)
      .setStrokeStyle(3, INK)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height * 0.72, '开始生存', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '24px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('Scavenge'));
    btn.on('pointerover', () => btn.setFillStyle(0xa83229));
    btn.on('pointerout', () => btn.setFillStyle(RED));

    this.add
      .text(width / 2, height * 0.72 + 56, '手机：点按移动　桌面：WASD / 方向键', {
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontSize: '13px',
        color: '#9a9384',
      })
      .setOrigin(0.5);
  }
}
