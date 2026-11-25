import { GetCommentsBySubmissionId } from "../../../../src/modules/teacherCommentsOnSubmissions/application/GetComments";
import { CommentDataObject } from "../../../../src/modules/teacherCommentsOnSubmissions/domain/CommentsInterface";
import { TeacherCommentsRepositoryFake } from "../../__mocks__/submissions/TeacherCommentsRepositoryFake";

const commentFixture: CommentDataObject = {
    id: 1,
    submission_id: 129,
    teacher_id: 42,
    content: "This is a test comment",
    created_at: new Date(),
};

let mockRepository: TeacherCommentsRepositoryFake;
let getCommentsBySubmissionId: GetCommentsBySubmissionId;

beforeEach(() => {
    mockRepository = new TeacherCommentsRepositoryFake();
    getCommentsBySubmissionId = new GetCommentsBySubmissionId(mockRepository);
});

describe("GetCommentsBySubmissionId", () => {
    it("should return a list of comments for a given submission ID", async () => {
        const submissionId = 129;
        const mockComments: CommentDataObject[] = [commentFixture];
        
        mockRepository.getCommentsBySubmissionId.mockResolvedValue(mockComments);

        const result = await getCommentsBySubmissionId.getCommentsBySubmissionId(submissionId);

        expect(result).toEqual(mockComments);
        expect(mockRepository.getCommentsBySubmissionId).toHaveBeenCalledWith(submissionId);
    });

    it("should throw an error if the repository call fails", async () => {
        const submissionId = 129;
        const error = new Error("Failed to get comments");
        mockRepository.getCommentsBySubmissionId.mockRejectedValue(error);

        await expect(getCommentsBySubmissionId.getCommentsBySubmissionId(submissionId)).rejects.toThrow(error);
        expect(mockRepository.getCommentsBySubmissionId).toHaveBeenCalledWith(submissionId);
    });
});