import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import FilterPanel from '../components/FilterPanel';
import VisualizationPanel from '../components/VisualizationPanel';
import MemoryCard from '../components/MemoryCard';
import MemoryModal from '../components/MemoryModal';
import ReliveModal from '../components/ReliveModal';
import TrashModal from '../components/TrashModal';
import { useMemoryStore } from '../store/memoryStore';
import type { Filters } from '../utils/helpers';
import { filterMemories, getMemoryView } from '../utils/helpers';
import type { SmellMemory, ReliveInput } from '../utils/constants';
import type { MemoryInput } from '../store/memoryStore';
import { BookOpenCheck } from 'lucide-react';

const defaultFilters: Filters = {
  smellType: '',
  season: '',
  emotion: '',
};

export default function Home() {
  const {
    memories,
    master_ids,
    initIfEmpty,
    addMemory,
    updateMemory,
    deleteMemory,
    restoreMemory,
    purgeMemory,
    addRelive,
    setMasterRelive,
  } = useMemoryStore();

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmellMemory | null>(null);
  const [reliveTarget, setReliveTarget] = useState<SmellMemory | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    initIfEmpty();
  }, [initIfEmpty]);

  // 移走的记忆与其重现记录一起隐藏，不出现在档案、筛选与可视化中
  const activeMemories = useMemo(
    () => memories.filter((m) => !m.deleted_at),
    [memories],
  );
  const trashedMemories = useMemo(
    () => memories
      .filter((m) => m.deleted_at)
      .sort((a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime()),
    [memories],
  );

  // 卡片/筛选/可视化统一以主记录取值构造视图
  const activeViews = useMemo(
    () => activeMemories.map((m) => getMemoryView(m, master_ids[m.id] ?? null)),
    [activeMemories, master_ids],
  );

  const filteredViews = useMemo(
    () => filterMemories(activeViews, filters),
    [activeViews, filters],
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const resetFilters = () => setFilters(defaultFilters);

  const openAddModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (m: SmellMemory) => { setEditing(m); setModalOpen(true); };
  const openReliveModal = (m: SmellMemory) => {
    // 打开前拿到最新数据（避免沿用过期对象）
    const fresh = useMemoryStore.getState().memories.find((x) => x.id === m.id) ?? m;
    setReliveTarget(fresh);
  };

  const handleSubmit = (data: MemoryInput) => {
    if (editing) {
      updateMemory(editing.id, data);
    } else {
      addMemory(data);
    }
  };

  const handleReliveSubmit = (memoryId: string, data: ReliveInput) => {
    addRelive(memoryId, data);
    setExpandedId(memoryId);
  };

  const handleMoveAway = (id: string) => {
    const target = memories.find((m) => m.id === id);
    const msg = `把「${target?.location ?? '这段记忆'}」移到回收站吗？它的重现记录会一起藏起来，随时可以恢复。`;
    if (window.confirm(msg)) {
      deleteMemory(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const scrollToCard = (id: string) => {
    setExpandedId(id);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-memory-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const hasFilter = !!(filters.smellType || filters.season || filters.emotion);

  return (
    <div className="min-h-screen">
      <Header
        onAdd={openAddModal}
        onOpenTrash={() => setTrashOpen(true)}
        memoryCount={activeMemories.length}
        trashCount={trashedMemories.length}
      />

      <main className="container max-w-6xl pb-20">
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          resultCount={filteredViews.length}
        />

        <VisualizationPanel memories={filteredViews} onSelect={scrollToCard} />

        <section className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-hand text-2xl text-ochre-600 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5" />
              气味档案
            </h2>
            <span className="text-xs text-ink-700/50">
              点击卡片展开完整回忆与重现档案
            </span>
          </div>

          {filteredViews.length === 0 ? (
            <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-20 text-center">
              <div className="text-6xl mb-4 select-none">🍂</div>
              <h3 className="font-serif text-2xl text-ink-800 mb-2">
                {hasFilter
                  ? '没有匹配的气味记忆'
                  : '还没有封存任何气味'}
              </h3>
              <p className="text-ink-700/60 max-w-md mx-auto mb-6">
                {hasFilter
                  ? '换一组筛选条件试试？或者先封存一段新的气味'
                  : '空气中一定有让你难忘的味道——无论是衣柜里的樟木香，还是雨后操场的青草气'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={openAddModal} className="btn-primary">
                  封存第一段气味
                </button>
                {hasFilter && (
                  <button onClick={resetFilters} className="btn-secondary">
                    清除筛选条件
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="masonry-grid">
              {filteredViews.map((m, idx) => (
                <div key={m.id} data-memory-id={m.id}>
                  <MemoryCard
                    memory={m}
                    masterReliveId={m.master_relive_id}
                    index={idx}
                    isExpanded={expandedId === m.id}
                    onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    onEdit={() => openEditModal(m)}
                    onDelete={() => handleMoveAway(m.id)}
                    onAddRelive={() => openReliveModal(m)}
                    onSetMaster={(reliveId) => setMasterRelive(m.id, reliveId)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="pb-10 pt-4 text-center text-xs text-ink-700/40 font-hand text-lg">
        <p>愿每一缕气味，都是打开旧时光的钥匙 · Scent Archive</p>
      </footer>

      <MemoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editingData={editing}
      />
      <ReliveModal
        isOpen={!!reliveTarget}
        memory={reliveTarget}
        onClose={() => setReliveTarget(null)}
        onSubmit={handleReliveSubmit}
      />
      <TrashModal
        isOpen={trashOpen}
        memories={trashedMemories}
        onClose={() => setTrashOpen(false)}
        onRestore={(id) => { restoreMemory(id); }}
        onPurge={purgeMemory}
      />
    </div>
  );
}
