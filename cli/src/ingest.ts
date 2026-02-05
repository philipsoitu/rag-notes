import fs from "node:fs";
import path from "node:path";
import { openDb } from "./db";
import { sha256File } from "./hash";
import { chunkText } from "./text";
import { embedTexts, upsertEmbedding, deleteEmbeddingsForSource } from "./vectorstore";

function makeChunkId(sourceFileId: number, chunkIndex: number) {
  return `${sourceFileId}:${chunkIndex}`;
}

function getLastInsertRowId(db: any): number {
  // Bun versions differ a bit; handle common cases + fallback query.
  const direct = Number(db.lastInsertRowid ?? db.last_insert_rowid ?? 0);
  if (direct) return direct;

  const row = db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number } | null;
  return Number(row?.id ?? 0);
}

export async function ingestTxtFile(filepath: string) {
  const abs = path.resolve(filepath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const ext = path.extname(abs).toLowerCase();
  if (ext !== ".txt") throw new Error("Only .txt files supported (for now).");

  const db = openDb();
  const sha = sha256File(abs);

  const existing = db
    .prepare("SELECT id, sha256 FROM source_files WHERE filepath = ?")
    .get(abs) as { id: number; sha256: string } | null;

  // If file unchanged, skip
  if (existing && existing.sha256 === sha) {
    return { skipped: true, sourceFileId: existing.id, chunksAdded: 0 };
  }

  const now = new Date().toISOString();

  let sourceFileId: number;

  if (existing) {
    db.prepare("UPDATE source_files SET sha256 = ?, added_at = ? WHERE id = ?").run(
      sha,
      now,
      existing.id
    );
    sourceFileId = existing.id;

    // Remove old chunks + embeddings for this source
    // (We *do* support clean updates now.)
    deleteEmbeddingsForSource(sourceFileId);
    db.prepare("DELETE FROM chunks WHERE source_file_id = ?").run(sourceFileId);
  } else {
    db.prepare(
      "INSERT INTO source_files (filepath, sha256, added_at) VALUES (?, ?, ?)"
    ).run(abs, sha, now);

    sourceFileId = getLastInsertRowId(db);
    if (!sourceFileId) throw new Error("Could not determine inserted source_file_id.");
  }

  const content = fs.readFileSync(abs, "utf8");
  const chunks = chunkText(content);

  // Embed all chunks in a batch (much faster than one-by-one)
  const vectors = await embedTexts(chunks);

  const insertChunk = db.prepare(
    "INSERT OR REPLACE INTO chunks (id, source_file_id, chunk_index, content, created_at) VALUES (?, ?, ?, ?, ?)"
  );

  for (let i = 0; i < chunks.length; i++) {
    const id = makeChunkId(sourceFileId, i);
    insertChunk.run(id, sourceFileId, i, chunks[i], now);
    upsertEmbedding(id, vectors[i]);
  }

  return { skipped: false, sourceFileId, chunksAdded: chunks.length };
}
