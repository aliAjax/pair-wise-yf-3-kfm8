import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion, Reencounter } from '../utils/constants';
import { generateId, getSortedReencounters } from '../utils/helpers';
import { mockMemories, mockReencounters } from '../data/mockData';

export interface MemoryInput {
  location: string;
  source_guess: string;
  intensity: number;
  humidity: number;
  season: Season;
  smell_type: SmellType;
  memory_text: string;
  color_association: string;
  emotion: Emotion;
  want_again: boolean;
}

/** 一次重现记录的录入内容（日期、来源、强度、是否还想再闻） */
export interface ReencounterInput {
  date: string;
  source: string;
  intensity: number;
  want_again: boolean;
  note?: string;
}

interface MemoryStore {
  // —— 记录层：原记忆与重现记录分别存放，互不覆盖 ——
  memories: SmellMemory[];
  reencounters: Reencounter[];

  // —— 原记忆动作 ——
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;

  // —— 重现记录动作（不修改原记忆任何字段） ——
  addReencounter: (memoryId: string, input: ReencounterInput) => void;

  // —— 状态层：主记录指针 ——
  setPrimary: (memoryId: string, reencounterId: string | null) => void;

  // —— 状态层 + 数据层：移走 / 恢复 / 彻底删除 ——
  archiveMemory: (id: string) => void;
  restoreMemory: (id: string) => void;
  purgeMemory: (id: string) => void;

  initIfEmpty: () => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      reencounters: [],

      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          created_at: now,
          updated_at: now,
          archived: false,
          primary_reencounter_id: null,
        };
        set({ memories: [newMem, ...get().memories] });
      },

      updateMemory: (id, input) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? { ...m, ...input, updated_at: new Date().toISOString() }
              : m,
          ),
        });
      },

      addReencounter: (memoryId, input) => {
        const memory = get().memories.find((m) => m.id === memoryId);
        if (!memory) return;
        const record: Reencounter = {
          id: generateId(),
          memory_id: memoryId,
          date: input.date,
          source: input.source,
          intensity: input.intensity,
          want_again: input.want_again,
          note: input.note,
          created_at: new Date().toISOString(),
        };
        set({ reencounters: [...get().reencounters, record] });
      },

      setPrimary: (memoryId, reencounterId) => {
        set({
          memories: get().memories.map((m) =>
            m.id === memoryId ? { ...m, primary_reencounter_id: reencounterId } : m,
          ),
        });
      },

      // 移走只改状态：原记忆与全部重现记录继续保留，只是一起隐藏
      archiveMemory: (id) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id ? { ...m, archived: true } : m,
          ),
        });
      },

      // 恢复后原记忆与重现记录一起回来；主记录指针未被清除，同样回来
      restoreMemory: (id) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id ? { ...m, archived: false } : m,
          ),
        });
      },

      // 彻底删除才清理数据：原记忆与其重现记录一并移除
      purgeMemory: (id) => {
        set({
          memories: get().memories.filter((m) => m.id !== id),
          reencounters: get().reencounters.filter((r) => r.memory_id !== id),
        });
      },

      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories, reencounters: mockReencounters });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // v1 -> v2：补齐记录层与状态层的新字段，老数据一条不丢
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as Partial<MemoryStore>;
        const memories = (state.memories ?? []).map((m: SmellMemory) => ({
          ...m,
          archived: m.archived ?? false,
          primary_reencounter_id: m.primary_reencounter_id ?? null,
        }));
        const result = {
          ...state,
          memories,
          reencounters: state.reencounters ?? [],
        } as MemoryStore;
        void version;
        return result;
      },
    },
  ),
);

/** 新重现沿用上一条来源：取该记忆最近一次重现的来源，没有则用原始封存的来源猜测 */
export function getDefaultReencounterSource(
  memory: SmellMemory,
  reencounters: Reencounter[],
): string {
  const list = getSortedReencounters(reencounters, memory.id);
  if (list.length) return list[list.length - 1].source;
  return memory.source_guess;
}
