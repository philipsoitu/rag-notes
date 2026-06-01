# rag-notes

A tiny terminal RAG chat app using Bun, LangChain, Ollama, and ChromaDB.

## Setup

Install dependencies:

```bash
bun install
```

Pull the Ollama models:
```bash
ollama pull granite4.1:3b
ollama pull granite-embedding:278m
```

Make sure Ollama is running:

```bash
ollama serve
```

Start ChromaDB:

```bash
chroma run --host localhost --port 8000 --path ./.chroma
```

## Run

```bash
bun run dev
```

## Chat

Add a file or folder:

```text
/add ./transcripts
```

Ask a question:

```text
What did lecture 3 say about retrieval?
```

Quit:

```text
/exit
```
