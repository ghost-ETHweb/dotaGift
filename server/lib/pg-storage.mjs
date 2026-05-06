import pg from 'pg';
import crypto from 'node:crypto';
import { GAME_BALANCE, getRewardsTable } from '../config/game-config.mjs';

const { Pool } = pg;
const rewardsTable = getRewardsTable();

function toIso(value) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toCard(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    race: row.race,
    name: row.name,
    rarity: row.rarity,
    stars: row.stars,
    state: row.state,
    imageUrl: row.image_url,
    boardIndex: row.board_index ?? undefined,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    mergedFrom: row.merged_from ?? undefined,
    source: row.source,
  };
}

function playerRowToBase(row) {
  return {
    id: row.id,
    telegramId: row.telegram_id,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    languageCode: row.language_code ?? undefined,
    referralCode: row.referral_code,
    referredBy: row.referred_by ?? null,
    selectedAvatarRace: row.selected_avatar_race,
    level: row.level,
    xp: row.xp,
    invitedCount: row.invited_count,
    activeInvitedCount: row.active_invited_count,
    referralLevel: row.referral_level,
    stats: {
      created: row.stats_created,
      merged: row.stats_merged,
      deleted: row.stats_deleted,
      trophies: row.stats_trophies,
    },
    energy: {
      current: row.energy_current,
      max: row.energy_max,
      createCost: GAME_BALANCE.createCardEnergyCost,
      regenIntervalMinutes: GAME_BALANCE.energyRegenIntervalMinutes,
      nextRegenAt: toIso(row.energy_next_regen_at),
    },
    board: Array.from({ length: GAME_BALANCE.boardSize }, () => null),
    trophies: [],
    claimedRewardIds: [],
    processedActionIds: [],
    actionLog: [],
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export class PgStorage {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });
  }

  async hydratePlayer(row, client = this.pool) {
    if (!row) return null;

    const player = playerRowToBase(row);
    const [cardsResult, rewardClaimsResult, actionResult] = await Promise.all([
      client.query('SELECT * FROM cards WHERE player_id = $1 ORDER BY board_index ASC NULLS LAST, created_at DESC', [player.id]),
      client.query('SELECT reward_id FROM reward_claims WHERE player_id = $1', [player.id]),
      client.query('SELECT client_action_id, created_at FROM action_ledger WHERE player_id = $1 ORDER BY created_at DESC LIMIT 200', [player.id]),
    ]);

    for (const cardRow of cardsResult.rows) {
      const card = toCard(cardRow);
      if (card.state === 'trophy') {
        player.trophies.push(card);
      } else if (Number.isInteger(card.boardIndex) && card.boardIndex >= 0 && card.boardIndex < GAME_BALANCE.boardSize) {
        player.board[card.boardIndex] = card;
      }
    }

    player.claimedRewardIds = rewardClaimsResult.rows.map((claim) => claim.reward_id);
    player.processedActionIds = actionResult.rows.map((action) => action.client_action_id);
    player.actionLog = actionResult.rows.map((action) => new Date(action.created_at).getTime()).filter(Number.isFinite);

    return player;
  }

  async getPlayer(playerId) {
    const result = await this.pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
    return this.hydratePlayer(result.rows[0]);
  }

  async getPlayerByTelegramId(telegramId) {
    const result = await this.pool.query('SELECT * FROM players WHERE telegram_id = $1', [String(telegramId)]);
    return this.hydratePlayer(result.rows[0]);
  }

  async getPlayerByReferralCode(referralCode) {
    const result = await this.pool.query('SELECT * FROM players WHERE referral_code = $1', [referralCode]);
    return this.hydratePlayer(result.rows[0]);
  }

  async savePlayer(player) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `
          INSERT INTO players (
            id, telegram_id, username, avatar_url, language_code, referral_code, referred_by, selected_avatar_race,
            level, xp, energy_current, energy_max, energy_next_regen_at,
            invited_count, active_invited_count, referral_level,
            stats_created, stats_merged, stats_deleted, stats_trophies, created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19, $20, COALESCE($21, now()), now()
          )
          ON CONFLICT (id) DO UPDATE SET
            telegram_id = EXCLUDED.telegram_id,
            username = EXCLUDED.username,
            avatar_url = EXCLUDED.avatar_url,
            language_code = EXCLUDED.language_code,
            referral_code = EXCLUDED.referral_code,
            referred_by = EXCLUDED.referred_by,
            selected_avatar_race = EXCLUDED.selected_avatar_race,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            energy_current = EXCLUDED.energy_current,
            energy_max = EXCLUDED.energy_max,
            energy_next_regen_at = EXCLUDED.energy_next_regen_at,
            invited_count = EXCLUDED.invited_count,
            active_invited_count = EXCLUDED.active_invited_count,
            referral_level = EXCLUDED.referral_level,
            stats_created = EXCLUDED.stats_created,
            stats_merged = EXCLUDED.stats_merged,
            stats_deleted = EXCLUDED.stats_deleted,
            stats_trophies = EXCLUDED.stats_trophies,
            updated_at = now()
        `,
        [
          player.id,
          player.telegramId,
          player.username,
          player.avatarUrl ?? null,
          player.languageCode ?? null,
          player.referralCode,
          player.referredBy ?? null,
          player.selectedAvatarRace ?? 'orcs',
          player.level,
          player.xp,
          player.energy.current,
          player.energy.max,
          player.energy.nextRegenAt ?? null,
          player.invitedCount,
          player.activeInvitedCount,
          player.referralLevel,
          player.stats.created,
          player.stats.merged,
          player.stats.deleted,
          player.stats.trophies,
          player.createdAt ?? null,
        ],
      );

      await client.query('DELETE FROM cards WHERE player_id = $1', [player.id]);
      const cards = [...player.board.filter(Boolean), ...player.trophies];
      for (const card of cards) {
        await client.query(
          `
            INSERT INTO cards (
              id, player_id, template_id, race, name, rarity, stars, state, image_url,
              board_index, source, merged_from, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
          `,
          [
            card.id,
            player.id,
            card.templateId,
            card.race,
            card.name,
            card.rarity,
            card.stars,
            card.state,
            card.imageUrl,
            card.state === 'trophy' ? null : card.boardIndex,
            card.source,
            card.mergedFrom ? JSON.stringify(card.mergedFrom) : null,
            card.createdAt ?? new Date().toISOString(),
          ],
        );
      }

      await client.query('DELETE FROM reward_claims WHERE player_id = $1', [player.id]);
      for (const rewardId of player.claimedRewardIds) {
        const reward = rewardsTable.find((item) => item.id === rewardId) ?? { level: 0, type: 'energy', amount: 0 };
        await client.query(
          `
            INSERT INTO reward_claims (id, player_id, reward_id, level, reward_type, amount)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (player_id, reward_id) DO NOTHING
          `,
          [`claim_${player.id}_${rewardId}`, player.id, rewardId, reward.level, reward.type, reward.amount ?? null],
        );
      }

      for (const clientActionId of player.processedActionIds) {
        await client.query(
          `
            INSERT INTO action_ledger (id, player_id, client_action_id, action_type)
            VALUES ($1, $2, $3, 'game_action')
            ON CONFLICT (player_id, client_action_id) DO NOTHING
          `,
          [`action_${player.id}_${clientActionId}`, player.id, clientActionId],
        );
      }

      await client.query('COMMIT');
      return this.getPlayer(player.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listPlayers() {
    const result = await this.pool.query('SELECT * FROM players ORDER BY level DESC, xp DESC LIMIT 250');
    return Promise.all(result.rows.map((row) => this.hydratePlayer(row)));
  }

  async recordAnalyticsEvent(event) {
    const id = event.id ?? `evt_${crypto.randomUUID()}`;
    const createdAt = event.createdAt ?? new Date().toISOString();
    await this.pool.query(
      `
        INSERT INTO analytics_events (id, player_id, event_type, payload, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [id, event.playerId ?? null, event.eventType, JSON.stringify(event.payload ?? {}), createdAt],
    );

    return {
      id,
      playerId: event.playerId ?? null,
      eventType: event.eventType,
      payload: event.payload ?? {},
      createdAt,
    };
  }

  async getAdminStats() {
    const [playersResult, gameResult, eventsResult] = await Promise.all([
      this.pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS new_24h,
          COALESCE(ROUND(AVG(level)::numeric, 1), 0)::float AS average_level,
          COALESCE(SUM(energy_current), 0)::int AS total_energy,
          COALESCE(ROUND(AVG(energy_current)::numeric, 1), 0)::float AS average_energy
        FROM players
      `),
      this.pool.query(`
        SELECT
          COALESCE(SUM(stats_created), 0)::int AS cards_created,
          COALESCE(SUM(stats_merged), 0)::int AS cards_merged,
          COALESCE(SUM(stats_deleted), 0)::int AS cards_deleted,
          COALESCE(SUM(stats_trophies), 0)::int AS trophies
        FROM players
      `),
      this.pool.query(`
        SELECT event_type, COUNT(*)::int AS count
        FROM analytics_events
        WHERE created_at >= now() - interval '24 hours'
        GROUP BY event_type
      `),
    ]);

    const activeResult = await this.pool.query(`
      SELECT COUNT(DISTINCT player_id)::int AS active_24h
      FROM analytics_events
      WHERE created_at >= now() - interval '24 hours' AND player_id IS NOT NULL
    `);

    const byType24h = Object.fromEntries(eventsResult.rows.map((row) => [row.event_type, row.count]));
    const total24h = eventsResult.rows.reduce((sum, row) => sum + row.count, 0);
    const players = playersResult.rows[0];
    const game = gameResult.rows[0];

    return {
      players: {
        total: players.total,
        new24h: players.new_24h,
        active24h: activeResult.rows[0].active_24h,
        averageLevel: players.average_level,
      },
      game: {
        cardsCreated: game.cards_created,
        cardsMerged: game.cards_merged,
        cardsDeleted: game.cards_deleted,
        trophies: game.trophies,
      },
      economy: {
        totalEnergy: players.total_energy,
        averageEnergy: players.average_energy,
      },
      events: {
        total24h,
        byType24h,
      },
      serverTime: new Date().toISOString(),
    };
  }
}
