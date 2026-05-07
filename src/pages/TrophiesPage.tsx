import { Header } from '../shared/Header';
import { useGameStore } from '../store/gameStore';
import { rarityConfig } from '../config/gameConfig';

export function TrophiesPage() {
  const trophies = useGameStore((state) => state.trophies);

  return (
    <>
      <Header />
      <section>
        <div className="mb-3">
          <h2 className="game-title text-lg">Trophy Hall</h2>
          <p className="game-caption text-sm text-zinc-400">Final cards, seasonal relics and collection bonuses.</p>
        </div>
        {trophies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-6 text-center">
            <p className="text-3xl">T</p>
            <p className="game-label mt-2">No trophies yet</p>
            <p className="game-caption mt-1 text-sm text-zinc-400">Merge two matching 6 star race cards to unlock your first trophy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trophies.map((card) => (
              <div key={card.id} className={`rounded-md border ${rarityConfig[card.rarity].ring} bg-white/[0.05] p-3 shadow-lg`}>
                <div className={`grid aspect-square place-items-center rounded bg-gradient-to-br ${rarityConfig[card.rarity].gradient} text-4xl`}>
                  {card.imageUrl}
                </div>
                <p className="game-label mt-2 truncate">{card.name}</p>
                <p className="game-caption text-xs text-zinc-400">Source: {card.source}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
