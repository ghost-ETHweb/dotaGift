import fs from 'node:fs/promises';
import path from 'node:path';

export class JsonFileStorage {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { players: {}, analyticsEvents: [] };
    this.ready = this.load();
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(raw);
      this.data.players ??= {};
      this.data.analyticsEvents ??= [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.flush();
    }
  }

  async flush() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  async getPlayer(playerId) {
    await this.ready;
    return this.data.players[playerId] ?? null;
  }

  async getPlayerByTelegramId(telegramId) {
    await this.ready;
    return Object.values(this.data.players).find((player) => player.telegramId === String(telegramId)) ?? null;
  }

  async getPlayerByReferralCode(referralCode) {
    await this.ready;
    return Object.values(this.data.players).find((player) => player.referralCode === referralCode) ?? null;
  }

  async listDirectReferrals(referralCode) {
    await this.ready;
    return Object.values(this.data.players).filter((player) => player.referredBy === referralCode);
  }

  async savePlayer(player) {
    await this.ready;
    this.data.players[player.id] = { ...player, updatedAt: new Date().toISOString() };
    await this.flush();
    return this.data.players[player.id];
  }

  async listPlayers() {
    await this.ready;
    return Object.values(this.data.players);
  }

  async recordAnalyticsEvent(event) {
    await this.ready;
    const analyticsEvent = {
      id: event.id,
      playerId: event.playerId ?? null,
      eventType: event.eventType,
      payload: event.payload ?? {},
      createdAt: event.createdAt ?? new Date().toISOString(),
    };

    this.data.analyticsEvents.push(analyticsEvent);
    this.data.analyticsEvents = this.data.analyticsEvents.slice(-5000);
    await this.flush();
    return analyticsEvent;
  }

  async getAdminStats() {
    await this.ready;
    const players = Object.values(this.data.players);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const events24h = this.data.analyticsEvents.filter((event) => Date.parse(event.createdAt) >= dayAgo);
    const eventsByType = events24h.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});

    return {
      players: {
        total: players.length,
        new24h: players.filter((player) => Date.parse(player.createdAt ?? 0) >= dayAgo).length,
        active24h: new Set(events24h.map((event) => event.playerId).filter(Boolean)).size,
        averageLevel: players.length ? Math.round((players.reduce((sum, player) => sum + player.level, 0) / players.length) * 10) / 10 : 0,
      },
      game: {
        cardsCreated: players.reduce((sum, player) => sum + player.stats.created, 0),
        cardsMerged: players.reduce((sum, player) => sum + player.stats.merged, 0),
        cardsDeleted: players.reduce((sum, player) => sum + player.stats.deleted, 0),
        trophies: players.reduce((sum, player) => sum + player.trophies.length, 0),
      },
      economy: {
        totalEnergy: players.reduce((sum, player) => sum + player.energy.current, 0),
        averageEnergy: players.length ? Math.round((players.reduce((sum, player) => sum + player.energy.current, 0) / players.length) * 10) / 10 : 0,
      },
      events: {
        total24h: events24h.length,
        byType24h: eventsByType,
      },
      serverTime: new Date().toISOString(),
    };
  }

  async getReferralXpSummary(playerId) {
    await this.ready;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const events = this.data.analyticsEvents.filter((event) => event.playerId === playerId && event.eventType === 'referral_xp');
    const amountOf = (event) => Number(event.payload?.amount ?? 0) || 0;

    return {
      xpToday: events.filter((event) => Date.parse(event.createdAt) >= dayAgo).reduce((sum, event) => sum + amountOf(event), 0),
      totalReferralXp: events.reduce((sum, event) => sum + amountOf(event), 0),
    };
  }

  async getXpByPlayerSince(playerIds, sinceIso) {
    await this.ready;
    const wanted = new Set(playerIds);
    const since = Date.parse(sinceIso);
    const xpByPlayer = new Map();

    for (const event of this.data.analyticsEvents) {
      if (!wanted.has(event.playerId) || Date.parse(event.createdAt) < since) continue;
      if (!['create_card', 'merge_cards', 'delete_card', 'referral_xp'].includes(event.eventType)) continue;

      const amount = Number(event.payload?.xpDelta ?? event.payload?.amount ?? 0) || 0;
      xpByPlayer.set(event.playerId, (xpByPlayer.get(event.playerId) ?? 0) + amount);
    }

    return xpByPlayer;
  }
}
