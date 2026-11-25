import { CommitHistoryDTO } from "../domain/githubCommitInterfaces.ts";
import { CommitHistoryRepository } from "../domain/CommitHistoryRepositoryInterface.ts";
import { CommitCycleDTO } from "../domain/TddCycleInterface.ts";
import axios from "axios";
import { VITE_API } from "../../../../config.ts";
import { TDDLogEntry } from "../domain/TDDLogInterfaces.ts";
import { getErrorResponseStatus } from "../../../shared/helpers/errorHelpers";
import {
  DatabaseBranchCommit,
  DatabaseBranchHistory,
} from "../domain/DatabaseBranchHistory";

type BackendBranch = { name: string };
type BackendCommit = Omit<CommitHistoryDTO, "commit"> & {
  commit: Omit<CommitHistoryDTO["commit"], "date"> & { date: string | Date };
};
type BackendCommitCycle = Omit<CommitCycleDTO, "tddCycle"> & {
  tddCycle?: string | null;
};

export class CommitHistoryAdapter implements CommitHistoryRepository {
  backAPI: string;

  constructor() {
    this.backAPI = VITE_API + "/TDDCycles"; // https://localhost:3000/api/ -> https://tdd-lab-api-gold.vercel.app/api/
  }

  private getLatestExecution(commit: DatabaseBranchCommit) {
    return (commit.executions ?? []).reduce<
      NonNullable<DatabaseBranchCommit["executions"]>[number] | undefined
    >((latest, execution) => {
      if (
        !latest ||
        new Date(execution.executed_at).getTime() >
          new Date(latest.executed_at).getTime()
      ) {
        return execution;
      }
      return latest;
    }, undefined);
  }

  private hasDatabaseCommits(histories: DatabaseBranchHistory[]): boolean {
    return histories.some((history) =>
      history.commits.some((commit) => Array.isArray(commit.executions)),
    );
  }

  private normalizeTDDLogEntry(entry: unknown): TDDLogEntry | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const candidate = entry as Record<string, unknown>;

    if (typeof candidate.commitId === "string") {
      return {
        commitId: candidate.commitId,
        commitName:
          typeof candidate.commitName === "string" ? candidate.commitName : "",
        commitTimestamp:
          typeof candidate.commitTimestamp === "number"
            ? candidate.commitTimestamp
            : 0,
        testId: typeof candidate.testId === "number" ? candidate.testId : 0,
      };
    }

    if (
      typeof candidate.numPassedTests === "number" &&
      typeof candidate.failedTests === "number" &&
      typeof candidate.numTotalTests === "number" &&
      typeof candidate.timestamp === "number" &&
      typeof candidate.success === "boolean" &&
      typeof candidate.testId === "number"
    ) {
      return {
        numPassedTests: candidate.numPassedTests,
        failedTests: candidate.failedTests,
        numTotalTests: candidate.numTotalTests,
        timestamp: candidate.timestamp,
        success: candidate.success,
        testId: candidate.testId,
      };
    }

    return null;
  }

  private async obtainLegacyCommits(
    owner: string,
    repoName: string,
  ): Promise<CommitHistoryDTO[]> {
    const url = `${this.backAPI}/commits-history`;
    const response = await axios.get<BackendCommit[]>(url, {
      params: { owner, repoName },
    });
    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    if (!Array.isArray(response.data)) {
      throw new Error("La API anterior no devolvió una lista de commits");
    }

    return response.data.map((commit) => ({
      ...commit,
      commit: { ...commit.commit, date: new Date(commit.commit.date) },
    }));
  }

  private async obtainLegacyTDDLogs(
    owner: string,
    repoName: string,
  ): Promise<TDDLogEntry[]> {
    try {
      const url = `${this.backAPI}/tdd-logs`;
      const response = await axios.get<unknown>(url, {
        params: { owner, repoName },
      });
      if (response.status === 404) {
        console.warn("Logs TDD no encontrados. Continuando sin datos de registro.");
        return [];
      }
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const payload = Array.isArray(response.data)
        ? response.data
        : (response.data as { logs?: unknown } | null)?.logs;
      if (!Array.isArray(payload)) {
        throw new Error("La API anterior no devolvió una lista de logs TDD");
      }

      return payload.map((entry, index) => {
        const normalized = this.normalizeTDDLogEntry(entry);
        if (!normalized) {
          throw new Error(`La entrada de log TDD ${index} tiene un formato inválido`);
        }
        return normalized;
      });
    } catch (error: unknown) {
      if (getErrorResponseStatus(error) === 404) {
        console.warn("Logs TDD no encontrados. Continuando sin datos de registro.");
        return [];
      }
      throw error;
    }
  }

  async obtainCommitsOfRepo(
    owner: string,
    repoName: string,
  ): Promise<CommitHistoryDTO[]> {
    try {
      const histories = await this.obtainBranchHistories(owner, repoName);
      if (!this.hasDatabaseCommits(histories)) {
        return await this.obtainLegacyCommits(owner, repoName);
      }

      return histories.flatMap(({ branch, commits }) =>
        commits.map((commit) => {
          const latestExecution = this.getLatestExecution(commit);
          return {
            ...commit,
            branch: branch.name,
            commit: { ...commit.commit, date: new Date(commit.commit.date) },
            tests_passed: latestExecution?.tests_passed ?? 0,
            tests_failed: latestExecution?.tests_failed ?? 0,
          };
        }),
      );
    } catch (error) {
      console.error(
        "Error obteniendo commits desde la base de datos o el almacenamiento anterior:",
        error,
      );
      throw error;
    }
  }

  async obtainBranchHistories(
    owner: string,
    repoName: string,
  ): Promise<DatabaseBranchHistory[]> {
    try {
      const params = { owner, repoName };
      const branchesUrl = `${this.backAPI}/branches/branches`;
      const branchesResponse = await axios.get<BackendBranch[]>(branchesUrl, {
        params,
      });

      if (branchesResponse.status !== 200) {
        throw new Error(`HTTP error! Status: ${branchesResponse.status}`);
      }
      if (!Array.isArray(branchesResponse.data)) {
        throw new Error("La API no devolvió una lista de ramas");
      }

      return await Promise.all(
        branchesResponse.data.map(async ({ name }) => {
          if (typeof name !== "string" || name.length === 0) {
            throw new Error("La API devolvió una rama sin nombre");
          }
          const historyUrl = `${this.backAPI}/branches/branches/history`;
          const response = await axios.get<DatabaseBranchHistory | null>(
            historyUrl,
            { params: { ...params, branch: name } },
          );
          if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          if (!response.data) {
            throw new Error(`No se encontró el historial de la rama ${name}`);
          }

          return response.data;
        }),
      );
    } catch (error) {
      console.error("Error obteniendo ramas desde la base de datos:", error);
      throw error;
    }
  }

  async obtainCommitTddCycle(
    owner: string,
    repoName: string,
  ): Promise<CommitCycleDTO[]> {
    try {
      const url = `${this.backAPI}/commit-cycles`;
      const response = await axios.get<BackendCommitCycle[]>(url, {
        params: { owner, repoName },
      });
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      if (!Array.isArray(response.data)) {
        throw new Error("La API anterior no devolvió una lista de ciclos TDD");
      }

      return response.data.map((item) => ({
        repository_slug: item.repository_slug,
        branch: item.branch,
        url: item.url,
        sha: item.sha,
        tddCycle: item.tddCycle ?? "null",
        coverage: item.coverage,
      }));
    } catch (error) {
      console.error("Error al obtener los ciclos TDD:", error);
      throw error;
    }
  }

  async obtainTDDLogs(owner: string, repoName: string): Promise<TDDLogEntry[]> {
    try {
      const histories = await this.obtainBranchHistories(owner, repoName);
      if (!this.hasDatabaseCommits(histories)) {
        return await this.obtainLegacyTDDLogs(owner, repoName);
      }

      return histories.flatMap(({ commits }) =>
        commits.flatMap((commit) => [
          ...(commit.executions ?? []).map((execution) => ({
            numPassedTests: execution.tests_passed,
            failedTests: execution.tests_failed,
            numTotalTests: execution.tests_total,
            timestamp: new Date(execution.executed_at).getTime(),
            success: execution.tests_failed === 0,
            testId: execution.id,
          })),
          {
            commitId: commit.sha,
            commitName: commit.commit.message,
            commitTimestamp: new Date(commit.commit.date).getTime(),
            testId: commit.executions?.[commit.executions.length - 1]?.id ?? 0,
          },
        ]),
      );
    } catch (error) {
      console.error("Error al obtener los logs TDD:", error);
      throw error;
    }
  }
}
