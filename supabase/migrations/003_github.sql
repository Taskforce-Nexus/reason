-- Add github_repo field to projects
alter table public.projects
  add column if not exists github_repo text;
