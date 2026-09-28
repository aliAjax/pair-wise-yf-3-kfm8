import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import FilterPanel from '../components/FilterPanel';
import VisualizationPanel from '../components/VisualizationPanel';
import MemoryCard from '../components/MemoryCard';
import MemoryModal from '../components/MemoryModal';
import ReencounterModal from '../components/ReencounterModal';
import ArchivedView from '../components/ArchivedView';
import { useMemoryStore } from '../store/memoryStore';
import type { MemoryInput, ReencounterInput } from '../store/memoryStore';
import type { Filters, MemoryView } from '../utils/helpers';
import { getMemoryView, getSortedReencounters, getLatestDiff } from '../utils/helpers';
import type { SmellMemory } from '../utils/constants';
import { BookOpenCheck } from 'lucide-react';

const defaultFilters: Filters = {
  smellType: '',
  season: '',
  emotion: '',
  wantAgain: '',
};

export default function Home() {
  const {
    memories, reencounters, initIfEmpty,
    addMemory, updateMemory, addReencounter, setPrimary,
    archiveMemory, restoreMemory, purgeMemory,
  } = useMemoryStore();
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmellMemory | null>(null);
  const [reencounterTarget, setReencounterTarget] = useState<SmellMemory | null>(null);

  useEffect(() => {
    initIfEmpty();
  }, [initIfEmpty]);

  // 记录层与状态层分离：archived 仅切换可见性，重现记录不动
  const activeMemories = useMemo(() => memories.filter((m) => !m.archived), [memories]);
  const archivedMemories = useMemo(() => memories.filter((m) => m.archived), [memories]);

  // 主记录视图：卡片、筛选、可视化统一以主记录为准
  const views = useMemo<MemoryView[]>(
    () => activeMemories.map((m) => getMemoryView(m, reencounters)),
    [activeMemories, reencounters],
  );

  // 筛选以主记录视图为准（类型/季节/情绪/是否想再闻）
  const filteredViews = useMemo(
    () => views.filter((v) => {
      if (filters.smellType && v.smell_type !== filters.smellType) return false;
      if (filters.season && v.season !== filters.season) return false;
      if (filters.emotion && v.emotion !== filters.emotion) return false;
      if (filters.wantAgain === 'yes' && !v.want_again) return false;
      if (filters.wantAgain === 'no' && v.want_again) return false;
      return true;
    }),
    [views, filters],
  );

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const resetFilters = () => setFilters(defaultFilters);

  const openAddModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (m: SmellMemory) => { setEditing(m); setModalOpen(true); };

  const handleSubmit = (data: MemoryInput) => {
    if (editing) {
      updateMemory(editing.id, data);
    } else {
      addMemory(data);
    }
  };

  const handleAddReencounter = (memoryId: string, data: ReencounterInput) => {
    addReencounter(memoryId, data);
    // 记下重现后展开该卡片，方便立刻看到时间线与「最近 vs 原始」差别
    setExpandedId(memoryId);
  };

  const handleArchive = (m: SmellMemory) => {
    const msg = `把「${m.location}」移走吗？它的 ${getSortedReencounters(reencounters, m.id).length} 条重现记录会一起藏起来，恢复后完整回来。`;
    if (window.confirm(msg)) {
      archiveMemory(m.id);
      if (expandedId === m.id) setExpandedId(null);
    }
  };

  const handleRestore = (id: string) => restoreMemory(id);

  const handlePurge = (id: string) => {
    const target = memories.find((m) => m.id === id);
    const msg = `彻底删除「${target?.location ?? '这段记忆'}」吗？原始封存与全部重现记录都会永久消失，无法恢复。`;
    if (window.confirm(msg)) purgeMemory(id);
  };

  const scrollToCard = (id: string) => {
    setExpandedId(id);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-memory-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const hasFilter = !!(filters.smellType || filters.season || filters.emotion || filters.wantAgain);

  return (
    <div className="min-h-screen">
      <Header
        onAdd={openAddModal}
        memoryCount={activeMemories.length}
        view={view}
        archivedCount={archivedMemories.length}
        onToggleView={() => setView((v) => (v === 'active' ? 'archived' : 'active'))}
      />

      <main className="container max-w-6xl pb-20">
        {view === 'archived' ? (
          <ArchivedView
            archived={archivedMemories}
            reencounters={reencounters}
            onRestore={handleRestore}
            onPurge={handlePurge}
          />
        ) : (
          <>
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
                  点击卡片展开完整回忆与重现记录
                </span>
              </div>

              {filteredViews.length === 0 ? (
                <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-20 text-center">
                  <div className="text-6xl mb-4 select-none">🍂</div>
                  <h3 className="font-serif text-2xl text-ink-800 mb-2">
                    {hasFilter ? '没有匹配的气味记忆' : '还没有封存任何气味'}
                  </h3>
                  <p className="text-ink-700/60 max-w-md mx-auto mb-6">
                    {hasFilter ? '换一组筛选条件试试？或者先封存一段新的气味' : '空气中一定有让你难忘的味道——无论是衣柜里的樟木香，还是雨后操场的青草气'}
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
                  {filteredViews.map((v, idx) => {
                    const list = getSortedReencounters(reencounters, v.id);
                    return (
                      <div key={v.id} data-memory-id={v.id}>
                        <MemoryCard
                          view={v}
                          reencounters={list}
                          diff={getLatestDiff(v)}
                          index={idx}
                          isExpanded={expandedId === v.id}
                          onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
                          onEdit={() => openEditModal(v)}
                          onArchive={() => handleArchive(v)}
                          onAddReencounter={() => setReencounterTarget(v)}
                          onSetPrimary={(rid) => setPrimary(v.id, rid)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
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

      <ReencounterModal
        isOpen={!!reencounterTarget}
        memory={reencounterTarget}
        onClose={() => setReencounterTarget(null)}
        onSubmit={handleAddReencounter}
      />
    </div>
  );
}
