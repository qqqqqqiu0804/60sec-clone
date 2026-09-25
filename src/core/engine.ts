import { EVENT_DECK, FAMILY_DEFS, ITEM_DEFS } from './content';
import type { Choice, Ending, EventCard, FamilyMember, GameState, ItemId, Resources } from './types';

// Ted 一次能搬运的物资槽位上限（逼玩家做取舍）
export const CARRY_CAPACITY = 14;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// 由搜刮结果初始化避难所状态
export function createInitialState(carried: ItemId[], rescued: string[]): GameState {
  const resources: Resources = {};
  for (const id of carried) resources[id] = (resources[id] ?? 0) + 1;
  // 避难所自带的囤货底子，让开局不至于立刻断粮
  resources.food = (resources.food ?? 0) + 4;
  resources.water = (resources.water ?? 0) + 4;
  resources.medical = (resources.medical ?? 0) + 1;

  const members: FamilyMember[] = FAMILY_DEFS.map((m) => ({
    ...m,
    alive: m.id === 'ted' ? true : rescued.includes(m.id),
  }));

  return {
    day: 1,
    maxDays: 8,
    resources,
    members,
    flags: {},
    rescueProgress: 0,
    rescueNeeded: 3,
    usedOnce: [],
    log: ['核警报拉响，你们扑进避难所，铁门在身后落下。'],
    ending: null,
  };
}

// 当天消耗：每位存活家人吃 1 食物、喝 1 饮水
export function dailyConsume(s: GameState): void {
  const alive = s.members.filter((m) => m.alive);
  for (const m of alive) {
    if ((s.resources.food ?? 0) > 0) {
      s.resources.food! -= 1;
    } else {
      m.health = clamp(m.health - 8);
      m.mental = clamp(m.mental - 5);
      s.log.push(`${m.name} 饿了一天。`);
    }
    if ((s.resources.water ?? 0) > 0) {
      s.resources.water! -= 1;
    } else {
      m.health = clamp(m.health - 10);
      m.mental = clamp(m.mental - 5);
      s.log.push(`${m.name} 渴得嘴唇干裂。`);
    }
  }
  // 每隔几天用掉一份娱乐/书籍稳军心
  if (s.day % 3 === 0) {
    if ((s.resources.fun ?? 0) > 0) {
      s.resources.fun! -= 1;
      for (const m of alive) m.mental = clamp(m.mental + 4);
    } else if ((s.resources.book ?? 0) > 0) {
      s.resources.book! -= 1;
      for (const m of alive) m.mental = clamp(m.mental + 3);
    } else {
      for (const m of alive) m.mental = clamp(m.mental - 3);
    }
  }
  reapDeaths(s);
}

// 健康归零者离世
export function reapDeaths(s: GameState): void {
  for (const m of s.members) {
    if (m.alive && m.health <= 0) {
      m.alive = false;
      s.log.push(`${m.name} 没能撑过去……`);
    }
  }
}

function aliveMembers(s: GameState): FamilyMember[] {
  return s.members.filter((m) => m.alive);
}

function resolveTargets(s: GameState, target?: string): FamilyMember[] {
  if (target === 'all') return aliveMembers(s);
  if (target === 'random') {
    const a = aliveMembers(s);
    return a.length ? [a[Math.floor(Math.random() * a.length)]] : [];
  }
  const m = s.members.find((x) => x.id === target && x.alive);
  return m ? [m] : [];
}

// 选项是否满足前置资源
export function meetsRequire(s: GameState, c: Choice): boolean {
  if (!c.requires) return true;
  for (const k of Object.keys(c.requires) as ItemId[]) {
    if ((s.resources[k] ?? 0) < (c.requires[k] ?? 0)) return false;
  }
  return true;
}

// 结算一个选项，返回回显说明
export function applyChoice(s: GameState, card: EventCard, idx: number): string {
  const choice = card.choices[idx];
  const eff = choice.effect;

  if (eff.res) {
    for (const k of Object.keys(eff.res) as ItemId[]) {
      const next = (s.resources[k] ?? 0) + (eff.res[k] ?? 0);
      s.resources[k] = Math.max(0, next);
    }
  }
  if (eff.health || eff.mental) {
    for (const t of resolveTargets(s, eff.target)) {
      t.health = clamp(t.health + (eff.health ?? 0));
      t.mental = clamp(t.mental + (eff.mental ?? 0));
    }
  }
  if (eff.flag) s.flags[eff.flag] = true;
  if (eff.rescue) s.rescueProgress = Math.min(s.rescueNeeded, s.rescueProgress + 1);

  reapDeaths(s);
  const note = eff.note ?? '你做出了选择。';
  s.log.push(`[${card.title}] ${note}`);
  return note;
}

// 抽取当天事件（收音机任务与日常事件各走各的池子）
export function nextEvent(s: GameState): EventCard | null {
  const hasBattery = (s.resources.battery ?? 0) > 0;
  if (hasBattery && s.rescueProgress < s.rescueNeeded && Math.random() < 0.4) {
    const radio = EVENT_DECK.filter(
      (e) => e.kind === 'radio' && (!e.condition || e.condition(s)),
    );
    if (radio.length) {
      const card = radio[Math.floor(Math.random() * radio.length)];
      if (card.once && !s.usedOnce.includes(card.id)) s.usedOnce.push(card.id);
      return card;
    }
  }

  const pool = EVENT_DECK.filter(
    (e) =>
      e.kind !== 'radio' &&
      (!e.once || !s.usedOnce.includes(e.id)) &&
      (!e.condition || e.condition(s)),
  );
  if (pool.length === 0) return null;

  const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) {
      if (e.once && !s.usedOnce.includes(e.id)) s.usedOnce.push(e.id);
      return e;
    }
  }
  const last = pool[pool.length - 1];
  if (last.once && !s.usedOnce.includes(last.id)) s.usedOnce.push(last.id);
  return last;
}

// 推进到下一天：天数+1 -> 消耗 -> 判定结局
export function advanceDay(s: GameState): Ending | null {
  s.day += 1;
  dailyConsume(s);
  return checkEnding(s);
}

// 结局判定（优先级：救援 > 团灭 > 到期）
export function checkEnding(s: GameState): Ending | null {
  const alive = aliveMembers(s);

  if (s.rescueProgress >= s.rescueNeeded) {
    return buildEnding(s, 'rescue');
  }
  if (alive.length === 0) {
    return buildEnding(s, 'wipeout');
  }
  if (s.day > s.maxDays) {
    return buildEnding(s, alive.length === 1 && alive[0].id === 'ted' ? 'lone' : 'survivor');
  }
  return null;
}

function aliveNames(s: GameState): string {
  return s.members.filter((m) => m.alive).map((m) => m.name).join('、');
}

function buildEnding(s: GameState, kind: Ending['kind']): Ending {
  const who = aliveNames(s) || '无人生还';
  switch (kind) {
    case 'rescue':
      return {
        kind,
        title: '救援抵达',
        text: `第 ${s.day} 天，铁门外传来整齐的脚步声。军用卡车的光刺破尘雾，你们被带离了地底。\n存活：${who}。无线电没有白响。`,
      };
    case 'survivor':
      return {
        kind,
        title: '苦撑到头',
        text: `第 ${s.maxDays} 天过去，辐射尘慢慢落定。你们推开铁门，第一次看见灰白的天光。\n存活：${who}。活着，本身就是胜利。`,
      };
    case 'lone':
      return {
        kind,
        title: '只剩一人',
        text: `避难所里最终只剩泰德还喘着气。他抱着所有人的名字，走进了沉默的新世界。\n存活：${who}。`,
      };
    case 'wipeout':
    default:
      return {
        kind: 'wipeout',
        title: '归于寂静',
        text: `铁门再没打开过。多年后，有人在废墟里找到这只罐头，里面早已空了。\n无人生还。`,
      };
  }
}

// 给 UI 用的物资清单（按定义顺序，跳过 0）
const ITEM_NAMES: Record<ItemId, string> = Object.fromEntries(
  Object.values(ITEM_DEFS).map((d) => [d.id, d.name]),
) as Record<ItemId, string>;
const ITEM_CHARS: Record<ItemId, string> = Object.fromEntries(
  Object.values(ITEM_DEFS).map((d) => [d.id, d.char]),
) as Record<ItemId, string>;
const ITEM_COLORS: Record<ItemId, number> = Object.fromEntries(
  Object.values(ITEM_DEFS).map((d) => [d.id, d.color]),
) as Record<ItemId, number>;
const RESOURCE_ORDER: ItemId[] = ['food', 'water', 'medical', 'tool', 'fun', 'battery', 'map', 'book', 'gun'];

export function resourceList(s: GameState): { id: ItemId; name: string; char: string; color: number; n: number }[] {
  return RESOURCE_ORDER.filter((id) => (s.resources[id] ?? 0) > 0).map((id) => ({
    id,
    name: ITEM_NAMES[id],
    char: ITEM_CHARS[id],
    color: ITEM_COLORS[id],
    n: s.resources[id] ?? 0,
  }));
}
