import { Database } from "bun:sqlite";
import { DB_PATH } from "./paths";

export function openDb() {
  const db = new Database(DB_PATH);

  db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS source_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath TEXT NOT NULL UNIQUE,
    sha256 TEXT NOT NULL,
    added_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    source_file_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (source_file_id) REFERENCES source_files(id)
  );

  CREATE INDEX IF NOT EXISTS idx_chunks_source_file_id ON chunks(source_file_id);

  -- NEW: store embeddings in SQLite (JSON array as text)
  CREATE TABLE IF NOT EXISTS embeddings (
    chunk_id TEXT PRIMARY KEY,
    vector_json TEXT NOT NULL,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id)
  );
`);

  return db;
}
