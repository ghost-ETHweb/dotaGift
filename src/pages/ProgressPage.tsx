import { useState } from 'react';
import { Header } from '../shared/Header';
import { useT } from '../shared/i18n';
import { rewardsTable, xpToNextLevel } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';

const PAGE_SIZE = 15;
type ProgressIconType = 'level' | 'created' | 'merge' | 'trophy';

function ProgressIcon({ type, className = '' }: { type: ProgressIconType; className?: string }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `size-4 ${className}`,
    'aria-hidden': true,
  };

  if (type === 'level') {
    return (
      <svg {...commonProps}>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
        <path d="M5 19h14" />
      </svg>
    );
  }

  if (type === 'created') {
    return (
      <svg {...commonProps}>
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <path d="m6.3 6.3 2.8 2.8" />
        <path d="m14.9 14.9 2.8 2.8" />
        <path d="m17.7 6.3-2.8 2.8" />
        <path d="m9.1 14.9-2.8 2.8" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (type === 'merge') {
    return (
      <svg {...commonProps}>
        <path d="M4 7h5c3 0 4 2 6 5" />
        <path d="M4 17h5c3 0 4-2 6-5" />
        <path d="m15 7 5 5-5 5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 3" />
      <path d="M17 6h3a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function ProgressPage() {
  const player = useGameStore((state) => state.player);
  const claimedRewardIds = useGameStore((state) => state.claimedRewardIds);
  const claimReward = useGameStore((state) => state.claimReward);
  const isSyncing = useGameStore((state) => state.isSyncing);
  const [visibleRewards, setVisibleRewards] = useState(PAGE_SIZE);
  const t = useT();
  const xpGoal = xpToNextLevel(player.level);
  const visibleRewardRows = rewardsTable.slice(0, visibleRewards);
  const statCards = [
    { label: t('created'), value: player.stats.created, tone: 'from-emerald-300/14', icon: 'created' as const, iconTone: 'text-emerald-100' },
    { label: t('merge'), value: player.stats.merged, tone: 'from-cyan-300/14', icon: 'merge' as const, iconTone: 'text-cyan-100' },
    { label: t('trophies'), value: player.stats.trophies, tone: 'from-amber-300/14', icon: 'trophy' as const, iconTone: 'text-amber-100' },
  ];

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="rounded-lg border border-cyan-200/20 bg-gradient-to-br from-cyan-300/12 via-sky-500/10 to-white/[0.035] p-4 shadow-[0_0_28px_rgba(34,211,238,0.11)]">
          <div className="flex items-center gap-2">
            <ProgressIcon type="level" className="size-5 text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            <p className="game-label text-sm text-cyan-100/72">{t('currentLevel')}</p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="game-number text-5xl text-cyan-50 drop-shadow-[0_0_12px_rgba(34,211,238,0.28)]">{player.level}</strong>
            <span className="game-caption pb-2 text-right text-sm text-zinc-200">{t('xpToNext', { xp: xpGoal - player.xp })}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {statCards.map(({ label, value, tone, icon, iconTone }) => (
            <div key={label} className={`rounded-md border border-white/10 bg-gradient-to-br ${tone} to-white/[0.035] p-3 shadow-[0_0_18px_rgba(255,255,255,0.04)]`}>
              <div className="flex items-center gap-2">
                <ProgressIcon type={icon} className={`size-4 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.16)] ${iconTone}`} />
                <p className="game-caption min-w-0 truncate text-xs text-zinc-400">{label}</p>
              </div>
              <p className="game-number mt-1 text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="game-title mb-2 text-base">{t('levelRewards')}</h2>
          <div className="grid gap-2">
            {visibleRewardRows.map((reward) => {
              const isClaimed = claimedRewardIds.includes(reward.id);
              const isLocked = reward.level > player.level;
              const isAvailable = !isClaimed && !isLocked;
              const statusLabel = isClaimed ? t('claimed') : isLocked ? t('locked') : t('claim');
              const stateClass = isClaimed
                ? 'border-emerald-300/30 bg-emerald-300/[0.075] text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.1)]'
                : isAvailable
                  ? 'border-amber-300/35 bg-amber-300/[0.09] text-amber-100 shadow-[0_0_20px_rgba(252,211,77,0.12)]'
                  : 'border-white/8 bg-white/[0.025] text-zinc-500 opacity-70';

              return (
                <button
                  key={reward.id}
                  type="button"
                  onClick={() => void claimReward(reward.id)}
                  disabled={isSyncing || isLocked || isClaimed}
                  className={`flex min-h-14 items-center justify-between rounded-md border px-3 text-left transition active:scale-[0.99] ${stateClass}`}
                >
                  <span>
                    <span className="game-label block text-sm">
                      {t('level')} {reward.level}
                    </span>
                    <span className="game-caption text-xs opacity-75">
                      +{reward.amount ?? 0} {t('energyUnit')}
                    </span>
                  </span>
                  <span className="game-label text-xs">{statusLabel}</span>
                </button>
              );
            })}
          </div>

          {visibleRewards < rewardsTable.length ? (
            <button
              type="button"
              onClick={() => setVisibleRewards((current) => Math.min(current + PAGE_SIZE, rewardsTable.length))}
              className="game-label mt-3 min-h-12 w-full rounded-md border border-cyan-200/20 bg-cyan-300/[0.075] px-4 text-sm text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.08)] active:scale-[0.99]"
            >
              {t('showMoreRewards')}
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
