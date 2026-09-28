import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion, ReliveRecord, ReliveInput } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { mockMemories } from '../data/mockData';

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

interface PersistedState {
  memories: SmellMemory[];
  /** 各记忆当前主记录：memoryId -> 某次重现记录的 id（无值/空串表示以原始记录为主） */
  master_ids: Record<string, string>;
}

interface MemoryStore extends PersistedState {
  /* 原始记忆 */
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  /** 移走（软删除）：原记忆与重现记录一起隐藏 */
  deleteMemory: (id: string) => void;
  /** 恢复：原记忆与重现记录一起回来 */
  restoreMemory: (id: string) => void;
  /** 永久删除：从档案中彻底抹除（含全部重现记录与主记录设置） */
  purgeMemory: (id: string) => void;
  initIfEmpty: () => void;

  /* 重现记录（独立维护，只追加，绝不覆盖原始内容） */
  addRelive: (memoryId: string, input: ReliveInput) => void;
  /** 设某次重现为主记录；传 null 则恢复以原始记录为主 */
  setMasterRelive: (memoryId: string, reliveId: string | null) => void;
}

/** 旧版本数据迁移：补齐重现记录列表与删除标记，原内容保持不动 */
function migrate(state: unknown): PersistedState {
  const s = (state ?? {}) as Partial<Pick<PersistedState, 'memories' | 'master_ids'>>;
  const memories = (s.memories ?? []).map((m) => ({
    ...m,
    relive_records: Array.isArray(m.relive_records) ? m.relive_records : [],
    deleted_at: m.deleted_at ?? null,
  }));
  return {
    memories,
    master_ids: s.master_ids ?? {},
  };
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      master_ids: {},

      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          created_at: now,
          updated_at: now,
          relive_records: [],
          deleted_at: null,
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

      deleteMemory: (id) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m,
          ),
        });
      },

      restoreMemory: (id) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id ? { ...m, deleted_at: null } : m,
          ),
        });
      },

      purgeMemory: (id) => {
        const { [id]: _removed, ...restMaster } = get().master_ids;
        void _removed;
        set({
          memories: get().memories.filter((m) => m.id !== id),
          master_ids: restMaster,
        });
      },

      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories, master_ids: mockMasterIds });
        }
      },

      addRelive: (memoryId, input) => {
        const record: ReliveRecord = {
          id: generateId(),
          ...input,
          created_at: new Date().toISOString(),
        };
        set({
          memories: get().memories.map((m) =>
            m.id === memoryId
              ? { ...m, relive_records: [...(m.relive_records ?? []), record] }
              : m,
          ),
        });
      },

      setMasterRelive: (memoryId, reliveId) => {
        set({
          master_ids: {
            ...get().master_ids,
            ...(reliveId ? { [memoryId]: reliveId } : { [memoryId]: '' }),
          },
        });
      },
    }),
    {
      name: 'scent-memory-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // 旧版本（v1 或无版本）数据补齐新字段
      migrate: (persisted) => migrate(persisted),
      merge: (persisted, current) => {
        const migrated = migrate(persisted);
        return { ...current, ...migrated };
      },
    },
  ),
);

/** 示例数据的主记录设置（由 mockData 中的重现场景决定） */
const mockMasterIds: Record<string, string> = {
  'mock-008': 'mock-008-r2',
};
