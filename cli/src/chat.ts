import readline from "node:readline";
import { openDb } from "./db";
import { similaritySearch, RetrievedChunk } from "./vectorstore";
import { Ollama } from "@langchain/ollama";

export async function chatLoop() {
  const llm = new Ollama({
    model: process.env.OLLAMA_CHAT_MODEL || "qwen2.5:3b",
    temperature: 0.2,
  });

  const db = openDb();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string) =>
    new Promise<string>((res) => rl.question(q, res));

  // simple per-session state
  const state = {
    k: 6,
    minScore: -1, // cosine sim can be negative; keep everything by default
  };

  console.log("RAG Notes — local chat. Type /exit to quit. Type /help for commands.");

  while (true) {
    const q = (await ask("\n> ")).trim();
    if (!q) continue;

    if (q === "/exit") break;

    if (q === "/help") {
      console.log(
        [
          "Commands:",
          "  /exit                 Quit",
          "  /sources              List ingested files",
          "  /k N                  Set retrieval count (default 6, max 30)",
          "  /minscore X           Filter retrieved chunks by similarity score (default -1)",
          "  /stats                Show chunk/vector counts",
        ].join("\n")
      );
      continue;
    }

    if (q === "/sources") {
      const rows = db
        .prepare(
          "SELECT id, filepath, added_at FROM source_files ORDER BY added_at DESC"
        )
        .all() as Array<{ id: number; filepath: string; added_at: string }>;

      if (!rows.length) console.log("(no sources)");
      else rows.forEach((r) => console.log(`#${r.id}  ${r.filepath}  (${r.added_at})`));
      continue;
    }

    if (q === "/stats") {
      const c = db
        .prepare("SELECT COUNT(*) AS n FROM chunks")
        .get() as { n: number } | null;
      const e = db
        .prepare("SELECT COUNT(*) AS n FROM embeddings")
        .get() as { n: number } | null;
      const s = db
        .prepare("SELECT COUNT(*) AS n FROM source_files")
        .get() as { n: number } | null;

      console.log(
        `sources=${s?.n ?? 0}  chunks=${c?.n ?? 0}  embeddings=${e?.n ?? 0}`
      );
      continue;
    }

    const kMatch = q.match(/^\/k\s+(\d+)$/);
    if (kMatch) {
      state.k = Math.max(1, Math.min(30, Number(kMatch[1])));
      console.log(`k = ${state.k}`);
      continue;
    }

    const msMatch = q.match(/^\/minscore\s+(-?\d+(\.\d+)?)$/);
    if (msMatch) {
      state.minScore = Number(msMatch[1]);
      console.log(`minScore = ${state.minScore}`);
      continue;
    }

    // Retrieve relevant chunks (pure SQLite + cosine in JS)
    let retrieved: RetrievedChunk[] = await similaritySearch(q, state.k);
    if (state.minScore !== -1) {
      retrieved = retrieved.filter((r) => r.score >= state.minScore);
    }

    const contextBlocks = retrieved.map(
      (r, i) =>
        `[#${i + 1}] (${r.filepath} — chunk ${r.chunkIndex}, score ${r.score.toFixed(3)})\n${r.content}`
    );

    const context = contextBlocks.join("\n\n");

    const prompt = [
      "You are a local notes assistant. Answer using ONLY the provided context when possible.",
      "If the context is insufficient, say what’s missing and ask a precise follow-up question.",
      "When you do answer, be concise and cite sources using [#] markers from the context.",
      "",
      "CONTEXT:",
      context || "(none)",
      "",
      `QUESTION: ${q}`,
      "",
      "ANSWER:",
    ].join("\n");

    const out = await llm.invoke(prompt);
    console.log(`\n${out}`);

    if (retrieved.length) {
      console.log("\nSources:");
      for (let i = 0; i < retrieved.length; i++) {
        const r = retrieved[i];
        console.log(`- [#${i + 1}] ${r.filepath} (chunk ${r.chunkIndex}, score ${r.score.toFixed(3)})`);
      }
    } else {
      console.log("\n(no relevant chunks retrieved — try ingesting more notes, or lower /minscore)");
    }
  }

  rl.close();
}
