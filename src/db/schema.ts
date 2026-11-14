export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_quick_tap INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  category_id TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'ocr', 'voice', 'quick_tap')),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  tags TEXT NOT NULL DEFAULT '[]',
  group_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  month TEXT NOT NULL UNIQUE,
  total_limit_minor INTEGER NOT NULL CHECK (total_limit_minor >= 0),
  per_category_limits TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  server_id TEXT,
  members TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS group_expenses (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  paid_by TEXT NOT NULL,
  split_type TEXT NOT NULL,
  splits_json TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  server_updated_at TEXT,
  local_updated_at TEXT NOT NULL,
  pending_sync INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL,
  from_member TEXT NOT NULL,
  to_member TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  date TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
`;
