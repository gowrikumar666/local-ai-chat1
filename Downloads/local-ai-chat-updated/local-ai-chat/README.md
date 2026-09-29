# Local AI Chat

A private, fully local chat app built with Next.js and [Ollama](https://ollama.com). Nothing leaves your machine.

- Streaming responses with a Stop button
- Markdown rendering (lists, tables, code blocks with copy)
- Upload a PDF and ask questions about it
- Conversations stored in a local SQLite database

## Requirements

- Node.js 20+
- [Ollama](https://ollama.com/download) installed and running

## Setup

```bash
Before running the project, make sure the following are installed:
Node.js 22 LTS or a compatible Node.js version
npm
Python 3.10+
Visual Studio Build Tools with the Desktop development with C++ workload
ollama pull llama3        # or any model you prefer
npm install
cp .env.example .env.local   # optional, see Configuration
npm run dev
```

Open <http://localhost:3000>. If Ollama isn't running, the app tells you (`ollama serve`).

## Configuration

All settings are optional environment variables (see [`.env.example`](.env.example)):

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server address |
| `OLLAMA_MODEL` | `llama3` | Model used for chat |
| `OLLAMA_NUM_CTX` | `8192` | Context window (tokens) |
| `OLLAMA_KEEP_ALIVE` | `30m` | How long the model stays loaded |
| `OLLAMA_IDLE_TIMEOUT_MS` | `120000` | Abort if Ollama goes silent this long |
| `CHAT_HISTORY_LIMIT` | `20` | Messages sent to the model per turn |
| `MAX_PDF_MB` / `MAX_PDF_CHARS` | `10` / `14000` | PDF size and text limits |
| `DB_PATH` | `data/chat.db` | SQLite file location |

## Data

Chats live in `data/chat.db` (git-ignored). If a legacy `chats.json` exists in the project root, it is imported automatically on first start and renamed to `chats.json.migrated`.

## Project layout

```
app/
  api/chat/      streaming chat endpoint (talks to Ollama)
  api/chats/     list / create / delete conversations
  components/    UI components
  hooks/         useChatSession (client state + streaming)
lib/
  config.ts      env-based settings
  db.ts          SQLite connection, schema, legacy import
  chat-store.ts  queries
  extract-pdf.ts PDF text extraction
```

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint`
