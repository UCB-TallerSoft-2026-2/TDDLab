import express from "express";
import { PostgresConnectionFactory } from "../modules/Shared/Infrastructure/PostgresConnectionFactory";
import { PostgresTeacherCommentRepository } from "../modules/TeacherCommentsOnSubmissions/Infrastructure/PostgresTeacherCommentRepository";
import { TeacherCommentController } from "../controllers/teacherCommentsOnSubmissions/teacherCommentsOnSubmissionsController";
import { PinoLogger } from "../modules/Shared/Infrastructure/Logging/PinoLogger";

const connectionFactory = PostgresConnectionFactory.getInstance();
const teacherCommentRepository = new PostgresTeacherCommentRepository(connectionFactory);
const teacherCommentController = new TeacherCommentController(teacherCommentRepository, new PinoLogger());

const teacherCommentsOnSubmissionRouter = express.Router();

teacherCommentsOnSubmissionRouter.post("/", (req, res) => teacherCommentController.addComment(req, res));

teacherCommentsOnSubmissionRouter.get("/:submission_id", (req, res) => teacherCommentController.getComments(req, res));

export default teacherCommentsOnSubmissionRouter;
