import { useEffect, useRef, useState } from 'react';
import { X, Wind } from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import type { ReencounterInput } from '../store/memoryStore';
import { getDefaultReencounterSource, useMemoryStore } from '../store/memoryStore';
import { toDateInputValue } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  memory: SmellMemory | null;
  onClose: () => void;
  onSubmit: (memoryId: string, data: ReencounterInput) => void;
}

const intensityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ReencounterModal({ isOpen, memory, onClose, onSubmit }: Props) {
  const reencounters = useMemoryStore((s) => s.reencounters);
  const [date, setDate] = useState(toDateInputValue(new Date().toISOString()));
  const [source, setSource] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [wantAgain, setWantAgain] = useState(true);
  const [note, setNote] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && memory) {
      // 新记录沿用上一条来源（没有重现记录时沿用原始封存来源）
      setDate(toDateInputValue(new Date().toISOString()));
      setSource(getDefaultReencounterSource(memory, reencounters));
      setIntensity(memory.intensity);
      setWantAgain(memory.want_again);
      setNote('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, memory, reencounters]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory || !date) return;
    onSubmit(memory.id, {
      date: new Date(`${date}T12:00:00`).toISOString(),
      source: source.trim() || getDefaultReencounterSource(memory, reencounters),
      intensity,
      want_again: wantAgain,
      note: note.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen || !memory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.54 0 0 0 0 0.35 0 0 0 0 0.18 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
              <Wind className="w-6 h-6 text-moss-600" />
              又闻到了「{memory.location}」
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              记一次重现：原始封存不会被改动，来源改了只影响这一次
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-moss-500 rounded-full" />
              <h3 className="font-hand text-xl text-moss-600">这次重现</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">重现日期 *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="scent-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  这次的来源
                  <span className="ml-1.5 text-[11px] font-normal text-ink-700/50">已沿用上一条，可改</span>
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="例如：陈年樟木 + 薰衣草香包"
                  className="scent-input"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink-700">这次的气味强度</label>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ochre-100 text-ochre-600 font-semibold text-sm">
                  {intensity} / 10
                  <span className="text-[11px] font-normal text-ochre-600/70 ml-1">
                    原始 {memory.intensity}
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="scent-slider"
              />
              <div className="scent-slider-ticks">
                {intensityTicks.map((v) => (
                  <span key={v} data-value={v} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">这次还想再闻到吗？</label>
              <div
                className="flex items-center gap-4 p-3 rounded-xl bg-paper-100 border border-paper-200 cursor-pointer select-none"
                onClick={() => setWantAgain(!wantAgain)}
              >
                <div className={`toggle-switch ${wantAgain ? 'active' : ''}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-800">
                    {wantAgain ? '🌿 这次依然想再闻' : '😮‍💨 这次不想再闻了'}
                  </div>
                  <div className="text-[11px] text-ink-700/55 mt-0.5">
                    感受可以随时间改变，每次的选择都会单独保留
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">这次的感受备注</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="和记忆里的味道有什么不一样？场景变了吗..."
                className="scent-textarea font-serif"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              记下这次重现
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
