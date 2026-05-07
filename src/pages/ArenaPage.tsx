import { useEffect, useState } from 'react';
import { Header } from '../shared/Header';
import { useT, type TranslationKey } from '../shared/i18n';
import { apiClient } from '../api/client';
import type { LeaderboardPeriod, LeaderboardScope } from '../api/contracts';
import { raceConfig } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';
import type { LeaderboardRow } from '../types';

type ArenaTab = 'leaderboard' | 'tournaments';

const periods: Array<{ id: LeaderboardPeriod; labelKey: TranslationKey }> = [
  { id: 'today', labelKey: 'today' },
  { id: 'week', labelKey: 'week' },
  { id: 'allTime', labelKey: 'allTime' },
];

export function ArenaPage() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('leaderboard');
  const [period, setPeriod] = useState<LeaderboardPeriod>('today');
  const [scope, setScope] = useState<LeaderboardScope>('all');
  const t = useT();

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-1">
          {[
            { id: 'leaderboard' as const, label: t('leaderboard') },
            { id: 'tournaments' as const, label: t('tournaments') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`game-label min-h-10 rounded-md px-3 text-sm transition active:scale-[0.99] ${
                activeTab === tab.id ? 'bg-amber-300 text-zinc-950' : 'text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'leaderboard' ? <LeaderboardPanel period={period} setPeriod={setPeriod} scope={scope} setScope={setScope} /> : <TournamentsPanel />}
      </section>
    </>
  );
}

function LeaderboardPanel({
  period,
  setPeriod,
  scope,
  setScope,
}: {
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  scope: LeaderboardScope;
  setScope: (scope: LeaderboardScope) => void;
}) {
  const accessToken = useGameStore((state) => state.accessToken);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    if (!accessToken) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .getLeaderboard(accessToken, { period, scope })
      .then((response) => {
        if (isCancelled) return;
        setRows(response.rows);
        setCurrentUser(response.currentUser);
      })
      .catch((requestError: unknown) => {
        if (isCancelled) return;
        setError(requestError instanceof Error ? requestError.message : 'Leaderboard request failed.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, period, scope]);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {periods.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPeriod(item.id)}
            className={`game-label min-h-10 shrink-0 rounded-md px-4 text-sm transition active:scale-[0.99] ${
              period === item.id ? 'bg-amber-300 text-zinc-950' : 'bg-white/[0.06] text-zinc-300'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-cyan-200/20 bg-cyan-300/[0.055] p-1 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
        {[
          { id: 'all' as const, label: t('allPlayers'), icon: 'all' as const },
          { id: 'friends' as const, label: t('friendsOnly'), icon: 'friends' as const },
        ].map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScope(item.id)}
            className={`game-label min-h-9 px-3 text-xs transition active:scale-[0.99] ${
              index === 0 ? 'rounded-l-md border-r border-cyan-100/18' : 'rounded-r-md'
            } ${
              scope === item.id ? 'bg-cyan-200/18 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(165,243,252,0.12)]' : 'bg-black/12 text-zinc-400'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ScopeIcon type={item.icon} active={scope === item.id} />
              <span className={scope === item.id ? 'text-white drop-shadow-[0_0_8px_rgba(165,243,252,0.28)]' : 'text-zinc-400'}>{item.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {isLoading ? <LeaderboardNotice title={t('loading')} caption={`${t('leaderboard')}...`} /> : null}
        {error ? <LeaderboardNotice title={t('leaderboard')} caption={error} /> : null}
        {!isLoading && !error && rows.length === 0 ? (
          <LeaderboardNotice title={scope === 'friends' ? t('friendsLeaderboardEmpty') : t('leaderboardEmpty')} caption={scope === 'friends' ? t('partners') : t('leaderboard')} />
        ) : null}
        {!isLoading && !error ? rows.map((row) => <LeaderboardRowCard key={`${period}-${scope}-${row.rank}-${row.name}`} row={row} />) : null}
      </div>

      {currentUser && !rows.some((row) => row.isCurrentUser) ? (
        <div className="rounded-lg border border-amber-200/18 bg-amber-300/[0.055] p-2">
          <p className="game-caption mb-2 px-1 text-xs text-amber-100/80">{t('yourRank')}</p>
          <LeaderboardRowCard row={currentUser} compact />
        </div>
      ) : null}
    </>
  );
}

function LeaderboardRowCard({ row, compact = false }: { row: LeaderboardRow; compact?: boolean }) {
  const race = raceConfig[row.preferredRace] ?? raceConfig.orcs;
  const t = useT();

  return (
    <div
      className={`flex items-center gap-3 rounded-md border p-3 ${
        row.isCurrentUser ? 'border-amber-300/50 bg-amber-300/12' : compact ? 'border-amber-200/18 bg-black/16' : 'border-white/10 bg-white/[0.045]'
      }`}
    >
      <span className="game-number w-10 text-lg">#{row.rank}</span>
      {row.avatarUrl ? (
        <img src={row.avatarUrl} alt="" className="size-10 shrink-0 rounded-full border border-white/15 object-cover" />
      ) : (
        <div
          className={`game-label grid size-10 shrink-0 place-items-center rounded-full border text-sm ${race.ring}`}
          style={{ background: `linear-gradient(135deg, ${race.accent} 0%, #111827 100%)` }}
        >
          {race.imageUrl}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="game-label truncate">{row.name}</p>
        <p className="game-caption text-xs text-zinc-400">
          {race.label} / {row.xp.toLocaleString()} XP
        </p>
      </div>
      <span className="game-number rounded bg-sky-300/12 px-2 py-1 text-xs text-sky-100">
        {t('levelShort')} {row.level}
      </span>
    </div>
  );
}

function LeaderboardNotice({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-center">
      <p className="game-label text-zinc-100">{title}</p>
      <p className="game-caption mt-1 text-sm text-zinc-500">{caption}</p>
    </div>
  );
}

function ScopeIcon({ type, active }: { type: 'all' | 'friends'; active: boolean }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `size-4 shrink-0 ${active ? 'text-cyan-100' : 'text-zinc-500'}`,
    'aria-hidden': true,
  };

  if (type === 'friends') {
    return (
      <svg {...props}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M14.5 18.5a4.5 4.5 0 0 1 6 0" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4a12 12 0 0 1 0 16" />
      <path d="M12 4a12 12 0 0 0 0 16" />
    </svg>
  );
}

function TournamentsPanel() {
  const t = useT();

  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
      <TournamentIcon />
      <p className="game-label mt-3 text-zinc-100">{t('emptyTournamentsTitle')}</p>
      <p className="game-caption mt-1 text-sm text-zinc-400">{t('emptyTournamentsText')}</p>
    </div>
  );
}

function TournamentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto size-10 text-amber-100"
      aria-hidden="true"
    >
      <path d="M8 4h8l1 5-5 3-5-3 1-5Z" />
      <path d="M12 12v8" />
      <path d="M8 20h8" />
      <path d="m9 7 3 2 3-2" />
    </svg>
  );
}
