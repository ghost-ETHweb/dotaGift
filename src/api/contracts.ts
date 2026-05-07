import type { CardRace, EnergyState, GameCard, LeaderboardRow, PlayerProfile, Reward } from '../types';

export type LeaderboardPeriod = 'today' | 'week' | 'allTime';

export type LeaderboardScope = 'all' | 'friends' | 'race';

export interface TelegramLoginRequest {
  initData: string;
  referralCode?: string;
}

export interface TelegramLoginResponse {
  accessToken: string;
  player: PlayerProfile;
  serverTime: string;
}

export interface GameStateResponse {
  board: Array<GameCard | null>;
  trophies: GameCard[];
  pendingRewards: Reward[];
  energy: EnergyState;
  player: PlayerProfile;
  claimedRewardIds: string[];
  serverTime: string;
}

export interface CreateCardRequest {
  clientActionId: string;
}

export interface MergeCardsRequest {
  clientActionId: string;
  firstCardId: string;
  secondCardId: string;
}

export interface MoveCardRequest {
  clientActionId: string;
  cardId: string;
  targetIndex: number;
}

export interface DeleteCardRequest {
  clientActionId: string;
  cardId: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  displayNameCustom?: boolean;
  selectedAvatarRace?: string;
  avatarMode?: string;
}

export interface ActionResponse {
  board: Array<GameCard | null>;
  trophies: GameCard[];
  energy: EnergyState;
  player: PlayerProfile;
  claimedRewardIds: string[];
  xpDelta: number;
  levelUp?: {
    newLevel: number;
    rewards: Reward[];
  };
  serverTime: string;
}

export interface ClaimRewardRequest {
  rewardId: string;
}

export interface ClaimRewardResponse {
  reward: Reward;
  energy: EnergyState;
  claimedRewardIds: string[];
  serverTime: string;
}

export interface LeaderboardResponse {
  rows: LeaderboardRow[];
  currentUser: LeaderboardRow;
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  serverTime: string;
}

export interface RaceWarRow {
  race: CardRace;
  rank: number;
  trophyCount: number;
  hourlyXp: number;
  score: number;
}

export interface RaceWarResponse {
  rows: RaceWarRow[];
  playerRace: CardRace;
  playerContribution: {
    trophyCount: number;
    hourlyXp: number;
    score: number;
  };
  serverTime: string;
}

export interface TrophiesResponse {
  trophies: GameCard[];
  serverTime: string;
}

export interface ReferralStatsResponse {
  referralCode: string;
  referralLink: string;
  level1SharePercent: number;
  level2SharePercent: number;
  invitedCount: number;
  activeInvitedCount: number;
  xpToday: number;
  totalReferralXp: number;
  directReferrals: Array<{
    name: string;
    status: 'active' | 'pending';
    xpToday: number;
    totalXp: number;
  }>;
  serverTime: string;
}
