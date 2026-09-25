// 引擎无关的核心类型定义。该文件不依赖 Phaser，
// 任何渲染层（Phaser / DOM / 测试）都可复用。

export type ItemId =
  | 'food'
  | 'water'
  | 'medical'
  | 'tool'
  | 'fun'
  | 'battery'
  | 'map'
  | 'book'
  | 'gun';

export interface ItemDef {
  id: ItemId;
  name: string;
  char: string; // 画在精灵上的汉字标签
  color: number; // 0xRRGGBB
  desc: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  alive: boolean;
  health: number; // 0-100
  mental: number; // 0-100
}

export type Resources = Partial<Record<ItemId, number>>;

export interface Effect {
  res?: Resources; // 资源增减（负数为消耗）
  target?: string; // 受影响的家人 id；'all' / 'random' / 具体 id
  health?: number; // 生命增减
  mental?: number; // 精神增减
  flag?: string; // 置位一个标记
  rescue?: boolean; // 该选项是否推进救援进度
  note?: string; // 选择后回显的说明
}

export interface Choice {
  label: string;
  requires?: Resources; // 需要的资源下限，不满足则禁用
  requiresText?: string;
  effect: Effect;
}

export type EventKind = 'daily' | 'radio' | 'disaster' | 'story';

export interface EventCard {
  id: string;
  kind: EventKind;
  title: string;
  text: string;
  weight?: number; // 抽取权重，默认 1
  once?: boolean; // 仅触发一次
  condition?: (s: GameState) => boolean;
  choices: Choice[];
}

export type EndingKind = 'rescue' | 'survivor' | 'lone' | 'wipeout';

export interface Ending {
  kind: EndingKind;
  title: string;
  text: string;
}

export interface GameState {
  day: number;
  maxDays: number;
  resources: Resources;
  members: FamilyMember[];
  flags: Record<string, boolean>;
  rescueProgress: number;
  rescueNeeded: number;
  usedOnce: string[];
  log: string[];
  ending: Ending | null;
}
