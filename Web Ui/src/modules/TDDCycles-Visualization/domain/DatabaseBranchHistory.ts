import { CommitHistoryDTO } from "./githubCommitInterfaces";

export interface DatabaseBranchExecution {
  id: number;
  tests_total: number;
  tests_passed: number;
  tests_failed: number;
  executed_at: Date | string;
}

export type DatabaseBranchCommit = Omit<
  CommitHistoryDTO,
  "commit" | "tests_passed" | "tests_failed"
> & {
  commit: Omit<CommitHistoryDTO["commit"], "date"> & {
    date: Date | string;
  };
  executions?: DatabaseBranchExecution[];
};

export interface DatabaseBranchHistory {
  branch: { name: string };
  commits: DatabaseBranchCommit[];
}
