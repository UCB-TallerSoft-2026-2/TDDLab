import { act, renderHook, waitFor } from "@testing-library/react";
import { useTDDChartPage } from "../../../src/presentation/tdd-visualization/hooks/useTDDChartPage";
import { MockGithubAPI } from "./__mocks__/MocksCommitHistory";

const mockNavigate = jest.fn();
const submissions = [
	{ id: 1, repository_link: "https://github.com/student/first" },
	{ id: 2, repository_link: "https://github.com/student/second" },
	{ id: 3, repository_link: "https://github.com/student/third" },
];

jest.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => ({
		// El hook lee las entregas desde location.state
		state: { fetchedSubmissions: submissions },
		search: "",
		pathname: "",
		hash: "",
		key: "test",
	}),
	useSearchParams: () => [
		new URLSearchParams({
			repoOwner: "student",
			repoName: "second",
			submissionId: "2",
			assignmentId: "5",
		}),
	],
}));

jest.mock(
	"../../../src/presentation/tdd-visualization/services/tddVisualization.service",
	() => ({
		fetchCommentsData: jest
			.fn()
			.mockResolvedValue({ emails: {}, comments: [] }),
		fetchOwnerName: jest.fn().mockResolvedValue("Student"),
		fetchTDDVisualizationData: jest
			.fn()
			.mockResolvedValue({ commits: [], commitsTddCycles: [], tddLogs: [] }),
		createTeacherComment: jest.fn(),
	}),
);

describe("Navegación entre entregas", () => {
	beforeEach(() => {
		mockNavigate.mockClear();
	});

	it.each([
		["goToPreviousStudent", "first", "1", 0],
		["goToNextStudent", "third", "3", 2],
	] as const)(
		"%s conserva el repositorio y la lista de entregas",
		async (action, repo, id, index) => {
			const port = new MockGithubAPI();
			const { result } = renderHook(() =>
				useTDDChartPage({ port, role: "teacher", teacher_id: 10 }),
			);

			await waitFor(() => expect(result.current.loading).toBe(false));
			// Esperar a que currentIndex se sincronice con submissionId=2 (índice 1)
			await waitFor(() => expect(result.current.currentIndex).toBe(1));

			act(() => result.current[action]());

			expect(mockNavigate).toHaveBeenCalledTimes(1);
			const [url, options] = mockNavigate.mock.calls[0];
			const query = new URLSearchParams(url.replace(/^\?/, ""));

			expect(query.get("repoOwner")).toBe("student");
			expect(query.get("repoName")).toBe(repo);
			expect(query.get("submissionId")).toBe(id);
			expect(query.get("assignmentId")).toBe("5");
			expect(options).toEqual({ state: { fetchedSubmissions: submissions } });
			expect(result.current.currentIndex).toBe(index);
		},
	);
});
