import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ScavengeScene } from './scenes/ScavengeScene';
import { ShelterScene } from './scenes/ShelterScene';
import { EndingScene } from './scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#2B2B2B',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 854,
  },
  scene: [BootScene, MenuScene, ScavengeScene, ShelterScene, EndingScene],
};

// eslint-disable-next-line no-new
const game = new Phaser.Game(config);
// 暴露给自动化冒烟测试（无害，生产环境也可保留）
(window as unknown as { __game?: Phaser.Game }).__game = game;
