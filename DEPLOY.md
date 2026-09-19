# Deployment Guide

## Recommended stack

| Service     | Recommendation              | Free tier? |
|-------------|-----------------------------|------------|
| Hosting     | **Vercel**                  | Yes        |
| Database    | **Neon** or **Supabase**    | Yes        |
| Auth secret | Generate locally            | —          |

---

## 1. Database (Neon – recommended)

1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the connection string (it looks like `postgresql://user:pass@host/db?sslmode=require`).
3. Keep it ready for the next step.

Alternative: [Supabase](https://supabase.com) → Project Settings → Database → Connection string (URI).

---

## 2. Deploy to Vercel

### Option A – Vercel Dashboard (easiest)

1. Push this repo to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the `telegram-directory` repository.
4. Add Environment Variables:

| Name              | Value                                      |
|-------------------|--------------------------------------------|
| `DATABASE_URL`    | Your Neon/Supabase connection string       |
| `NEXTAUTH_URL`    | `https://your-app.vercel.app` (update after first deploy) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally      |
| `ADMIN_EMAIL`     | Your admin email                           |
| `ADMIN_PASSWORD`  | A strong password                          |

5. Click **Deploy**.

6. After deploy, update `NEXTAUTH_URL` to the real production URL and redeploy.

### Option B – Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # follow prompts
vercel env add DATABASE_URL
# ... add the other env vars
vercel --prod
```

---

## 3. Run database migrations on production

After the first deploy, the database is empty. Run:

```bash
# Locally, pointing at the production DATABASE_URL
DATABASE_URL="your-production-url" npx prisma db push
DATABASE_URL="your-production-url" npm run db:seed
```

Or add a Vercel build command that includes `prisma db push` (not ideal for production long-term — prefer migrations).

Better long-term approach:

```bash
npx prisma migrate dev --name init   # creates migration files
# then on Vercel set build command to:
# prisma migrate deploy && next build
```

---

## 4. Post-deploy checklist

- [ ] Visit `/admin/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Run seed so categories appear
- [ ] Submit a test group and approve it
- [ ] Confirm search and category pages work
- [ ] (Optional) Add TGStat token under Admin → Integrations

---

## 5. Custom domain (optional)

In Vercel → Project → Settings → Domains → add your domain and follow the DNS instructions.

---

## Notes

- The free Neon tier is excellent for this project size.
- Vercel free tier is more than enough for the MVP.
- Never commit `.env` — it is already in `.gitignore`.
- Rotate `ADMIN_PASSWORD` and `NEXTAUTH_SECRET` if they were ever shared.
