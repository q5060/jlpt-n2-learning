-- Drizzle migration: extended sync tables
CREATE TABLE IF NOT EXISTS wrong_answer_queue_remote (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  skill TEXT NOT NULL,
  due_at BIGINT NOT NULL,
  source TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  prompt TEXT,
  exercise_id TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_vocab_remote (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example TEXT,
  tags JSONB,
  source TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weakness_items_remote (
  content_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  wrong_count INTEGER NOT NULL,
  last_wrong_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, content_id)
);
