import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readEnv } from './lib/env.mjs';
import { HttpError, notFound, readJsonBody, sendJson } from './lib/http.mjs';
import { createAccessToken, verifyAccessToken } from './lib/token.mjs';
import { createDevTelegramUser, validateTelegramInitData } from './lib/telegram-auth.mjs';
import { JsonFileStorage } from './lib/storage.mjs';
import { PgStorage } from './lib/pg-storage.mjs';
import {
  applyEnergyRegen,
  claimRewardAction,
  createCardAction,
  createNewPlayer,
  deleteCardAction,
  grantBonusXp,
  getPendingRewards,
  isActiveReferral,
  mergeCardsAction,
  moveCardAction,
  totalXpForPlayer,
  toPlayerProfile,
} from './domain/game-service.mjs';

const env = readEnv();
const storage = env.databaseUrl ? new PgStorage(env.databaseUrl) : new JsonFileStorage(env.devDbPath);

const demoLeaderboardRows = [
  { id: 'seed_aegis_hunter', username: 'Aegis Hunter', selectedAvatarRace: 'orcs', level: 88, xp: 92140, trophies: Array.from({ length: 11 }, () => ({ rarity: 'immortal' })) },
  { id: 'seed_rune_breaker', username: 'Rune Breaker', selectedAvatarRace: 'dwarves', level: 82, xp: 87320, trophies: Array.from({ length: 9 }, () => ({ rarity: 'immortal' })) },
  { id: 'seed_midnight_courier', username: 'Midnight Courier', selectedAvatarRace: 'assassins', level: 76, xp: 80100, trophies: Array.from({ length: 8 }, () => ({ rarity: 'immortal' })) },
  { id: 'seed_ward_sentinel', username: 'Ward Sentinel', selectedAvatarRace: 'mages', level: 64, xp: 65220, trophies: Array.from({ length: 4 }, () => ({ rarity: 'immortal' })) },
];

function isLocalOrigin(origin) {
  return origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:');
}

function securityHeaders() {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    ...(env.isProduction ? { 'strict-transport-security': 'max-age=63072000; includeSubDomains; preload' } : {}),
  };
}

function corsHeaders(request) {
  const origin = request.headers.origin;
  const isAllowedOrigin = origin === env.clientOrigin || (!env.isProduction && isLocalOrigin(origin));

  return {
    ...securityHeaders(),
    ...(isAllowedOrigin ? { 'access-control-allow-origin': origin } : {}),
    'access-control-allow-headers': 'content-type, authorization, x-admin-token',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

function getPath(request) {
  return new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;
}

function getUrl(request) {
  return new URL(request.url ?? '/', `http://${request.headers.host}`);
}

async function trackEvent(eventType, player, payload = {}) {
  try {
    await storage.recordAnalyticsEvent({
      id: `evt_${crypto.randomUUID()}`,
      playerId: player?.id ?? null,
      eventType,
      payload,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Analytics event failed: ${eventType}`, error);
  }
}

function safeEqualSecret(incoming, expected) {
  if (!incoming || !expected) return false;

  const incomingBuffer = Buffer.from(incoming);
  const expectedBuffer = Buffer.from(expected);
  if (incomingBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(incomingBuffer, expectedBuffer);
}

async function trackLevelUp(player, result) {
  if (!result.levelUp) return;
  await trackEvent('level_up', player, {
    level: result.levelUp.newLevel,
    rewardIds: result.levelUp.rewards.map((reward) => reward.id),
  });
}

function cleanDisplayName(value) {
  if (typeof value !== 'string') return null;
  const name = value.replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 32) throw new HttpError(400, 'INVALID_DISPLAY_NAME', 'Display name must be 2-32 characters.');
  return name;
}

function cleanAvatarRace(value) {
  if (typeof value !== 'string') return null;
  return ['orcs', 'dwarves', 'assassins', 'demons', 'mages'].includes(value) ? value : null;
}

function cleanAvatarMode(value) {
  if (typeof value !== 'string') return null;
  return ['telegram', 'caste'].includes(value) ? value : null;
}

function leaderboardSince(period) {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
  if (period === 'week') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

function telegramDisplayName(telegramUser, fallback = 'Telegram Player') {
  return [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || fallback;
}

function assertAdminAccess(request) {
  if (!env.adminToken) throw new HttpError(503, 'ADMIN_NOT_CONFIGURED', 'Admin access is not configured.');

  const authHeader = request.headers.authorization ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  const headerValue = request.headers['x-admin-token'];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const token = bearerToken || headerToken;

  if (!safeEqualSecret(token, env.adminToken)) throw new HttpError(401, 'ADMIN_UNAUTHORIZED', 'Valid admin token is required.');
}

function normalizeReferralCode(referralCode) {
  if (typeof referralCode !== 'string') return null;
  const normalized = referralCode.trim();
  return /^ref_[A-Za-z0-9_-]{3,64}$/.test(normalized) ? normalized : null;
}

async function resolveReferralCode(rawReferralCode, telegramUser) {
  const referralCode = normalizeReferralCode(rawReferralCode);
  if (!referralCode) return null;
  if (referralCode === `ref_${telegramUser.id}`) return null;

  const inviter = await storage.getPlayerByReferralCode(referralCode);
  if (!inviter) return null;
  if (inviter.telegramId === String(telegramUser.id)) return null;

  return { referralCode, inviter };
}

async function syncReferralCounters(player) {
  const directReferrals = await storage.listDirectReferrals(player.referralCode);
  player.invitedCount = directReferrals.length;
  player.activeInvitedCount = directReferrals.filter(isActiveReferral).length;
  return directReferrals;
}

async function grantReferralBonuses(player, xpDelta) {
  if (!player.referredBy || !Number.isFinite(xpDelta) || xpDelta <= 0) return;

  try {
    const inviter = await storage.getPlayerByReferralCode(player.referredBy);
    if (!inviter || inviter.id === player.id) return;

    const level1Amount = Math.max(1, Math.floor(xpDelta * 0.05));
    grantBonusXp(inviter, level1Amount);
    await storage.savePlayer(inviter);
    await trackEvent('referral_xp', inviter, {
      amount: level1Amount,
      depth: 1,
      sourcePlayerId: player.id,
    });

    if (!inviter.referredBy) return;
    const parent = await storage.getPlayerByReferralCode(inviter.referredBy);
    if (!parent || parent.id === inviter.id || parent.id === player.id) return;

    const level2Amount = Math.max(1, Math.floor(xpDelta * 0.02));
    grantBonusXp(parent, level2Amount);
    await storage.savePlayer(parent);
    await trackEvent('referral_xp', parent, {
      amount: level2Amount,
      depth: 2,
      sourcePlayerId: player.id,
    });
  } catch (error) {
    console.error('Referral bonus failed', error);
  }
}

async function getAuthedPlayer(request) {
  const header = request.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const payload = token ? verifyAccessToken(token, env.jwtSecret) : null;
  if (!payload?.sub) throw new HttpError(401, 'UNAUTHORIZED', 'Valid Bearer token is required.');

  const player = await storage.getPlayer(payload.sub);
  if (!player) throw new HttpError(401, 'PLAYER_NOT_FOUND', 'Player session is no longer valid.');

  applyEnergyRegen(player);
  return player;
}

async function saveAndSendPlayer(response, request, player, payload) {
  await storage.savePlayer(player);
  sendJson(response, 200, payload, corsHeaders(request));
}

async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  let telegramUser;
  let referralCode = body.referralCode;

  if (body.initData) {
    const validation = validateTelegramInitData(body.initData, env.telegramBotToken);
    if (!validation.ok) {
      if (!env.allowDevAuth) throw new HttpError(401, 'INVALID_TELEGRAM_AUTH', validation.reason);
      telegramUser = createDevTelegramUser();
    } else {
      telegramUser = validation.user;
      referralCode = validation.startParam || referralCode;
    }
  } else if (env.allowDevAuth) {
    telegramUser = createDevTelegramUser();
  } else {
    throw new HttpError(401, 'INIT_DATA_REQUIRED', 'Telegram initData is required.');
  }

  let player = await storage.getPlayerByTelegramId(telegramUser.id);
  const isNewPlayer = !player;
  const canAttachReferral = !player || !player.referredBy;
  const referral = canAttachReferral ? await resolveReferralCode(referralCode, telegramUser) : null;
  let didAttachReferral = false;

  if (!player) {
    player = createNewPlayer(telegramUser, referral?.referralCode);
    didAttachReferral = Boolean(referral?.referralCode);
  } else {
    if (referral?.referralCode && !player.referredBy) {
      player.referredBy = referral.referralCode;
      didAttachReferral = true;
    }
    if (!player.displayNameCustom) player.username = telegramDisplayName(telegramUser, player.username);
    player.avatarUrl = telegramUser.photo_url ?? player.avatarUrl;
    player.languageCode = telegramUser.language_code ?? player.languageCode;
  }

  applyEnergyRegen(player);
  await storage.savePlayer(player);
  if (referral?.inviter && didAttachReferral) {
    referral.inviter.invitedCount += 1;
    await storage.savePlayer(referral.inviter);
    await trackEvent('referral_signup', referral.inviter, {
      invitedPlayerId: player.id,
    });
  }
  await trackEvent(isNewPlayer ? 'signup' : 'login', player, {
    hasReferral: Boolean(referral?.referralCode),
    languageCode: player.languageCode,
  });

  sendJson(
    response,
    200,
    {
      accessToken: createAccessToken({ sub: player.id, telegramId: player.telegramId }, env.jwtSecret),
      player: toPlayerProfile(player),
      serverTime: new Date().toISOString(),
    },
    corsHeaders(request),
  );
}

async function handleProfile(request, response) {
  const player = await getAuthedPlayer(request);
  await syncReferralCounters(player);
  await saveAndSendPlayer(response, request, player, {
    player: toPlayerProfile(player),
    serverTime: new Date().toISOString(),
  });
}

async function handleGameState(request, response) {
  const player = await getAuthedPlayer(request);
  await syncReferralCounters(player);
  await saveAndSendPlayer(response, request, player, {
    board: player.board,
    trophies: player.trophies,
    pendingRewards: getPendingRewards(player),
    energy: player.energy,
    player: toPlayerProfile(player),
    claimedRewardIds: player.claimedRewardIds,
    serverTime: new Date().toISOString(),
  });
}

async function handleCreateCard(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const previousCardIds = new Set(player.board.filter(Boolean).map((card) => card.id));
  const result = createCardAction(player, body.clientActionId);
  const createdCard = player.board.filter(Boolean).find((card) => !previousCardIds.has(card.id));
  await grantReferralBonuses(player, result.xpDelta);
  await saveAndSendPlayer(response, request, player, result);
  await trackEvent('create_card', player, {
    xpDelta: result.xpDelta,
    energyCurrent: result.energy.current,
    card: createdCard
      ? {
          race: createdCard.race,
          rarity: createdCard.rarity,
          stars: createdCard.stars,
          boardIndex: createdCard.boardIndex,
        }
      : null,
  });
  await trackLevelUp(player, result);
}

async function handleMergeCards(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const previousTrophyCount = player.trophies.length;
  const result = mergeCardsAction(player, body.clientActionId, body.firstCardId, body.secondCardId);
  const createdTrophy = player.trophies.length > previousTrophyCount ? player.trophies[0] : null;
  await grantReferralBonuses(player, result.xpDelta);
  await saveAndSendPlayer(response, request, player, result);
  await trackEvent('merge_cards', player, {
    xpDelta: result.xpDelta,
    trophies: player.trophies.length,
    energyCurrent: result.energy.current,
  });
  if (createdTrophy) {
    await trackEvent('trophy_created', player, {
      trophies: player.trophies.length,
      xpDelta: result.xpDelta,
      race: createdTrophy.race,
      rarity: createdTrophy.rarity,
      stars: createdTrophy.stars,
    });
  }
  await trackLevelUp(player, result);
}

async function handleMoveCard(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const result = moveCardAction(player, body.clientActionId, body.cardId, body.targetIndex);
  await saveAndSendPlayer(response, request, player, result);
}

async function handleDeleteCard(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const result = deleteCardAction(player, body.clientActionId, body.cardId);
  await grantReferralBonuses(player, result.xpDelta);
  await saveAndSendPlayer(response, request, player, result);
  await trackEvent('delete_card', player, {
    xpDelta: result.xpDelta,
    energyCurrent: result.energy.current,
  });
  await trackLevelUp(player, result);
}

async function handleClaimReward(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const result = claimRewardAction(player, body.rewardId);
  await saveAndSendPlayer(response, request, player, result);
  await trackEvent('claim_reward', player, {
    rewardId: result.reward.id,
    rewardType: result.reward.type,
    amount: result.reward.amount ?? null,
  });
}

async function handleAdminStats(request, response) {
  assertAdminAccess(request);
  const stats = await storage.getAdminStats();
  sendJson(response, 200, stats, corsHeaders(request));
}

async function handleUpdateProfile(request, response) {
  const body = await readJsonBody(request);
  const player = await getAuthedPlayer(request);
  const displayName = cleanDisplayName(body.displayName);
  const selectedAvatarRace = cleanAvatarRace(body.selectedAvatarRace);
  const avatarMode = cleanAvatarMode(body.avatarMode);

  if (displayName) {
    player.username = displayName;
    player.displayNameCustom = body.displayNameCustom === false ? false : true;
  }
  if (selectedAvatarRace) player.selectedAvatarRace = selectedAvatarRace;
  if (avatarMode) player.avatarMode = avatarMode;

  await saveAndSendPlayer(response, request, player, {
    player: toPlayerProfile(player),
    serverTime: new Date().toISOString(),
  });
  await trackEvent('profile_update', player, {
    displayNameChanged: Boolean(displayName),
    avatarRaceChanged: Boolean(selectedAvatarRace),
    avatarModeChanged: Boolean(avatarMode),
  });
}

async function handleLeaderboard(request, response) {
  const player = await getAuthedPlayer(request);
  const url = getUrl(request);
  const period = ['today', 'week', 'allTime'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : 'today';
  const requestedScope = url.searchParams.get('scope');
  const scope = ['friends', 'race'].includes(requestedScope) ? requestedScope : 'all';
  const players =
    scope === 'friends'
      ? [player, ...(await storage.listDirectReferrals(player.referralCode))]
      : (await storage.listPlayers()).filter((item) => scope !== 'race' || (item.selectedAvatarRace ?? 'orcs') === (player.selectedAvatarRace ?? 'orcs'));
  const since = leaderboardSince(period);
  const xpByPlayer = since ? await storage.getXpByPlayerSince(players.map((item) => item.id), since) : new Map();
  const demoRows =
    env.allowDevAuth && scope !== 'friends'
      ? demoLeaderboardRows.filter((item) => scope !== 'race' || (item.selectedAvatarRace ?? 'orcs') === (player.selectedAvatarRace ?? 'orcs'))
      : [];
  const fullRows = [...players, ...demoRows]
    .map((item) => ({
      id: item.id,
      rank: 0,
      name: item.username,
      avatarUrl: item.avatarUrl,
      preferredRace: item.selectedAvatarRace ?? 'orcs',
      level: item.level,
      xp: period === 'allTime' ? totalXpForPlayer(item) : xpByPlayer.get(item.id) ?? 0,
      immortalTrophies: item.trophies.filter((card) => card.rarity === 'immortal').length,
      isCurrentUser: item.id === player.id,
      referredBy: item.referredBy,
    }))
    .sort((a, b) => b.xp - a.xp || b.level - a.level || b.immortalTrophies - a.immortalTrophies)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const currentUser = fullRows.find((row) => row.isCurrentUser);
  const rows = scope === 'friends' ? fullRows.filter((row) => !row.isCurrentUser) : fullRows;

  sendJson(
    response,
    200,
    {
      rows: rows.map(({ id, referredBy, ...row }) => row),
      currentUser: currentUser ? (({ id, referredBy, ...row }) => row)(currentUser) : undefined,
      period,
      scope,
      serverTime: new Date().toISOString(),
    },
    corsHeaders(request),
  );
}

async function handleTrophies(request, response) {
  const player = await getAuthedPlayer(request);
  sendJson(response, 200, { trophies: player.trophies, serverTime: new Date().toISOString() }, corsHeaders(request));
}

async function handleReferralStats(request, response) {
  const player = await getAuthedPlayer(request);
  const directReferrals = await syncReferralCounters(player);
  await storage.savePlayer(player);
  const referralXp = await storage.getReferralXpSummary(player.id);
  const directRows = directReferrals.map((referral) => ({
    name: referral.username,
    status: isActiveReferral(referral) ? 'active' : 'pending',
    xpToday: 0,
    totalXp: totalXpForPlayer(referral),
  }));

  sendJson(
    response,
    200,
    {
      referralCode: player.referralCode,
      referralLink: `https://t.me/DotaGiftBot?startapp=${encodeURIComponent(player.referralCode)}`,
      level1SharePercent: 5,
      level2SharePercent: 2,
      invitedCount: directReferrals.length,
      activeInvitedCount: directRows.filter((referral) => referral.status === 'active').length,
      xpToday: referralXp.xpToday,
      totalReferralXp: referralXp.totalReferralXp,
      directReferrals: directRows,
      serverTime: new Date().toISOString(),
    },
    corsHeaders(request),
  );
}

export async function route(request, response) {
  const path = getPath(request);
  const method = request.method ?? 'GET';

  if (method === 'OPTIONS') {
    response.writeHead(204, corsHeaders(request));
    response.end();
    return;
  }

  if (method === 'GET' && path === '/') {
    return sendJson(
      response,
      200,
      {
        ok: true,
        service: 'Dota Gift API',
        frontendUrl: 'http://localhost:5173',
        healthUrl: '/api/health',
        serverTime: new Date().toISOString(),
      },
      corsHeaders(request),
    );
  }
  if (method === 'GET' && path === '/api/health') return sendJson(response, 200, { ok: true, serverTime: new Date().toISOString() }, corsHeaders(request));
  if (method === 'POST' && path === '/api/auth/telegram') return handleLogin(request, response);
  if (method === 'GET' && path === '/api/profile') return handleProfile(request, response);
  if (method === 'POST' && path === '/api/profile/update') return handleUpdateProfile(request, response);
  if (method === 'GET' && path === '/api/game-state') return handleGameState(request, response);
  if (method === 'POST' && path === '/api/cards/create') return handleCreateCard(request, response);
  if (method === 'POST' && path === '/api/cards/move') return handleMoveCard(request, response);
  if (method === 'POST' && path === '/api/cards/merge') return handleMergeCards(request, response);
  if (method === 'POST' && path === '/api/cards/delete') return handleDeleteCard(request, response);
  if (method === 'POST' && path === '/api/rewards/claim') return handleClaimReward(request, response);
  if (method === 'GET' && path === '/api/leaderboard') return handleLeaderboard(request, response);
  if (method === 'GET' && path === '/api/trophies') return handleTrophies(request, response);
  if (method === 'GET' && path === '/api/referrals/stats') return handleReferralStats(request, response);
  if (method === 'GET' && path === '/api/admin/stats') return handleAdminStats(request, response);

  return notFound();
}

export async function handleRequest(request, response) {
  try {
    await route(request, response);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'INTERNAL_ERROR';
    const message = error instanceof HttpError ? error.message : 'Unexpected server error.';

    if (!(error instanceof HttpError)) console.error(error);
    sendJson(response, status, { error: { code, message }, serverTime: new Date().toISOString() }, corsHeaders(request));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = http.createServer(handleRequest);

  server.listen(env.port, () => {
    console.log(`Dota Gift API listening on http://localhost:${env.port}`);
  });
}
