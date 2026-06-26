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
