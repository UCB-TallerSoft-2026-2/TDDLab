import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getErrorResponseStatus } from "../../../shared/helpers/errorHelpers";
import {
  readTeacherSubmissions,
} from "../../../shared/helpers/navigationHandlers";
import { CommentDataObject } from "../../../modules/teacherCommentsOnSubmissions/domain/CommentsInterface";
import {
  createTeacherComment,
  fetchCommentsData,
  fetchTDDVisualizationData,
} from "../services/tddVisualization.service";
import {
  CycleReportViewProps,
  Submission,
} from "../types/tddVisualization.types";
import { CommitDataObject } from "../../../modules/TDDCycles-Visualization/domain/githubCommitInterfaces";
import { CommitCycle } from "../../../modules/TDDCycles-Visualization/domain/TddCycleInterface";
import { TDDLogEntry } from "../../../modules/TDDCycles-Visualization/domain/TDDLogInterfaces";

function isStudent(role: string) {
  return role === "student";
}

function getDefaultMetric(graphs: string) {
  return graphs === "graph" ? "DashboardClasico" : "Complejidad";
}

function getRepoQuery(submission: Submission, assignmentId?: number) {
  const [, , , repoOwner, repoName] = submission.repository_link.split("/");
  const params = new URLSearchParams({
    repoOwner,
    repoName,
    submissionId: submission.id.toString(),
  });

  if (assignmentId && assignmentId > 0) {
    params.set("assignmentId", assignmentId.toString());
  }

  return params.toString();
}

export function useTDDChartPage({
  graphs,
  port,
  role,
  teacher_id,
}: Readonly<CycleReportViewProps>) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentRole = isStudent(role);
  const isTeacherView = role !== "student";
  const repoOwner = String(searchParams.get("repoOwner")) || "defaultOwner";
  const repoName = String(searchParams.get("repoName")) || "defaultRepo";
  const submissionIdcomments = Number.parseInt(searchParams.get("submissionId") || "0");
  const assignmentId = Number.parseInt(searchParams.get("assignmentId") || "0");
  const fetchedSubmissions: Submission[] = isTeacherView
    ? readTeacherSubmissions(assignmentId)
    : [];
  const submissionId = isTeacherView ? Number(searchParams.get("submissionId")) : 0;

  const [currentIndex, setCurrentIndex] = useState(
    isTeacherView
      ? fetchedSubmissions.findIndex((submission) => submission.id === submissionId)
      : 0,
  );
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentDataObject[] | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metric, setMetric] = useState<string | null>(null);
  const [commitsInfo, setCommitsInfo] = useState<CommitDataObject[] | null>(null);
  const [tddLogsInfo, setTDDLogsInfo] = useState<TDDLogEntry[] | null>(null);
  const [commitsTddCycles, setCommitsTddCycles] = useState<CommitCycle[]>([]);

  const defaultMetric = getDefaultMetric(graphs);

  const loadComments = useCallback(async () => {
    if (
      !isTeacherView ||
      !Number.isInteger(submissionIdcomments) ||
      submissionIdcomments <= 0
    ) {
      setEmails({});
      setComments([]);
      setCommentsError(null);
      return;
    }

    try {
      const commentsData = await fetchCommentsData(submissionIdcomments);
      setEmails(commentsData.emails);
      setComments(commentsData.comments);
      setCommentsError(null);
    } catch (error) {
      setEmails({});
      setComments([]);
      if (getErrorResponseStatus(error) === 404) {
        setCommentsError("No se encontró la entrega asociada a estos comentarios.");
        return;
      }
      setCommentsError("No se pudieron cargar los comentarios.");
      throw error;
    }
  }, [isTeacherView, submissionIdcomments]);

  useEffect(() => {
    loadComments().catch((error: unknown) => console.error("Error loading comments:", error));
  }, [loadComments]);

  useEffect(() => {
    const loadVisualizationData = async () => {
      setLoading(true);
      try {
        const visualizationData = await fetchTDDVisualizationData(port, repoOwner, repoName);
        setCommitsInfo(visualizationData.commits);
        setCommitsTddCycles(visualizationData.commitsTddCycles);
        setTDDLogsInfo(visualizationData.tddLogs);
      } catch (error) {
        console.error("Error obtaining data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVisualizationData().catch((error: unknown) => console.error("Error loading visualization data:", error));
  }, [port, repoOwner, repoName]);

  const goToPreviousStudent = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      const previousSubmission = fetchedSubmissions[previousIndex];
      localStorage.setItem("selectedMetric", defaultMetric);
      navigate(`?${getRepoQuery(previousSubmission, assignmentId)}`);
      setCurrentIndex(previousIndex);
    }
  };

  const goToNextStudent = () => {
    if (currentIndex < fetchedSubmissions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSubmission = fetchedSubmissions[nextIndex];
      localStorage.setItem("selectedMetric", defaultMetric);
      navigate(`?${getRepoQuery(nextSubmission, assignmentId)}`);
      setCurrentIndex(nextIndex);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createTeacherComment({
        submission_id: submissionIdcomments,
        teacher_id,
        content: feedback,
      });
      setFeedback("");
      await loadComments();
    } catch (error) {
      console.error("Error al enviar la retroalimentación:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    chartsState: {
      commitsInfo,
      commitsTddCycles,
      metric,
      setMetric,
      tddLogsInfo,
    },
    comments,
    commentsError,
    currentIndex,
    emails,
    feedback,
    fetchedSubmissions,
    goToNextStudent,
    goToPreviousStudent,
    handleSubmitFeedback,
    isSubmitting,
    isStudent: studentRole,
    loading,
    repoOwner,
    repoName,
    role,
    setFeedback,
  };
}
