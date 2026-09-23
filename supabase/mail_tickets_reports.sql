-- Email verification, tickets messages, reports
-- Run in Supabase SQL Editor (safe to re-run)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ticket_messages" (
  "id" TEXT PRIMARY KEY,
  "ticketId" TEXT NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "authorName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

CREATE TABLE IF NOT EXISTS "reports" (
  "id" TEXT PRIMARY KEY,
  "entityId" TEXT REFERENCES "entities"("id") ON DELETE SET NULL,
  "reason" TEXT NOT NULL,
  "title" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "reports_entityId_idx" ON "reports"("entityId");

-- Ensure tickets table exists (from earlier schema)
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

ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" DISABLE ROW LEVEL SECURITY;
