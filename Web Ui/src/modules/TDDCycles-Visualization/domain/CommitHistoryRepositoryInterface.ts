import { CommitHistoryDTO } from "./githubCommitInterfaces";
import { CommitCycleDTO } from "./TddCycleInterface";
import { TDDLogEntry } from "./TDDLogInterfaces";
import { DatabaseBranchHistory } from "./DatabaseBranchHistory";

export interface CommitHistoryRepository {
  obtainBranchHistories(owner: string, repoName: string): Promise<DatabaseBranchHistory[]>;
  obtainCommitsOfRepo(owner: string, repoName: string): Promise<CommitHistoryDTO[]>;
  obtainCommitTddCycle(owner: string, repoName: string): Promise<CommitCycleDTO[]>;
  obtainTDDLogs(owner: string, repoName: string): Promise<TDDLogEntry[]>;
}
