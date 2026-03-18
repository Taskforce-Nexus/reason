-- ============================================================
-- Stripe integration fields — Story 5.0
-- Run in Supabase SQL Editor
-- ============================================================

-- NOTE: profiles.stripe_customer_id already exists (verified 2026-03-17)
-- NOTE: subscriptions.stripe_subscription_id and stripe_customer_id already exist
-- Only migration needed: create token_usages table

-- ── token_usages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_usages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  activity     text NOT NULL,          -- compose | session_question | generate_specialist | etc.
  tokens_used  integer NOT NULL DEFAULT 0,
  cost_usd     numeric(10, 4) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_usages_user_id_idx ON token_usages(user_id);
CREATE INDEX IF NOT EXISTS token_usages_project_id_idx ON token_usages(project_id);

-- Enable RLS
ALTER TABLE token_usages ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage
CREATE POLICY "Users can read own token_usages"
  ON token_usages FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts (from /api/stripe/usage)
CREATE POLICY "Service role can insert token_usages"
  ON token_usages FOR INSERT
  WITH CHECK (true);

-- ── Initial token balance for existing users ──────────────────
-- Give $5 credit to any user without a balance
INSERT INTO token_balances (user_id, balance_usd)
SELECT id, 5.00 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
