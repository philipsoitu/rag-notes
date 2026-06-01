import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";

const MODEL = "granite4.1:3b";
const EMBEDDING_MODEL = "granite-embedding:278m";
const COLLECTION = "rag_notes";
const CHROMA_HOST = "localhost";
const CHROMA_PORT = 8000;

const embeddings = new OllamaEmbeddings({ model: EMBEDDING_MODEL });
const chat = new ChatOllama({ model: MODEL, temperature: 0.2 });

async function main() {
  await waitForChroma();

  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: COLLECTION,
    clientParams: { host: CHROMA_HOST, port: CHROMA_PORT },
  });

  console.log("RAG chat is ready.");
  console.log("Use /add ./path-to-file-or-folder to index documents. Use /exit to quit.");

  const rl = createInterface({ input, output });

  try {
    while (true) {
      const line = (await rl.question("\n> ")).trim();

      if (!line) continue;
      if (line === "/exit" || line === "/quit") break;

      if (line.startsWith("/add ")) {
        await addPathToVectorStore(line.slice("/add ".length).trim(), vectorStore);
        continue;
      }

      await answerQuestion(line, vectorStore);
    }
  } finally {
    rl.close();
    console.log("\nBye.");
  }
}

async function waitForChroma() {
  const url = `http://${CHROMA_HOST}:${CHROMA_PORT}/api/v2/heartbeat`;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Chroma is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Could not connect to Chroma at ${url}. Start Chroma separately before running this app.`,
  );
}

async function addPathToVectorStore(path: string, vectorStore: Chroma) {
  const files = await findTextFiles(resolve(path));
  if (files.length === 0) {
    console.log("No readable text files found.");
    return;
  }

  let addedChunks = 0;

  for (const file of files) {
    const text = await Bun.file(file).text();
    const chunks = chunkText(text).map(
      (chunk, index) =>
        new Document({
          pageContent: chunk,
          metadata: { source: file, chunk: index },
        }),
    );

    await vectorStore.addDocuments(chunks);
    addedChunks += chunks.length;
    console.log(`Added ${chunks.length} chunks from ${file}`);
  }

  console.log(`Indexed ${addedChunks} chunks from ${files.length} file(s).`);
}

function chunkText(text: string): string[] {
  const chunkSize = 900;
  const overlap = 150;
  const chunks: string[] = [];

  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const chunk = text.slice(start, start + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

async function findTextFiles(path: string): Promise<string[]> {
  const info = await stat(path);

  if (info.isFile()) return [path];
  if (!info.isDirectory()) return [];

  const names = await readdir(path);
  const nested = await Promise.all(names.map((name) => findTextFiles(join(path, name))));
  return nested.flat();
}

async function answerQuestion(question: string, vectorStore: Chroma) {
  const docs = await vectorStore.similaritySearch(question, 4);
  const context = docs
    .map((doc, index) => `[${index + 1}] ${doc.metadata.source}\n${doc.pageContent}`)
    .join("\n\n");

  const response = await chat.invoke([
    ["system", "Answer using the context when it is useful. If the context does not contain the answer, say so and answer from general knowledge."],
    ["human", `Context:\n${context || "No documents have been added yet."}\n\nQuestion: ${question}`],
  ]);

  console.log(`\n${response.content}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
