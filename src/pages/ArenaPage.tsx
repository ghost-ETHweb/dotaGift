import { useEffect, useState } from 'react';
import { Header } from '../shared/Header';
import { useT, type TranslationKey } from '../shared/i18n';
import { apiClient } from '../api/client';
import type { LeaderboardScope, RaceWarResponse } from '../api/contracts';
import { raceConfig, raceOrder } from '../config/gameConfig';
import { raceAbilities, seasonLengthDays, trophyXpPerHour } from '../config/seasonConfig';
import { useGameStore } from '../store/gameStore';
import type { CardRace, LeaderboardRow } from '../types';

type ArenaTab = 'leaderboard' | 'tournaments';
type TournamentTab = 'raceWar' | 'seasonEvent';

export function ArenaPage() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('leaderboard');
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

        {activeTab === 'leaderboard' ? <LeaderboardPanel scope={scope} setScope={setScope} /> : <TournamentsPanel />}
      </section>
    </>
  );
}

function LeaderboardPanel({
  scope,
  setScope,
}: {
  scope: LeaderboardScope;
  setScope: (scope: LeaderboardScope) => void;
}) {
  const accessToken = useGameStore((state) => state.accessToken);
  const player = useGameStore((state) => state.player);
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
      .getLeaderboard(accessToken, { period: 'allTime', scope })
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
  }, [accessToken, scope]);

  const uniqueRows = rows.filter((row, index, list) => list.findIndex((item) => item.name === row.name) === index);

  return (
    <>
      <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-cyan-200/20 bg-cyan-300/[0.055] p-1 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
        {[
          { id: 'all' as const, label: t('allPlayers'), icon: 'all' as const },
          { id: 'friends' as const, label: t('friendsOnly'), icon: 'friends' as const },
          { id: 'race' as const, label: t('myRace'), icon: 'race' as const },
        ].map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScope(item.id)}
            className={`game-label min-h-9 min-w-0 px-1.5 text-[11px] transition active:scale-[0.99] ${
              index === 0 ? 'rounded-l-md border-r border-cyan-100/18' : index === 1 ? 'border-r border-cyan-100/18' : 'rounded-r-md'
            } ${
              scope === item.id ? 'bg-cyan-200/18 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(165,243,252,0.12)]' : 'bg-black/12 text-zinc-400'
            }`}
          >
            <span className="flex min-w-0 items-center justify-center gap-1">
              <ScopeIcon type={item.icon} active={scope === item.id} />
              <span className={`min-w-0 truncate ${scope === item.id ? 'text-white drop-shadow-[0_0_8px_rgba(165,243,252,0.28)]' : 'text-zinc-400'}`}>{item.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {isLoading ? <LeaderboardNotice title={t('loading')} caption={`${t('leaderboard')}...`} /> : null}
        {error ? <LeaderboardNotice title={t('leaderboard')} caption={error} /> : null}
        {!isLoading && !error && uniqueRows.length === 0 ? (
          <LeaderboardNotice
            title={scope === 'friends' ? t('friendsLeaderboardEmpty') : scope === 'race' ? t('raceBoardEmpty') : t('leaderboardEmpty')}
            caption={scope === 'friends' ? t('partners') : scope === 'race' && player.seasonRace ? getRaceLabel(player.seasonRace, t) : t('chooseSeasonRace')}
          />
        ) : null}
        {!isLoading && !error ? uniqueRows.map((row) => <LeaderboardRowCard key={`all-time-${scope}-${row.rank}-${row.name}`} row={row} />) : null}
      </div>

      {scope !== 'race' && currentUser && !rows.some((row) => row.isCurrentUser) ? (
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
          {getRaceLabel(row.preferredRace, t)} / {row.xp.toLocaleString()} XP
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

function ScopeIcon({ type, active }: { type: 'all' | 'friends' | 'race'; active: boolean }) {
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

  if (type === 'race') {
    return (
      <svg {...props}>
        <path d="M12 3 5 7v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V7l-7-4Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
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
  const [activeTournament, setActiveTournament] = useState<TournamentTab>('raceWar');
  const t = useT();

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-cyan-200/20 bg-cyan-300/[0.055] p-1 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
        {[
          { id: 'raceWar' as const, label: t('raceWar') },
          { id: 'seasonEvent' as const, label: t('seasonEvent') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTournament(tab.id)}
            className={`game-label min-h-9 min-w-0 px-2 text-xs transition active:scale-[0.99] ${
              tab.id === 'raceWar' ? 'rounded-l-md border-r border-cyan-100/18' : 'rounded-r-md'
            } ${
              activeTournament === tab.id ? 'bg-cyan-200/18 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(165,243,252,0.12)]' : 'bg-black/12 text-zinc-400'
            }`}
          >
            <span className={activeTournament === tab.id ? 'text-white drop-shadow-[0_0_8px_rgba(165,243,252,0.28)]' : 'text-zinc-400'}>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTournament === 'raceWar' ? <RaceWarPanel /> : <SeasonEventPlaceholder />}
    </div>
  );
}

function RaceWarPanel() {
  const accessToken = useGameStore((state) => state.accessToken);
  const player = useGameStore((state) => state.player);
  const setSeasonRace = useGameStore((state) => state.setSeasonRace);
  const isSyncing = useGameStore((state) => state.isSyncing);
  const [now, setNow] = useState(Date.now());
  const [infoModal, setInfoModal] = useState<{ title: string; body: string } | null>(null);
  const [raceWar, setRaceWar] = useState<RaceWarResponse | null>(null);
  const [isRaceWarLoading, setIsRaceWarLoading] = useState(false);
  const [raceWarError, setRaceWarError] = useState<string | null>(null);
  const t = useT();
  const nextAbilityMs = 4 * 60 * 60 * 1000 - (now % (4 * 60 * 60 * 1000));
  const seasonDurationMs = seasonLengthDays * 24 * 60 * 60 * 1000;
  const seasonEndMs = seasonDurationMs - (now % seasonDurationMs);
  const raceWarRows =
    raceWar?.rows ??
    raceOrder.map((race, index) => ({
      race,
      rank: index + 1,
      trophyCount: 0,
      hourlyXp: 0,
      score: 0,
      abilityScore: 0,
    }));
  const rows = raceWarRows.map((row) => {
      const raceView = raceConfig[row.race];

      return {
        ...row,
        raceView,
        ability: raceAbilities[row.race],
      };
    });
  const maxScore = Math.max(...rows.map((row) => row.score), 1);
  const playerRace = raceWar?.playerRace ?? player.seasonRace ?? null;
  const myRaceRow = rows.find((row) => row.race === playerRace) ?? rows[0];
  const myContribution = raceWar?.playerContribution.hourlyXp ?? myRaceRow.trophyCount * trophyXpPerHour.standard;
  const seasonEndsAt = raceWar?.seasonEndsAt ? Date.parse(raceWar.seasonEndsAt) : now + seasonEndMs;
  const nextAbilityAt = raceWar?.nextAbilityAt ? Date.parse(raceWar.nextAbilityAt) : now + nextAbilityMs;
  const displayedSeasonEndMs = seasonEndsAt - now;
  const displayedNextAbilityMs = nextAbilityAt - now;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    let isCancelled = false;
    setIsRaceWarLoading(true);
    setRaceWarError(null);

    apiClient
      .getRaceWar(accessToken)
      .then((response) => {
        if (isCancelled) return;
        setRaceWar(response);
      })
      .catch((requestError: unknown) => {
        if (isCancelled) return;
        setRaceWarError(requestError instanceof Error ? requestError.message : 'Race war request failed.');
      })
      .finally(() => {
        if (!isCancelled) setIsRaceWarLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="grid gap-3">
      <section className="rounded-lg border border-amber-200/18 bg-gradient-to-br from-amber-300/[0.12] to-cyan-300/[0.045] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="game-caption text-xs uppercase text-amber-100/75">{t('raceTournament')}</p>
            <p className="game-number mt-1 text-2xl text-cyan-50">{formatSeasonTimer(displayedSeasonEndMs)}</p>
            <p className="game-caption mt-1 text-sm text-zinc-400">{t('seasonEndsIn')}</p>
          </div>
          <TournamentIcon compact />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setInfoModal({ title: t('nextAbility'), body: t('nextAbilityInfo') })}
            className="rounded-md border border-white/10 bg-black/18 p-3 text-left transition active:scale-[0.99]"
          >
            <p className="game-caption text-xs text-zinc-500">{t('nextAbility')}</p>
            <p className="game-number mt-1 text-lg text-cyan-100">{formatTournamentTimer(displayedNextAbilityMs)}</p>
          </button>
          {playerRace ? (
            <div className={`flex items-center gap-3 rounded-md border bg-black/18 p-3 ${myRaceRow.raceView.ring}`}>
              <span
                className={`game-label grid size-9 shrink-0 place-items-center rounded-full border text-xs ${myRaceRow.raceView.ring}`}
                style={{ background: `linear-gradient(135deg, ${myRaceRow.raceView.accent} 0%, #111827 100%)` }}
              >
                {myRaceRow.raceView.imageUrl}
              </span>
              <span className="min-w-0">
                <p className="game-caption text-xs text-zinc-500">{t('yourRace')}</p>
                <p className="game-number mt-1 truncate text-lg text-amber-100">{getRaceLabel(myRaceRow.race, t)}</p>
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200/20 bg-amber-300/[0.075] p-3">
              <p className="game-caption text-xs text-amber-100/80">{t('chooseSeasonRace')}</p>
              <p className="game-number mt-1 text-sm text-amber-50">{t('seasonRaceLocked')}</p>
            </div>
          )}
        </div>
      </section>

      {!playerRace ? (
        <section className="rounded-lg border border-cyan-200/18 bg-cyan-300/[0.045] p-3">
          <p className="game-label text-cyan-50">{t('chooseSeasonRace')}</p>
          <p className="game-caption mt-1 text-xs leading-5 text-zinc-400">{t('seasonRaceLockedText')}</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {raceOrder.map((race) => {
              const config = raceConfig[race];
              return (
                <button
                  key={race}
                  type="button"
                  disabled={isSyncing}
                  onClick={() => {
                    void setSeasonRace(race as CardRace).then((response) => {
                      if (response) setRaceWar(response);
                    });
                  }}
                  className={`min-h-16 rounded-md border bg-black/18 p-2 text-center transition active:scale-[0.98] disabled:opacity-50 ${config.ring}`}
                >
                  <span
                    className={`game-label mx-auto grid size-8 place-items-center rounded-full border text-xs ${config.ring}`}
                    style={{ background: `linear-gradient(135deg, ${config.accent} 0%, #111827 100%)` }}
                  >
                    {config.imageUrl}
                  </span>
                  <span className="game-caption mt-1 block truncate text-[10px] text-zinc-300">{getRaceLabel(race, t)}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-2">
        {isRaceWarLoading ? <LeaderboardNotice title={t('loading')} caption={t('raceWar')} /> : null}
        {raceWarError ? <LeaderboardNotice title={t('raceWar')} caption={raceWarError} /> : null}
        {rows.map((row) => {
          const progress = Math.max(8, (row.score / maxScore) * 100);

          return (
            <article key={row.race} className={`rounded-lg border bg-white/[0.04] p-3 ${row.raceView.ring}`}>
              <div className="flex items-center gap-3">
                <span
                  className={`game-label grid size-10 shrink-0 place-items-center rounded-full border text-sm ${row.raceView.ring}`}
                  style={{ background: `linear-gradient(135deg, ${row.raceView.accent} 0%, #111827 100%)` }}
                >
                  {row.raceView.imageUrl}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="game-label truncate">
                      #{row.rank} {getRaceLabel(row.race, t)}
                    </p>
                    <p className="game-number text-xs text-amber-100">{row.score.toLocaleString()} XP</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/28">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: row.raceView.accent }} />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <SeasonMetric label={t('hourly')} value={`+${row.hourlyXp}`} />
                <SeasonMetric label={t('trophies')} value={String(row.trophyCount)} />
                <SeasonMetric label={t('ability')} value={`+${row.abilityScore}`} />
              </div>
              <button
                type="button"
                onClick={() =>
                  setInfoModal({
                    title: t(`ability${capitalizeRace(row.race)}Name` as TranslationKey),
                    body: t(`ability${capitalizeRace(row.race)}Detail` as TranslationKey),
                  })
                }
                className="mt-3 w-full rounded-md border p-2 text-left shadow-[0_0_16px_rgba(34,211,238,0.08)] transition active:scale-[0.99]"
                style={{
                  borderColor: `${row.raceView.accent}9a`,
                  background: `linear-gradient(135deg, ${row.raceView.accent}20 0%, rgba(0,0,0,0.18) 100%)`,
                }}
              >
                <p className="game-label text-sm text-cyan-50">{t(`ability${capitalizeRace(row.race)}Name` as TranslationKey)}</p>
                <p className="game-caption mt-1 text-xs leading-4 text-zinc-300">{t(`ability${capitalizeRace(row.race)}Short` as TranslationKey)}</p>
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-cyan-200/18 bg-cyan-300/[0.045] p-3">
        <p className="game-label text-cyan-100">{t('yourSeasonContribution')}</p>
        <p className="game-caption mt-1 text-sm leading-5 text-zinc-400">{t('yourSeasonContributionText')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SeasonMetric label={t('baseTrophy')} value={`${trophyXpPerHour.standard}/h`} />
          <SeasonMetric label={t('yourHourly')} value={`+${myContribution}/h`} />
        </div>
      </section>
      {infoModal ? <InfoModal title={infoModal.title} body={infoModal.body} onClose={() => setInfoModal(null)} /> : null}
    </div>
  );
}

function SeasonEventPlaceholder() {
  const t = useT();

  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
      <TournamentIcon />
      <p className="game-label mt-3 text-zinc-100">{t('seasonEventSoonTitle')}</p>
      <p className="game-caption mt-1 text-sm leading-5 text-zinc-400">{t('seasonEventSoonText')}</p>
    </div>
  );
}

function capitalizeRace(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getRaceLabel(race: string, t: ReturnType<typeof useT>) {
  return t(`race${capitalizeRace(race)}` as TranslationKey);
}

function InfoModal({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 px-4 backdrop-blur-sm" onPointerDown={onClose}>
      <section
        className="w-full max-w-[360px] rounded-lg border border-cyan-200/22 bg-[#121923] p-4 shadow-2xl shadow-black/45"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="game-title text-lg text-cyan-50">{title}</h3>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-md bg-white/[0.06] text-zinc-300">
            x
          </button>
        </div>
        <p className="game-caption mt-3 text-sm leading-5 text-zinc-300">{body}</p>
      </section>
    </div>
  );
}

function formatTournamentTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatSeasonTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
}

function SeasonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/16 px-2 py-2">
      <p className="game-caption text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="game-number mt-0.5 text-sm text-zinc-100">{value}</p>
    </div>
  );
}

function TournamentIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${compact ? 'size-10 shrink-0' : 'mx-auto size-10'} text-amber-100`}
      aria-hidden="true"
    >
      <path d="M8 4h8l1 5-5 3-5-3 1-5Z" />
      <path d="M12 12v8" />
      <path d="M8 20h8" />
      <path d="m9 7 3 2 3-2" />
    </svg>
  );
}
