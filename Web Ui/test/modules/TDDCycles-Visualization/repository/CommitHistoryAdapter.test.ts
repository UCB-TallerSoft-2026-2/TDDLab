import axios from "axios";
import { CommitHistoryAdapter } from "../../../../src/modules/TDDCycles-Visualization/repository/CommitHistoryAdapter";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const owner = "test-owner";
const repoName = "test-repo";
const branchHistory = {
  branch: { name: "main" },
  commits: [
    {
      repository_slug: "test-owner/test-repo",
      branch: "main",
      html_url: "https://github.com/test-owner/test-repo/commit/abc",
      sha: "abc",
      author: "Test User",
      stats: { total: 0, additions: 0, deletions: 0, date: "" },
      commit: {
        date: "2025-01-01T00:00:00.000Z",
        message: "Add tests",
        url: "https://github.com/test-owner/test-repo/commit/abc",
        comment_count: 0,
      },
      coverage: 0,
      test_count: 2,
      conclusion: "success",
      executions: [
        {
          id: 3,
          tests_total: 2,
          tests_passed: 2,
          tests_failed: 0,
          executed_at: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
};

describe("CommitHistoryAdapter", () => {
  let adapter: CommitHistoryAdapter;

  beforeEach(() => {
    adapter = new CommitHistoryAdapter();
    mockedAxios.get.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads branches and their histories from the database routes", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [{ name: "main" }] })
      .mockResolvedValueOnce({ status: 200, data: branchHistory });

    await expect(
      adapter.obtainBranchHistories(owner, repoName),
    ).resolves.toEqual([branchHistory]);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      `${adapter.backAPI}/branches/branches`,
      { params: { owner, repoName } },
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      `${adapter.backAPI}/branches/branches/history`,
      { params: { owner, repoName, branch: "main" } },
    );
  });

  it("maps database commits into the existing commit chart contract", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [{ name: "main" }] })
      .mockResolvedValueOnce({ status: 200, data: branchHistory });

    const commits = await adapter.obtainCommitsOfRepo(owner, repoName);

    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual(
      expect.objectContaining({
        sha: "abc",
        branch: "main",
        tests_passed: 2,
        tests_failed: 0,
        commit: expect.objectContaining({ date: new Date("2025-01-01T00:00:00.000Z") }),
      }),
    );
  });

  it("uses the previous commits endpoint when Neon has no commit history", async () => {
    const legacyCommit = {
      repository_slug: "test-owner/test-repo",
      branch: "main",
      html_url: "https://github.com/test-owner/test-repo/commit/old",
      sha: "old",
      author: "Test User",
      stats: { total: 0, additions: 0, deletions: 0 },
      commit: {
        date: "2024-12-01T00:00:00.000Z",
        message: "Previously saved commit",
        url: "https://github.com/test-owner/test-repo/commit/old",
        comment_count: 0,
      },
      coverage: 0,
      test_count: 0,
      tests_passed: 0,
      tests_failed: 0,
      conclusion: "",
    };
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [] })
      .mockResolvedValueOnce({ status: 200, data: [legacyCommit] });

    const commits = await adapter.obtainCommitsOfRepo(owner, repoName);

    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe("old");
    expect(commits[0].commit.date).toEqual(new Date("2024-12-01T00:00:00.000Z"));
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      `${adapter.backAPI}/commits-history`,
      { params: { owner, repoName } },
    );
  });

  it("builds TDD log entries from persisted executions and commits", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [{ name: "main" }] })
      .mockResolvedValueOnce({ status: 200, data: branchHistory });

    await expect(adapter.obtainTDDLogs(owner, repoName)).resolves.toEqual([
      {
        numPassedTests: 2,
        failedTests: 0,
        numTotalTests: 2,
        timestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
        success: true,
        testId: 3,
      },
      {
        commitId: "abc",
        commitName: "Add tests",
        commitTimestamp: new Date("2025-01-01T00:00:00.000Z").getTime(),
        testId: 3,
      },
    ]);
  });

  it("continues without legacy logs when the previous logs route is unavailable", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [] });
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(adapter.obtainTDDLogs(owner, repoName)).resolves.toEqual([]);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      `${adapter.backAPI}/tdd-logs`,
      { params: { owner, repoName } },
    );
  });

  it("loads saved TDD cycles from the previous endpoint for legacy repositories", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: [
        {
          repository_slug: "test-owner/test-repo",
          branch: "main",
          url: "https://github.com/test-owner/test-repo/commit/old",
          sha: "old",
          tddCycle: "red-green-refactor",
          coverage: 80,
        },
      ],
    });

    await expect(adapter.obtainCommitTddCycle(owner, repoName)).resolves.toEqual([
      {
        repository_slug: "test-owner/test-repo",
        branch: "main",
        url: "https://github.com/test-owner/test-repo/commit/old",
        sha: "old",
        tddCycle: "red-green-refactor",
        coverage: 80,
      },
    ]);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${adapter.backAPI}/commit-cycles`,
      { params: { owner, repoName } },
    );
  });

  it("fails rather than presenting an empty history when a branch history is missing", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200, data: [{ name: "main" }] })
      .mockResolvedValueOnce({ status: 200, data: null });

    await expect(adapter.obtainBranchHistories(owner, repoName)).rejects.toThrow(
      "No se encontró el historial de la rama main",
    );
  });
});
