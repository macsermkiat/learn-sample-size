import { ReactNode, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Nav from "./Nav";
import { ROUTES, SITE_TITLE } from "../app/routes";

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Per-route document title (every render, including first load).
    const meta = ROUTES.find((r) => r.path === pathname);
    document.title = meta
      ? `${meta.title} — ${SITE_TITLE}`
      : `Page not found — ${SITE_TITLE}`;

    // Focus management: move focus to the page <h1> on route CHANGE so keyboard
    // and screen-reader users are oriented after navigation. Skip the first load
    // so the natural top-of-page tab order (skip link first) is preserved.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const h1 = mainRef.current?.querySelector("h1");
    if (h1 instanceof HTMLElement) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: false });
    }
  }, [pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container container--wide site-header__inner">
          <Link className="brand" to="/">
            <span className="brand__mark" aria-hidden="true">
              ▰
            </span>
            <span className="brand__text">
              Sample size
              <span className="brand__sub">explained</span>
            </span>
          </Link>
          <Nav />
        </div>
      </header>

      <main id="main" ref={mainRef} className="site-main" tabIndex={-1}>
        <div className="container container--wide">{children}</div>
      </main>

      <footer className="site-footer">
        <div className="container container--wide site-footer__inner">
          <p>
            An independent interactive explainer of{" "}
            <a
              href="https://doi.org/10.1136/bmj.m441"
              target="_blank"
              rel="noreferrer"
            >
              Riley et al. (2020), BMJ 368:m441
            </a>
            . Figures and numbers are original recreations, checked against the
            authors' <code>pmsampsize</code> package — not reproductions of the
            paper.
          </p>
        </div>
      </footer>
    </div>
  );
}
