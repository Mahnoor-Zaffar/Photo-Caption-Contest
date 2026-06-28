# Photo Caption Contest API

REST API backend for a photo caption contest platform built with **Node.js**, **Express**, **PostgreSQL**, and **Sequelize ORM**.

## Live Demo

Replace with your Render URL after deploy:

- **API:** `https://photo-caption-api.onrender.com`
- **Swagger:** `https://photo-caption-api.onrender.com/api-docs`
- **Frontend:** `https://photo-caption-api.onrender.com/`

> First request after idle on Render free tier may take ~50 seconds (cold start).

## Features

- User registration, login, logout, and **refresh tokens**
- Protected caption submission and voting via JWT middleware
- PostgreSQL schema: Users, Images, Captions, and Votes
- **Sequelize transactions** on caption submit and voting
- Paginated captions on `GET /api/images/:id`
- In-memory response caching with **node-cache**
- Rate limiting on auth routes, **helmet** security headers
- Structured logging with **pino**
- Interactive **Swagger** docs at `/api-docs`
- **Postman collection** in `postman/`
- **Docker** support via `Dockerfile` and `docker-compose.yml`
- Minimal **frontend** at `/`

## Tech Stack

- Node.js + Express
- PostgreSQL + Sequelize ORM
- bcrypt, jsonwebtoken, express-validator
- node-cache, helmet, express-rate-limit, pino
- Jest + Supertest

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Local Setup

```bash
npm install
cp .env.example .env
createdb photo_caption_contest
npm run db:migrate
npm run db:seed
npm run dev
```

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api-docs`
- Frontend: `http://localhost:8000/`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | No | Logout and clear cookies |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/images` | No | List all contest images (cached) |
| GET | `/api/images/:id` | No | Get image with paginated captions (cached) |
| POST | `/api/images/:id/captions` | JWT | Submit a caption for an image |
| POST | `/api/captions/:id/votes` | JWT | Vote for a caption |
| DELETE | `/api/captions/:id/votes` | JWT | Remove your vote |

## Testing

```bash
npm test
```

Import `postman/Photo-Caption-Contest.postman_collection.json` into Postman. Set `baseUrl` to your local or Render API URL.

## Docker

```bash
docker compose up --build
```

Runs PostgreSQL + API on port 8000 with migrations and seeds applied automatically.

## Caching

- `GET /api/images` and `GET /api/images/:id` use read-through cache
- Default TTL: 60 seconds (`CACHE_TTL_SECONDS`)
- Cache invalidates when captions or votes change

## Deploy to Render

1. Push to GitHub
2. **New → Blueprint** → connect repo
3. Or manually set:
   - Build: `npm install && npm run db:migrate`
   - Start: `npm start`
   - Health check: `/api/health`

## Project Structure

```
src/
├── config/          # Database, cache, logger, env, Swagger
├── controllers/     # Route handlers
├── middlewares/     # Auth, cache, rate limit, UUID validation
├── migrations/      # Sequelize migrations
├── models/          # Sequelize models and associations
├── routes/          # Express routes + Swagger annotations
├── seeders/         # Demo contest images
└── utils/           # ApiError, ApiResponse, asyncHandler
public/              # Frontend UI
postman/             # Postman collection
tests/               # Jest + Supertest tests
```

## License

ISC
