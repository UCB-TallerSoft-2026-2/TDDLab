import { render } from "@testing-library/react";
import TDDCycleList from "../../../src/presentation/tdd-visualization/components/TDDCycleList";
import { commitFixture } from "./fixtures/commitData";
import { convertToCommitDataObject } from "./support/TDDVisualizationTestDoubles";
import "@testing-library/jest-dom";

describe("TDDCycleList Component", () => {
  test("renders a list of cycle cards when provided with commits and jobs data", () => {
    const commitsInfo = [convertToCommitDataObject(commitFixture)];

    render(
      <TDDCycleList commitsInfo={commitsInfo} />
    );
    const cycleCards = document.getElementsByClassName("cycleCardContainer");
    expect(cycleCards.length).toBeGreaterThanOrEqual(1);
  });

  test("renders a list of cycle cards when commits and jobs don't match", () => {
    const commitsInfo = [convertToCommitDataObject(commitFixture)];

    render(
      <TDDCycleList commitsInfo={commitsInfo} />
    );
    const cycleCards = document.getElementsByClassName("cycleCardContainer");
    expect(cycleCards.length).toBeGreaterThanOrEqual(1);
  });

  test("renders nothing when provided with no commits and jobs data", () => {
    render(<TDDCycleList commitsInfo={null} />);
    const cycleCards = document.getElementsByClassName("cycleCardContainer");
    expect(cycleCards.length).toBe(0);
  });
});