import { History, Pin, Star } from 'lucide-react';
import type { Reencounter } from '../utils/constants';
import { formatShortDate } from '../utils/helpers';

interface Props {
  reencounters: Reencounter[];
  /** 当前主记录对应的重现 id；null 表示原始封存为主记录 */
  primaryReencounterId: string | null | undefined;
  onSetPrimary: (reencounterId: string | null) => void;
}

function intensityDeltaLabel(curr: number, prev: number): { text: string; cls: string } {
  const delta = curr - prev;
  if (delta === 0) return { text: '强度持平', cls: 'text-ink-700/55' };
  if (delta > 0) return { text: `比上次浓 +${delta}`, cls: 'text-brick-500' };
  return { text: `比上次淡 ${delta}`, cls: 'text-moss-600' };
}

export default function ReencounterTimeline({ reencounters, primaryReencounterId, onSetPrimary }: Props) {
  if (reencounters.length === 0) return null;

  // 时间线倒序：最近一次在最上
  const list = [...reencounters].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="p-4 rounded-xl bg-moss-600/[0.04] border border-moss-600/15">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-moss-600" />
        <span className="font-hand text-lg text-moss-700">重现记录</span>
        <span className="text-xs text-ink-700/50">· 共 {list.length} 次，原始封存不会被覆盖</span>
      </div>

      <ol className="relative ml-1.5 border-l-2 border-dashed border-moss-600/25 space-y-3">
        {list.map((r, idx) => {
          const isPrimary = primaryReencounterId === r.id;
          const prev = list[idx + 1];
          const delta = prev
            ? intensityDeltaLabel(r.intensity, prev.intensity)
            : null;
          return (
            <li key={r.id} className="pl-4 relative">
              <span
                className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${
                  isPrimary ? 'bg-ochre-500 ring-2 ring-ochre-200' : 'bg-moss-500/50'
                }`}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-ink-800">{formatShortDate(r.date)}</span>
                    {isPrimary && (
                      <span className="scent-tag bg-ochre-100 text-ochre-600 !py-0">
                        <Star className="w-3 h-3 fill-current" /> 主记录
                      </span>
                    )}
                    {r.want_again
                      ? <span className="text-[11px] text-moss-600">🌿 想再闻</span>
                      : <span className="text-[11px] text-ink-700/55">😮‍💨 不想再闻</span>}
                    {delta && <span className={`text-[11px] font-medium ${delta.cls}`}>{delta.text}</span>}
                  </div>
                  <p className="text-xs text-ink-700/70 mt-0.5 truncate">来源：{r.source}</p>
                  <p className="text-xs text-ink-700/60 mt-0.5">强度 {r.intensity}/10</p>
                  {r.note && (
                    <p className="font-serif text-[13px] leading-relaxed text-ink-800 mt-1 whitespace-pre-wrap">
                      {r.note}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSetPrimary(isPrimary ? null : r.id)}
                  title={isPrimary ? '取消，恢复以原始封存为主记录' : '把这次设为主记录（决定卡片与筛选）'}
                  className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    isPrimary
                      ? 'bg-ochre-500 text-paper-50 hover:bg-ochre-600'
                      : 'text-ochre-600 hover:bg-ochre-100'
                  }`}
                >
                  <Pin className={`w-3 h-3 ${isPrimary ? 'fill-current' : ''}`} />
                  {isPrimary ? '主记录中' : '设为主记录'}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
