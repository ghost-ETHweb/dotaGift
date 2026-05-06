import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../shared/Header';
import { useT } from '../shared/i18n';
import { getDeleteEnergy, getDeleteXp, raceConfig, rarityConfig } from '../config/gameConfig';
import { useGameStore } from '../store/gameStore';
import type { GameCard } from '../types';

type DragState = {
  card: GameCard;
  pointerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PendingDrag = DragState & {
  startX: number;
  startY: number;
};

function getSlotIndexAtPoint(x: number, y: number) {
  const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-slot-index]'));
  const target = slots.find((slot) => {
    const rect = slot.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  });

  return target ? Number(target.dataset.slotIndex) : null;
}

const CardFace = memo(function CardFace({ card, muted = false }: { card: GameCard; muted?: boolean }) {
  const race = raceConfig[card.race];

  return (
    <div
      className={`relative flex h-full select-none flex-col overflow-hidden rounded-md border bg-[#101722] p-2 shadow-[0_6px_14px_rgba(0,0,0,0.22)] ${
        muted ? 'opacity-35 saturate-50' : ''
      }`}
      style={{ borderColor: `${race.accent}d8` }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: race.accent }} />
      <div className="grid min-h-0 flex-1 place-items-center pt-1">
        <span className="game-title text-[clamp(1.45rem,7vw,2rem)] leading-none text-white">{card.imageUrl}</span>
      </div>
      <div className="grid place-items-center">
        <span className="game-number rounded-full bg-amber-200 px-2 py-0.5 text-xs leading-none text-zinc-950">
          {card.stars}
          {'\u2605'}
        </span>
      </div>
    </div>
  );
});

function DragPreview({ dragState }: { dragState: DragState | null }) {
  if (!dragState) return null;

  return (
    <div
      className="pointer-events-none fixed z-[80]"
      style={{
        left: dragState.x,
        top: dragState.y,
        width: dragState.width,
        height: dragState.height,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="h-full rotate-2 scale-105 drop-shadow-2xl">
        <CardFace card={dragState.card} />
      </div>
    </div>
  );
}

function CardActionSheet({ card, isSyncing, onClose, onDelete }: { card: GameCard; isSyncing: boolean; onClose: () => void; onDelete: () => void }) {
  const rarity = rarityConfig[card.rarity];
  const race = raceConfig[card.race];
  const deleteXp = getDeleteXp(card.rarity);
  const deleteEnergy = getDeleteEnergy(card.stars);
  const t = useT();

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-[6.5rem] z-[70] mx-auto w-full max-w-[480px] px-4"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <section
        className={`pointer-events-auto rounded-lg border bg-[#121923]/98 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl ${race.ring}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid size-14 shrink-0 place-items-center rounded-md border text-2xl ${race.ring}`}
            style={{ background: `linear-gradient(135deg, ${race.accent} 0%, ${rarity.color} 60%, #080b12 100%)` }}
          >
            {card.imageUrl}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="game-title truncate text-lg">{card.name}</h3>
                <p className="text-sm text-zinc-400">
                  <span className="game-number text-amber-100 drop-shadow-[0_0_6px_rgba(252,211,77,0.65)]">
                    {Array.from({ length: card.stars }, () => '\u2605').join('')}
                  </span>{' '}
                  <span style={{ color: rarity.color }}>{rarity.label}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-md bg-white/[0.06] text-lg text-zinc-300">
                x
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isSyncing}
          className="game-label mt-4 min-h-12 w-full rounded-md border border-amber-200/30 bg-amber-300 px-4 text-sm text-zinc-950 shadow-[0_0_22px_rgba(252,211,77,0.18)] active:scale-[0.99] disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {t('deleteFor', { xp: deleteXp, energy: deleteEnergy })}
        </button>
      </section>
    </motion.div>
  );
}

export function GamePage() {
  const board = useGameStore((state) => state.board);
  const energy = useGameStore((state) => state.energy);
  const createCard = useGameStore((state) => state.createCard);
  const moveCard = useGameStore((state) => state.moveCard);
  const mergeCards = useGameStore((state) => state.mergeCards);
  const deleteCard = useGameStore((state) => state.deleteCard);
  const isSyncing = useGameStore((state) => state.isSyncing);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [actionCard, setActionCard] = useState<GameCard | null>(null);
  const pendingDrag = useRef<PendingDrag | null>(null);
  const isCreateDisabled = energy.current < energy.createCost || board.every(Boolean);
  const matchSource = dragState?.card ?? actionCard;
  const t = useT();

  useEffect(() => {
    if (!actionCard) return;

    const closeSheet = () => setActionCard(null);
    window.addEventListener('pointerdown', closeSheet);
    return () => window.removeEventListener('pointerdown', closeSheet);
  }, [actionCard]);

  const handleDrop = (sourceCard: GameCard, targetIndex: number | null) => {
    if (isSyncing) return;
    if (targetIndex === null || targetIndex === sourceCard.boardIndex) return;
    const targetCard = board[targetIndex];

    if (targetCard) {
      void mergeCards(sourceCard.id, targetCard.id);
    } else {
      void moveCard(sourceCard.id, targetIndex);
    }
  };

  return (
    <>
      <Header />
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-2 shadow-2xl">
        <div className="mb-2 rounded-md border border-cyan-200/18 bg-cyan-300/[0.055] px-3 py-2 shadow-[0_0_22px_rgba(34,211,238,0.1)]">
          <h2 className="game-title text-sm text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.28)]">{t('battleBoard')}</h2>
          <p className="game-caption mt-0.5 text-[11px] leading-4 text-cyan-100/78">{t('boardHint')}</p>
        </div>
        <div
          className="mx-auto grid aspect-square touch-none grid-cols-4 gap-1.5"
          style={{ width: 'min(100%, calc(100dvh - 292px))', maxWidth: '440px' }}
        >
          {board.map((card, index) => {
            const isSource = Boolean(matchSource && card?.id === matchSource.id);
            const isCompatible = Boolean(matchSource && card && !isSource && card.race === matchSource.race && card.stars === matchSource.stars);
            const isDimmed = Boolean(matchSource && card && !isSource && !isCompatible);
            const slotClass = isCompatible
              ? 'border-emerald-300/75 bg-emerald-300/12 shadow-[0_0_0_2px_rgba(110,231,183,0.18)]'
              : dropIndex === index
                ? 'border-cyan-200 bg-cyan-300/10 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
              : 'border-white/10 bg-black/22';

            return (
              <div key={index} data-slot-index={index} className={`relative aspect-square rounded-md border p-1 transition ${slotClass} ${isDimmed ? 'opacity-40' : ''}`}>
                <div className="absolute inset-1 rounded bg-white/[0.035]" />
                {card ? (
                  <div
                    className="relative z-10 h-full touch-none"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      pendingDrag.current = {
                        card,
                        pointerId: event.pointerId,
                        x: event.clientX,
                        y: event.clientY,
                        startX: event.clientX,
                        startY: event.clientY,
                        width: rect.width,
                        height: rect.height,
                      };
                    }}
                    onPointerMove={(event) => {
                      event.preventDefault();
                      const pending = pendingDrag.current;
                      if (!pending || pending.pointerId !== event.pointerId) return;

                      const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
                      if (distance < 8 && !dragState) return;

                      setActionCard(null);
                      setDropIndex(getSlotIndexAtPoint(event.clientX, event.clientY));
                      setDragState((current) => {
                        if (!current) return { ...pending, x: event.clientX, y: event.clientY };
                        return { ...current, x: event.clientX, y: event.clientY };
                      });
                    }}
                    onPointerUp={(event) => {
                      event.preventDefault();
                      const pending = pendingDrag.current;
                      const targetIndex = getSlotIndexAtPoint(event.clientX, event.clientY);

                      if (dragState) {
                        handleDrop(dragState.card, targetIndex);
                      } else if (pending && pending.pointerId === event.pointerId) {
                        setActionCard(card);
                      }

                      pendingDrag.current = null;
                      setDragState(null);
                      setDropIndex(null);
                    }}
                    onPointerCancel={() => {
                      pendingDrag.current = null;
                      setDragState(null);
                      setDropIndex(null);
                    }}
                  >
                    <CardFace card={card} muted={dragState?.card.id === card.id} />
                  </div>
                ) : (
                  <div className="relative z-10 h-full" />
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className="mt-3 grid gap-2">
        <button
          type="button"
          disabled={isCreateDisabled}
          onClick={() => void createCard()}
          className="game-label min-h-12 rounded-md bg-amber-300 px-5 text-sm text-zinc-950 shadow-glow transition active:scale-[0.99] disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {t('createCard')} / {energy.createCost} {t('energyUnit')}
        </button>
        <div className="game-caption rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-xs leading-4 text-zinc-300">
          {energy.current < energy.createCost
            ? t('energyEmpty', { minutes: energy.regenIntervalMinutes })
            : board.every(Boolean)
              ? t('boardFull')
              : t('createHint')}
        </div>
      </section>
      <DragPreview dragState={dragState} />
      <AnimatePresence>
        {actionCard ? (
          <CardActionSheet
            card={actionCard}
            isSyncing={isSyncing}
            onClose={() => setActionCard(null)}
            onDelete={() => {
              void deleteCard(actionCard.id);
              setActionCard(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
