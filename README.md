# Photo Caption Contest API

REST API backend for a photo caption contest platform built with **Node.js**, **Express**, **PostgreSQL**, and **Sequelize ORM**.

## Features

- User registration and login with **bcrypt** password hashing and **JWT** authentication
- Protected caption submission via auth middleware
- PostgreSQL schema: Users, Images, and Captions with foreign-key relationships
- REST endpoints for listing images, fetching images with nested captions, and submitting captions
- In-memory response caching with **node-cache** on read endpoints
- Interactive **Swagger** documentation at `/api-docs`
- **Render** deployment blueprint via `render.yaml`

## Tech Stack

- Node.js + Express
- PostgreSQL + Sequelize ORM
- bcrypt, jsonwebtoken, express-validator
- node-cache, swagger-jsdoc, swagger-ui-express

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Local Setup

1. **Clone and install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Update `.env` with your local PostgreSQL connection string and a secure `JWT_SECRET`.

3. **Create the database**

```bash
createdb photo_caption_contest
```

4. **Run migrations and seed demo images**

```bash
npm run db:migrate
npm run db:seed
```

5. **Start the development server**

```bash
npm run dev
```

The API runs at `http://localhost:8000` and Swagger docs at `http://localhost:8000/api-docs`.

> On startup, `npm start` automatically runs pending migrations and seeds images if the table is empty.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/auth/logout` | No | Logout and clear session cookie |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/images` | No | List all contest images (cached) |
| GET | `/api/images/:id` | No | Get image with nested captions (cached) |
| POST | `/api/images/:id/captions` | JWT | Submit a caption for an image |

## Example Usage

**Register**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jane_doe","email":"jane@example.com","password":"password123"}'
```

**Login**

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'
```

**List images**

```bash
curl http://localhost:8000/api/images
```

**Get image with captions**

```bash
curl http://localhost:8000/api/images/{image-id}
```

**Submit a caption**

```bash
curl -X POST http://localhost:8000/api/images/{image-id}/captions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text":"When the sun clocks out early..."}'
```

## Caching

- `GET /api/images` and `GET /api/images/:id` responses are cached in memory
- Default TTL: 60 seconds (`CACHE_TTL_SECONDS`)
- Cache is invalidated when a new caption is submitted for an image

## Deploy to Render

1. Push this repository to GitHub
2. In Render, choose **New > Blueprint** and connect the repo
3. Render reads `render.yaml` and provisions:
   - A PostgreSQL database
   - A Node.js web service with linked `DATABASE_URL`
4. After deploy, visit `https://your-service.onrender.com/api-docs`

### Manual Render setup

1. Create a PostgreSQL instance on Render
2. Create a Web Service linked to this repo
3. Set environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=<secure-random-string>`
   - `DATABASE_URL=<from Render PostgreSQL>`
4. Build command: `npm install`
5. Start command: `npm start`
6. Health check path: `/api/health`

## Project Structure

```
src/
├── config/          # Database, cache, Swagger config
├── controllers/     # Route handlers
├── middlewares/     # Auth, cache, validation, error handling
├── migrations/      # Sequelize migrations
├── models/          # Sequelize models and associations
├── routes/          # Express routes + Swagger annotations
├── seeders/         # Demo contest images
└── utils/           # ApiError, ApiResponse, asyncHandler
```

## License

ISC
