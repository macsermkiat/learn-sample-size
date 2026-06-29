import { Link } from "react-router-dom";
import { ROUTES, routeIndex } from "../app/routes";

export default function PrevNext({ current }: { current: string }) {
  const idx = routeIndex(current);
  if (idx < 0) return null;
  const prev = idx > 0 ? ROUTES[idx - 1] : null;
  const next = idx < ROUTES.length - 1 ? ROUTES[idx + 1] : null;

  return (
    <nav className="prev-next" aria-label="Previous and next section">
      {prev ? (
        <Link className="prev-next__link prev-next__link--prev" to={prev.path}>
          <span className="prev-next__dir">← Previous</span>
          <span className="prev-next__title">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="prev-next__link prev-next__link--next" to={next.path}>
          <span className="prev-next__dir">Next →</span>
          <span className="prev-next__title">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
