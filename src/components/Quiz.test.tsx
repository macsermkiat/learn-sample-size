import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Quiz, { type QuizQuestion } from "./Quiz";

const QS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Which criterion usually binds?",
    options: [
      { id: "a", text: "Events per variable", correct: false, why: "EPP is a summary, not a target." },
      { id: "b", text: "Required shrinkage", correct: true, why: "It is the typical driver of required N." },
    ],
  },
];

describe("Quiz", () => {
  it("reveals per-answer feedback explaining the why and scores a correct pick", () => {
    render(<Quiz questions={QS} />);
    expect(screen.getByText(/0 \/ 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Required shrinkage/i }));
    expect(screen.getByText(/Correct\./i)).toBeInTheDocument();
    expect(screen.getByText(/typical driver of required N/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
  });

  it("marks a wrong pick and explains why, locking the question", () => {
    render(<Quiz questions={QS} />);
    fireEvent.click(screen.getByRole("button", { name: /Events per variable/i }));
    expect(screen.getByText(/Not quite\./i)).toBeInTheDocument();
    // Both options are disabled after answering (the teaching is the explanation).
    screen.getAllByRole("button").forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByText(/0 \/ 1/)).toBeInTheDocument();
  });

  it("exposes the correct answer visually after answering wrong", () => {
    render(<Quiz questions={QS} />);
    fireEvent.click(screen.getByRole("button", { name: /Events per variable/i }));
    const correct = screen.getByRole("button", { name: /Required shrinkage/i });
    expect(within(correct).getByText("✓")).toBeInTheDocument();
  });
});
