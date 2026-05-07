import crypto from 'node:crypto';
import {
  CARD_RACES,
  GAME_BALANCE,
  RARITIES,
  RARITY_BY_STARS,
  energyCapForLevel,
  getRewardsTable,
  raceOrder,
  rarityOrder,
  xpToNextLevel,
} from '../config/game-config.mjs';
import { HttpError } from '../lib/http.mjs';

const rewardsTable = getRewardsTable();

function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function pickRarity() {
  const roll = crypto.randomInt(0, 10000) / 100;
  let cursor = 0;

  for (const rarity of rarityOrder) {
    cursor += RARITIES[rarity].chance;
    if (roll <= cursor) return rarity;
  }

  return 'common';
}

function pickRace() {
  return raceOrder[crypto.randomInt(0, raceOrder.length)];
}

function createCard(boardIndex, race = pickRace(), stars = RARITIES[pickRarity()].stars, source = 'create') {
  const raceView = CARD_RACES[race];
  const rarity = RARITY_BY_STARS[stars];

  return {
    id: randomId('card'),
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
}

function createInitialBoard() {
  return Array.from({ length: GAME_BALANCE.boardSize }, (_, index) => {
    if (index < raceOrder.length) return createCard(index, raceOrder[index], index + 1, 'reward');
    if (index === 6 || index === 7) return createCard(index, 'orcs', 1, 'reward');
    if (index === 8 || index === 9) return createCard(index, 'demons', 6, 'reward');
    return null;
  });
}

function normalizeUsername(telegramUser) {
  return [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || 'Telegram Player';
}

export function createNewPlayer(telegramUser, referralCode) {
  const level = 1;
  const energyMax = energyCapForLevel(level);

  return {
    id: `tg_${telegramUser.id}`,
    telegramId: String(telegramUser.id),
    username: normalizeUsername(telegramUser),
    displayNameCustom: false,
    avatarUrl: telegramUser.photo_url,
    avatarMode: 'caste',
    languageCode: telegramUser.language_code,
    referralCode: `ref_${telegramUser.id}`,
    referredBy: referralCode || null,
    selectedAvatarRace: 'orcs',
    level,
    xp: 260,
    invitedCount: 0,
    activeInvitedCount: 0,
    referralLevel: 1,
    stats: { created: 3, merged: 0, deleted: 0, trophies: 0 },
    energy: {
      current: energyMax,
      max: energyMax,
      createCost: GAME_BALANCE.createCardEnergyCost,
      regenIntervalMinutes: GAME_BALANCE.energyRegenIntervalMinutes,
      nextRegenAt: new Date(Date.now() + GAME_BALANCE.energyRegenIntervalMinutes * 60 * 1000).toISOString(),
    },
    board: createInitialBoard(),
    trophies: [],
    claimedRewardIds: [],
    processedActionIds: [],
    actionLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function toPlayerProfile(player) {
  return {
    id: player.id,
    telegramId: player.telegramId,
    username: player.username,
    avatarUrl: player.avatarUrl,
    avatarMode: player.avatarMode ?? 'caste',
    referralCode: player.referralCode,
    selectedAvatarRace: player.selectedAvatarRace ?? 'orcs',
    level: player.level,
    xp: player.xp,
    xpToNextLevel: xpToNextLevel(player.level),
    energy: player.energy.current,
    maxEnergy: player.energy.max,
    trophiesCount: player.trophies.length,
    referralLevel: player.referralLevel,
    invitedCount: player.invitedCount,
    activeInvitedCount: player.activeInvitedCount,
    stats: player.stats,
  };
}

export function totalXpForPlayer(player) {
  let total = player.xp;
  for (let level = 1; level < player.level; level += 1) {
    total += xpToNextLevel(level);
  }
  return total;
}

export function isActiveReferral(player) {
  return player.level >= 2 || player.stats.created >= 3 || player.stats.merged >= 1;
}

export function applyEnergyRegen(player, now = Date.now()) {
  const current = player.energy.current;
  const max = player.energy.max;

  if (current >= max) {
    player.energy.nextRegenAt = new Date(now + player.energy.regenIntervalMinutes * 60 * 1000).toISOString();
    return player;
  }

  const nextRegenAt = Date.parse(player.energy.nextRegenAt ?? new Date(now).toISOString());
  if (nextRegenAt > now) return player;

  const intervalMs = player.energy.regenIntervalMinutes * 60 * 1000;
  const ticks = Math.floor((now - nextRegenAt) / intervalMs) + 1;
  const nextCurrent = Math.min(max, current + ticks);
  const nextAt = nextCurrent >= max ? now + intervalMs : nextRegenAt + ticks * intervalMs;

  player.energy.current = nextCurrent;
  player.energy.nextRegenAt = new Date(nextAt).toISOString();
  return player;
}

function addBonusEnergy(player, amount) {
  player.energy.current += amount;
}

function addXp(player, xpDelta) {
  let xp = player.xp + xpDelta;
  let level = player.level;
  const levelUps = [];

  while (level < 100 && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    const previousMax = player.energy.max;
    player.energy.max = Math.max(player.energy.max, energyCapForLevel(level));
    levelUps.push({
      newLevel: level,
      rewards: rewardsTable.filter((reward) => reward.level === level),
      energyCapDelta: player.energy.max - previousMax,
    });
  }

  player.xp = xp;
  player.level = level;

  return levelUps;
}

export function grantBonusXp(player, xpDelta) {
  if (!Number.isFinite(xpDelta) || xpDelta <= 0) return [];
  return addXp(player, Math.floor(xpDelta));
}

function assertActionAllowed(player, clientActionId) {
  if (!clientActionId || typeof clientActionId !== 'string') {
    throw new HttpError(400, 'CLIENT_ACTION_ID_REQUIRED', 'clientActionId is required.');
  }

  if (player.processedActionIds.includes(clientActionId)) {
    throw new HttpError(409, 'DUPLICATE_ACTION', 'This action has already been processed.');
  }

  const now = Date.now();
  const minuteAgo = now - 60_000;
  player.actionLog = player.actionLog.filter((timestamp) => timestamp > minuteAgo);

  const lastActionAt = player.actionLog.at(-1) ?? 0;
  if (now - lastActionAt < GAME_BALANCE.antiFraud.actionMinIntervalMs) {
    throw new HttpError(429, 'ACTION_TOO_FAST', 'Action rate limit reached.');
  }

  if (player.actionLog.length >= GAME_BALANCE.antiFraud.maxActionsPerMinute) {
    throw new HttpError(429, 'TOO_MANY_ACTIONS', 'Too many actions per minute.');
  }

  player.actionLog.push(now);
  player.processedActionIds.push(clientActionId);
  player.processedActionIds = player.processedActionIds.slice(-GAME_BALANCE.antiFraud.actionIdRetention);
}

function getBoardCard(player, cardId) {
  const index = player.board.findIndex((card) => card?.id === cardId);
  return { index, card: index >= 0 ? player.board[index] : null };
}

function buildActionResponse(player, xpDelta, levelUps = []) {
  const latestLevelUp = levelUps.at(-1);

  return {
    board: player.board,
    trophies: player.trophies,
    energy: player.energy,
    player: toPlayerProfile(player),
    claimedRewardIds: player.claimedRewardIds,
    xpDelta,
    levelUp: latestLevelUp
      ? {
          newLevel: latestLevelUp.newLevel,
          rewards: latestLevelUp.rewards,
        }
      : undefined,
    serverTime: new Date().toISOString(),
  };
}

export function getPendingRewards(player) {
  return rewardsTable
    .filter((reward) => reward.level <= player.level && !player.claimedRewardIds.includes(reward.id))
    .map((reward) => ({ ...reward, claimed: false }));
}

export function createCardAction(player, clientActionId) {
  applyEnergyRegen(player);
  assertActionAllowed(player, clientActionId);

  const freeIndex = player.board.findIndex((slot) => !slot);
  if (freeIndex === -1) throw new HttpError(409, 'BOARD_FULL', 'Board is full.');
  if (player.energy.current < player.energy.createCost) throw new HttpError(409, 'NOT_ENOUGH_ENERGY', 'Not enough energy.');

  const card = createCard(freeIndex);
  player.board[freeIndex] = card;
  player.energy.current -= player.energy.createCost;
  player.stats.created += 1;

  const xpDelta = Math.round(20 * RARITIES[card.rarity].xpMultiplier);
  const levelUps = addXp(player, xpDelta);

  return buildActionResponse(player, xpDelta, levelUps);
}

export function moveCardAction(player, clientActionId, cardId, targetIndex) {
  applyEnergyRegen(player);
  assertActionAllowed(player, clientActionId);

  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= GAME_BALANCE.boardSize) {
    throw new HttpError(400, 'INVALID_TARGET_INDEX', 'Target board index is invalid.');
  }

  const { index, card } = getBoardCard(player, cardId);
  if (!card) throw new HttpError(404, 'CARD_NOT_FOUND', 'Card not found on board.');
  if (index === targetIndex) return buildActionResponse(player, 0, []);
  if (player.board[targetIndex]) throw new HttpError(409, 'TARGET_SLOT_OCCUPIED', 'Target slot is occupied.');

  player.board[index] = null;
  player.board[targetIndex] = { ...card, boardIndex: targetIndex };

  return buildActionResponse(player, 0, []);
}

export function mergeCardsAction(player, clientActionId, firstCardId, secondCardId) {
  applyEnergyRegen(player);
  assertActionAllowed(player, clientActionId);

  if (!firstCardId || !secondCardId || firstCardId === secondCardId) throw new HttpError(400, 'INVALID_CARDS', 'Two different card ids are required.');

  const first = getBoardCard(player, firstCardId);
  const second = getBoardCard(player, secondCardId);
  if (!first.card || !second.card) throw new HttpError(404, 'CARD_NOT_FOUND', 'Card not found on board.');
  if (first.card.race !== second.card.race || first.card.stars !== second.card.stars) {
    throw new HttpError(409, 'CARDS_NOT_COMPATIBLE', 'Cards must have the same caste and stars.');
  }

  player.stats.merged += 1;

  if (first.card.stars === 6) {
    const trophy = {
      ...second.card,
      id: randomId('trophy'),
      state: 'trophy',
      source: 'merge',
      boardIndex: undefined,
      mergedFrom: [first.card.id, second.card.id],
      createdAt: new Date().toISOString(),
    };

    player.board[first.index] = null;
    player.board[second.index] = null;
    player.trophies.unshift(trophy);
    player.stats.trophies += 1;
    addBonusEnergy(player, GAME_BALANCE.trophyEnergyReward);

    const xpDelta = Math.round(300 * RARITIES.immortal.xpMultiplier);
    const levelUps = addXp(player, xpDelta);

    return buildActionResponse(player, xpDelta, levelUps);
  }

  const nextStars = first.card.stars + 1;
  const rarity = RARITY_BY_STARS[nextStars];
  const mergedCard = {
    ...second.card,
    id: randomId('card'),
    rarity,
    stars: nextStars,
    boardIndex: second.index,
    source: 'merge',
    mergedFrom: [first.card.id, second.card.id],
    createdAt: new Date().toISOString(),
  };

  player.board[first.index] = null;
  player.board[second.index] = mergedCard;
  addBonusEnergy(player, GAME_BALANCE.mergeEnergyByResultStars[nextStars]);

  const xpDelta = Math.round(120 * RARITIES[rarity].xpMultiplier);
  const levelUps = addXp(player, xpDelta);

  return buildActionResponse(player, xpDelta, levelUps);
}

export function deleteCardAction(player, clientActionId, cardId) {
  applyEnergyRegen(player);
  assertActionAllowed(player, clientActionId);

  const { index, card } = getBoardCard(player, cardId);
  if (!card) throw new HttpError(404, 'CARD_NOT_FOUND', 'Card not found on board.');

  player.board[index] = null;
  player.stats.deleted += 1;
  addBonusEnergy(player, GAME_BALANCE.deleteEnergyByStars[card.stars]);

  const xpDelta = Math.round(8 * RARITIES[card.rarity].xpMultiplier);
  const levelUps = addXp(player, xpDelta);

  return buildActionResponse(player, xpDelta, levelUps);
}

export function claimRewardAction(player, rewardId) {
  applyEnergyRegen(player);

  const reward = rewardsTable.find((item) => item.id === rewardId);
  if (!reward) throw new HttpError(404, 'REWARD_NOT_FOUND', 'Reward not found.');
  if (reward.level > player.level) throw new HttpError(409, 'REWARD_LOCKED', 'Reward is locked.');
  if (player.claimedRewardIds.includes(rewardId)) throw new HttpError(409, 'REWARD_ALREADY_CLAIMED', 'Reward is already claimed.');

  if (reward.type === 'energy') addBonusEnergy(player, reward.amount ?? 0);
  player.claimedRewardIds.push(rewardId);

  return {
    reward: { ...reward, claimed: true },
    energy: player.energy,
    claimedRewardIds: player.claimedRewardIds,
    serverTime: new Date().toISOString(),
  };
}
