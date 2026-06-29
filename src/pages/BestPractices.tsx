import Lesson from "../components/Lesson";

// Each practice is anchored to a DIRECT quote from Riley et al. (2020, m441).
// DAG-based predictor selection is framed as broader-literature practice, not
// the paper's own term (the paper cites systematic reviews and PCA).
export default function BestPractices() {
  return (
    <Lesson path="/best-practices">
      <h1>Doing it well</h1>
      <p className="lede">
        Getting the sample size right is necessary but not sufficient. How you choose
        predictors and validate the model can quietly reintroduce the overfitting the
        calculation was meant to control. Three practices, each in the authors' own words.
      </p>

      <h2>1. Choose predictors blind to the data</h2>
      <p>
        Deciding which predictors to keep by peeking at their estimated effects inflates
        optimism — the model is tuned to noise in this particular sample. If the required
        N is impractical, reduce the number of <em>candidate</em> predictors using
        outside knowledge, before modelling.
      </p>
      <blockquote className="paper-quote">
        This process should be done blind to the estimated predictor effects in the full
        model, as otherwise decisions about predictor inclusion will be influenced by a
        "quick look" at the results (which increases the overfitting).
        <cite>Riley et al., BMJ 2020;368:m441</cite>
      </blockquote>
      <p>
        Sources of data-blind reduction the paper points to include existing evidence from
        systematic reviews and data-reduction techniques such as principal components
        analysis. From the broader literature, a causal diagram (DAG) is another common way
        to pre-specify which variables to include — a standard practice elsewhere, not a
        term used in this paper.
      </p>

      <h2>2. If N is impractical, cut candidate predictors — not data</h2>
      <p>
        The lever to pull is the number of candidate parameters P, decided up front. The
        paper's own example shows the swing:
      </p>
      <blockquote className="paper-quote">
        If recruiting 5249 women is impractical … the sample size required can be reduced
        by identifying a smaller number of candidate predictors (eg, based on existing
        evidence from systematic reviews). For example, with 20 rather than 30 candidate
        predictors, the required sample size … is at least 3500 women and 175 events
        (still 8.75 EPP).
        <cite>Riley et al., BMJ 2020;368:m441</cite>
      </blockquote>

      <h2>3. Do not split into training and test sets</h2>
      <p>
        Holding back a test set wastes data and weakens the model you actually deploy. Use
        all of it, and estimate optimism by resampling.
      </p>
      <blockquote className="paper-quote">
        We do not recommend data splitting (eg, into model training and testing samples),
        as this is inefficient and it is better to use all the data for model development,
        with resampling methods (such as bootstrapping) used for internal validation.
        <cite>Riley et al., BMJ 2020;368:m441</cite>
      </blockquote>

      <aside className="callout">
        <p className="callout__title">A note on flexible models.</p>
        <p>
          These criteria are derived for regression models. Flexible machine-learning
          methods generally need substantially more data than a regression model with the
          same number of predictors to reach comparable stability — sizing them with a
          regression EPP target understates the requirement.
        </p>
      </aside>
    </Lesson>
  );
}
