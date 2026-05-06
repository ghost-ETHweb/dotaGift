import { AnimatePresence, motion } from 'framer-motion';
import { deleteEnergyByStars, getTrophyEnergy, mergeEnergyByResultStars } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';
import { useT } from './i18n';

export function EnergyModal() {
  const isOpen = useGameStore((state) => state.isEnergyModalOpen);
  const energy = useGameStore((state) => state.energy);
  const playerLevel = useGameStore((state) => state.player.level);
  const closeEnergyModal = useGameStore((state) => state.closeEnergyModal);
  const nextCapLevel = Math.ceil((playerLevel + 1) / 5) * 5;
  const overflow = Math.max(0, energy.current - energy.max);
  const t = useT();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/68 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeEnergyModal}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="energy-title"
            className="max-h-[86vh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-lg border border-amber-200/25 bg-[#151a24] p-5 shadow-2xl shadow-amber-400/15"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="game-caption text-xs uppercase text-zinc-400">{t('resource')}</p>
                <h2 id="energy-title" className="game-title mt-1 text-2xl">
                  {t('energy')}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEnergyModal}
                className="grid size-9 place-items-center rounded-md bg-white/[0.06] text-xl text-zinc-300"
                aria-label="Close energy modal"
              >
                x
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-gradient-to-br from-amber-300/18 to-emerald-300/10 p-4 text-center">
              <p className="game-caption text-sm text-zinc-300">{t('currentStock')}</p>
              <p className="game-number mt-1 text-4xl">
                {energy.current}
                <span className="text-xl text-zinc-400">/{energy.max}</span>
              </p>
              {overflow > 0 ? <p className="game-caption mt-2 text-sm text-emerald-200">{t('bonusEnergy', { amount: overflow })}</p> : null}
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <InfoRow label={t('createCardCost')} value={`${energy.createCost} ${t('energyUnit')}`} />
              <InfoRow label={t('regen')} value={`+1 / ${energy.regenIntervalMinutes} min`} />
              <InfoRow label={t('capGrowth')} value={t('capGrowthValue')} />
              <InfoRow label={t('trophyMerge')} value={`+${getTrophyEnergy()} ${t('energyUnit')}`} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <RewardTable title={t('delete')} rows={Object.entries(deleteEnergyByStars).map(([stars, value]) => [`${stars} ${t('star')}`, `+${value}`])} />
              <RewardTable
                title={t('mergeResult')}
                rows={Object.entries(mergeEnergyByResultStars)
                  .filter(([stars]) => stars !== '1')
                  .map(([stars, value]) => [`${stars} ${t('star')}`, `+${value}`])}
              />
            </div>

            <div className="mt-4 rounded-md border border-amber-200/25 bg-amber-300/[0.075] p-3 shadow-[0_0_28px_rgba(252,211,77,0.14)]">
              <p className="game-label text-sm leading-5 text-amber-100">{t('naturalRegen')}</p>
              <p className="game-caption mt-1 text-sm leading-5 text-zinc-300">{t('energyRules')}</p>
              <p className="game-label mt-2 text-sm text-emerald-200">
                {t('nextCap', { value: nextCapLevel <= 100 ? `${t('level')} ${nextCapLevel}` : t('maxCapReached') })}
              </p>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
      <span className="game-caption text-zinc-400">{label}</span>
      <strong className="game-number text-right">{value}</strong>
    </div>
  );
}

function RewardTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <p className="game-label mb-2 text-zinc-200">{title}</p>
      <div className="grid gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="game-caption flex justify-between gap-2 text-zinc-400">
            <span>{label}</span>
            <strong className="game-number text-emerald-200">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
