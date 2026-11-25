import { CommitHistoryAdapter } from "../../../src/modules/TDDCycles-Visualization/repository/CommitHistoryAdapter";
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("CommitHistoryAdapter", () => {
  let adapter: CommitHistoryAdapter;

  beforeEach(() => {
    adapter = new CommitHistoryAdapter();
    mockedAxios.get.mockReset();
  });

  it("returns commits from persisted branch history", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [{ name: "main" }] })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          branch: { name: "main" },
          commits: [
            {
              repository_slug: "owner/repo",
              branch: "main",
              html_url: "https://github.com/owner/repo/commit/456",
              sha: "456",
              stats: { total: 0, additions: 0, deletions: 0, date: "" },
              commit: {
                date: "2024-01-02T00:00:00.000Z",
                message: "Test",
                url: "https://github.com/owner/repo/commit/456",
                comment_count: 0,
              },
              coverage: 0,
              test_count: 3,
              conclusion: "success",
              executions: [
                {
                  id: 5,
                  tests_total: 3,
                  tests_passed: 3,
                  tests_failed: 0,
                  executed_at: "2024-01-02T00:00:00.000Z",
                },
              ],
            },
          ],
        },
      });

    const commits = await adapter.obtainCommitsOfRepo("owner", "repo");

    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe("456");
    expect(commits[0].tests_passed).toBe(3);
    expect(mockedAxios.get.mock.calls[0][0]).toContain("/branches/branches");
  });

  it("loads the previous TDD cycle endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [] });

    await expect(adapter.obtainCommitTddCycle("owner", "repo")).resolves.toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${adapter.backAPI}/commit-cycles`,
      { params: { owner: "owner", repoName: "repo" } },
    );
  });

});
