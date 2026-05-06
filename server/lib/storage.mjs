import fs from 'node:fs/promises';
import path from 'node:path';

export class JsonFileStorage {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { players: {} };
    this.ready = this.load();
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(raw);
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
}
