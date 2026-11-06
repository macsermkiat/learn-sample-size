import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";

// The footer is the only place the site credits its author. Every page renders
// through Layout, so these links must survive any footer rewrite, point at the
// exact addresses, and open off-site without handing the opener to the target.
const renderFooter = () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Layout>
        <p>page</p>
      </Layout>
    </MemoryRouter>,
  );
  return screen.getByRole("contentinfo");
};

const EXPECTED_LINKS: ReadonlyArray<readonly [RegExp, string]> = [
  [/protocol\.med/i, "https://protocol.med"],
  [/royyak\.com/i, "https://www.royyak.com"],
  [/youtube/i, "https://www.youtube.com/@ProtocolDotMed"],
  [/^X$/, "https://x.com/ProtocolDotMed"],
  [/linkedin/i, "https://www.linkedin.com/company/114094267"],
  [/facebook/i, "https://www.facebook.com/profile.php?id=61572147557883"],
  [/instagram/i, "https://www.instagram.com/protocoldotmed/"],
];

describe("site footer author links", () => {
  it.each(EXPECTED_LINKS)("links %s to %s in a new tab", (name, href) => {
    const footer = renderFooter();

    const link = within(footer).getByRole("link", { name });

    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
