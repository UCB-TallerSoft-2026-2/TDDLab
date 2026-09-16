interface StudentSubmissionSummaryProps {
  status: string;
  repositoryLink?: string;
  comment?: string;
}

export function StudentSubmissionSummary({
  status,
  repositoryLink,
  comment,
}: Readonly<StudentSubmissionSummaryProps>) {
  return (
    <>
      <p className="assignment-student-row">
        <strong>Enlace:</strong>{" "}
        {repositoryLink ? (
          <a
            href={repositoryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="assignment-student-link"
          >
            {repositoryLink}
          </a>
        ) : (
          "Sin enlace"
        )}
      </p>

      <p className="assignment-student-row">
        <strong>Estado:</strong>{" "}
        <span
          className={`assignment-status-chip ${
            status === "Enviado"
              ? "is-sent"
              : status === "En progreso"
                ? "is-progress"
                : "is-pending"
          }`}
        >
          {status}
        </span>
      </p>

      {comment && (
        <p className="assignment-student-row">
          <strong>Comentario:</strong> {comment}
        </p>
      )}
    </>
  );
}
