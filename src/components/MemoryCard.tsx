import type { SmellMemory } from '../utils/constants';
import { getSeasonInfo, getSmellTypeInfo, getEmotionInfo } from '../utils/constants';
import {
  formatDate,
  formatShortDate,
  contrastTextColor,
  getMemoryView,
  getReliveDiff,
  getReliveRecords,
} from '../utils/helpers';
import {
  Pencil,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  Heart,
  RefreshCw,
  Star,
  History,
  Plus,
} from 'lucide-react';

interface Props {
  memory: SmellMemory;
  masterReliveId: string | null;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddRelive: () => void;
  onSetMaster: (reliveId: string | null) => void;
}

function IntensityDelta({ delta, className = '' }: { delta: number; className?: string }) {
  if (delta === 0) {
    return <span className={`text-[11px] text-ink-700/50 ${className}`}>· 持平</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`text-[11px] font-semibold ${
        up ? 'text-brick-500' : 'text-moss-600'
      } ${className}`}
    >
      {up ? '▲' : '▼'} {Math.abs(delta)}
    </span>
  );
}

export default function MemoryCard({
  memory,
  masterReliveId,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddRelive,
  onSetMaster,
}: Props) {
  const season = getSeasonInfo(memory.season);
  const stype = getSmellTypeInfo(memory.smell_type);
  const emotion = getEmotionInfo(memory.emotion);

  // 卡片取值由主记录决定
  const view = getMemoryView(memory, masterReliveId);
  const diff = getReliveDiff(memory);
  const relives = getReliveRecords(memory);
  const isMasterRelive = view.master_relive !== null;

  const intensityWidth = `${view.intensity * 10}%`;
  const humidityWidth = `${memory.humidity * 10}%`;

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
                  {view.source_guess}
                  {isMasterRelive && (
                    <span
                      className="ml-1.5 inline-flex items-center align-middle text-[10px] text-lavender-600 bg-lavender-300/30 rounded-full px-1.5 py-px"
                      title="卡片当前显示某次重现记录"
                    >
                      <Star className="w-2.5 h-2.5 fill-current mr-0.5" />重现
                    </span>
                  )}
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
              {view.want_again && (
                <span className="scent-tag bg-moss-100 text-moss-600">
                  <Heart className="w-3 h-3 fill-current" /> 想再闻
                </span>
              )}
              {relives.length > 0 && (
                <span className="scent-tag bg-lavender-300/40 text-lavender-600">
                  <RefreshCw className="w-3 h-3" /> 重现 {relives.length} 次
                </span>
              )}
            </div>

            {/* 最近一次重现与原始值的差别 */}
            {diff && view.latest_relive && (
              <div className="mb-3 rounded-lg bg-moss-100/50 border border-moss-200/60 px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-moss-600 mb-1">
                  <History className="w-3 h-3" />
                  最近重现 · {formatShortDate(view.latest_relive.date)}
                  <span className="text-ink-700/45 font-normal">对比初闻</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-700/75">
                  <span className="inline-flex items-center gap-1">
                    强度 {view.latest_relive.intensity}
                    <IntensityDelta delta={diff.intensityDelta} />
                  </span>
                  {diff.sourceChanged && (
                    <span className="text-ochre-600">来源有变化</span>
                  )}
                  {diff.wantAgainChanged && (
                    <span className="text-lavender-600">
                      {diff.latestWantAgain ? '改为想再闻' : '改为不想再闻'}
                    </span>
                  )}
                  {!diff.hasAnyChange && (
                    <span className="text-ink-700/50">感受如初，未曾改变</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[11px] text-ink-700/60 mb-1">
                  <span>强度{isMasterRelive && <span className="text-lavender-600">（主记录）</span>}</span>
                  <span className="font-semibold text-ochre-600">
                    {view.intensity}/10
                    {isMasterRelive && view.intensity !== memory.intensity && (
                      <span className="ml-1 font-normal text-ink-700/45">初 {memory.intensity}</span>
                    )}
                  </span>
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

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-paper-200/80">
              <span className="text-[11px] text-ink-700/50">初闻 {formatDate(memory.created_at)}</span>
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
            <div className="px-4 pb-4 animate-expand overflow-hidden">
              <div className="p-4 rounded-xl bg-paper-100/70 border border-paper-200/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-hand text-lg text-ochre-600">关联记忆</span>
                </div>
                <p className="font-serif text-[15px] leading-relaxed text-ink-800 whitespace-pre-wrap">
                  {memory.memory_text}
                </p>
              </div>

              {/* 重现档案：原始记录不可改，重现记录只追加，主记录可切换 */}
              <div className="mt-3 rounded-xl border border-moss-200/60 bg-moss-100/30 p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-hand text-lg text-moss-600 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" />
                    重现档案
                    <span className="text-xs text-ink-700/50 font-sans">
                      （共 {relives.length + 1} 条）
                    </span>
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddRelive(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-moss-600 hover:bg-moss-700 text-paper-50 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    记一次重现
                  </button>
                </div>

                <div className="relative pl-4 space-y-3">
                  <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-moss-200" />

                  {/* 原始记录（不可覆盖，可重新设为主记录） */}
                  <div className="relative">
                    <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-ochre-500 border-2 border-paper-50" />
                    <div
                      className={`rounded-lg p-2.5 border text-[12px] ${
                        !isMasterRelive
                          ? 'bg-paper-50 border-ochre-300'
                          : 'bg-paper-50/70 border-paper-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-ink-800">初闻 · {formatDate(memory.created_at)}</span>
                        {!isMasterRelive ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-lavender-600 font-medium">
                            <Star className="w-3 h-3 fill-current" /> 主记录
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onSetMaster(null); }}
                            className="text-[10px] text-ink-700/55 hover:text-lavender-600 underline-offset-2 hover:underline"
                          >
                            设为主记录
                          </button>
                        )}
                      </div>
                      <div className="text-ink-700/75 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span>强度 {memory.intensity}/10</span>
                          <span className="text-ink-700/55">
                            {memory.want_again ? '想再闻' : '留在记忆里'}
                          </span>
                        </div>
                        <p className="truncate">{memory.source_guess || '未记录来源'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 历次重现，按时间先后排列 */}
                  {relives.map((r, idx) => {
                    const prev = idx === 0
                      ? { intensity: memory.intensity }
                      : { intensity: relives[idx - 1].intensity };
                    const isMaster = view.master_relive_id === r.id;
                    return (
                      <div key={r.id} className="relative">
                        <div
                          className={`absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-paper-50 ${
                            isMaster ? 'bg-lavender-500' : 'bg-moss-400'
                          }`}
                        />
                        <div
                          className={`rounded-lg p-2.5 border text-[12px] ${
                            isMaster ? 'bg-paper-50 border-lavender-400' : 'bg-paper-50/70 border-paper-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-medium text-ink-800">
                              重现 · {formatDate(r.date)}
                            </span>
                            {isMaster ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-lavender-600 font-medium">
                                <Star className="w-3 h-3 fill-current" /> 主记录
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); onSetMaster(r.id); }}
                                className="text-[10px] text-ink-700/55 hover:text-lavender-600 underline-offset-2 hover:underline"
                              >
                                设为主记录
                              </button>
                            )}
                          </div>
                          <div className="text-ink-700/75 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span>强度 {r.intensity}/10</span>
                              <IntensityDelta delta={r.intensity - prev.intensity} />
                              <span className="text-ink-700/55">
                                {r.want_again ? '想再闻' : '不想再闻'}
                              </span>
                            </div>
                            <p className="truncate">{r.source_guess || '未记录来源'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[10.5px] text-ink-700/45 leading-relaxed">
                  原始记录始终保留；主记录决定卡片显示、筛选与可视化数据。
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-paper-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-700/50">
                  <span>更新于 {formatDate(memory.updated_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddRelive(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-600 hover:bg-moss-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 记重现
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ochre-600 hover:bg-ochre-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> 编辑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-brick-500 hover:bg-brick-500/10 transition-colors"
                  >
                    <ArchiveX className="w-3.5 h-3.5" /> 移走
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isExpanded && (
            <div className="px-4 pb-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onAddRelive(); }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-600 hover:bg-moss-100 transition-colors"
                title="记一次重现"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ochre-600 hover:bg-ochre-100 transition-colors"
                title="编辑原始记录"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-brick-500 hover:bg-brick-500/10 transition-colors"
                title="移走（可在回收站恢复）"
              >
                <ArchiveX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
