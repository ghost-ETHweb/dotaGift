export type TabId = 'game' | 'progress' | 'arena' | 'collection' | 'profile';

export type AppLanguage = 'en' | 'ru';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'legendary' | 'immortal';

export type CardRace = 'orcs' | 'dwarves' | 'assassins' | 'demons' | 'mages';

export type StarRank = 1 | 2 | 3 | 4 | 5 | 6;

export type CardState = 'on_board' | 'pending_merge' | 'trophy' | 'deleted';

export interface GameCard {
  id: string;
  templateId: string;
  race: CardRace;
  name: string;
  rarity: Rarity;
  stars: StarRank;
  state: CardState;
  imageUrl: string;
  boardIndex?: number;
  createdAt: string;
  mergedFrom?: string[];
  source: 'create' | 'merge' | 'reward' | 'event' | 'chest';
}

export interface EnergyState {
  current: number;
  max: number;
  createCost: number;
  regenIntervalMinutes: number;
  nextRegenAt?: string;
}

export interface Reward {
  id: string;
  level: number;
  type: 'energy' | 'chest' | 'contest_ticket' | 'xp_boost' | 'skin' | 'event_access';
  amount?: number;
  title: string;
  claimed: boolean;
}

export interface PlayerProfile {
  id: string;
  telegramId: string;
  username: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  energy: number;
  maxEnergy: number;
  trophiesCount: number;
  referralLevel: number;
  invitedCount: number;
  activeInvitedCount: number;
  stats: {
    created: number;
    merged: number;
    deleted: number;
    trophies: number;
  };
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  avatarUrl?: string;
  preferredRace: CardRace;
  level: number;
  xp: number;
  immortalTrophies: number;
  isCurrentUser?: boolean;
}
