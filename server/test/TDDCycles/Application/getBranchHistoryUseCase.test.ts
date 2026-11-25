import { GetBranchHistoryUseCase } from "../../../src/modules/TDDCycles/Application/GetBranchHistoryUseCase";
import { IGithubRepository } from "../../../src/modules/TDDCycles/Domain/IGithubRepository";
import { IBranchRepository } from "../../../src/modules/TDDCycles/Domain/IBranchRepository";

describe("GetBranchHistoryUseCase", () => {
  it("uses the database history when the repository is stored there", async () => {
    const history = { branch: { name: "main" }, commits: [] };
    const branchRepository = {
      getRepository: jest.fn().mockResolvedValue({ slug: "repo-id" }),
      getBranchHistory: jest.fn().mockResolvedValue(history),
    } as unknown as IBranchRepository;
    const githubRepository = {
      checkNewGenFile: jest.fn(),
    } as unknown as IGithubRepository;
    const useCase = new GetBranchHistoryUseCase(
      githubRepository,
      branchRepository,
    );

    await expect(useCase.execute("owner", "repo", "main")).resolves.toBe(history);
    expect(branchRepository.getBranchHistory).toHaveBeenCalledWith(
      "owner",
      "repo",
      "main",
    );
    expect(githubRepository.checkNewGenFile).not.toHaveBeenCalled();
  });
});
