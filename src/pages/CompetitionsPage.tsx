import { Header } from '../shared/Header';

export function CompetitionsPage() {
  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="rounded-lg border border-amber-200/20 bg-gradient-to-br from-amber-300/14 via-cyan-300/8 to-white/[0.035] p-4">
          <p className="game-caption text-xs uppercase text-amber-100/75">Season mode</p>
          <h2 className="game-title mt-1 text-xl">Tournaments</h2>
          <p className="game-caption mt-2 text-sm text-zinc-300">Seasonal tournaments will appear here.</p>
        </div>

        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
          <TournamentIcon />
          <p className="game-label mt-3 text-zinc-100">Sorry, it is empty here for now</p>
          <p className="game-caption mt-1 text-sm text-zinc-400">Wait for news. The first seasonal tournaments are coming later.</p>
        </div>
      </section>
    </>
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
