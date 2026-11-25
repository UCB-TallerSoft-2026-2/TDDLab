import dotenv from "dotenv"; // Import 'dotenv' as a module
dotenv.config();

const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const { BRANCH_DATABASE_URL } = process.env;

// DB CONFIG
const config = {
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: Number(PGPORT),
  ssl: {
    rejectUnauthorized: false,
  },
};

export const branchDatabaseConfig = BRANCH_DATABASE_URL
  ? {
      connectionString: BRANCH_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : config;

export default config;
