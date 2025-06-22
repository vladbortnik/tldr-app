-- TLDR App SQLite Schema
-- Comprehensive schema for command storage with FTS5 search support
-- Includes tables for commands, content types, and cache with TTL

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Disable journal mode (use WAL for better concurrency)
PRAGMA journal_mode = WAL;

-- Command Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commands Table (Core entity)
CREATE TABLE IF NOT EXISTS commands (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  stands_for TEXT,
  summary TEXT NOT NULL,
  category_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create index on command name for fast lookups
CREATE INDEX IF NOT EXISTS idx_commands_name ON commands(name);

-- Command Examples Table
CREATE TABLE IF NOT EXISTS command_examples (
  id INTEGER PRIMARY KEY,
  command_id INTEGER NOT NULL,
  example TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE
);

-- Content Types Table (for different content formats)
CREATE TABLE IF NOT EXISTS content_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Insert standard content types
INSERT OR IGNORE INTO content_types (name, description) VALUES
  ('tldr', 'TL;DR style brief command summary'),
  ('manpage', 'Full manual page content in markdown'),
  ('chtsh', 'Content from cht.sh API'),
  ('explainshell', 'Content from explainshell.com');

-- Command Content Table (for detailed markdown content)
CREATE TABLE IF NOT EXISTS command_content (
  id INTEGER PRIMARY KEY,
  command_id INTEGER NOT NULL,
  content_type_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  format TEXT DEFAULT 'markdown',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE,
  FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE,
  UNIQUE(command_id, content_type_id)
);

-- External API Cache Table (with TTL support)
CREATE TABLE IF NOT EXISTS api_cache (
  id INTEGER PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'json',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on cache expiration for cleanup
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Command Search using FTS5 (Virtual Table)
CREATE VIRTUAL TABLE IF NOT EXISTS command_search USING fts5(
  name,
  stands_for,
  summary,
  examples,
  content,
  category,
  content='',
  tokenize='porter unicode61'
);

-- Insert/Update Triggers for FTS5

-- Trigger to update FTS when commands are inserted
CREATE TRIGGER IF NOT EXISTS commands_ai AFTER INSERT ON commands BEGIN
  INSERT INTO command_search(rowid, name, stands_for, summary, examples, content, category)
  SELECT
    new.id,
    new.name,
    new.stands_for,
    new.summary,
    (SELECT GROUP_CONCAT(example, ' ') FROM command_examples WHERE command_id = new.id),
    (SELECT GROUP_CONCAT(content, ' ') FROM command_content WHERE command_id = new.id),
    (SELECT name FROM categories WHERE id = new.category_id)
  ;
END;

-- Trigger to update FTS when commands are updated
CREATE TRIGGER IF NOT EXISTS commands_au AFTER UPDATE ON commands BEGIN
  UPDATE command_search
  SET 
    name = new.name,
    stands_for = new.stands_for,
    summary = new.summary,
    category = (SELECT name FROM categories WHERE id = new.category_id)
  WHERE rowid = old.id;
END;

-- Trigger to update FTS when commands are deleted
CREATE TRIGGER IF NOT EXISTS commands_ad AFTER DELETE ON commands BEGIN
  DELETE FROM command_search WHERE rowid = old.id;
END;

-- Trigger to update FTS when examples are inserted/updated
CREATE TRIGGER IF NOT EXISTS examples_ai AFTER INSERT ON command_examples BEGIN
  UPDATE command_search
  SET examples = (SELECT GROUP_CONCAT(example, ' ') FROM command_examples WHERE command_id = new.command_id)
  WHERE rowid = new.command_id;
END;

-- Trigger to update FTS when content is inserted/updated
CREATE TRIGGER IF NOT EXISTS content_ai AFTER INSERT ON command_content BEGIN
  UPDATE command_search
  SET content = (SELECT GROUP_CONCAT(content, ' ') FROM command_content WHERE command_id = new.command_id)
  WHERE rowid = new.command_id;
END;

-- User Command History Table
CREATE TABLE IF NOT EXISTS command_history (
  id INTEGER PRIMARY KEY,
  command_id INTEGER,
  raw_input TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE SET NULL
);

-- Create index on history timestamps
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON command_history(timestamp);

-- Config/Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('db_version', '1.0'),
  ('cache_ttl_seconds', '86400'),
  ('theme', 'dark');

-- View for convenient search results
CREATE VIEW IF NOT EXISTS v_command_search AS
SELECT 
  c.id,
  c.name,
  c.stands_for,
  c.summary,
  cat.name AS category,
  (SELECT GROUP_CONCAT(example, '\n') FROM command_examples WHERE command_id = c.id) AS examples,
  (SELECT content FROM command_content WHERE command_id = c.id AND content_type_id = (SELECT id FROM content_types WHERE name = 'tldr') LIMIT 1) AS tldr_content
FROM commands c
LEFT JOIN categories cat ON c.category_id = cat.id;
