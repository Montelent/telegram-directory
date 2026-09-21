-- ============================================================
-- Telegram Directory — FULL database migration (Supabase)
-- Run once in: Supabase → SQL Editor → New query → Run
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "EntityType" AS ENUM ('GROUP', 'CHANNEL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EntityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Categories
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Entities (channels / groups)
CREATE TABLE IF NOT EXISTS "entities" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "shortDesc" TEXT,
  "longDesc" TEXT,
  "tags" TEXT,
  "type" "EntityType" NOT NULL,
  "status" "EntityStatus" NOT NULL DEFAULT 'PENDING',
  "memberCount" INTEGER,
  "language" TEXT,
  "country" TEXT,
  "inviteLink" TEXT,
  "photoUrl" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isScam" BOOLEAN NOT NULL DEFAULT false,
  "isNsfw" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "featuredUntil" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "source" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT REFERENCES "categories"("id")
);

ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "shortDesc" TEXT;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "longDesc" TEXT;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "isNsfw" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "entities" ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "entities_status_idx" ON "entities"("status");
CREATE INDEX IF NOT EXISTS "entities_type_idx" ON "entities"("type");
CREATE INDEX IF NOT EXISTS "entities_categoryId_idx" ON "entities"("categoryId");
CREATE INDEX IF NOT EXISTS "entities_isFeatured_idx" ON "entities"("isFeatured");

-- Users
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "password" TEXT NOT NULL,
  "balanceCents" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Submissions
CREATE TABLE IF NOT EXISTS "submissions" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "shortDesc" TEXT,
  "longDesc" TEXT,
  "tags" TEXT,
  "language" TEXT,
  "country" TEXT,
  "isNsfw" BOOLEAN NOT NULL DEFAULT false,
  "wantFeature" BOOLEAN NOT NULL DEFAULT false,
  "type" "EntityType" NOT NULL,
  "status" "EntityStatus" NOT NULL DEFAULT 'PENDING',
  "submittedBy" TEXT,
  "userId" TEXT REFERENCES "users"("id"),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "entityId" TEXT REFERENCES "entities"("id")
);
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "shortDesc" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "longDesc" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "isNsfw" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "wantFeature" BOOLEAN NOT NULL DEFAULT false;

-- User media
CREATE TABLE IF NOT EXISTS "user_media" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "username" TEXT NOT NULL,
  "type" "EntityType" NOT NULL DEFAULT 'CHANNEL',
  "status" "EntityStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "entityId" TEXT REFERENCES "entities"("id")
);
CREATE INDEX IF NOT EXISTS "user_media_userId_idx" ON "user_media"("userId");

-- Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT PRIMARY KEY,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "entityId" TEXT NOT NULL REFERENCES "entities"("id") ON DELETE CASCADE,
  UNIQUE ("userId", "entityId")
);
CREATE INDEX IF NOT EXISTS "reviews_entityId_idx" ON "reviews"("entityId");

-- Blog
CREATE TABLE IF NOT EXISTS "blog_categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImage" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoJsonLd" TEXT,
  "focusKeyword" TEXT,
  "canonicalUrl" TEXT,
  "robots" TEXT DEFAULT 'index,follow',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT REFERENCES "blog_categories"("id")
);
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "robots" TEXT DEFAULT 'index,follow';
CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts"("published");

-- Tickets
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" TEXT PRIMARY KEY,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT REFERENCES "users"("id")
);

-- Deposits (payment history)
CREATE TABLE IF NOT EXISTS "deposits" (
  "id" TEXT PRIMARY KEY,
  "amountCents" INTEGER NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reference" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "deposits_userId_idx" ON "deposits"("userId");

-- Site settings (ads, scripts, SEO, payments keys)
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin users
CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "password" TEXT,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API integrations
CREATE TABLE IF NOT EXISTS "api_integrations" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS for app-managed tables (app uses service role / Prisma)
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "entities" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_media" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "deposits" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "api_integrations" DISABLE ROW LEVEL SECURITY;

-- Optional seed category
INSERT INTO "categories" ("id", "name", "slug", "description", "icon", "createdAt", "updatedAt")
VALUES (
  'seed_cat_other',
  'Other',
  'other',
  'Uncategorized',
  '📁',
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- Test approved entity (for detail page checks)
INSERT INTO "entities" (
  "id", "username", "title", "description", "type", "status",
  "memberCount", "language", "createdAt", "updatedAt", "categoryId"
) VALUES (
  'testchannel001',
  'testchannel001',
  'Test Channel',
  'Sample approved channel for testing detail pages.',
  'CHANNEL',
  'APPROVED',
  1000,
  'English',
  NOW(),
  NOW(),
  'seed_cat_other'
) ON CONFLICT ("username") DO NOTHING;
