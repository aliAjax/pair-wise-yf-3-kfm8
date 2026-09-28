import type { SmellMemory, Reencounter } from './constants';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

/** 重现记录用的短日期：2026.09.28 */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 把日期格式化为 <input type="date"> 需要的 YYYY-MM-DD */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface Filters {
  smellType: string;
  season: string;
  emotion: string;
  /** '' 全部 / 'yes' 想再闻 / 'no' 不想再闻（按主记录判定） */
  wantAgain: string;
}

/** 主记录条目：可以是原始封存，也可以是某次重现 */
export interface MemoryViewEntry {
  kind: 'original' | 'reencounter';
  source_guess: string;
  intensity: number;
  want_again: boolean;
  date: string;
  reencounter_id?: string;
}

/** 卡片/筛选/可视化统一消费的视图：原记忆静态字段 + 主记录决定的可变字段 */
export interface MemoryView extends SmellMemory {
  /** 原始封存值（永不被覆盖），用于与最近一次重现对照 */
  source_guess_original: string;
  intensity_original: number;
  want_again_original: boolean;
  /** 当前主记录（原始值或某次重现） */
  primaryEntry: MemoryViewEntry;
  /** 最近一次重现（若有），用于与原始值对照 */
  latestReencounter: Reencounter | null;
  /** 重现次数（不含原始封存） */
  reencounterCount: number;
}

/** 按时间从早到晚排列某条记忆的重现记录 */
export function getSortedReencounters(reencounters: Reencounter[], memoryId: string): Reencounter[] {
  return reencounters
    .filter((r) => r.memory_id === memoryId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/** 最近一次重现 */
export function getLatestReencounter(reencounters: Reencounter[], memoryId: string): Reencounter | null {
  const list = getSortedReencounters(reencounters, memoryId);
  return list.length ? list[list.length - 1] : null;
}

/** 解析一条记忆当前的主记录条目 */
export function getPrimaryEntry(memory: SmellMemory, reencounters: Reencounter[]): MemoryViewEntry {
  if (memory.primary_reencounter_id) {
    const pinned = reencounters.find(
      (r) => r.id === memory.primary_reencounter_id && r.memory_id === memory.id,
    );
    if (pinned) {
      return {
        kind: 'reencounter',
        source_guess: pinned.source,
        intensity: pinned.intensity,
        want_again: pinned.want_again,
        date: pinned.date,
        reencounter_id: pinned.id,
      };
    }
  }
  return {
    kind: 'original',
    source_guess: memory.source_guess,
    intensity: memory.intensity,
    want_again: memory.want_again,
    date: memory.created_at,
  };
}

/** 合并出主记录视图：卡片展示、筛选、可视化都以它为准 */
export function getMemoryView(memory: SmellMemory, reencounters: Reencounter[]): MemoryView {
  const list = getSortedReencounters(reencounters, memory.id);
  const primaryEntry = getPrimaryEntry(memory, reencounters);
  return {
    ...memory,
    // 原始值留存（原内容不覆盖）
    source_guess_original: memory.source_guess,
    intensity_original: memory.intensity,
    want_again_original: memory.want_again,
    // 主记录决定卡片与筛选
    source_guess: primaryEntry.source_guess,
    intensity: primaryEntry.intensity,
    want_again: primaryEntry.want_again,
    primaryEntry,
    latestReencounter: list.length ? list[list.length - 1] : null,
    reencounterCount: list.length,
  };
}

/** 最近一次重现相对原始值的差别（独立于主记录设置，始终是「最近一次 vs 原始」） */
export interface LatestDiff {
  intensityDelta: number;
  sourceChanged: boolean;
  wantAgainChanged: boolean;
  hasAny: boolean;
}

export function getLatestDiff(view: MemoryView): LatestDiff {
  const latest = view.latestReencounter;
  if (!latest) {
    return { intensityDelta: 0, sourceChanged: false, wantAgainChanged: false, hasAny: false };
  }
  // 来源沿用上一条：与原始封存值比较才有「变没变」的意义
  const sourceChanged = latest.source.trim() !== view.source_guess_original.trim();
  const wantAgainChanged = latest.want_again !== view.want_again_original;
  const intensityDelta = latest.intensity - view.intensity_original;
  return {
    intensityDelta,
    sourceChanged,
    wantAgainChanged,
    hasAny: intensityDelta !== 0 || sourceChanged || wantAgainChanged,
  };
}

export function filterMemories(memories: SmellMemory[], filters: Filters, reencounters: Reencounter[] = []): SmellMemory[] {
  return memories.filter(m => {
    if (filters.smellType && m.smell_type !== filters.smellType) return false;
    if (filters.season && m.season !== filters.season) return false;
    if (filters.emotion && m.emotion !== filters.emotion) return false;
    if (filters.wantAgain) {
      const view = getMemoryView(m, reencounters);
      if (filters.wantAgain === 'yes' && !view.want_again) return false;
      if (filters.wantAgain === 'no' && view.want_again) return false;
    }
    return true;
  });
}

export interface IntensityDistribution {
  bucket: string;
  count: number;
  range: [number, number];
}

export function getIntensityDistribution(memories: SmellMemory[]): IntensityDistribution[] {
  const buckets = [
    { bucket: '1-2', range: [1, 2] as [number, number] },
    { bucket: '3-4', range: [3, 4] as [number, number] },
    { bucket: '5-6', range: [5, 6] as [number, number] },
    { bucket: '7-8', range: [7, 8] as [number, number] },
    { bucket: '9-10', range: [9, 10] as [number, number] },
  ];
  return buckets.map(b => ({
    ...b,
    count: memories.filter(m => m.intensity >= b.range[0] && m.intensity <= b.range[1]).length,
  }));
}

export function getAverageIntensity(memories: SmellMemory[]): number {
  if (!memories.length) return 0;
  const sum = memories.reduce((acc, m) => acc + m.intensity, 0);
  return Math.round((sum / memories.length) * 10) / 10;
}

export function getTopIntensityMemories(memories: SmellMemory[], n = 5): SmellMemory[] {
  return [...memories].sort((a, b) => b.intensity - a.intensity).slice(0, n);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function contrastTextColor(hex: string): string {
  return isLightColor(hex) ? '#2A2118' : '#FBF7EE';
}
