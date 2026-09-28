import { X, RotateCcw, Trash2, Archive } from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import { getSmellTypeInfo } from '../utils/constants';
import { formatShortDate, getReliveRecords } from '../utils/helpers';

interface Props {
  isOpen: boolean;
  memories: SmellMemory[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}

/**
 * 「记忆回收站」入口：与主档案分开维护。
 * 移走的原记忆连同它的重现记录一起隐藏在此，恢复后整体回来；
 * 永久删除则连重现记录一起抹除。
 */
export default function TrashModal({ isOpen, memories, onClose, onRestore, onPurge }: Props) {
  if (!isOpen) return null;

  const handlePurge = (m: SmellMemory) => {
    const extra = getReliveRecords(m).length > 0 ? `及其 ${getReliveRecords(m).length} 条重现记录` : '';
    if (window.confirm(`永久删除「${m.location}」${extra}吗？此操作无法撤销。`)) {
      onPurge(m.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div className="relative w-full max-w-2xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
              <Archive className="w-5 h-5 text-brick-500" />
              记忆回收站
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              移走的记忆与重现记录一起藏在这里，随时可以请回来
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {memories.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-5xl mb-3 select-none opacity-60">🗄️</div>
              <p className="font-hand text-lg text-ink-700/60">回收站空空如也</p>
              <p className="text-xs text-ink-700/50 mt-1">移走的气味会暂存在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map((m) => {
                const stype = getSmellTypeInfo(m.smell_type);
                const reliveCount = getReliveRecords(m).length;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-paper-100/70 border border-paper-200"
                  >
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: m.color_association }}
                    >
                      <span className="text-base">{stype.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-base font-semibold text-ink-800 truncate">
                        {m.location}
                      </div>
                      <div className="text-[11px] text-ink-700/60 truncate">
                        {m.source_guess}
                        {reliveCount > 0 && (
                          <span className="ml-1.5 inline-flex items-center text-moss-600">
                            · 含 {reliveCount} 条重现记录
                          </span>
                        )}
                        {m.deleted_at && (
                          <span className="ml-1.5 text-ink-700/45">
                            · {formatShortDate(m.deleted_at)} 移走
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onRestore(m.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-600 hover:bg-moss-100 transition-colors"
                        title="恢复到气味档案"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        恢复
                      </button>
                      <button
                        onClick={() => handlePurge(m)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-brick-500 hover:bg-brick-500/10 transition-colors"
                        title="永久删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        彻底删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
