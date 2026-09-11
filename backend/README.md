# Human Tribunal - Backend

Express + TypeScript API server for managing tribunal sessions, health checks, and generating absurd AI verdicts.

## Running Locally

```bash
npm install
npm run dev
```

Server will run at `http://localhost:3000`.

## API Endpoints

- `GET /api/health` - System status check
- `POST /api/session/start` - Create a new tribunal session
- `GET /api/session/:id` - Fetch session details
- `POST /api/verdict` - Submit case for AI deliberation
- `GET /api/live-updates` - Real-time SSE stream of issued verdicts
