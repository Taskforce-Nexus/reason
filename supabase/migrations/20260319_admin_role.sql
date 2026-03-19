-- Story 7.1 — Admin role on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Grant admin to founders
UPDATE profiles SET role = 'admin' WHERE email IN ('juan@taskforce.fyi', 'porfirio@taskforce.fyi');
