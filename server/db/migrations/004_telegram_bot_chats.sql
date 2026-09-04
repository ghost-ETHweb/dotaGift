CREATE TABLE IF NOT EXISTS telegram_bot_chats (
  chat_id TEXT PRIMARY KEY,
  last_message_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
