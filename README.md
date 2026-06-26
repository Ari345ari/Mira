# Chimege Protocol

AI-powered meeting intelligence platform for Mongolian and English meetings.

## What it does

- Upload audio or video recordings
- Auto-transcribe with Mongolian STT (Chimege API)
- Identify speakers
- Generate AI meeting protocol (summary, decisions, action items)
- Export as PDF or DOCX
- Team workspaces with role-based access

## Tech stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL + pgvector
- **Queue:** BullMQ + Redis
- **Storage:** AWS S3
- **AI:** Chimege STT + OpenAI GPT-4o-mini

## Local development setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose

### 1. Start infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, and Mailhog (email catcher).

### 2. Set up backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install
npm run start:dev
```

Backend runs on http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### 3. Set up frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on http://localhost:3001

### 4. View emails

Open http://localhost:8025 to see emails sent in development.

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

- `CHIMEGE_API_KEY` — get from chimege.com
- `OPENAI_API_KEY` — get from platform.openai.com
- `ASSEMBLYAI_API_KEY` — get from assemblyai.com
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS credentials
- `S3_BUCKET` — your S3 bucket name

Set `USE_MOCK_STT=true` and `USE_MOCK_AI=true` to develop without API keys.

## Project structure

```
chimege-protocol/
├── frontend/          Next.js app
│   └── src/
│       ├── app/       Pages (App Router)
│       ├── components/
│       ├── hooks/
│       └── lib/
├── backend/           NestJS API + Workers
│   └── src/
│       ├── modules/   Feature modules
│       ├── database/  Entities + migrations
│       ├── workers/   Background job processors
│       └── config/
└── docker-compose.yml Local infrastructure
```
