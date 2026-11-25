import { MergeInfo } from "./IMergeInfo";

export interface TddExecutionData {
  id: number;
  tests_total: number;
  tests_passed: number;
  tests_failed: number;
  executed_at: Date;
}

export interface CommitHistoryData {
  repository_slug:string;
  branch: string;
  html_url: string;
  sha: string;
  parent_sha?: string;
  author?: string;
  stats: {
    total: number;
    additions: number;
    deletions: number;
    date: string;
  };
  commit: {
    date: Date;
    message: string;
    url: string;
    comment_count: number;
  };
  coverage: number;
  test_count: number;
  conclusion: string;
  executions?: TddExecutionData[];
  merge?: MergeInfo
}
