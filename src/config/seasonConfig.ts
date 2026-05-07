import type { CardRace } from '../types';

export type SeasonTrophyType = 'standard' | 'seasonal' | 'rare';

export type RaceAbility = {
  race: CardRace;
  name: string;
  short: string;
  cadenceHours: number;
};

export type PartnerBoostCard = {
  id: string;
  partner: string;
  name: string;
  targetRace?: CardRace;
  bonusPercent: number;
  status: 'active' | 'locked';
  expiresIn: string;
};

export const seasonLengthDays = 28;

export const trophyXpPerHour: Record<SeasonTrophyType, number> = {
  standard: 10,
  seasonal: 20,
  rare: 30,
};

export const raceAbilities: Record<CardRace, RaceAbility> = {
  demons: {
    race: 'demons',
    name: 'Soul Drain',
    short: 'Steals temporary generation from the leading race.',
    cadenceHours: 4,
  },
  mages: {
    race: 'mages',
    name: 'Arcane Surge',
    short: 'Creates bonus XP from mage trophies.',
    cadenceHours: 4,
  },
  orcs: {
    race: 'orcs',
    name: 'Raid',
    short: 'Raids a higher race and steals recent XP.',
    cadenceHours: 4,
  },
  dwarves: {
    race: 'dwarves',
    name: 'Deep Mines',
    short: 'Adds steady mining XP and reduces incoming steals.',
    cadenceHours: 4,
  },
  assassins: {
    race: 'assassins',
    name: 'Shadow Contract',
    short: 'Copies growth from the fastest race.',
    cadenceHours: 4,
  },
};

export const partnerBoostCards: PartnerBoostCard[] = [
  {
    id: 'testy-drop-sigil',
    partner: 'Testy Drop',
    name: 'Testy Drop Sigil',
    targetRace: 'mages',
    bonusPercent: 15,
    status: 'active',
    expiresIn: 'Season end',
  },
  {
    id: 'arena-pass-relic',
    partner: 'Partner slot',
    name: 'Arena Pass Relic',
    bonusPercent: 10,
    status: 'locked',
    expiresIn: 'Future event',
  },
];

export const baseSeasonScores: Record<CardRace, number> = {
  orcs: 18420,
  dwarves: 16180,
  assassins: 17340,
  demons: 19110,
  mages: 16890,
};

export const underdogMultiplierByRank = [1, 1.05, 1.1, 1.18, 1.25] as const;
