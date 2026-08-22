CREATE TABLE IF NOT EXISTS source_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  source TEXT NOT NULL,

  external_id TEXT NOT NULL,

  title TEXT NOT NULL,

  description TEXT,

  url TEXT,

  category TEXT NOT NULL DEFAULT 'general',

  score REAL NOT NULL DEFAULT 1,

  published_at TEXT,

  collected_at TEXT NOT NULL,

  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_source_items_collected
ON source_items(collected_at);

CREATE INDEX IF NOT EXISTS idx_source_items_category
ON source_items(category);

CREATE INDEX IF NOT EXISTS idx_source_items_source
ON source_items(source);

CREATE INDEX IF NOT EXISTS idx_source_items_score
ON source_items(score);

CREATE TABLE IF NOT EXISTS chats (
  chat_id TEXT PRIMARY KEY,

  enabled INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  started_at TEXT NOT NULL,

  finished_at TEXT,

  fetched INTEGER NOT NULL DEFAULT 0,

  inserted INTEGER NOT NULL DEFAULT 0,

  errors INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_collection_runs_started
ON collection_runs(started_at);
