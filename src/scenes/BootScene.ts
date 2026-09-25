import Phaser from 'phaser';

// 资源加载与全局初始化。美术素材由 AI 生成，放在 /assets。
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('room', 'assets/room.png');
    this.load.image('family', 'assets/family.png');
    this.load.image('items', 'assets/items.png');
  }

  create() {
    this.scene.start('Menu');
  }
}
