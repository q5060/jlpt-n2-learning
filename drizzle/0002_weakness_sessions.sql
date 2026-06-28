-- Extended sync: weakness skill scores and study sessions
CREATE TABLE IF NOT EXISTS weakness_scores_remote (
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  score REAL NOT NULL,
  total_attempts INTEGER NOT NULL,
  correct_attempts INTEGER NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, skill)
);

CREATE TABLE IF NOT EXISTS study_sessions_remote (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  cards_reviewed INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
