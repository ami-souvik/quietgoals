# Quiet Goals Web

A single-list, keyboard-first, unapologetically minimal goals app built with Next.js 16 App Router, Tailwind CSS v4, Framer Motion, and Turso (libSQL) using Drizzle ORM.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router + Server Actions)
- **Styling:** Tailwind CSS v4
- **Motion:** Framer Motion (spring-based physics, zero layout shifts)
- **Database:** Turso (libSQL / SQLite) via `@libsql/client`
- **ORM:** Drizzle ORM & Drizzle Kit
- **Auth:** Auth.js v5 (NextAuth) with Google, and local dev fallback
- **Validation:** Zod v4 (strict input validation on all mutations)
- **Testing:** Native Node.js test runner (`tsx --test`) for unit tests & Playwright for E2E happy-path

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> quiet-goals-web
cd quiet-goals-web
npm install
```

### 2. Configure Local Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

By default, the application runs immediately out of the box using a local SQLite file (`file:local.db`). In local development, if OAuth credentials are not provided, a local mock provider is enabled automatically so you can test sign-in immediately.

### 3. Initialize Local Database

Run migrations to set up the tables (`users`, `goals`, `api_tokens`):

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `TURSO_DATABASE_URL` | **Yes** | Database URL (`file:` for local SQLite, or `libsql://` for Turso cloud) | `file:local.db`<br>`libsql://quiet-goals-prod-[org].turso.io` |
| `TURSO_AUTH_TOKEN` | Prod | Authentication token for remote Turso database | `eyJhbGciOi...` |
| `AUTH_SECRET` | **Yes** | Secret used to sign session cookies and JWT tokens | Generate via `openssl rand -base64 32` |
| `AUTH_URL` | Prod | Canonical base URL of the deployed application | `https://quietgoals.com` or `https://app.example.com` |
| `AUTH_TRUST_HOST` | Prod | Set to `true` when deployed behind Vercel or reverse proxies | `true` |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth 2.0 Client ID | `xxx.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth 2.0 Client Secret | `GOCSPX-...` |

---

## 🗄 Database Strategy: Dev & Production

### 1. Separate Turso Databases

Never share the same database instance between environments. Create two isolated Turso databases:

```bash
# 1. Dev Database (for staging / cloud dev)
turso db create quiet-goals-dev

# 2. Production Database (for live production users)
turso db create quiet-goals-prod
```

Retrieve credentials:

```bash
# Production credentials
turso db show quiet-goals-prod --url
turso db tokens create quiet-goals-prod
```

### 2. Production Migration Step

> **Important Architecture Rule:** Migrations must **never** run on serverless cold starts. Running migrations in serverless functions causes connection exhaustion, race conditions across concurrent lambdas, and introduces multi-second cold-start latency.

#### Option A: Manual CLI Migration (Recommended before deployment)

To apply pending migrations to production from your terminal:

```bash
TURSO_DATABASE_URL="libsql://quiet-goals-prod-[org].turso.io" \
TURSO_AUTH_TOKEN="your-prod-token" \
npm run db:migrate
```

#### Option B: Automated CI Step (GitHub Actions)

In your CI/CD pipeline, run `npm run db:migrate` as an isolated pre-deploy step before triggering the Vercel production deployment:

```yaml
- name: Run Production Database Migrations
  env:
    TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL_PROD }}
    TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN_PROD }}
  run: npm run db:migrate
```

---

## 🛡 Security Review & Verification

1. **User Scoping:** Every single Server Action (`createGoal`, `updateGoal`, `moveGoal`, `archiveGoal`, `restoreGoal`, `deleteGoalForever`, `generateAgentToken`, `revokeAgentToken`) calls `requireUser()` and scopes all SQL queries with `where(eq(table.userId, user.id))`. No user can read or mutate another user's goals.
2. **Input Validation:** Every mutation validates input parameters using strict Zod schemas with character limits (title: 1–200 characters, UUID format checks, and strict enum checking for priority and status).
3. **Security Headers in `next.config.ts`:**
   - `Content-Security-Policy`: Restricts scripts, objects, frame ancestors, and connects.
   - `X-Frame-Options: DENY`: Prevents clickjacking attacks.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
   - `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables unused hardware APIs.
4. **Client Bundles:** Secrets are only accessed in server-side files (`src/lib/db.ts`, `src/lib/auth.ts`). No sensitive variables are prefixed with `NEXT_PUBLIC_`.
5. **Agent API & MCP Server:** Personal API tokens are hashed with SHA-256 before database insertion; raw tokens are shown once and never stored. All requests to `/api/mcp` are rate-limited to 60 req/min per user.

---

## 🩺 Health Check Endpoint

A lightweight health endpoint is available at `/api/health`:

- **Path:** `GET /api/health`
- **Auth:** Public (bypasses auth middleware for external uptime monitors like Datadog, BetterStack, or Pingdom)
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-30T14:58:34.719Z",
    "database": "connected"
  }
  ```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Unit Tests
Tests the optimistic state reducer and fractional-indexing ordering invariants:

```bash
npm run test:unit
```

### E2E Happy-Path Test
Playwright test testing the complete user journey (sign-in mocked $\rightarrow$ create $\rightarrow$ edit $\rightarrow$ reorder $\rightarrow$ complete $\rightarrow$ restore):

```bash
npm run test:e2e
```

---

## 📋 Go-Live Checklist

Before pointing production traffic to your Vercel deployment:

- [ ] **1. Create Production Turso DB**:
  - Run `turso db create quiet-goals-prod`.
  - Save the database URL and generate a long-lived auth token (`turso db tokens create quiet-goals-prod`).
- [ ] **2. Apply Database Migrations**:
  - Run `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate`.
  - Confirm tables (`users`, `goals`, `api_tokens`) exist and migrations table is updated.
- [ ] **3. Configure Vercel Project Environment Variables**:
  - `TURSO_DATABASE_URL` = `libsql://quiet-goals-prod-[org].turso.io`
  - `TURSO_AUTH_TOKEN` = `your-turso-token`
  - `AUTH_SECRET` = `openssl rand -base64 32`
  - `AUTH_URL` = `https://your-domain.com` (or preview URL)
  - `AUTH_TRUST_HOST` = `true`
  - `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`
- [ ] **4. Configure OAuth Provider Callback URLs**:
  - **Google Cloud Console:**
    - Authorized Redirect URI: `https://your-domain.com/api/auth/callback/google`
- [ ] **5. Set Custom Domain**:
  - In Vercel Project Settings $\rightarrow$ Domains, add your domain (e.g. `quietgoals.com`).
  - Configure DNS CNAME / A records as prompted.
- [ ] **6. Validate Production Deployment**:
  - Check `/api/health` returns HTTP 200 with `{"status": "ok"}`.
  - Sign in with Google.
  - Create a goal, edit, reorder, complete, and restore.
