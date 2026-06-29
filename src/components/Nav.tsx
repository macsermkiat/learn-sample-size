import { NavLink } from "react-router-dom";
import { ROUTES } from "../app/routes";

export default function Nav() {
  return (
    <nav className="site-nav" aria-label="Lesson sections">
      <ol className="site-nav__list">
        {ROUTES.map((route, i) => (
          <li key={route.path}>
            <NavLink
              to={route.path}
              end={route.path === "/"}
              className={({ isActive }) =>
                "site-nav__link" + (isActive ? " is-active" : "")
              }
            >
              <span className="site-nav__step" aria-hidden="true">
                {i + 1}
              </span>
              <span className="site-nav__label">{route.label}</span>
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
