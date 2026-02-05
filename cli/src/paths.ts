import path from "node:path";
import fs from "node:fs";

export const DATA_DIR = path.resolve(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "rag-notes.sqlite");
export const HNSW_DIR = path.join(DATA_DIR, "hnsw");

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(HNSW_DIR, { recursive: true });
}
