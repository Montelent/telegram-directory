# Telegram Directory

A modern, searchable directory for public Telegram groups and channels.

Built with **Next.js 15**, TypeScript, Tailwind CSS, Prisma, and an admin panel for managing data, categories, submissions, and API integrations.

> **Important**: It is not possible to automatically index *all* public Telegram groups. This project focuses on high-quality discovery, categorization, user submissions, and optional enrichment via third-party APIs (e.g. TGStat) + future crawlers.

## Features

### Public
- Search groups & channels by keyword
- Browse by category (dedicated category pages)
- Detail links to Telegram
- Submit a group/channel (moderated)
- Clean, responsive UI with mobile navigation

### Admin Panel (`/admin`)
- Dashboard with live stats
- Manage groups / channels (CRUD, approve/reject/archive)
- Full Categories CRUD
- Submission queue with one-click approve/reject
- API Integrations (TGStat token storage – placeholder for future sync)

## Tech Stack

| Layer              | Choice                          |
|--------------------|---------------------------------|
| Framework          | Next.js 15 (App Router)         |
| Language           | TypeScript                      |
| Styling            | Tailwind CSS                    |
| Database           | PostgreSQL + Prisma ORM         |
| Auth (Admin)       | NextAuth.js (Credentials)       |
| Deployment         | Vercel + Neon/Supabase          |

## Getting Started

```bash
git clone https://github.com/Montelent/telegram-directory.git
cd telegram-directory
npm install

cp .env.example .env
# Edit .env → DATABASE_URL, NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npx prisma generate
npx prisma db push
npm run db:seed

npm run dev
```

- Public site → http://localhost:3000  
- Admin → http://localhost:3000/admin  

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for a complete Vercel + Neon/Supabase guide.

## Project Structure

```
app/
  (public pages)
  admin/           # Protected admin routes
  api/             # API routes
  category/[slug]/ # Public category pages
components/        # Navbar, LoadingSpinner, etc.
lib/               # prisma, auth, utils
prisma/            # schema + seed
```

## Roadmap

- [x] Core directory + admin
- [x] Submissions + moderation
- [x] Search, categories, homepage
- [x] TGStat integration placeholder
- [ ] Real TGStat sync jobs
- [ ] Telethon crawler worker
- [ ] Full-text search (Meilisearch / Typesense)

## License

MIT
