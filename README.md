# customer-api

Secure Node.js + Express REST API with PIN-based authentication and JWT sessions.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the template
cp .env.example .env

# 3. Edit .env — at minimum set a strong JWT_SECRET
#    Generate one: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Start the server (seeds the DB on first run)
npm start
```

The server starts on `http://localhost:3000` by default.

## Seed customers

| customerId | PIN  | name         | email              |
|------------|------|--------------|--------------------|
| 1001       | 1234 | Alice Nguyen | alice@example.com  |
| 1002       | 5678 | Bob Martinez | bob@example.com    |
| 1003       | 9999 | Carol Smith  | carol@example.com  |

## Endpoints

### `POST /auth/login`

Authenticate with a `customerId` and `pin` (both must be integers).  
Returns a signed JWT valid for 15 minutes.

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"customerId": 1001, "pin": 1234}'
```

Response:
```json
{ "token": "<jwt>" }
```

### `GET /customers/me`

Returns the authenticated customer's profile. Requires the JWT from login.

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"customerId": 1001, "pin": 1234}' | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

curl -s http://localhost:3000/customers/me \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "customerId": 1001,
  "name": "Alice Nguyen",
  "email": "alice@example.com",
  "created_at": "2024-01-01 00:00:00"
}
```

### `DELETE /customers/me`

Permanently deletes the authenticated customer's account. Requires the JWT from login.

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/customers/me \
  -H "Authorization: Bearer $TOKEN"
```

Returns `204 No Content` on success. The JWT remains cryptographically valid until it expires, but any subsequent request to a protected endpoint will return `404` as the account no longer exists.

## Error responses

| Scenario | Status |
|---|---|
| Wrong credentials | `401 { "error": "Invalid credentials" }` |
| Missing / invalid JWT | `401 { "error": "Unauthorized" }` |
| Non-integer input | `400 { "error": "customerId and pin must be integers" }` |
| > 5 login attempts/min | `429 { "error": "Too many login attempts..." }` |

## Development

```bash
npm run dev   # nodemon — auto-restarts on file changes
```

## Security notes

- PINs are hashed with bcrypt (cost factor 12) and never stored or returned in plaintext.
- JWT secret is loaded from `.env` — the server refuses to start without it.
- Login endpoint is rate-limited to 5 requests per minute per IP.
- Helmet sets secure HTTP headers on every response.
- Both "user not found" and "wrong PIN" return the same `401` to prevent user enumeration.
