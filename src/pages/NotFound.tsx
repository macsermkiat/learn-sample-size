import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found">
      <h1>Page not found</h1>
      <p>That section does not exist in this explainer.</p>
      <p>
        <Link className="button button--primary" to="/">
          Return to the intro
        </Link>
      </p>
    </section>
  );
}
