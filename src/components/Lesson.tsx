import { ReactNode } from "react";
import StepBar from "./StepBar";
import PrevNext from "./PrevNext";

// Shared wrapper for the lesson pages: step bar on top, prev/next at the bottom.
export default function Lesson({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <article className="lesson">
      <StepBar current={path} />
      {children}
      <PrevNext current={path} />
    </article>
  );
}
