CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.tdd_repository (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repos_name varchar(255) NOT NULL,
  repo_url varchar(255) NOT NULL UNIQUE,
  owner varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tdd_branch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  fork_commit_sha text,
  created_at date,
  repo_id uuid REFERENCES public.tdd_repository (id)
);

CREATE TABLE IF NOT EXISTS public.tdd_commit (
  sha text PRIMARY KEY,
  parent_sha text,
  branch_id uuid REFERENCES public.tdd_branch (id),
  author text,
  message text,
  committed_at text
);

CREATE TABLE IF NOT EXISTS public.tdd_execution (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commit_sha text REFERENCES public.tdd_commit (sha),
  tests_total integer DEFAULT 0,
  tests_passed integer DEFAULT 0,
  tests_failed integer DEFAULT 0,
  executed_at date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tdd_merge (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_branch_id uuid NOT NULL REFERENCES public.tdd_branch (id),
  target_branch_id uuid NOT NULL REFERENCES public.tdd_branch (id),
  source_commit_sha text NOT NULL REFERENCES public.tdd_commit (sha),
  merge_commit_sha text NOT NULL REFERENCES public.tdd_commit (sha),
  is_fast_forward integer NOT NULL DEFAULT 0,
  merged_at date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tdd_schema_migration (
  version integer PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_tdd_execution_commit_sha
  ON public.tdd_execution (commit_sha);
CREATE INDEX IF NOT EXISTS idx_tdd_execution_executed_at
  ON public.tdd_execution (executed_at);

GRANT ALL PRIVILEGES ON TABLE
  public.tdd_repository,
  public.tdd_branch,
  public.tdd_commit,
  public.tdd_execution,
  public.tdd_merge,
  public.tdd_schema_migration
TO neondb_owner WITH GRANT OPTION;
