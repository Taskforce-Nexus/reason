-- Migration 004: user_integrations — stores OAuth tokens per user/provider

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,         -- 'github'
  access_token text NOT NULL,
  github_login text,              -- GitHub username, set for provider='github'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_integrations"
  ON public.user_integrations
  FOR ALL
  USING (user_id = auth.uid());
