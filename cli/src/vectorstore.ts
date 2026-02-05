import { openDb } from "./db";
import { OllamaEmbeddings } from "@langchain/ollama";

export const embeddings = new OllamaEmbeddings({
  model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
});

export type RetrievedChunk = {
  chunkId: string;
  filepath: string;
  chunkIndex: number;
  sourceFileId: number;
  score: number; // cosine similarity
  content: string;
};

function dot(a: number[], b: number[]) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a: number[], b: number[]) {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

export async function embedText(text: string): Promise<number[]> {
  // LangChain embeddings API returns number[] for embedQuery
  return await embeddings.embedQuery(text);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return await embeddings.embedDocuments(texts);
}

/**
 * Store/replace embedding vector for a chunk.
 */
export function upsertEmbedding(chunkId: string, vector: number[]) {
  const db = openDb();
  db.prepare(
    "INSERT OR REPLACE INTO embeddings (chunk_id, vector_json) VALUES (?, ?)"
  ).run(chunkId, JSON.stringify(vector));
}

/**
 * Delete embeddings for all chunks of a given source file (used on re-ingest update).
 */
export function deleteEmbeddingsForSource(sourceFileId: number) {
  const db = openDb();
  // Join chunks -> embeddings
  db.prepare(`
    DELETE FROM embeddings
    WHERE chunk_id IN (
      SELECT id FROM chunks WHERE source_file_id = ?
    )
  `).run(sourceFileId);
}

/**
 * Retrieve topK chunks by cosine similarity.
 * This loads vectors from SQLite and computes similarity in JS.
 * Good enough for notes-scale corpora; fully offline; zero native deps.
 */
export async function similaritySearch(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const db = openDb();
  const qVec = await embedText(query);

  // Pull candidate chunks + vectors
  const rows = db.prepare(`
    SELECT
      c.id AS chunkId,
      c.content AS content,
      c.chunk_index AS chunkIndex,
      c.source_file_id AS sourceFileId,
      sf.filepath AS filepath,
      e.vector_json AS vectorJson
    FROM embeddings e
    JOIN chunks c ON c.id = e.chunk_id
    JOIN source_files sf ON sf.id = c.source_file_id
  `).all() as Array<{
    chunkId: string;
    content: string;
    chunkIndex: number;
    sourceFileId: number;
    filepath: string;
    vectorJson: string;
  }>;

  // Score
  const scored: RetrievedChunk[] = rows.map(r => {
    let vec: number[] = [];
    try {
      vec = JSON.parse(r.vectorJson);
    } catch {
      vec = [];
    }
    const score = cosineSimilarity(qVec, vec);
    return {
      chunkId: r.chunkId,
      filepath: r.filepath,
      chunkIndex: r.chunkIndex,
      sourceFileId: r.sourceFileId,
      score,
      content: r.content,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
