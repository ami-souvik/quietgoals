# Quiet Goals Web

A Next.js 16 application styled with Tailwind CSS v4, connected to [Turso](https://turso.tech/) (libSQL) using [Drizzle ORM](https://orm.drizzle.team/).

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** [Turso](https://turso.tech/) (libSQL / SQLite)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- **Language:** TypeScript

---

## 🚀 Getting Started

### 1. Environment Configuration

By default, the project works immediately out of the box using a local SQLite database (`file:local.db`).

To connect to a remote Turso cloud database:

1. Install the Turso CLI (if not already installed):
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   ```

2. Create a new database:
   ```bash
   turso db create quiet-goals-db
   ```

3. Retrieve your database URL and authentication token:
   ```bash
   turso db show quiet-goals-db --url
   turso db tokens create quiet-goals-db
   ```

4. Configure `.env.local`:
   ```env
   TURSO_DATABASE_URL=libsql://quiet-goals-db-[your-org].turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ```

---

## 💾 Database Scripts (Drizzle ORM)

| Command | Description |
| :--- | :--- |
| `npm run db:push` | Directly synchronize your TypeScript schema (`src/db/schema.ts`) to Turso / SQLite |
| `npm run db:generate` | Generate SQL migration files in the `drizzle/` directory |
| `npm run db:migrate` | Execute pending migrations |
| `npm run db:studio` | Launch Drizzle Studio GUI in your browser |

---

## 💻 Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── drizzle.config.ts        # Drizzle configuration for Turso
├── src/
│   ├── app/
│   │   ├── actions.ts       # Next.js Server Actions for database mutations
│   │   ├── globals.css      # Tailwind v4 configuration
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Dashboard with live Turso database queries
│   ├── components/
│   │   ├── GoalForm.tsx     # Form for adding goals via Server Action
│   │   └── GoalItem.tsx     # Goal item with status toggle
│   └── db/
│       ├── index.ts         # Turso libSQL client & Drizzle ORM instance
│       └── schema.ts        # Database schema definitions
└── .env.example             # Example environment variables
```
