import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, within, waitFor } from "@testing-library/react";
import App from "./App.jsx";

/* Page indices, for seeding saved progress directly:
   0 welcome, 1 outcomes, 2 setup, 3 story, 4 m1, 5 t1, 6 t1c, 7 t2, 8 t2c,
   9 r1, 10 m2, 11 t3, 12 t3c, 13 t4, 14 t4c, 15 r2, 16 m3, 17 t5, 18 t6,
   19 t6c, 20 r3, 21 checklist, 22 finale, 23 report, 24 further */

const STORAGE_KEY = "sprint-progress-v2";

const seed = (page, state = {}) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ page, state: { student: { name: "Amina" }, ...state } }));

async function startSprint() {
  render(<App />);
  const input = await screen.findByPlaceholderText("Your name");
  fireEvent.change(input, { target: { value: "Amina" } });
  fireEvent.click(screen.getByText("Start the sprint"));
  await screen.findByText("Five problems every data team recognises");
}

const next = () => fireEvent.click(screen.getByText("Next →"));
const back = () => fireEvent.click(screen.getByText("← Back"));

async function goToTask1() {
  await startSprint();
  next(); // setup
  next(); // story
  next(); // m1
  next(); // t1
  await screen.findByText("Task 1: The Data Cleaning Playbook Gem");
}

async function completeFixTheBrief() {
  next(); // t1 -> t1c
  await screen.findByText("Knowledge check: Fix the Brief");
  fireEvent.click(screen.getByText(/You are a data cleaning advisor for the DukaLink analytics team/));
  fireEvent.click(screen.getByText(/Numeric nulls above 5 percent: investigate before imputing/));
  fireEvent.click(screen.getByText(/Respond with: Decision, Rule applied, Code snippet, Caveats/));
  fireEvent.click(screen.getByText(/If a rule is not covered by this playbook, say so instead of improvising/));
  fireEvent.click(screen.getByText("Score my brief"));
  await screen.findByText(/4 of 4 elements repaired/);
}

describe("welcome and storyline", () => {
  it("requires a name before the sprint can start", async () => {
    render(<App />);
    const button = await screen.findByText("Start the sprint");
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Amina" } });
    expect(button).toBeEnabled();
  });

  it("frames a 45-minute sprint of three required tasks, never five deliverables", async () => {
    render(<App />);
    await screen.findByText(/45-minute sprint/);
    expect(screen.queryByText(/five deliverables/)).toBeNull();
    expect(screen.queryByText(/2 hours/)).toBeNull();
  });

  it("renders a transition sentence at the foot of the page", async () => {
    render(<App />);
    await screen.findByText(/First stop: the five problems this sprint exists to solve/);
  });
});

describe("navigation and sidebar", () => {
  it("lists only the three renumbered core tasks in the nav, no optional pages", async () => {
    await startSprint();
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Task 1: Playbook Gem")).toBeInTheDocument();
    expect(within(nav).getByText("Task 2: Privacy-first EDA")).toBeInTheDocument();
    expect(within(nav).getByText("Task 3: Agentic ETL build")).toBeInTheDocument();
    expect(within(nav).queryByText(/Optional/)).toBeNull();
    expect(within(nav).queryByText(/Task 4|Task 5|Task 6/)).toBeNull();
  });

  it("collapses and reopens the sidebar from the Board button", async () => {
    await startSprint();
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("md:block");
    fireEvent.click(screen.getByText(/Board/));
    expect(nav.className).toContain("md:hidden");
    fireEvent.click(screen.getByText(/Board/));
    expect(nav.className).toContain("md:block");
  });

  it("Next skips the hidden optional pages when the learner has not opted in", async () => {
    await goToTask1();
    await completeFixTheBrief();
    next(); // from t1c: t2/t2c are hidden and not opted in, so land on r1
    await screen.findByText("Milestone 1: what you learned");
    back(); // and Back skips them in reverse
    await screen.findByText("Knowledge check: Fix the Brief");
  });
});

describe("task pages", () => {
  it("renders the full prompt inside the step where it is used, not at the page foot", async () => {
    await goToTask1();
    const label = screen.getByText(/The full brief these steps assemble/);
    expect(label.closest("ol")).not.toBeNull();
  });

  it("uses the interactive game as the knowledge check, with no multiple choice", async () => {
    await goToTask1();
    next();
    await screen.findByText("Knowledge check: Fix the Brief");
    expect(screen.getByText(/No multiple choice here/)).toBeInTheDocument();
    expect(screen.queryByText(/^Q1\./)).toBeNull();
  });
});

describe("ticket clock", () => {
  it("starts at 15 minutes when Task 1 opens and is absent before", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await startSprint();
    expect(screen.queryByTestId("ticket-clock")).toBeNull();
    next(); next(); next(); // setup, story, m1
    expect(screen.queryByTestId("ticket-clock")).toBeNull();
    next(); // t1: clock starts
    await screen.findByText("Task 1: The Data Cleaning Playbook Gem");
    expect(screen.getByTestId("ticket-clock").textContent).toMatch(/^1[45]:/);
  });

  it("shows time up once the 15 minutes are spent", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await goToTask1();
    act(() => { vi.setSystemTime(Date.now() + 16 * 60 * 1000); vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId("ticket-clock")).toHaveTextContent("time up");
  });
});

describe("optional-exercise offer", () => {
  it("appears once the knowledge check is finished and opens the optional task", async () => {
    await goToTask1();
    expect(screen.queryByTestId("optional-offer")).toBeNull();
    await completeFixTheBrief();
    const offer = await screen.findByTestId("optional-offer");
    fireEvent.click(within(offer).getByText("Try the optional exercise"));
    await screen.findByText("Optional exercise: The Code Review Gem");
  });

  it("continues to the recap when the learner declines", async () => {
    await goToTask1();
    await completeFixTheBrief();
    const offer = await screen.findByTestId("optional-offer");
    fireEvent.click(within(offer).getByText("Continue the lesson"));
    await screen.findByText("Milestone 1: what you learned");
  });

  it("withdraws the optional choice when under three minutes remain on the ticket", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await goToTask1();
    await completeFixTheBrief();
    act(() => { vi.setSystemTime(Date.now() + 13 * 60 * 1000); vi.advanceTimersByTime(1000); });
    const offer = screen.getByTestId("optional-offer");
    expect(within(offer).getByText(/Less than three minutes remain/)).toBeInTheDocument();
    expect(within(offer).queryByText("Try the optional exercise")).toBeNull();
    expect(within(offer).getByText("Continue the lesson")).toBeInTheDocument();
  });

  it("offers the profiling exercise directly on the Task 3 page, which has no game", async () => {
    seed(17); // t5, the agentic ETL build
    render(<App />);
    await screen.findByText("Task 3: The Self-Correcting ETL Build");
    const offer = await screen.findByTestId("optional-offer");
    expect(within(offer).getByText("Try the optional exercise")).toBeInTheDocument();
  });
});

describe("performance highlights", () => {
  it("shows at most the top three results and no export or share controls", async () => {
    seed(23, { games: { t1: 4, t2: { hits: 4, misses: 0 }, t3: 6, t4: true } });
    render(<App />);
    await screen.findByText("Amina's top 3 moments");
    expect(screen.getAllByText(/🥇|🥈|🥉/)).toHaveLength(3);
    expect(screen.queryByText(/Download JSON|Download CSV|Print/)).toBeNull();
    expect(screen.getByText(/That is the whole report/)).toBeInTheDocument();
  });

  it("invites the learner to play a knowledge check when nothing is attempted", async () => {
    seed(23, { games: {} });
    render(<App />);
    await screen.findByText(/Complete a knowledge check and your highlights will appear here/);
  });
});

describe("further practice", () => {
  it("keeps the optional exercises reachable after the sprint", async () => {
    seed(24);
    render(<App />);
    await screen.findByText(/The optional exercises, any time you want them/);
    const openButtons = screen.getAllByText("Open");
    expect(openButtons).toHaveLength(3);
    fireEvent.click(openButtons[0]);
    await screen.findByText("Optional exercise: The Code Review Gem");
  });
});

describe("persistence", () => {
  it("saves progress under the v2 storage key as the learner navigates", async () => {
    await startSprint();
    next();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(saved.page).toBeGreaterThan(0);
      expect(saved.state.student.name).toBe("Amina");
    });
  });
});
