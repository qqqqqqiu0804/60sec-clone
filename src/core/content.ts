import type { EventCard, FamilyMember, ItemDef, ItemId } from './types';

// ───────────────────────── 物资定义 ─────────────────────────
export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  food: { id: 'food', name: '罐头食物', char: '食', color: 0xe8b04b, desc: '每天每人要吃掉一份' },
  water: { id: 'water', name: '干净饮水', char: '水', color: 0x4aa3df, desc: '每天每人要喝掉一份' },
  medical: { id: 'medical', name: '医疗包', char: '医', color: 0xe05a5a, desc: '治疗伤病，恢复生命' },
  tool: { id: 'tool', name: '工具', char: '工', color: 0x9aa0a6, desc: '修修补补、应对突发状况' },
  fun: { id: 'fun', name: '娱乐', char: '乐', color: 0xb084e6, desc: '下棋听唱片，稳住精神' },
  battery: { id: 'battery', name: '电池', char: '电', color: 0x6fcf6f, desc: '让收音机持续发声，呼叫救援' },
  map: { id: 'map', name: '地图', char: '图', color: 0xd9a066, desc: '了解外界，减少迷路风险' },
  book: { id: 'book', name: '书籍', char: '书', color: 0xcf9b6b, desc: '睡前读物，安抚情绪' },
  gun: { id: 'gun', name: '手枪', char: '枪', color: 0x707880, desc: '威慑闯入者，但别走火' },
};

// 搜刮阶段房间里刷新的物资及数量
export const SCAVENGE_SPAWN: { id: ItemId; count: number }[] = [
  { id: 'food', count: 14 },
  { id: 'water', count: 14 },
  { id: 'medical', count: 5 },
  { id: 'tool', count: 5 },
  { id: 'fun', count: 4 },
  { id: 'battery', count: 3 },
  { id: 'map', count: 2 },
  { id: 'book', count: 2 },
  { id: 'gun', count: 1 },
];

// 可救援的家人（Ted 默认在场，无需救援）
export const FAMILY_DEFS: FamilyMember[] = [
  { id: 'ted', name: '泰德', role: '一家之主', alive: true, health: 100, mental: 100 },
  { id: 'dolores', name: '多洛雷斯', role: '妻子', alive: true, health: 100, mental: 100 },
  { id: 'mary', name: '玛丽珍', role: '女儿', alive: true, health: 100, mental: 100 },
  { id: 'timmy', name: '蒂米', role: '儿子', alive: true, health: 100, mental: 100 },
];

export const RESCUABLE_FAMILY = ['dolores', 'mary', 'timmy'];

// ───────────────────────── 事件卡组 ─────────────────────────
// 数据驱动：渲染层只需把 choices 画成按钮，effect 交由 engine 结算。
export const EVENT_DECK: EventCard[] = [
  // —— 日常事件 ——
  {
    id: 'rat',
    kind: 'daily',
    title: '地窖里的响动',
    text: '黑暗中传来窸窣声。是只大老鼠，还是别的什么？孩子们攥紧了你的衣角。',
    choices: [
      {
        label: '用工具做个捕鼠夹',
        requires: { tool: 1 },
        requiresText: '需要 工具×1',
        effect: { res: { tool: -1 }, note: '你守住了存粮，全家安心不少。', mental: 5, target: 'all' },
      },
      {
        label: '装作没听见',
        effect: { note: '第二天发现少了一罐食物。', res: { food: -1 }, mental: -5, target: 'all' },
      },
    ],
  },
  {
    id: 'story_time',
    kind: 'daily',
    title: '漫长的夜晚',
    text: '辐射尘遮住了太阳，密闭的避难所里时间变得粘稠。需要找点事做。',
    choices: [
      {
        label: '拿出娱乐用品，全家联欢',
        requires: { fun: 1 },
        requiresText: '需要 娱乐×1',
        effect: { res: { fun: -1 }, mental: 12, target: 'all', note: '笑声让狭小的屋子宽敞了些。' },
      },
      {
        label: '给孩子们读会儿书',
        requires: { book: 1 },
        requiresText: '需要 书籍×1',
        effect: { res: { book: -1 }, mental: 8, target: 'all', note: '书页翻动，恐惧被暂时压下。' },
      },
      {
        label: '各自发呆',
        effect: { mental: -8, target: 'all', note: '沉默像霉斑一样蔓延。' },
      },
    ],
  },
  {
    id: 'sickness',
    kind: 'daily',
    title: '咳嗽声',
    text: '有人发起高烧，脸颊烧得通红，呼吸也变得急促。',
    choices: [
      {
        label: '动用医疗包',
        requires: { medical: 1 },
        requiresText: '需要 医疗包×1',
        effect: { res: { medical: -1 }, health: 30, mental: 5, target: 'random', note: '药物见效，烧退了。' },
      },
      {
        label: '硬扛过去',
        effect: { health: -20, mental: -5, target: 'random', note: '没有药，只能靠身体硬撑。' },
      },
    ],
  },
  {
    id: 'knock',
    kind: 'daily',
    title: '门外的敲击',
    text: '三长两短。是邻居？还是辐射变异的什么东西在模仿人类？',
    choices: [
      {
        label: '用枪指门，喝令退后',
        requires: { gun: 1 },
        requiresText: '需要 手枪×1',
        effect: { note: '门外没了声息。你手心都是汗。', mental: -5, target: 'all' },
      },
      {
        label: '屏住呼吸，假装没人',
        effect: { note: '敲击声渐渐远去。', mental: -8, target: 'all' },
      },
      {
        label: '开条缝看一眼',
        effect: { health: -15, mental: -15, target: 'random', note: '门外空无一人——但你的精神受了重创。' },
      },
    ],
  },
  {
    id: 'scout',
    kind: 'daily',
    title: '外出搜刮',
    text: '避难所外似乎还有物资，但辐射风险不小。要不要派人出去？',
    choices: [
      {
        label: '派一名家人外出',
        effect: {
          res: { food: 2, water: 1 },
          health: -10,
          target: 'random',
          note: '带回了食物饮水，但这个人受了辐射。',
        },
      },
      {
        label: '谁也不派，守在屋里',
        effect: { mental: -5, target: 'all', note: '安全，但也错过了补给。' },
      },
    ],
  },

  // —— 灾害事件 ——
  {
    id: 'leak',
    kind: 'disaster',
    title: '管道渗漏',
    text: '一股刺鼻气味从接缝渗出——可能是毒气，也可能是漏了的清洁剂。',
    choices: [
      {
        label: '用工具封住裂缝',
        requires: { tool: 1 },
        requiresText: '需要 工具×1',
        effect: { res: { tool: -1 }, note: '你及时封堵，虚惊一场。' },
      },
      {
        label: '捂住口鼻躲远点',
        effect: { health: -12, mental: -6, target: 'random', note: '有人吸进了些怪味。' },
      },
    ],
  },
  {
    id: 'quake',
    kind: 'disaster',
    title: '余震',
    text: '地面毫无征兆地摇晃，架子上的东西哗啦倒了一地。',
    choices: [
      {
        label: '护住孩子',
        effect: { health: -8, target: 'ted', mental: -4, note: '你扑过去护住孩子，自己擦伤了。' },
      },
      {
        label: '先稳住存粮',
        effect: { res: { food: -1 }, note: '你保住了大部分口粮，但有人擦伤了。', health: -6, target: 'random' },
      },
    ],
  },

  // —— 剧情/一次性事件 ——
  {
    id: 'anniversary',
    kind: 'story',
    once: true,
    title: '纪念日',
    text: '你忽然想起，今天本该是和多洛雷斯的结婚纪念日。',
    condition: (s) => s.members.some((m) => m.id === 'dolores' && m.alive),
    choices: [
      {
        label: '用最后的娱乐用品庆祝',
        requires: { fun: 1 },
        requiresText: '需要 娱乐×1',
        effect: { res: { fun: -1 }, mental: 15, target: 'all', note: '她笑了，眼里闪着光。' },
      },
      {
        label: '默默记在心里',
        effect: { mental: 4, target: 'dolores', note: '你什么也没说，但握了握她的手。' },
      },
    ],
  },

  // —— 收音机救援任务（condition 内判定是否有电池）——
  {
    id: 'radio_signal',
    kind: 'radio',
    title: '收音机：军用频段',
    text: '电流声里挤出一句人话：「幸存者，按指令发送坐标，我们会评估。」',
    condition: (s) => (s.resources.battery ?? 0) > 0,
    choices: [
      {
        label: '消耗补给，持续发报',
        requires: { food: 1, water: 1 },
        requiresText: '需要 食物×1 饮水×1',
        effect: {
          res: { food: -1, water: -1 },
          rescue: true,
          note: '坐标发出去了。对方记下了你的呼号。',
          mental: 6,
          target: 'all',
        },
      },
      {
        label: '省着点，这次不发了',
        effect: { note: '你关小了音量，怕暴露也怕浪费电。', mental: -4, target: 'all' },
      },
    ],
  },
  {
    id: 'radio_resupply',
    kind: 'radio',
    title: '收音机：空投指令',
    text: '「附近有空投点，照地图去取，我们算你一份。」',
    condition: (s) => (s.resources.battery ?? 0) > 0 && (s.resources.map ?? 0) > 0,
    choices: [
      {
        label: '按地图去找空投',
        requires: { map: 1 },
        requiresText: '需要 地图×1',
        effect: {
          res: { map: -1, food: 3, medical: 1 },
          rescue: true,
          note: '你摸黑取回了空投，补给多了，救援进度+1。',
          mental: 8,
          target: 'all',
        },
      },
      {
        label: '太危险，放弃',
        effect: { note: '空投终究没去成。', mental: -3, target: 'all' },
      },
    ],
  },
  {
    id: 'radio_morale',
    kind: 'radio',
    title: '收音机：自由电台',
    text: '一段老歌之后，主持人说：「坚持住，同胞们，黎明终会来。」',
    condition: (s) => (s.resources.battery ?? 0) > 0,
    choices: [
      {
        label: '让大家一起听',
        effect: { mental: 10, target: 'all', rescue: true, note: '希望像火星一样被点燃。救援进度+1。' },
      },
      {
        label: '关掉，省电',
        effect: { note: '你掐灭了那点光。', mental: -4, target: 'all' },
      },
    ],
  },
];
