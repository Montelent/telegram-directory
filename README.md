# Telegram Directory

A modern, searchable directory for public Telegram groups and channels.

Built with **Next.js 15**, TypeScript, Tailwind CSS, Prisma, and an admin panel for managing data, categories, submissions, and API integrations.

> **Important**: It is not possible to automatically index *all* public Telegram groups. This project focuses on high-quality discovery, categorization, user submissions, and optional enrichment via third-party APIs (e.g. TGStat) + future crawlers.

## Features (MVP)

### Public
- Search groups & channels by keyword
- Browse by category, language, country
- Detail pages with member count, description, join link
- Submit a group/channel (moderated)
- Clean, fast, SEO-friendly UI

### Admin Panel (`/admin`)
- Dashboard with stats
- Manage groups / channels (CRUD, approve/reject submissions)
- Manage categories
- Manage API keys & external integrations (TGStat, etc.)
- View submission queue
- Basic job logs / refresh status

## Tech Stack

| Layer              | Choice                          |
|--------------------|---------------------------------|
| Framework          | Next.js 15 (App Router)         |
| Language           | TypeScript                      |
| Styling            | Tailwind CSS + shadcn/ui        |
| Database           | PostgreSQL + Prisma ORM         |
| Auth (Admin)       | NextAuth.js (Credentials / GitHub) |
| Deployment         | Vercel (recommended)            |
| Future crawler     | Python + Telethon (separate worker) |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Montelent/telegram-directory.git
cd telegram-directory
```

### 2. Install dependencies

```bash
npm install
# or pnpm install / yarn
```

### 3. Environment variables

Copy the example and fill in values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` – PostgreSQL connection string (use Neon, Supabase, or local)
- `NEXTAUTH_SECRET` – generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` – `http://localhost:3000` for local
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – for credentials login (or configure GitHub OAuth)

Optional:
- `TGSTAT_TOKEN` – if you want to use TGStat API later

### 4. Database setup

```bash
npx prisma generate
npx prisma db push          # or migrate dev
npx prisma db seed          # (when seed is ready)
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

```
telegram-directory/
├── app/
│   ├── (public)/           # Public pages (search, categories, detail)
│   ├── admin/              # Protected admin routes
│   ├── api/                # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # shadcn components
│   ├── groups/
│   └── admin/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
└── ...
```

## Data Model (high level)

- **Group / Channel**: username, title, description, memberCount, type (group/channel), category, language, country, status (pending/approved/rejected), lastChecked, etc.
- **Category**: name, slug, description, icon
- **Submission**: user-submitted groups awaiting moderation
- **ApiKey / Integration**: for external services

## Roadmap

- [x] Project scaffold + admin structure
- [ ] Public search & browse UI
- [ ] Submission form + moderation
- [ ] Admin CRUD for groups & categories
- [ ] TGStat integration (optional enrichment)
- [ ] Background refresh jobs
- [ ] Telethon crawler worker (separate service)
- [ ] Full-text search (Meilisearch / Typesense later)

## Contributing

This is currently a personal/starter project. Feel free to open issues or PRs.

## License

MIT
