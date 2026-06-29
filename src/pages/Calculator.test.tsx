import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Calculator from "./Calculator";
import { binarySampleSize } from "../engine";

// Integration seam: render /calculator, drive the sliders, and assert the
// on-screen binding N, criteria, and the "matches the paper" check equal the
// engine outputs — not a smoke test. Default state is the pre-eclampsia preset.
const renderCalc = (initial = "/calculator") =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Calculator />
    </MemoryRouter>,
  );

const payloadN = (c: HTMLElement): number =>
  Number(c.querySelector(".payload__n")!.textContent!.replace(/[^0-9]/g, ""));

const criteriaTable = (c: HTMLElement): HTMLElement =>
  c.querySelector(".criteria__table") as HTMLElement;

describe("/calculator binary tab", () => {
  it("loads the pre-eclampsia preset and shows N = 5249 (matches the paper)", () => {
    const { container } = renderCalc();
    expect(payloadN(container)).toBe(5249);
    // Binding criterion conveyed in text (payload), not colour alone.
    expect(container.querySelector(".payload__binding")!.textContent).toMatch(/Required shrinkage/i);
    expect(screen.getByText(/exact match/i)).toBeInTheDocument();
  });

  it("the displayed binding N equals the engine at the same inputs", () => {
    const { container } = renderCalc();
    const engine = binarySampleSize({ parameters: 30, r2cs: 0.05, prevalence: 0.05 });
    expect(payloadN(container)).toBe(engine.n);
    expect(engine.bindingId).toBe("B3");
  });

  it("the full per-criterion table reports each criterion's N (B1=73, B2=544, B3=5249)", () => {
    const { container } = renderCalc();
    const table = criteriaTable(container);
    const row = (re: RegExp) => within(table).getByText(re).closest("tr")!;
    expect(within(row(/B1 — Precise overall risk/i)).getByText("73")).toBeInTheDocument();
    expect(within(row(/B2 — Small prediction error/i)).getByText("544")).toBeInTheDocument();
    expect(within(row(/B3 — Required shrinkage/i)).getByText("5,249")).toBeInTheDocument();
    // Binding is conveyed by a literal word in the binding column.
    expect(within(row(/B3 — Required shrinkage/i)).getByText("binding")).toBeInTheDocument();
  });

  it("dragging P from 30 to 20 swings the required N to 3500", () => {
    const { container } = renderCalc();
    const pSlider = screen.getByLabelText(/Candidate predictor parameters/i);
    fireEvent.change(pSlider, { target: { value: "20" } });
    expect(payloadN(container)).toBe(3500);
    expect(payloadN(container)).toBe(
      binarySampleSize({ parameters: 20, r2cs: 0.05, prevalence: 0.05 }).n,
    );
  });

  it("shows a non-crashing message (not NaN) on degenerate input via the URL", () => {
    // R²cs above max(R²cs) at φ=0.05 (~0.33) — the engine fails loud; UI shows it.
    const { container } = renderCalc("/calculator?type=binary&p=30&mode=r2&r2=0.5&phi=0.05");
    expect(container.querySelector(".payload--error")).toBeTruthy();
    expect(container.textContent).not.toMatch(/NaN/);
  });

  it("switching to the time-to-event tab loads the VTE preset → N = 5143", () => {
    const { container } = renderCalc();
    fireEvent.click(screen.getByRole("tab", { name: /Time-to-event/i }));
    expect(payloadN(container)).toBe(5143);
    // Type-specific EPP (events = n·rate·mean-follow-up) shown, not n·rate.
    expect(container.textContent).toMatch(/23\.07/);
    expect(screen.getByText(/exact match/i)).toBeInTheDocument();
  });

  it("switching to the continuous tab loads the fat-free-mass preset → N = 254", () => {
    const { container } = renderCalc();
    fireEvent.click(screen.getByRole("tab", { name: /Continuous/i }));
    expect(payloadN(container)).toBe(254);
    // Continuous reports SPP, not events.
    expect(container.querySelector(".payload__binding")!.textContent).toMatch(/Residual-SD precision/i);
  });
});
