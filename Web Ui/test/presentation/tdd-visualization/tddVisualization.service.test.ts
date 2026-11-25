import { CommitHistoryRepository } from "../../../src/modules/TDDCycles-Visualization/domain/CommitHistoryRepositoryInterface";
import { DatabaseBranchHistory } from "../../../src/modules/TDDCycles-Visualization/domain/DatabaseBranchHistory";
import { fetchTDDVisualizationData } from "../../../src/presentation/tdd-visualization/services/tddVisualization.service";

describe("fetchTDDVisualizationData", () => {
  it("falls back to the existing commit and cycle endpoints when Neon is empty", async () => {
    const previousCommit = {
      html_url: "https://github.com/owner/repo/commit/old",
      stats: { total: 0, additions: 0, deletions: 0 },
      commit: {
        date: new Date("2024-12-01T00:00:00.000Z"),
        message: "Previously saved commit",
        url: "https://github.com/owner/repo/commit/old",
        comment_count: 0,
      },
      sha: "old",
      branch: "main",
      coverage: 0,
      test_count: 0,
      conclusion: "",
    };
    const previousCycle = {
      url: "https://github.com/owner/repo/commit/old",
      sha: "old",
      tddCycle: "red-green-refactor",
    };
    const previousLog = {
      commitId: "old",
      commitName: "Previously saved commit",
      commitTimestamp: new Date("2024-12-01T00:00:00.000Z").getTime(),
      testId: 1,
    };
    const port = {
      obtainBranchHistories: jest.fn().mockResolvedValue([]),
      obtainCommitsOfRepo: jest.fn().mockResolvedValue([previousCommit]),
      obtainCommitTddCycle: jest.fn().mockResolvedValue([previousCycle]),
      obtainTDDLogs: jest.fn().mockResolvedValue([previousLog]),
    } as unknown as CommitHistoryRepository;

    await expect(fetchTDDVisualizationData(port, "owner", "repo")).resolves.toEqual({
      commits: [previousCommit],
      commitsTddCycles: [previousCycle],
      tddLogs: [previousLog],
    });
    expect(port.obtainCommitsOfRepo).toHaveBeenCalledWith("owner", "repo");
    expect(port.obtainCommitTddCycle).toHaveBeenCalledWith("owner", "repo");
    expect(port.obtainTDDLogs).toHaveBeenCalledWith("owner", "repo");
  });

  it("builds chart data from Neon branch histories and their saved executions", async () => {
    const histories: DatabaseBranchHistory[] = [
      {
        branch: { name: "feature/db" },
        commits: [
          {
            repository_slug: "owner/repo",
            branch: "feature/db",
            html_url: "https://github.com/owner/repo/commit/abc",
            sha: "abc",
            parent_sha: "parent",
            author: "Developer",
            stats: { total: 0, additions: 0, deletions: 0 },
            commit: {
              date: "2025-01-02T00:00:00.000Z",
              message: "Add database chart",
              url: "https://github.com/owner/repo/commit/abc",
              comment_count: 0,
            },
            coverage: 0,
            test_count: 2,
            conclusion: "success",
            executions: [
              {
                id: 7,
                tests_total: 2,
                tests_passed: 2,
                tests_failed: 0,
                executed_at: "2025-01-02T00:01:00.000Z",
              },
            ],
          },
        ],
      },
    ];
    const port = {
      obtainBranchHistories: jest.fn().mockResolvedValue(histories),
    } as unknown as CommitHistoryRepository;

    const result = await fetchTDDVisualizationData(port, "owner", "repo");

    expect(port.obtainBranchHistories).toHaveBeenCalledWith("owner", "repo");
    expect(result.commits).toEqual([
      expect.objectContaining({
        sha: "abc",
        branch: "feature/db",
        author: "Developer",
        test_count: 2,
        conclusion: "success",
      }),
    ]);
    expect(result.commitsTddCycles).toEqual([]);
    expect(result.tddLogs).toEqual([
      expect.objectContaining({
        testId: 7,
        numTotalTests: 2,
        numPassedTests: 2,
        failedTests: 0,
      }),
      expect.objectContaining({
        commitId: "abc",
        commitName: "Add database chart",
      }),
    ]);
  });
});
