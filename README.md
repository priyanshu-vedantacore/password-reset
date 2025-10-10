# Backend Developer Guide

This document explains the backend architecture, setup, conventions, and APIs to help developers onboard quickly and contribute confidently.

## Overview

- Stack: Node.js (ES modules), Express 5, MongoDB (Mongoose)
- Auth: JWT access + refresh tokens, password hashing (bcrypt)
- Validation: Joi via `validate` middleware
- Security: Helmet, CORS, rate limiting, JSON body size limits
- Email: Nodemailer (Gmail by default, configurable)
- Logging: Lightweight console logger with levels

## Project Structure

```
backend/
├─ src/
│  ├─ app.js                 # Express app bootstrap (middlewares, routes)
│  ├─ server.js              # HTTP server entrypoint
│  ├─ config/
│  │  ├─ db.js              # Mongoose connection
│  │  ├─ env.js             # Env var validation
│  │  └─ logger.js          # Minimal logger
│  ├─ controllers/
│  │  └─ auth.controller.js # Request handlers for auth
│  ├─ middleware/
│  │  ├─ auth.middleware.js # `protect` JWT auth guard
│  │  ├─ error.middleware.js# Centralized error handler
│  │  └─ validate.middleware.js # Joi validator
│  ├─ models/
│  │  └─ user.model.js      # User schema & methods
│  ├─ routes/
│  │  └─ auth.routes.js     # Auth router & validation wiring
│  ├─ services/
│  │  └─ auth.service.js    # Domain logic (register)
│  ├─ utils/
│  │  ├─ apiResponse.js     # (reserved – currently unused)
│  │  ├─ generateTokens.js  # Access/refresh token helpers
│  │  └─ sendEmail.js       # Nodemailer sender
│  └─ validations/
│     └─ auth.validation.js # Joi schemas for inputs
├─ .env                      # Environment variables (local only, not committed)
├─ .env.example              # Template for environment variables
├─ package.json              # Dependencies and scripts
└─ package-lock.json
```

## Runtime Flow

- Request → `routes/*` → `validate(schema)` → `controllers/*` → `services/*` → `models/*`
- Errors bubble to `errorHandler` for consistent JSON responses and logging.
- DB connection is established on app bootstrap via `connectDB()`.

## Environment

Required variables (validated in `src/config/env.js`):
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – JWT secret for access tokens
- `JWT_REFRESH_SECRET` – JWT secret for refresh tokens

Recommended/optional:
- `PORT` – Server port (default 5000)
- `NODE_ENV` – `development` | `production`
- `CORS_ORIGIN` – Comma-separated origins (default `*`)
- `SMTP_EMAIL`, `SMTP_PASSWORD` – Email credentials for Nodemailer
- `FRONTEND_URL` – Used to build password reset links

See `backend/.env.example` for a template.

## Getting Started

- Prerequisites: Node 18+, MongoDB instance (local or cloud)
- Install deps: `npm install`
- Create `.env` from `.env.example` and fill values
- Run dev server: `npm run dev`
- Server listens on `http://localhost:<PORT|5000>`

## Security

- `helmet` hardens HTTP headers
- `cors` configured via `CORS_ORIGIN`
- Rate limiting applied to `/api/auth` routes
- JSON body size limited to 10kb
- Passwords hashed with `bcrypt`
- Password reset tokens stored hashed (SHA-256) and expire in 15 minutes

## Authentication

- Access token: 15 minutes (`JWT_SECRET`)
- Refresh token: 7 days (`JWT_REFRESH_SECRET`)
- `protect` middleware (`src/middleware/auth.middleware.js`) verifies `Authorization: Bearer <token>` and attaches `req.user.id`

Token generation: `src/utils/generateTokens.js`

## API Endpoints

Base URL: `/api/auth`

- POST `/register`
  - Body: `{ name, email, password }`
  - 201: `{ message, user: { id, email, name }, tokens: { accessToken, refreshToken } }`
  - 409: `Email already registered`

- POST `/login`
  - Body: `{ email, password }`
  - 200: `{ message, user: { id, name, email }, tokens }`
  - 400/401: Validation or invalid credentials

- POST `/forgot-password`
  - Body: `{ email }`
  - 200: `Reset email sent` (sends link to `${FRONTEND_URL}/reset-password/<token>`)
  - 404: No user with email

- POST `/reset-password/:token`
  - Body: `{ password }`
  - 200: `Password reset successful`
  - 400: Invalid or expired token

Example (register):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

## Controllers & Services

- Controller: `auth.controller.js` – HTTP concerns, response shaping, error forwarding
- Service: `auth.service.js` – Business logic (e.g., unique email check, user creation, token issuance)

## Model

`User` (`src/models/user.model.js`):
- Fields: `name`, `email` (unique), `password` (min 6, `select: false`), `resetPasswordToken`, `resetPasswordExpire`
- Hooks: `pre('save')` to hash password
- Methods: `matchPassword(entered)`, `generatePasswordResetToken()`

## Validation

`Joi` schemas in `src/validations/auth.validation.js` used via `validate` middleware to return 400 on invalid payloads.

## Error Handling & Logging

- `errorHandler` middleware logs errors and returns JSON: `{ success: false, message }`
- `logger` provides `info`, `warn`, `error`, `debug` with timestamped formatting

## Email

- `sendEmail` uses Nodemailer Gmail transport by default
- Configure `SMTP_EMAIL`, `SMTP_PASSWORD`
- Consider switching to a provider (e.g., Resend, SendGrid) for production and using OAuth2/App Passwords

## Conventions

- ES modules with `.js` extensions and `import`/`export`
- Keep controllers thin; put domain logic in services
- Validate inputs at route boundary
- Never expose sensitive fields (`password`) in responses

## Known Notes

- `src/utils/apiResponse.js` is currently unused; consider removing or implementing a shared response helper.

## Future Improvements

- Refresh token rotation & revocation list (persist refresh tokens)
- Add `/token/refresh` endpoint and logout flow
- Email templating + branded HTML emails
- Centralized rate limiting strategy per route group
- Add request logging middleware (`morgan` or pino-http)
- Unit/integration tests (controllers, services, model hooks)

## Scripts

- `npm run dev` – Starts dev server with nodemon and dotenv loaded

## License

Project is provided as-is; add a license file if needed.

