import axios from "axios";
import TeacherCommentsRepositoryInterface from "../domain/CommentsRepositoryInterface";
import { CommentDataObject, CommentsCreationObject } from "../domain/CommentsInterface";
import { VITE_API } from "../../../../config";

const API_URL = VITE_API + "/commentsSubmission";

class TeacherCommentsRepository implements TeacherCommentsRepositoryInterface {
  async getCommentsBySubmissionId(submissionId: number): Promise<CommentDataObject[]> {
    const response = await axios.get<CommentDataObject[]>(`${API_URL}/${submissionId}`);
    if (response.status !== 200) {
      throw new Error("Failed to get comments by submission ID");
    }
    return response.data;
  }

  async createComment(commentData: CommentsCreationObject): Promise<CommentDataObject> {
    const response = await axios.post<CommentDataObject>(API_URL, commentData);
    if (response.status !== 201) {
      throw new Error("Failed to create comment");
    }
    return response.data;
  }
}

export default TeacherCommentsRepository;