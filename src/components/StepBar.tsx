import { Link } from "react-router-dom";
import { ROUTES, routeIndex } from "../app/routes";

// Progress indicator for the lesson sequence. Communicates position by text
// ("Step 2 of 6") and aria-current, not colour alone.
export default function StepBar({ current }: { current: string }) {
  const idx = routeIndex(current);
  if (idx < 0) return null;

  return (
    <nav className="step-bar" aria-label="Lesson progress">
      <p className="step-bar__count">
        Step {idx + 1} of {ROUTES.length}
      </p>
      <ol className="step-bar__list">
        {ROUTES.map((route, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "upcoming";
          return (
            <li key={route.path} className={`step-bar__item is-${state}`}>
              <Link
                to={route.path}
                aria-current={i === idx ? "step" : undefined}
                className="step-bar__dot"
              >
                <span className="visually-hidden">
                  {state === "done"
                    ? "Completed: "
                    : state === "current"
                      ? "Current: "
                      : "Upcoming: "}
                </span>
                {route.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
