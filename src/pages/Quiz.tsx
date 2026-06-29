import Lesson from "../components/Lesson";
import Quiz, { type QuizQuestion } from "../components/Quiz";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "binds",
    prompt:
      "For a binary model with many candidate predictors and a low outcome proportion, which criterion most often determines the required sample size?",
    options: [
      { id: "a", text: "Events per variable (10-EPP)", correct: false, why: "EPP is a summary of a design, not a criterion in the framework. It rarely matches the actual requirement." },
      { id: "b", text: "The required-shrinkage criterion, driven by anticipated R²cs", correct: true, why: "Shrinkage (B3) usually binds. It targets low overfitting and is driven by the anticipated R²cs, not by counting events per parameter." },
      { id: "c", text: "Precise estimate of the overall risk", correct: false, why: "This (B1) is usually the smallest requirement — 73 in the pre-eclampsia example versus 5249 for shrinkage." },
      { id: "d", text: "The number of predictors alone", correct: false, why: "P matters, but the binding requirement also depends on outcome frequency and anticipated performance." },
    ],
  },
  {
    id: "quicklook",
    prompt: "Why does deciding which predictors to keep after a 'quick look' at their estimated effects increase overfitting?",
    options: [
      { id: "a", text: "It reduces the sample size", correct: false, why: "It doesn't change N; it changes how the model is tuned to this sample." },
      { id: "b", text: "It tunes inclusion decisions to noise specific to this sample", correct: true, why: "Selecting on the observed effects fits the model to sample-specific noise, inflating apparent performance and optimism. The paper says to choose predictors blind to their estimated effects." },
      { id: "c", text: "It changes the outcome definition", correct: false, why: "The outcome is unchanged; the problem is data-driven predictor selection." },
      { id: "d", text: "It always improves calibration", correct: false, why: "The opposite — it worsens out-of-sample calibration by overfitting." },
    ],
  },
  {
    id: "ruleflaw",
    prompt: "The 10 events-per-variable rule is flawed mainly because…",
    options: [
      { id: "a", text: "events are difficult to count", correct: false, why: "Counting events is not the issue." },
      { id: "b", text: "it ignores anticipated predictive performance and outcome frequency", correct: true, why: "A single fixed target cannot track a requirement that depends on R²cs and φ — it over-sizes at low prevalence and under-sizes at high prevalence." },
      { id: "c", text: "it requires a holdout sample", correct: false, why: "It says nothing about holdouts." },
      { id: "d", text: "it is always too conservative", correct: false, why: "It can be too lax — it under-sizes when the outcome is common." },
    ],
  },
  {
    id: "survevents",
    prompt: "For a time-to-event model, the expected number of events is approximately…",
    options: [
      { id: "a", text: "N × event rate", correct: false, why: "This omits follow-up time. Using it gives a wrong EPP (11.1 instead of 23.07 in the VTE example)." },
      { id: "b", text: "N × event rate × mean follow-up", correct: true, why: "Events accrue over person-time, so EPP is type-specific: events = N × rate × mean follow-up. This is why the survival EPP differs from the binary one." },
      { id: "c", text: "N × outcome proportion", correct: false, why: "That is the binary form; survival accrues events over time." },
      { id: "d", text: "N ÷ number of parameters", correct: false, why: "That is EPP itself, not the event count." },
    ],
  },
  {
    id: "split",
    prompt: "Instead of splitting the data into training and test sets, Riley et al. recommend…",
    options: [
      { id: "a", text: "a 50/50 train/test split", correct: false, why: "They explicitly advise against data splitting as inefficient." },
      { id: "b", text: "using all the data, with bootstrapping for internal validation", correct: true, why: "The paper recommends using all data for development and resampling (such as bootstrapping) for internal validation, rather than holding data back." },
      { id: "c", text: "external validation only", correct: false, why: "External validation is a separate question with its own sample-size methods; it is not a substitute for efficient development." },
      { id: "d", text: "dropping predictors at random", correct: false, why: "Predictor reduction should use outside evidence, blind to the data — not randomness." },
    ],
  },
];

export default function QuizPage() {
  return (
    <Lesson path="/quiz">
      <h1>Knowledge check</h1>
      <p className="lede">
        Five questions on the ideas that matter most: which criterion binds, why
        data-driven predictor selection overfits, and how to size and validate honestly.
        Pick an answer to see why it is right or wrong.
      </p>
      <Quiz questions={QUESTIONS} />
    </Lesson>
  );
}
