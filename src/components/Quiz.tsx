import { useState } from "react";

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  why: string;
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

// Data-driven knowledge check: one answer per question, instant per-answer
// feedback explaining the WHY, and a running score. Once answered, a question
// locks (the teaching is in the explanation, not in retrying). Accessible:
// options are buttons with aria-pressed; feedback is announced via aria-live.
export default function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const answeredCount = Object.keys(chosen).length;
  const score = questions.reduce((acc, q) => {
    const pick = q.options.find((o) => o.id === chosen[q.id]);
    return acc + (pick?.correct ? 1 : 0);
  }, 0);

  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const picked = chosen[q.id];
        const answered = picked !== undefined;
        const pickedOpt = q.options.find((o) => o.id === picked);
        return (
          <div className="quiz__q" key={q.id}>
            <p className="quiz__prompt">
              {i + 1}. {q.prompt}
            </p>
            <ul className="quiz__options">
              {q.options.map((o) => {
                const isPicked = picked === o.id;
                const cls =
                  "quiz__option" +
                  (answered && o.correct ? " is-correct" : "") +
                  (answered && isPicked && !o.correct ? " is-wrong" : "");
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={cls}
                      aria-pressed={isPicked}
                      disabled={answered}
                      onClick={() => setChosen((p) => ({ ...p, [q.id]: o.id }))}
                    >
                      <span className="quiz__mark" aria-hidden="true">
                        {answered && o.correct ? "✓" : answered && isPicked ? "✗" : "○"}
                      </span>
                      <span>{o.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {answered && (
              <p className="quiz__feedback" aria-live="polite">
                <strong>{pickedOpt?.correct ? "Correct. " : "Not quite. "}</strong>
                {pickedOpt?.why}
              </p>
            )}
          </div>
        );
      })}
      <p className="quiz__score" aria-live="polite">
        Score: {score} / {questions.length}
        {answeredCount < questions.length
          ? ` (${questions.length - answeredCount} unanswered)`
          : " — complete"}
      </p>
    </div>
  );
}
