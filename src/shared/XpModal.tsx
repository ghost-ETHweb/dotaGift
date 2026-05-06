import { AnimatePresence, motion } from 'framer-motion';
import { xpToNextLevel } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';
import { useT } from './i18n';

export function XpModal() {
  const isOpen = useGameStore((state) => state.isXpModalOpen);
  const player = useGameStore((state) => state.player);
  const closeXpModal = useGameStore((state) => state.closeXpModal);
  const goal = xpToNextLevel(player.level);
  const progress = Math.min(100, (player.xp / goal) * 100);
  const left = Math.max(0, goal - player.xp);
  const t = useT();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/68 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeXpModal}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="xp-title"
            className="w-full max-w-sm rounded-lg border border-sky-200/25 bg-[#111a26] p-5 shadow-2xl shadow-sky-400/15"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="game-caption text-xs uppercase text-sky-200/70">{t('progress')}</p>
                <h2 id="xp-title" className="game-title mt-1 text-2xl">
                  {t('playerXp')}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeXpModal}
                className="grid size-9 place-items-center rounded-md bg-white/[0.06] text-xl text-zinc-300"
                aria-label="Close XP modal"
              >
                x
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-sky-200/20 bg-gradient-to-br from-sky-300/16 via-cyan-300/10 to-emerald-300/10 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="game-caption text-sm text-zinc-300">{t('level')}</p>
                  <p className="game-number text-4xl">{player.level}</p>
                </div>
                <p className="game-caption pb-1 text-sm text-emerald-200">{t('xpToNext', { xp: left })}</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full border border-cyan-100/10 bg-[#071822] shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#22d3ee] to-[#bff8ff] shadow-[0_0_20px_rgba(34,211,238,0.62)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="game-number mt-2 flex justify-between text-xs text-zinc-400">
                <span>{player.xp} XP</span>
                <span>{goal} XP</span>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <InfoRow label={t('createCard')} value={t('xpSmall')} />
              <InfoRow label={t('merge')} value={t('xpMain')} />
              <InfoRow label={t('trophies')} value={t('xpBonus')} />
            </div>

            <div className="mt-4 rounded-md border border-cyan-200/25 bg-cyan-300/[0.07] p-3 shadow-[0_0_28px_rgba(34,211,238,0.13)]">
              <p className="game-label text-sm leading-5 text-cyan-100">{t('xpRare')}</p>
              <p className="game-caption mt-1 text-sm leading-5 text-zinc-300">{t('xpCurve')}</p>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="game-caption text-zinc-400">{label}</span>
      <strong className="game-label">{value}</strong>
    </div>
  );
}
