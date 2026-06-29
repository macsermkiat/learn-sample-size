// Single source of truth for the lesson sequence: drives nav, step-bar,
// prev/next, and per-route document titles. One concept per route, deep-linkable.
export interface RouteMeta {
  path: string;
  /** Short label for nav + step bar. */
  label: string;
  /** Long title for the document <title> and the page <h1>. */
  title: string;
}

export const ROUTES: readonly RouteMeta[] = [
  { path: "/", label: "Intro", title: "Is 10 events per variable enough?" },
  { path: "/rule-of-thumb", label: "Rule of thumb", title: "Why the 10-EPP rule fails" },
  { path: "/criteria", label: "Criteria", title: "The criteria, and take the max" },
  { path: "/calculator", label: "Calculator", title: "Sample-size calculator" },
  { path: "/best-practices", label: "Best practice", title: "Doing it well" },
  { path: "/quiz", label: "Quiz", title: "Knowledge check" },
] as const;

export const SITE_TITLE = "Sample size for prediction models, explained";

export function routeIndex(path: string): number {
  return ROUTES.findIndex((r) => r.path === path);
}
