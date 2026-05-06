export const CARD_RACES = {
  orcs: { label: 'Orcs', templateId: 'orcs', imageUrl: 'OR' },
  dwarves: { label: 'Dwarves', templateId: 'dwarves', imageUrl: 'DW' },
  assassins: { label: 'Assassins', templateId: 'assassins', imageUrl: 'AS' },
  demons: { label: 'Demons', templateId: 'demons', imageUrl: 'DE' },
  mages: { label: 'Mages', templateId: 'mages', imageUrl: 'MA' },
};

export const RARITIES = {
  common: { chance: 61.4, xpMultiplier: 1, stars: 1 },
  uncommon: { chance: 22.2, xpMultiplier: 1.4, stars: 2 },
  rare: { chance: 10.05, xpMultiplier: 2.1, stars: 3 },
  mythic: { chance: 4.2, xpMultiplier: 3.2, stars: 4 },
  legendary: { chance: 2, xpMultiplier: 5, stars: 5 },
  immortal: { chance: 0.15, xpMultiplier: 10, stars: 6 },
};

export const RARITY_BY_STARS = {
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'mythic',
  5: 'legendary',
  6: 'immortal',
};

export const GAME_BALANCE = {
  boardSize: 16,
  createCardEnergyCost: 5,
  energyRegenIntervalMinutes: 20,
  trophyEnergyReward: 25,
  deleteEnergyByStars: {
    1: 1,
    2: 2,
    3: 3,
    4: 5,
    5: 8,
    6: 12,
  },
  mergeEnergyByResultStars: {
    1: 0,
    2: 1,
    3: 2,
    4: 4,
    5: 7,
    6: 12,
  },
  antiFraud: {
    actionMinIntervalMs: 350,
    maxActionsPerMinute: 90,
    actionIdRetention: 200,
  },
};

export const raceOrder = Object.keys(CARD_RACES);
export const rarityOrder = Object.keys(RARITIES);

export function xpToNextLevel(level) {
  return Math.round(1000 * Math.pow(1.2, level - 1));
}

export function energyCapForLevel(level) {
  return 25 + Math.floor(level / 5) * 5 + Math.floor(level / 10) * 5;
}

export function getLevelEnergyReward(level) {
  if (level === 100) return 100;
  if (level === 50) return 50;
  if (level % 10 === 0) return 20;
  if (level % 5 === 0) return 10;
  return 5;
}

export function getRewardsTable() {
  return Array.from({ length: 100 }, (_, index) => {
    const level = index + 1;
    const amount = getLevelEnergyReward(level);
    const milestoneLabel =
      level === 100 ? 'grand milestone' : level === 50 ? 'major milestone' : level % 10 === 0 ? 'milestone' : level % 5 === 0 ? 'cap step' : '';

    return {
      id: `reward-${level}`,
      level,
      type: 'energy',
      amount,
      title: milestoneLabel ? `+${amount} energy ${milestoneLabel}` : `+${amount} energy`,
      claimed: false,
    };
  });
}
