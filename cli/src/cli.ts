#!/usr/bin/env bun
import { Command } from "commander";
import { ensureDirs } from "./paths";
import { ingestTxtFile } from "./ingest";
import { chatLoop } from "./chat";

ensureDirs();

const program = new Command();

program
  .name("rag-notes")
  .description("Local RAG notes CLI (Bun + LangChain + Ollama)")
  .version("0.1.0");

program
  .command("add")
  .description("Ingest a .txt file into the local RAG index")
  .argument("<file>", "Path to .txt file")
  .action(async (file) => {
    const res = await ingestTxtFile(file);
    if (res.skipped) console.log(`No changes detected. Skipped. (source #${res.sourceFileId})`);
    else console.log(`Ingested source #${res.sourceFileId}, chunks added: ${res.chunksAdded}`);
  });

program
  .command("chat")
  .description("Chat with your local RAG")
  .action(async () => {
    await chatLoop();
  });

program.parse(process.argv);
