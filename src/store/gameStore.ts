import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { ActionResponse } from '../api/contracts';
import type { AppLanguage, CardRace, EnergyState, GameCard, LeaderboardRow, PlayerProfile, Rarity, StarRank, TabId } from '../types';
import {
  CREATE_CARD_ENERGY_COST,
  ENERGY_REGEN_INTERVAL_MINUTES,
  raceConfig,
  raceOrder,
  rarityByStars,
  rewardsTable,
  xpToNextLevel,
} from '../config/gameConfig';

type LevelUpModal = {
  level: number;
  rewardTitle: string;
};

interface GameStore {
  activeTab: TabId;
  accessToken?: string;
  isBootstrapping: boolean;
  isSyncing: boolean;
  apiError?: string;
  board: Array<GameCard | null>;
  trophies: GameCard[];
  claimedRewardIds: string[];
  selectedAvatarRace: CardRace;
  language: AppLanguage;
  levelUpModal?: LevelUpModal;
  isEnergyModalOpen: boolean;
  isXpModalOpen: boolean;
  energy: EnergyState;
  player: PlayerProfile;
  bootstrapSession: (initData?: string, referralCode?: string) => Promise<void>;
  clearApiError: () => void;
  setActiveTab: (tab: TabId) => void;
  setSelectedAvatarRace: (race: CardRace) => void;
  setLanguage: (language: AppLanguage) => void;
  setLanguageFromSystem: (languageCode?: string) => void;
  createCard: () => Promise<void>;
  moveCard: (cardId: string, targetIndex: number) => Promise<void>;
  mergeCards: (sourceCardId: string, targetCardId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  claimReward: (rewardId: string) => Promise<void>;
  closeLevelUpModal: () => void;
  openEnergyModal: () => void;
  closeEnergyModal: () => void;
  openXpModal: () => void;
  closeXpModal: () => void;
}

const initialEnergy: EnergyState = {
  current: 25,
  max: 25,
  createCost: CREATE_CARD_ENERGY_COST,
  regenIntervalMinutes: ENERGY_REGEN_INTERVAL_MINUTES,
  nextRegenAt: new Date(Date.now() + ENERGY_REGEN_INTERVAL_MINUTES * 60 * 1000).toISOString(),
};

const initialPlayer: PlayerProfile = {
  id: 'demo-player',
  telegramId: 'demo',
  username: 'Telegram Player',
  referralCode: 'ref_demo_player',
  level: 1,
  xp: 260,
  xpToNextLevel: xpToNextLevel(1),
  energy: initialEnergy.current,
  maxEnergy: initialEnergy.max,
  trophiesCount: 0,
  referralLevel: 2,
  invitedCount: 12,
  activeInvitedCount: 7,
  stats: { created: 3, merged: 0, deleted: 0, trophies: 0 },
};

const createCardFromRaceAndStars = (boardIndex: number, race: CardRace, stars: StarRank, source: GameCard['source']): GameCard => {
  const raceView = raceConfig[race];
  const rarity = rarityByStars[stars] as Rarity;

  return {
    id: crypto.randomUUID(),
    templateId: raceView.templateId,
    race,
    name: raceView.label,
    rarity,
    stars,
    state: 'on_board',
    imageUrl: raceView.imageUrl,
    boardIndex,
    createdAt: new Date().toISOString(),
    source,
  };
};

const createInitialBoard = () =>
  Array.from({ length: 16 }, (_, index) => {
    if (index < raceOrder.length) return createCardFromRaceAndStars(index, raceOrder[index], (index + 1) as StarRank, 'reward');
    if (index === 6 || index === 7) return createCardFromRaceAndStars(index, 'orcs', 1, 'reward');
    if (index === 8 || index === 9) return createCardFromRaceAndStars(index, 'demons', 6, 'reward');
    return null;
  });

const getLevelRewardTitle = (level: number) => rewardsTable.find((reward) => reward.level === level)?.title ?? '+5 energy';

const createActionId = (name: string) => `${name}_${crypto.randomUUID()}`;

export const useGameStore = create<GameStore>((set, get) => {
  const applyActionResponse = (response: ActionResponse) => {
    set({
      board: response.board,
      trophies: response.trophies,
      energy: response.energy,
      player: response.player,
      claimedRewardIds: response.claimedRewardIds,
      apiError: undefined,
      levelUpModal: response.levelUp
        ? {
            level: response.levelUp.newLevel,
            rewardTitle: response.levelUp.rewards[0]?.title ?? getLevelRewardTitle(response.levelUp.newLevel),
          }
        : get().levelUpModal,
    });
  };

  const runServerAction = async (action: (accessToken: string) => Promise<ActionResponse>) => {
    const { accessToken, isSyncing } = get();
    if (!accessToken || isSyncing) return;

    set({ isSyncing: true, apiError: undefined });
    try {
      applyActionResponse(await action(accessToken));
    } catch (error) {
      set({ apiError: error instanceof Error ? error.message : 'Server sync failed.' });
    } finally {
      set({ isSyncing: false });
    }
  };

  return {
    activeTab: 'game',
    accessToken: undefined,
    isBootstrapping: true,
    isSyncing: false,
    apiError: undefined,
    board: createInitialBoard(),
    trophies: [],
    claimedRewardIds: [],
    selectedAvatarRace: 'orcs',
    language: 'en',
    isEnergyModalOpen: false,
    isXpModalOpen: false,
    energy: initialEnergy,
    player: initialPlayer,
    bootstrapSession: async (initData, referralCode) => {
      set({ isBootstrapping: true, apiError: undefined });

      try {
        const login = await apiClient.loginViaTelegram({ initData: initData ?? '', referralCode });
        const gameState = await apiClient.getGameState(login.accessToken);

        set({
          accessToken: login.accessToken,
          board: gameState.board,
          trophies: gameState.trophies,
          energy: gameState.energy,
          player: gameState.player,
          claimedRewardIds: gameState.claimedRewardIds,
          isBootstrapping: false,
          apiError: undefined,
        });
      } catch (error) {
        set({
          isBootstrapping: false,
          apiError: error instanceof Error ? error.message : 'Could not connect to the game server.',
        });
      }
    },
    clearApiError: () => set({ apiError: undefined }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedAvatarRace: (race) => set({ selectedAvatarRace: race }),
    setLanguage: (language) => set({ language }),
    setLanguageFromSystem: (languageCode) => {
      const normalizedLanguage = languageCode?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
      set({ language: normalizedLanguage });
    },
    createCard: () => runServerAction((accessToken) => apiClient.createCard(accessToken, { clientActionId: createActionId('create') })),
    moveCard: (cardId, targetIndex) =>
      runServerAction((accessToken) => apiClient.moveCard(accessToken, { clientActionId: createActionId('move'), cardId, targetIndex })),
    mergeCards: (sourceCardId, targetCardId) =>
      runServerAction((accessToken) =>
        apiClient.mergeCards(accessToken, {
          clientActionId: createActionId('merge'),
          firstCardId: sourceCardId,
          secondCardId: targetCardId,
        }),
      ),
    deleteCard: (cardId) => runServerAction((accessToken) => apiClient.deleteCard(accessToken, { clientActionId: createActionId('delete'), cardId })),
    claimReward: async (rewardId) => {
      const { accessToken, isSyncing } = get();
      if (!accessToken || isSyncing) return;

      set({ isSyncing: true, apiError: undefined });
      try {
        const response = await apiClient.claimReward(accessToken, { rewardId });
        set({
          energy: response.energy,
          player: {
            ...get().player,
            energy: response.energy.current,
            maxEnergy: response.energy.max,
          },
          claimedRewardIds: response.claimedRewardIds,
          apiError: undefined,
        });
      } catch (error) {
        set({ apiError: error instanceof Error ? error.message : 'Reward claim failed.' });
      } finally {
        set({ isSyncing: false });
      }
    },
    closeLevelUpModal: () => set({ levelUpModal: undefined }),
    openEnergyModal: () => set({ isEnergyModalOpen: true }),
    closeEnergyModal: () => set({ isEnergyModalOpen: false }),
    openXpModal: () => set({ isXpModalOpen: true }),
    closeXpModal: () => set({ isXpModalOpen: false }),
  };
});

export const leaderboardRows: LeaderboardRow[] = [
  { rank: 1, name: 'Aegis Hunter', preferredRace: 'orcs', level: 88, xp: 92140, immortalTrophies: 11 },
  { rank: 2, name: 'Rune Breaker', preferredRace: 'dwarves', level: 82, xp: 87320, immortalTrophies: 9 },
  { rank: 3, name: 'Midnight Courier', preferredRace: 'assassins', level: 76, xp: 80100, immortalTrophies: 8 },
  { rank: 418, name: 'Telegram Player', preferredRace: 'orcs', level: 1, xp: 260, immortalTrophies: 0, isCurrentUser: true },
];
