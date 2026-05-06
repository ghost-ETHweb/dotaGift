import type { CardRace, Rarity, Reward, StarRank } from '../types';

export const rarityConfig: Record<
  Rarity,
  { label: string; chance: number; xpMultiplier: number; color: string; ring: string; glow: string; gradient: string }
> = {
  common: {
    label: 'Common',
    chance: 61.4,
    xpMultiplier: 1,
    color: '#b0c3d9',
    ring: 'border-[#b0c3d9]',
    glow: 'shadow-[#b0c3d9]/25',
    gradient: 'from-[#b0c3d9] to-[#26303a]',
  },
  uncommon: {
    label: 'Uncommon',
    chance: 22.2,
    xpMultiplier: 1.4,
    color: '#5e98d9',
    ring: 'border-[#5e98d9]',
    glow: 'shadow-[#5e98d9]/35',
    gradient: 'from-[#5e98d9] to-[#102036]',
  },
  rare: {
    label: 'Rare',
    chance: 10.05,
    xpMultiplier: 2.1,
    color: '#4b69ff',
    ring: 'border-[#4b69ff]',
    glow: 'shadow-[#4b69ff]/40',
    gradient: 'from-[#4b69ff] to-[#101638]',
  },
  mythic: {
    label: 'Mythic',
    chance: 4.2,
    xpMultiplier: 3.2,
    color: '#8847ff',
    ring: 'border-[#8847ff]',
    glow: 'shadow-[#8847ff]/45',
    gradient: 'from-[#8847ff] to-[#211044]',
  },
  legendary: {
    label: 'Legendary',
    chance: 2,
    xpMultiplier: 5,
    color: '#d32ce6',
    ring: 'border-[#d32ce6]',
    glow: 'shadow-[#d32ce6]/50',
    gradient: 'from-[#d32ce6] to-[#3a0d42]',
  },
  immortal: {
    label: 'Immortal',
    chance: 0.15,
    xpMultiplier: 10,
    color: '#ff243d',
    ring: 'border-[#ff243d]',
    glow: 'shadow-[#ff243d]/70',
    gradient: 'from-[#050505] via-[#7a0714] to-[#ff243d]',
  },
};

export const raceConfig: Record<
  CardRace,
  { label: string; templateId: string; imageUrl: string; accent: string; ring: string; glow: string; gradient: string }
> = {
  orcs: {
    label: 'Orcs',
    templateId: 'orcs',
    imageUrl: 'OR',
    accent: '#2f7d46',
    ring: 'border-[#61d394]',
    glow: 'shadow-[#61d394]/45',
    gradient: 'from-[#214f32] via-[#2f7d46] to-[#0d1c14]',
  },
  dwarves: {
    label: 'Dwarves',
    templateId: 'dwarves',
    imageUrl: 'DW',
    accent: '#b7772c',
    ring: 'border-[#d6a34a]',
    glow: 'shadow-[#d6a34a]/45',
    gradient: 'from-[#6b421d] via-[#b7772c] to-[#1f1208]',
  },
  assassins: {
    label: 'Assassins',
    templateId: 'assassins',
    imageUrl: 'AS',
    accent: '#155e75',
    ring: 'border-[#7dd3fc]',
    glow: 'shadow-[#7dd3fc]/42',
    gradient: 'from-[#0f3149] via-[#155e75] to-[#050b14]',
  },
  demons: {
    label: 'Demons',
    templateId: 'demons',
    imageUrl: 'DE',
    accent: '#7f101c',
    ring: 'border-[#fb3958]',
    glow: 'shadow-[#fb3958]/55',
    gradient: 'from-[#1b0508] via-[#7f101c] to-[#050101]',
  },
  mages: {
    label: 'Mages',
    templateId: 'mages',
    imageUrl: 'MA',
    accent: '#5b21b6',
    ring: 'border-[#a78bfa]',
    glow: 'shadow-[#a78bfa]/50',
    gradient: 'from-[#21114a] via-[#5b21b6] to-[#0c0719]',
  },
};

export const rarityByStars: Record<StarRank, Rarity> = {
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'mythic',
  5: 'legendary',
  6: 'immortal',
};

export const starsByRarity: Record<Rarity, StarRank> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
  legendary: 5,
  immortal: 6,
};

export const raceOrder = Object.keys(raceConfig) as CardRace[];

export const CREATE_CARD_ENERGY_COST = 5;
export const ENERGY_REGEN_INTERVAL_MINUTES = 20;
export const TROPHY_ENERGY_REWARD = 25;

export const deleteEnergyByStars: Record<StarRank, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 8,
  6: 12,
};

export const mergeEnergyByResultStars: Record<StarRank, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 7,
  6: 12,
};

export const energyCapForLevel = (level: number) => 25 + Math.floor(level / 5) * 5 + Math.floor(level / 10) * 5;

export const getLevelEnergyReward = (level: number) => {
  if (level === 100) return 100;
  if (level === 50) return 50;
  if (level % 10 === 0) return 20;
  if (level % 5 === 0) return 10;
  return 5;
};

export const xpToNextLevel = (level: number) => Math.round(1000 * Math.pow(1.2, level - 1));

export const getNextStars = (stars: StarRank) => Math.min(stars + 1, 6) as StarRank;

export const getMergeXp = (rarity: Rarity) => Math.round(120 * rarityConfig[rarity].xpMultiplier);

export const getDeleteXp = (rarity: Rarity) => Math.round(8 * rarityConfig[rarity].xpMultiplier);

export const getDeleteEnergy = (stars: StarRank) => deleteEnergyByStars[stars];

export const getMergeEnergy = (resultStars: StarRank) => mergeEnergyByResultStars[resultStars];

export const getTrophyEnergy = () => TROPHY_ENERGY_REWARD;

export const pickRandomRace = () => raceOrder[Math.floor(Math.random() * raceOrder.length)];

export const rewardsTable: Reward[] = Array.from({ length: 100 }, (_, index) => {
  const level = index + 1;
  const amount = getLevelEnergyReward(level);
  const milestoneLabel = level === 100 ? 'grand milestone' : level === 50 ? 'major milestone' : level % 10 === 0 ? 'milestone' : level % 5 === 0 ? 'cap step' : '';

  return {
    id: `reward-${level}`,
    level,
    type: 'energy',
    amount,
    title: milestoneLabel ? `+${amount} energy ${milestoneLabel}` : `+${amount} energy`,
    claimed: false,
  };
});
