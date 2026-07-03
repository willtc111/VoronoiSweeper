CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  game_id TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_time ON leaderboard(game_id, time_ms ASC);
CREATE INDEX IF NOT EXISTS idx_created_at ON leaderboard(created_at DESC);