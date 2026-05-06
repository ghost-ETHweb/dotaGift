import { useState } from 'react';
import { Header } from '../shared/Header';
import { useT } from '../shared/i18n';
import { useGameStore } from '../store/gameStore';
import { rarityConfig } from '../config/gameConfig';

type CollectionTab = 'trophies' | 'season';

export function CollectionPage() {
  const trophies = useGameStore((state) => state.trophies);
  const [activeTab, setActiveTab] = useState<CollectionTab>('trophies');
  const t = useT();

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div>
          <h2 className="game-title text-lg">{t('collection')}</h2>
          <p className="game-caption text-sm text-zinc-400">{t('collectionHint')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-1">
          {[
            { id: 'trophies' as const, label: t('trophies') },
            { id: 'season' as const, label: t('seasonCards') },
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

        {activeTab === 'trophies' ? <TrophiesPanel trophies={trophies} /> : <SeasonCardsPanel />}
      </section>
    </>
  );
}

function TrophiesPanel({ trophies }: { trophies: ReturnType<typeof useGameStore.getState>['trophies'] }) {
  const t = useT();

  if (trophies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
        <TrophyIcon />
        <p className="game-label mt-2">{t('noTrophies')}</p>
        <p className="game-caption mt-1 text-sm text-zinc-400">{t('noTrophiesText')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {trophies.map((card) => (
        <div key={card.id} className={`rounded-md border ${rarityConfig[card.rarity].ring} bg-white/[0.05] p-3 shadow-lg`}>
          <div className={`grid aspect-square place-items-center rounded bg-gradient-to-br ${rarityConfig[card.rarity].gradient} text-4xl`}>{card.imageUrl}</div>
          <p className="game-label mt-2 truncate">{card.name}</p>
          <p className="game-caption text-xs text-zinc-400">
            {t('source')}: {card.source}
          </p>
        </div>
      ))}
    </div>
  );
}

function SeasonCardsPanel() {
  const t = useT();

  return (
    <div className="rounded-lg border border-dashed border-cyan-200/15 bg-cyan-300/[0.035] p-6 text-center">
      <SeasonCardIcon />
      <p className="game-label mt-2">{t('noSeasonCards')}</p>
      <p className="game-caption mt-1 text-sm text-zinc-400">{t('noSeasonCardsText')}</p>
    </div>
  );
}

function TrophyIcon() {
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
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 3" />
      <path d="M17 6h3a3 3 0 0 1-3 3" />
    </svg>
  );
}

function SeasonCardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto size-10 text-cyan-100"
      aria-hidden="true"
    >
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 17h6" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}
