import { Header } from '../shared/Header';
import { useGameStore } from '../store/gameStore';

export function ReferralPage() {
  const player = useGameStore((state) => state.player);
  const progress = Math.min(100, (player.activeInvitedCount / 10) * 100);

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="rounded-lg border border-white/10 bg-gradient-to-br from-emerald-500/16 to-sky-500/10 p-4">
          <p className="game-caption text-sm text-zinc-300">Referral link</p>
          <p className="game-number mt-2 break-all rounded-md bg-black/25 p-3 text-sm text-emerald-100">
            t.me/dotagift_bot/app?startapp=ref_demo_player
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Invited', player.invitedCount],
            ['Active', player.activeInvitedCount],
            ['Ref lvl', player.referralLevel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
              <p className="game-caption text-xs text-zinc-400">{label}</p>
              <p className="game-number text-xl">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
          <div className="game-caption mb-2 flex justify-between text-sm">
            <span>Next bonus progress</span>
            <span>{player.activeInvitedCount}/10</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="game-caption mt-3 text-sm text-zinc-400">
            An active friend counts after Telegram verification, a real game session and the first server-confirmed actions.
          </p>
        </div>
      </section>
    </>
  );
}
