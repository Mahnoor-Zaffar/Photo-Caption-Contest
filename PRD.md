# Product Requirement Document (PRD)

## 1. Project Overview
The **Photo Caption Contest** platform is a backend RESTful API that allows users to view hosted images, submit creative captions, and participate in caption contests. The platform enforces authentication for caption submissions, utilizes local caching to optimize image retrieval performance, and provides interactive API documentation.

## 2. Objectives & Success Metrics
* **Git Version Control:** 100% of the codebase managed via clean git commits.
* **Database Integration:** Fully relational PostgreSQL database integrated using Sequelize ORM.
* **Authentication & Security:** Secure registration and login using `bcrypt` and JWT/Session tokens.
* **Performance Optimization:** Cache hit ratio > 80% for high-traffic image retrieval endpoints using `node-cache`.
* **Documentation:** Fully interactive Swagger API specification covering all active endpoints.
* **Deployment:** Publicly accessible deployment hosted on Render.

## 3. System Architecture & Tech Stack
* **Runtime Environment:** Node.js (v18+)
* **Web Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Sequelize & Sequelize-CLI
* **Authentication:** `bcrypt` (password hashing) & `jsonwebtoken` (stateless auth middleware)
* **Caching Layer:** `node-cache`
* **Documentation:** `swagger-ui-express` & `swagger-jsdoc`
* **Deployment Target:** Render (Web Service + Managed PostgreSQL)

## 4. Database Schema & Data Models

### 4.1. Entity Relationship Overview
* **User (1) ----> (N) Caption** (A user can submit multiple captions across images)
* **Image (1) ----> (N) Caption** (An image can have multiple captions)
* **User (1) ----> (N) Vote** (A user can vote on captions)
* **Caption (1) ----> (N) Vote** (A caption can receive multiple votes)

```
+------------------+          +------------------+          +------------------+
|      Users       |          |     Captions     |          |      Images      |
+------------------+          +------------------+          +------------------+
| id (PK, UUID)    |1        N| id (PK, UUID)    |N        1| id (PK, UUID)    |
| username         +----------+ userId (FK)      |          | title            |
| email            |          | imageId (FK)     +----------+ url              |
| password         |          | text             |          | description      |
| refreshToken     |          | createdAt        |          | createdAt        |
| createdAt        |          | updatedAt        |          | updatedAt        |
| updatedAt        |          +------------------+          +------------------+
+------------------+                    |
         |                              | 1
         | 1                            |
         |                              N
         |                    +------------------+
         +------------------->|      Votes       |
                              +------------------+
                              | id (PK, UUID)    |
                              | userId (FK)      |
                              | captionId (FK)   |
                              | createdAt        |
                              +------------------+
```

## 5. Functional Requirements & Endpoints

### 5.1. Authentication Routes
* `POST /api/auth/register` - Registers a new user. Hashes password using bcrypt.
* `POST /api/auth/login` - Authenticates user credentials and issues JWT tokens.
* `POST /api/auth/logout` - Clears session cookies.
* `POST /api/auth/refresh` - Issues a new access token using a refresh token.
* `GET /api/auth/me` - Returns the authenticated user profile.

### 5.2. Image & Caption Routes
* `GET /api/images` - Retrieves all hosted images (read-through cache via `node-cache`).
* `GET /api/images/:id` - Retrieves a single image with paginated captions and author usernames.
* `POST /api/images/:id/captions` - Submits a caption for an image. **(Requires Auth Middleware)**

### 5.3. Voting Routes
* `POST /api/captions/:id/votes` - Vote for a caption. **(Requires Auth Middleware)**
* `DELETE /api/captions/:id/votes` - Remove vote. **(Requires Auth Middleware)**

## 6. Non-Functional Requirements
* **Security:** Passwords must never be stored in plain text. Caption and vote routes must block unauthorized requests with `401 Unauthorized`.
* **Performance:** Image listings must check `node-cache` prior to executing PostgreSQL queries. Cache invalidation must occur when captions or votes change.
* **Robustness:** Graceful error handling using centralized Express error middleware returning clean JSON payloads.
* **Transactions:** Caption submission and voting use Sequelize transactions for atomic writes.

## 7. Deployment Plan
* **Database:** Provision a PostgreSQL instance on Render.
* **Environment Variables:** Secure `.env` with production database URIs and JWT secrets.
* **Build Commands:** Run migrations during build (`npm install && npm run db:migrate`), then start the server (`npm start`).
