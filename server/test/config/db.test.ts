describe("branch database configuration", () => {
  const originalBranchDatabaseUrl = process.env.BRANCH_DATABASE_URL;

  afterEach(() => {
    if (originalBranchDatabaseUrl === undefined) {
      delete process.env.BRANCH_DATABASE_URL;
    } else {
      process.env.BRANCH_DATABASE_URL = originalBranchDatabaseUrl;
    }
    jest.resetModules();
  });

  it("uses BRANCH_DATABASE_URL for the branch repository connection", () => {
    const connectionString = "postgresql://test:test@localhost:5432/neondb";
    process.env.BRANCH_DATABASE_URL = connectionString;
    jest.resetModules();

    const { branchDatabaseConfig } = require("../../src/config/db");

    expect(branchDatabaseConfig).toEqual({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  });
});
