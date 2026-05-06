import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useT } from './i18n';

export function LevelUpModal() {
  const modal = useGameStore((state) => state.levelUpModal);
  const closeLevelUpModal = useGameStore((state) => state.closeLevelUpModal);
  const t = useT();

  return (
    <AnimatePresence>
      {modal ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/68 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
            className="w-full max-w-sm overflow-hidden rounded-lg border border-amber-200/30 bg-[#151a24] shadow-2xl shadow-amber-400/20"
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="bg-gradient-to-br from-amber-300/24 via-emerald-300/12 to-sky-400/14 px-5 pb-5 pt-6 text-center">
              <div className="game-number mx-auto grid size-20 place-items-center rounded-full border border-amber-200/40 bg-amber-300 text-4xl text-zinc-950 shadow-glow">
                {modal.level}
              </div>
              <h2 id="level-up-title" className="game-title mt-4 text-2xl">
                {t('congratulations')}
              </h2>
              <p className="game-caption mt-2 text-sm text-zinc-200">{t('reachedLevel', { level: modal.level })}</p>
            </div>
            <div className="px-5 py-4">
              <div className="rounded-md border border-white/10 bg-white/[0.055] p-3 text-center">
                <p className="game-caption text-xs uppercase text-zinc-400">{t('levelReward')}</p>
                <p className="game-label mt-1 text-amber-100">{modal.rewardTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeLevelUpModal}
                className="game-label mt-4 min-h-12 w-full rounded-md bg-amber-300 px-4 text-zinc-950 active:scale-[0.99]"
              >
                {t('claim')}
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
