import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { SmellMemory, ReliveInput } from '../utils/constants';
import { getLatestRelive, toDateInputValue, fromDateInputValue } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  memory: SmellMemory | null;
  onClose: () => void;
  onSubmit: (memoryId: string, input: ReliveInput) => void;
}

const intensityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * 「记一次重现」入口。
 * 来源默认沿用上一条记录（没有则沿用原始值），改动只保存在本次重现里。
 */
export default function ReliveModal({ isOpen, memory, onClose, onSubmit }: Props) {
  const [date, setDate] = useState(toDateInputValue(new Date().toISOString()));
  const [sourceGuess, setSourceGuess] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [wantAgain, setWantAgain] = useState(true);

  useEffect(() => {
    if (isOpen && memory) {
      const latest = getLatestRelive(memory);
      setDate(toDateInputValue(new Date().toISOString()));
      // 新记录沿用上一条来源：有重现取最近一次，否则取原始来源
      setSourceGuess(latest ? latest.source_guess : memory.source_guess);
      setIntensity(latest ? latest.intensity : memory.intensity);
      setWantAgain(latest ? latest.want_again : memory.want_again);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, memory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;
    onSubmit(memory.id, {
      date: fromDateInputValue(date),
      source_guess: sourceGuess.trim(),
      intensity,
      want_again: wantAgain,
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
      <div className="relative w-full max-w-xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-moss-600" />
              又闻到了「{memory.location}」
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              记下这次重现的感受，最初的记录不会被改动
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">闻到的日期</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="scent-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">本次气味来源</label>
              <input
                type="text"
                value={sourceGuess}
                onChange={(e) => setSourceGuess(e.target.value)}
                placeholder="沿用上一条来源，可只改这次"
                className="scent-input"
              />
              <p className="text-[11px] text-ink-700/50 mt-1">默认沿用上一条记录，改动仅保存在本次</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-700">这次的气味强度</label>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ochre-100 text-ochre-600 font-semibold text-sm">
                {intensity} / 10
                <span className="text-[11px] font-normal text-ochre-600/70">
                  （最初 {memory.intensity}）
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
                  {wantAgain ? '🌿 希望有机会再次闻到' : '😮‍💨 这次就算了吧'}
                </div>
                <div className="text-[11px] text-ink-700/55 mt-0.5">
                  最初的选择是「{memory.want_again ? '想再闻' : '留在记忆里'}」，这里只记录这次的感受
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              保存这次重现
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
