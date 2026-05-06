import { Header } from '../shared/Header';
import { leaderboardRows } from '../store/gameStore';

export function LeaderboardPage() {
  return (
    <>
      <Header />
      <section>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {['Today', 'Week', 'Season', 'All time'].map((period, index) => (
            <button
              key={period}
              type="button"
              className={`game-label min-h-10 shrink-0 rounded-md px-4 text-sm ${index === 2 ? 'bg-amber-300 text-zinc-950' : 'bg-white/[0.06] text-zinc-300'}`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="grid gap-2">
          {leaderboardRows.map((row) => (
            <div
              key={`${row.rank}-${row.name}`}
              className={`flex items-center gap-3 rounded-md border p-3 ${
                row.isCurrentUser ? 'border-amber-300/50 bg-amber-300/12' : 'border-white/10 bg-white/[0.045]'
              }`}
            >
              <span className="game-number w-10 text-lg">#{row.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="game-label truncate">{row.name}</p>
                <p className="game-caption text-xs text-zinc-400">
                  Lvl {row.level} / {row.xp.toLocaleString()} XP
                </p>
              </div>
              <span className="rounded bg-[#ff243d]/18 px-2 py-1 text-xs text-[#ff7a89]">{row.immortalTrophies} immortal</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
