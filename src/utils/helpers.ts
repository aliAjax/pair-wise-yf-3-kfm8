import type { SmellMemory, ReliveRecord } from './constants';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/* ---------------- 重现记录：记录层派生逻辑 ---------------- */

export function getReliveRecords(memory: SmellMemory): ReliveRecord[] {
  return memory.relive_records ?? [];
}

/** 最近一次重现记录（按日期倒序，日期相同按录入时间倒序） */
export function getLatestRelive(memory: SmellMemory): ReliveRecord | null {
  const records = getReliveRecords(memory);
  if (records.length === 0) return null;
  return [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      || new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}

export function getReliveById(memory: SmellMemory, reliveId: string): ReliveRecord | null {
  return getReliveRecords(memory).find((r) => r.id === reliveId) ?? null;
}

/**
 * 卡片/筛选实际使用的记忆视图：由「主记录」决定。
 * 主记录 id 为空（或为原始记录）时沿用原始值；
 * 指向某次重现时，来源/强度/是否想再闻由该次重现接管，其余字段保持原始值。
 */
export interface MemoryView extends SmellMemory {
  master_relive_id: string | null;
  master_relive: ReliveRecord | null;
  latest_relive: ReliveRecord | null;
  relive_count: number;
}

export function getMemoryView(memory: SmellMemory, masterReliveId: string | null): MemoryView {
  const latest = getLatestRelive(memory);
  const master = masterReliveId ? getReliveById(memory, masterReliveId) : null;
  return {
    ...memory,
    source_guess: master ? master.source_guess : memory.source_guess,
    intensity: master ? master.intensity : memory.intensity,
    want_again: master ? master.want_again : memory.want_again,
    master_relive_id: master ? master.id : null,
    master_relive: master,
    latest_relive: latest,
    relive_count: getReliveRecords(memory).length,
  };
}

/** 卡片上展示的「最近一次重现与原始值的差别」 */
export interface ReliveDiff {
  intensityDelta: number;
  sourceChanged: boolean;
  latestSource: string;
  wantAgainChanged: boolean;
  latestWantAgain: boolean;
  hasAnyChange: boolean;
}

export function getReliveDiff(memory: SmellMemory): ReliveDiff | null {
  const latest = getLatestRelive(memory);
  if (!latest) return null;
  const intensityDelta = latest.intensity - memory.intensity;
  const sourceChanged = latest.source_guess.trim() !== memory.source_guess.trim();
  const wantAgainChanged = latest.want_again !== memory.want_again;
  return {
    intensityDelta,
    sourceChanged,
    latestSource: latest.source_guess,
    wantAgainChanged,
    latestWantAgain: latest.want_again,
    hasAnyChange: intensityDelta !== 0 || sourceChanged || wantAgainChanged,
  };
}

/** 日期输入框取值：YYYY-MM-DD（本地时区） */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 把日期输入框的值转成 ISO（正午，避免时区跨过零点） */
export function fromDateInputValue(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
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

export interface Filters {
  smellType: string;
  season: string;
  emotion: string;
}

export function filterMemories<T extends SmellMemory>(memories: T[], filters: Filters): T[] {
  return memories.filter(m => {
    if (filters.smellType && m.smell_type !== filters.smellType) return false;
    if (filters.season && m.season !== filters.season) return false;
    if (filters.emotion && m.emotion !== filters.emotion) return false;
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
