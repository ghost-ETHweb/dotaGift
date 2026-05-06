import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { telegram } from '../lib/telegram';
import { useGameStore } from '../store/gameStore';
import { BottomNav } from '../shared/BottomNav';
import { LevelUpModal } from '../shared/LevelUpModal';
import { EnergyModal } from '../shared/EnergyModal';
import { XpModal } from '../shared/XpModal';
import { GamePage } from '../pages/GamePage';
import { ProgressPage } from '../pages/ProgressPage';
import { ArenaPage } from '../pages/ArenaPage';
import { CollectionPage } from '../pages/CollectionPage';
import { ProfilePage } from '../pages/ProfilePage';

const pages = {
  game: GamePage,
  progress: ProgressPage,
  arena: ArenaPage,
  collection: CollectionPage,
  profile: ProfilePage,
};

export default function App() {
  const activeTab = useGameStore((state) => state.activeTab);
  const accessToken = useGameStore((state) => state.accessToken);
  const isBootstrapping = useGameStore((state) => state.isBootstrapping);
  const apiError = useGameStore((state) => state.apiError);
  const bootstrapSession = useGameStore((state) => state.bootstrapSession);
  const clearApiError = useGameStore((state) => state.clearApiError);
  const setLanguageFromSystem = useGameStore((state) => state.setLanguageFromSystem);
  const Page = pages[activeTab];

  useEffect(() => {
    telegram.init();
    setLanguageFromSystem(telegram.getUserLanguageCode() ?? navigator.language);
    void bootstrapSession(telegram.getInitData());
  }, [bootstrapSession, setLanguageFromSystem]);

  if (isBootstrapping) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-[480px] place-items-center bg-[#10141c]/95 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto size-10 animate-pulse rounded-full border border-cyan-200/30 bg-cyan-300/12 shadow-[0_0_24px_rgba(34,211,238,0.14)]" />
          <p className="game-label mt-4 text-cyan-50">Syncing game</p>
          <p className="game-caption mt-1 text-sm text-zinc-400">Connecting to the Dota Gift server.</p>
        </div>
      </main>
    );
  }

  if (apiError && !accessToken) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-[480px] place-items-center bg-[#10141c]/95 px-6 text-white">
        <section className="w-full rounded-lg border border-amber-200/25 bg-amber-300/[0.07] p-5 text-center shadow-[0_0_28px_rgba(252,211,77,0.1)]">
          <p className="game-title text-xl text-amber-100">Server is offline</p>
          <p className="game-caption mt-2 text-sm leading-5 text-zinc-300">{apiError}</p>
          <button
            type="button"
            onClick={() => {
              clearApiError();
              void bootstrapSession(telegram.getInitData());
            }}
            className="game-label mt-4 min-h-11 w-full rounded-md bg-amber-300 px-4 text-zinc-950 active:scale-[0.99]"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col overflow-hidden bg-[#10141c]/95 text-white">
      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-2 sm:px-4">
        {apiError ? (
          <button
            type="button"
            onClick={clearApiError}
            className="game-caption mb-3 w-full rounded-md border border-amber-200/20 bg-amber-300/[0.08] px-3 py-2 text-left text-xs text-amber-100"
          >
            {apiError}
          </button>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
      <EnergyModal />
      <XpModal />
      <LevelUpModal />
    </main>
  );
}
