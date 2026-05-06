import { useGameStore } from '../store/gameStore';
import { raceConfig, rarityConfig, xpToNextLevel } from '../config/gameConfig';
import { useT } from './i18n';

export function Header() {
  const player = useGameStore((state) => state.player);
  const energy = useGameStore((state) => state.energy);
  const selectedAvatarRace = useGameStore((state) => state.selectedAvatarRace);
  const setActiveTab = useGameStore((state) => state.setActiveTab);
  const openEnergyModal = useGameStore((state) => state.openEnergyModal);
  const openXpModal = useGameStore((state) => state.openXpModal);
  const xpGoal = xpToNextLevel(player.level);
  const progress = Math.min(100, (player.xp / xpGoal) * 100);
  const avatarRace = raceConfig[selectedAvatarRace];
  const avatarRarity = rarityConfig.common;
  const t = useT();

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setActiveTab('profile')} className="flex min-w-0 items-center gap-3">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className="size-10 rounded-full border border-white/20 object-cover shadow-glow" />
          ) : (
            <div
              className={`game-label grid size-10 place-items-center rounded-full border text-sm shadow-glow ${avatarRace.ring}`}
              style={{
                background: `linear-gradient(135deg, ${avatarRace.accent} 0%, ${avatarRarity.color} 70%, #080b12 100%)`,
              }}
            >
              {avatarRace.imageUrl}
            </div>
          )}
          <div className="min-w-0 text-left">
            <h1 className="game-title truncate text-xl text-zinc-50">Dota Gift</h1>
            <p className="game-caption truncate text-xs text-zinc-400">
              {t('levelShort')} {player.level}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={openEnergyModal}
          className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-right transition active:scale-[0.98]"
          aria-label="Open energy info"
        >
          <p className="game-caption text-[11px] uppercase text-zinc-400">{t('energy')}</p>
          <p className="game-number text-sm text-amber-200">
            {energy.current}/{energy.max}
          </p>
        </button>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={openXpModal}
          className="mb-2 flex w-full items-center justify-between rounded-md border border-sky-200/20 bg-sky-300/[0.07] px-3 py-2 text-left shadow-[0_0_22px_rgba(56,189,248,0.12)] transition active:scale-[0.99]"
          aria-label="Open XP info"
        >
          <span className="game-caption text-xs uppercase text-sky-100">{t('xpProgress')}</span>
          <span className="game-number text-xs text-emerald-200">
            {player.xp}/{xpGoal}
          </span>
        </button>
        <div className="h-2 overflow-hidden rounded-full border border-cyan-100/10 bg-[#071822] shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#22d3ee] to-[#bff8ff] shadow-[0_0_16px_rgba(34,211,238,0.62)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}
