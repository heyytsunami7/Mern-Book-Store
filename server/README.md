# Mern-Book-Store API

Express API for the Mern-Book-Store project. MongoDB (native driver), Firebase Auth,
Zod validation.

## Scripts

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the API with nodemon (needs `.env`)           |
| `npm start`          | Start the API with node                             |
| `npm test`           | Run the Vitest suite (uses an in-memory MongoDB)    |
| `npm run lint`       | ESLint                                              |
| `npm run format`     | Prettier                                            |
| `npm run dev:legacy` | Run the old single-file server (removed in Phase 3) |

## Environment

Copy `.env.example` to `.env` and fill it in. Use a dev database name (ending in
`_dev`) locally.

| Variable                                 | Notes                                        |
| ---------------------------------------- | -------------------------------------------- |
| `MONGODB_URI`, `DB_NAME`                 | Required                                     |
| `PORT`                                   | Defaults to 3001                             |
| `CORS_ORIGINS`                           | Comma-separated allowed origins              |
| `FIREBASE_SERVICE_ACCOUNT_KEY`           | Service account JSON on one line             |
| `ADMIN_EMAILS`                           | Comma-separated. Empty means nobody is admin |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Test-mode keys, used from Phase 7            |

## Structure

- `src/app.js`: `createApp()`, builds the app from injected dependencies (no port, no DB)
- `src/bootstrap.js`: wires the real config, database and Firebase
- `server.js`: local entry. `index.js`: Vercel entry
- `src/middleware/`: auth, validate, rate limits, error handling
- `src/routes/`: route modules. `src/services/`: business logic and integrations
- `tests/`: Vitest + Supertest

## Errors

Every error uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "path": "category", "message": "Invalid option" }]
  }
}
```

## Admin rule

A user is an admin only if their email is verified and listed in `ADMIN_EMAILS`.
If the list is empty, nobody is an admin.
