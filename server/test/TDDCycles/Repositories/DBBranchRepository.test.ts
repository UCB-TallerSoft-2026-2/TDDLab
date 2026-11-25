import { Pool } from "pg";
import { DBBranchRepository } from "../../../src/modules/TDDCycles/Repositories/DBBranchRepository";

describe("DBBranchRepository", () => {
  it("uses the GitHub URL when saving a repository without a remote URL", async () => {
    const insertClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ id: "repository-id", created_at: new Date("2025-01-01") }],
      }),
      release: jest.fn(),
    };
    const lookupClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    const repository = new DBBranchRepository();
    repository.pool = {
      connect: jest
        .fn()
        .mockResolvedValueOnce(insertClient)
        .mockResolvedValueOnce(lookupClient),
    } as unknown as Pool;

    await repository.saveRepository({ slug: "owner/repo" });

    expect(insertClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO tdd_repository"),
      ["repo", "https://github.com/owner/repo", "owner"],
    );
    expect(insertClient.release).toHaveBeenCalled();
    expect(lookupClient.release).toHaveBeenCalled();
  });
});
