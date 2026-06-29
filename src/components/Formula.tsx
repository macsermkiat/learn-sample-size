import "katex/dist/katex.min.css";
import { FORMULAS, type FormulaKey } from "../content/formulas.generated";

// Renders a BUILD-TIME pre-rendered KaTeX formula. The visual markup is shown;
// the container's aria-label gives a plain-language reading (it overrides the
// inner markup), so screen-reader users hear a sentence, not raw symbols.
export default function Formula({ name }: { name: FormulaKey }) {
  const f = FORMULAS[name];
  return (
    <div
      className="formula"
      role="math"
      aria-label={f.aria}
      dangerouslySetInnerHTML={{ __html: f.html }}
    />
  );
}
