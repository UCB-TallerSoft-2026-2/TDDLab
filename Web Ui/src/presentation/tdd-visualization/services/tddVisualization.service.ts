import { GetCommitTddCycle } from "../../../modules/TDDCycles-Visualization/application/GetCommitTddCycle";
import { GetCommitsOfRepo } from "../../../modules/TDDCycles-Visualization/application/GetCommitsOfRepo";
import { GetTDDLogs } from "../../../modules/TDDCycles-Visualization/application/GetTDDLogs";
import { GetCommentsBySubmissionId } from "../../../modules/teacherCommentsOnSubmissions/application/GetComments";
import { CommitHistoryRepository } from "../../../modules/TDDCycles-Visualization/domain/CommitHistoryRepositoryInterface";
import TeacherCommentsRepository from "../../../modules/teacherCommentsOnSubmissions/repository/CommentsRepository";
import { CommentsCreationObject } from "../../../modules/teacherCommentsOnSubmissions/domain/CommentsInterface";
import UsersRepository from "../../../modules/Users/repository/UsersRepository";
import { TDDCommentsData, TDDVisualizationData } from "../types/tddVisualization.types";
import type { CommitDataObject } from "../../../modules/TDDCycles-Visualization/domain/githubCommitInterfaces";
import type { TDDLogEntry } from "../../../modules/TDDCycles-Visualization/domain/TDDLogInterfaces";

export async function fetchTDDVisualizationData(
  port: CommitHistoryRepository,
  repoOwner: string,
  repoName: string,
): Promise<TDDVisualizationData> {
  const histories = await port.obtainBranchHistories(repoOwner, repoName);
  const hasDatabaseCommits = histories.some((history) =>
    history.commits.some((commit) => Array.isArray(commit.executions)),
  );
  if (!hasDatabaseCommits) {
    const getCommitsOfRepoUseCase = new GetCommitsOfRepo(port);
    const getCommitTddCycleUseCase = new GetCommitTddCycle(port);
    const getTDDLogsUseCase = new GetTDDLogs(port);
    const [tddLogs, commits, commitsTddCycles] = await Promise.all([
      getTDDLogsUseCase.execute(repoOwner, repoName),
      getCommitsOfRepoUseCase.execute(repoOwner, repoName),
      getCommitTddCycleUseCase.execute(repoOwner, repoName),
    ]);

    return { commits, commitsTddCycles, tddLogs };
  }

  const commits: CommitDataObject[] = histories.flatMap(({ branch, commits }) =>
    commits.map((commit) => {
      const executions = commit.executions ?? [];
      const latestExecution = executions.reduce<
        (typeof executions)[number] | undefined
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

      return {
        html_url: commit.html_url,
        sha: commit.sha,
        branch: branch.name,
        parent_sha: commit.parent_sha,
        author: commit.author,
        stats: {
          total: commit.stats.total,
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
        },
        commit: {
          ...commit.commit,
          date: new Date(commit.commit.date),
        },
        coverage: commit.coverage,
        test_count: latestExecution?.tests_total ?? 0,
        conclusion: latestExecution
          ? latestExecution.tests_failed === 0
            ? "success"
            : "failure"
          : "",
      };
    }),
  );
  const tddLogs: TDDLogEntry[] = histories.flatMap(({ commits }) =>
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

  return {
    commits,
    commitsTddCycles: [],
    tddLogs,
  };
}

export async function fetchCommentsData(submissionId: number): Promise<TDDCommentsData> {
  const commentsRepo = new TeacherCommentsRepository();
    const getComments = new GetCommentsBySubmissionId(commentsRepo);
  const usersRepository = new UsersRepository();
    const comments = await getComments.getCommentsBySubmissionId(submissionId);
  const emails: Record<number, string> = {};

    const teacherIds = [...new Set(comments.map((comment) => comment.teacher_id))];
    await Promise.all(
      teacherIds.map(async (teacherId) => {
        try {
          const user = await usersRepository.getUserById(teacherId);
          emails[teacherId] = user.email.toString();
        } catch {
          emails[teacherId] = "Correo no disponible";
        }
      }),
    );

    return { comments, emails };
}

export function createTeacherComment(commentData: CommentsCreationObject) {
  const commentsRepo = new TeacherCommentsRepository();
  return commentsRepo.createComment(commentData);
}
