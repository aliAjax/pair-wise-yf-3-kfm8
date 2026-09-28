import { ArchiveX, RotateCcw, Trash2, Wind } from 'lucide-react';
import type { SmellMemory, Reencounter } from '../utils/constants';
import { getSmellTypeInfo } from '../utils/constants';
import { formatDate, getSortedReencounters } from '../utils/helpers';

interface Props {
  archived: SmellMemory[];
  reencounters: Reencounter[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}

export default function ArchivedView({ archived, reencounters, onRestore, onPurge }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-hand text-2xl text-brick-600 flex items-center gap-2">
          <ArchiveX className="w-5 h-5" />
          移走区
        </h2>
        <span className="text-xs text-ink-700/50">
          已移走 {archived.length} 段 · 重现记录随本体一起藏在此处，恢复后完整回来
        </span>
      </div>

      {archived.length === 0 ? (
        <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-16 text-center">
          <div className="text-5xl mb-3 select-none opacity-60">📭</div>
          <h3 className="font-serif text-xl text-ink-800 mb-2">移走区是空的</h3>
          <p className="text-ink-700/60 text-sm">被移走的气味记忆会安静地待在这里，随时可以恢复</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archived.map((m) => {
            const stype = getSmellTypeInfo(m.smell_type);
            const count = getSortedReencounters(reencounters, m.id).length;
            return (
              <div
                key={m.id}
                className="flex items-center gap-4 bg-paper-50/80 rounded-2xl border border-paper-300 px-4 py-3.5 shadow-paper"
              >
                <div
                  className="w-2.5 h-12 rounded-full shrink-0 opacity-50"
                  style={{ backgroundColor: m.color_association }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-ink-800/80 leading-tight truncate">
                    {m.location}
                  </h3>
                  <p className="text-xs text-ink-700/60 truncate mt-0.5">
                    <span className="mr-1">{stype.emoji}</span>
                    {m.source_guess}
                    <span className="ml-2 text-ink-700/40">封存于 {formatDate(m.created_at)}</span>
                  </p>
                </div>
                {count > 0 && (
                  <span className="hidden sm:inline-flex scent-tag bg-moss-600/10 text-moss-700 shrink-0">
                    <Wind className="w-3 h-3" /> 重现×{count} 一并隐藏
                  </span>
                )}
                <button
                  onClick={() => onRestore(m.id)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-moss-700 bg-moss-100 hover:bg-moss-200/70 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 恢复
                </button>
                <button
                  onClick={() => onPurge(m.id)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-brick-500 hover:bg-brick-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 彻底删除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
