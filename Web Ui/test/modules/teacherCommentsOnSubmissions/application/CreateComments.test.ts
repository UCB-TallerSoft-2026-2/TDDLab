// test/modules/teacherCommentsOnSubmissions/application/CreateComments.test.ts
import { CreateComments } from "../../../../src/modules/teacherCommentsOnSubmissions/application/CreateComments";
import { TeacherCommentsRepositoryFake } from "../../__mocks__/submissions/TeacherCommentsRepositoryFake";
import { teacherCommentFixture } from "../../__mocks__/submissions/teacherCommentFixture";

describe('CreateComments', () => {
    let mockRepository: TeacherCommentsRepositoryFake;
    let createComments: CreateComments;

    beforeEach(() => {
        mockRepository = new TeacherCommentsRepositoryFake();
        createComments = new CreateComments(mockRepository);
    });

    it('should successfully create a new comment', async () => {
        const mockResponse = {
            ...teacherCommentFixture,
            id: 1,
            created_at: new Date()
        };
        mockRepository.createComment.mockResolvedValue(mockResponse);

        const result = await createComments.createComment(teacherCommentFixture);
        expect(result).toEqual(mockResponse);
        expect(mockRepository.createComment).toHaveBeenCalledWith(teacherCommentFixture);
    });

    it('should handle creation error', async () => {
        mockRepository.createComment.mockRejectedValue(new Error("Creation failed"));
        await expect(createComments.createComment(teacherCommentFixture))
            .rejects.toThrowError("Creation failed");
    });
});