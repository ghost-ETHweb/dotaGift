import type {
  ActionResponse,
  ClaimRewardRequest,
  ClaimRewardResponse,
  CreateCardRequest,
  DeleteCardRequest,
  GameStateResponse,
  LeaderboardResponse,
  LeaderboardPeriod,
  LeaderboardScope,
  MergeCardsRequest,
  MoveCardRequest,
  ReferralStatsResponse,
  TelegramLoginRequest,
  TelegramLoginResponse,
  TrophiesResponse,
  UpdateProfileRequest,
} from './contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8787' : '');

type RequestOptions = {
  accessToken?: string;
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.body ? 'POST' : 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.accessToken ? { authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeoutId));

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'API request failed');
  }

  return payload as T;
}

export const apiClient = {
  loginViaTelegram: (body: TelegramLoginRequest) => apiRequest<TelegramLoginResponse>('/api/auth/telegram', { body }),
  getProfile: (accessToken: string) => apiRequest<{ player: TelegramLoginResponse['player']; serverTime: string }>('/api/profile', { accessToken }),
  updateProfile: (accessToken: string, body: UpdateProfileRequest) => apiRequest<{ player: TelegramLoginResponse['player']; serverTime: string }>('/api/profile/update', { accessToken, body }),
  getGameState: (accessToken: string) => apiRequest<GameStateResponse>('/api/game-state', { accessToken }),
  createCard: (accessToken: string, body: CreateCardRequest) => apiRequest<ActionResponse>('/api/cards/create', { accessToken, body }),
  moveCard: (accessToken: string, body: MoveCardRequest) => apiRequest<ActionResponse>('/api/cards/move', { accessToken, body }),
  mergeCards: (accessToken: string, body: MergeCardsRequest) => apiRequest<ActionResponse>('/api/cards/merge', { accessToken, body }),
  deleteCard: (accessToken: string, body: DeleteCardRequest) => apiRequest<ActionResponse>('/api/cards/delete', { accessToken, body }),
  claimReward: (accessToken: string, body: ClaimRewardRequest) => apiRequest<ClaimRewardResponse>('/api/rewards/claim', { accessToken, body }),
  getLeaderboard: (accessToken: string, params: { period: LeaderboardPeriod; scope: LeaderboardScope }) =>
    apiRequest<LeaderboardResponse>(`/api/leaderboard?period=${params.period}&scope=${params.scope}`, { accessToken }),
  getTrophies: (accessToken: string) => apiRequest<TrophiesResponse>('/api/trophies', { accessToken }),
  getReferralStats: (accessToken: string) => apiRequest<ReferralStatsResponse>('/api/referrals/stats', { accessToken }),
};
