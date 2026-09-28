import { Pencil, Archive, ChevronDown, ChevronUp, Heart, Wind, Star, GitCompareArrows } from 'lucide-react';
import type { Reencounter } from '../utils/constants';
import { getSeasonInfo, getSmellTypeInfo, getEmotionInfo } from '../utils/constants';
import { formatDate, formatShortDate, contrastTextColor } from '../utils/helpers';
import type { MemoryView, LatestDiff } from '../utils/helpers';
import ReencounterTimeline from './ReencounterTimeline';

interface Props {
  /** 主记录视图：卡片展示值一律由它决定 */
  view: MemoryView;
  reencounters: Reencounter[];
  diff: LatestDiff;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onAddReencounter: () => void;
  onSetPrimary: (reencounterId: string | null) => void;
}

function DiffChip({ diff, view, onToggle }: { diff: LatestDiff; view: MemoryView; onToggle: () => void }) {
  if (!view.latestReencounter) return null;
  const latest = view.latestReencounter;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="w-full text-left mt-3 rounded-lg border border-moss-600/20 bg-moss-600/[0.05] px-2.5 py-2 hover:bg-moss-600/10 transition-colors"
      title={`最近一次重现（${formatShortDate(latest.date)}）与原始封存的差别，点击展开查看详情`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-moss-700 mb-1">
        <GitCompareArrows className="w-3.5 h-3.5" />
        最近重现 · {formatShortDate(latest.date)}
        <span className="font-normal text-ink-700/50">vs 原始封存</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {diff.intensityDelta !== 0 && (
          <span className={`scent-tag !py-0.5 text-[10px] ${
            diff.intensityDelta > 0 ? 'bg-brick-500/10 text-brick-600' : 'bg-moss-100 text-moss-700'
          }`}>
            强度 {view.intensity_original} → {latest.intensity}
            （{diff.intensityDelta > 0 ? `浓 +${diff.intensityDelta}` : `淡 ${diff.intensityDelta}`}）
          </span>
        )}
        {diff.sourceChanged && (
          <span className="scent-tag bg-lavender-300/40 text-lavender-600 !py-0.5 text-[10px]">
            来源变了
          </span>
        )}
        {diff.wantAgainChanged && (
          <span className="scent-tag bg-ochre-100 text-ochre-700 !py-0.5 text-[10px]">
            {latest.want_again ? '变得想再闻' : '变得不想再闻'}
          </span>
        )}
        {!diff.hasAny && (
          <span className="text-[10px] text-ink-700/55">和当初一样</span>
        )}
      </div>
    </button>
  );
}

export default function MemoryCard({
  view, reencounters, diff, index, isExpanded,
  onToggle, onEdit, onArchive, onAddReencounter, onSetPrimary,
}: Props) {
  const memory = view;
  const season = getSeasonInfo(memory.season);
  const stype = getSmellTypeInfo(memory.smell_type);
  const emotion = getEmotionInfo(memory.emotion);

  const intensityWidth = `${memory.intensity * 10}%`;
  const humidityWidth = `${memory.humidity * 10}%`;
  const primaryIsReencounter = memory.primaryEntry.kind === 'reencounter';

  return (
    <article
      className="group relative bg-paper-50 rounded-2xl border border-paper-300 shadow-card overflow-hidden hover:shadow-paper-hover hover:-translate-y-1 transition-all duration-300 animate-fadeInUp"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <div className="flex">
        <div
          className="w-2 shrink-0 relative overflow-hidden transition-all duration-300 group-hover:w-3"
          style={{ backgroundColor: memory.color_association }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="p-4 pb-3 cursor-pointer select-none"
            onClick={onToggle}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-xl font-semibold text-ink-800 leading-tight truncate">
                  {memory.location}
                </h3>
                <p className="text-sm text-ink-700/70 mt-0.5 truncate">
                  <span className="mr-1" style={{ color: stype.color }}>{stype.emoji}</span>
                  {memory.source_guess}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center shadow-sm border-2 border-paper-50"
                style={{
                  backgroundColor: memory.color_association,
                  color: contrastTextColor(memory.color_association),
                }}
                title={`颜色联想: ${memory.color_association}`}
              >
                <span className="text-xs font-bold">色</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`scent-tag ${emotion.bg} ${emotion.text}`}>
                {emotion.emoji} {emotion.label}
              </span>
              <span className="scent-tag bg-ochre-100 text-ochre-600">
                {season.emoji} {season.label}
              </span>
              <span
                className="scent-tag text-paper-50"
                style={{ backgroundColor: stype.color }}
              >
                {stype.label}
              </span>
              {memory.want_again && (
                <span className="scent-tag bg-moss-100 text-moss-600">
                  <Heart className="w-3 h-3 fill-current" /> 想再闻
                </span>
              )}
              {primaryIsReencounter && (
                <span className="scent-tag bg-ochre-500/15 text-ochre-700">
                  <Star className="w-3 h-3 fill-current" />
                  第{reencounters.findIndex((r) => r.id === memory.primaryEntry.reencounter_id) + 1}次重现为主
                </span>
              )}
              {memory.reencounterCount > 0 && (
                <span className="scent-tag bg-moss-600/10 text-moss-700">
                  <Wind className="w-3 h-3" /> 重现×{memory.reencounterCount}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[11px] text-ink-700/60 mb-1">
                  <span>强度{primaryIsReencounter && <span className="text-ochre-600">（主记录）</span>}</span>
                  <span className="font-semibold text-ochre-600">{memory.intensity}/10</span>
                </div>
                <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: intensityWidth,
                      background: 'linear-gradient(90deg, #D4B487 0%, #8B5A2B 60%, #5C3A1D 100%)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-ink-700/60 mb-1">
                  <span>湿度感</span>
                  <span className="font-semibold text-moss-600">
                    {memory.humidity <= 3 ? '偏干' : memory.humidity <= 6 ? '适中' : '偏湿'}
                  </span>
                </div>
                <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: humidityWidth,
                      background: 'linear-gradient(90deg, #CFDBD3 0%, #7DA08C 60%, #3D5A4A 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <DiffChip diff={diff} view={memory} onToggle={onToggle} />

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-paper-200/80">
              <span className="text-[11px] text-ink-700/50">封存于 {formatDate(memory.created_at)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="inline-flex items-center gap-1 text-[11px] text-ochre-600 hover:text-ochre-700 font-medium"
              >
                {isExpanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> 收起</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> 展开回忆</>
                )}
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="px-4 pb-4 animate-expand overflow-hidden space-y-3">
              <div className="p-4 rounded-xl bg-paper-100/70 border border-paper-200/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-hand text-lg text-ochre-600">关联记忆</span>
                  <span className="text-[10px] text-ink-700/45">原始封存内容，永不改变</span>
                </div>
                <p className="font-serif text-[15px] leading-relaxed text-ink-800 whitespace-pre-wrap">
                  {memory.memory_text}
                </p>
              </div>

              <ReencounterTimeline
                reencounters={reencounters}
                primaryReencounterId={memory.primary_reencounter_id}
                onSetPrimary={(rid) => onSetPrimary(rid)}
              />

              <div className="flex items-center justify-between pt-2 border-t border-paper-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-700/50">
                  <span>更新于 {formatDate(memory.updated_at)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddReencounter(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-700 hover:bg-moss-100 transition-colors"
                  >
                    <Wind className="w-3.5 h-3.5" /> 记一次重现
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ochre-600 hover:bg-ochre-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> 编辑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-brick-500 hover:bg-brick-500/10 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" /> 移走
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isExpanded && (
            <div className="px-4 pb-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onAddReencounter(); }}
                title="记一次重现"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-700 hover:bg-moss-100 transition-colors"
              >
                <Wind className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                title="编辑原记忆"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ochre-600 hover:bg-ochre-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                title="移走（重现记录一起隐藏）"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-brick-500 hover:bg-brick-500/10 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
