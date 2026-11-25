
## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run dev

# production mode
$ npm run dev
```

## Test

```bash
# unit tests
$ npm run test
$ npm run test:coverage
```

## Database schema for branch visualizations

The branch visualization endpoints require the `tdd_repository`, `tdd_branch`,
`tdd_commit`, `tdd_execution`, and `tdd_merge` tables. Apply
`database/migrations/001_tdd_branch_visualization.sql` to the PostgreSQL
database configured by the server's `BRANCH_DATABASE_URL` or `PG*` environment
variables before using those endpoints. In Neon, run the migration from the SQL
Editor for the project and database used by the server.

`DBBranchRepository` uses `BRANCH_DATABASE_URL` when it is set; otherwise, it
uses the `PG*` variables. The other repositories continue using `PG*`.

The migration creates the tables and indexes but does not insert historical
repositories, branches, commits, or executions. Existing branch data must be
sent through the branch-save endpoint after the schema is installed.

If the Neon SQL Editor shows these tables but the server reports
`relation "tdd_repository" does not exist`, verify that the server's `PGHOST`,
`PGDATABASE`, and `PGUSER` point to the same Neon project, database, and branch.
