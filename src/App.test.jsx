import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, within, waitFor } from "@testing-library/react";
import App from "./App.jsx";

/* Page indices, for seeding saved progress directly:
   0 welcome, 1 outcomes, 2 setup, 3 m1, 4 t1, 5 t1c, 6 t2, 7 t2c, 8 r1,
   9 m2, 10 t3, 11 t3c, 12 t4, 13 t4c, 14 r2, 15 m3, 16 t5, 17 t5c, 18 t6,
   19 t6c, 20 t7, 21 r3, 22 checklist, 23 finale, 24 report, 25 further */

const STORAGE_KEY = "sprint-progress-v3";

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

  it("merges the brief and the mission on one welcome page", async () => {
    render(<App />);
    await screen.findByText(/45-minute sprint/);
    expect(screen.getByText(/Your required brief, one deliverable per 15-minute ticket/)).toBeInTheDocument();
    expect(screen.getByText(/You sketch three milestones on your board/)).toBeInTheDocument();
    expect(screen.queryByText(/five deliverables/)).toBeNull();
    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByText("Your mission")).toBeNull();
  });

  it("opens the outcomes page with an introductory sentence before the list", async () => {
    await startSprint();
    expect(screen.getByText(/Every exercise in this sprint exists because one of these five problems/)).toBeInTheDocument();
  });

  it("offers the setup instructions as a downloadable PDF", async () => {
    seed(2);
    render(<App />);
    await screen.findByText("Set up before the event");
    const pdfLink = screen.getByTitle(/Download these setup instructions as a PDF/);
    expect(pdfLink).toHaveAttribute("href", "files/setup_instructions.pdf");
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
  });

  it("auto-hides the sidebar when the learner interacts with the main content", async () => {
    render(<App />);
    await screen.findByPlaceholderText("Your name");
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("md:translate-x-0");
    fireEvent.click(screen.getByText(/Monday morning/)); // any main-content click
    expect(nav.className).toContain("md:-translate-x-full");
  });

  it("reopens and collapses the sidebar from the Board button", async () => {
    await startSprint(); // the start click already auto-hid the sidebar
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("md:-translate-x-full");
    fireEvent.click(screen.getByText(/Board/));
    expect(nav.className).toContain("md:translate-x-0");
    fireEvent.click(screen.getByText(/Board/));
    expect(nav.className).toContain("md:-translate-x-full");
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

  it("turns file and site mentions in the steps into live links opening a new tab", async () => {
    await goToTask1();
    const gemini = screen.getByRole("link", { name: "gemini.google.com" });
    expect(gemini).toHaveAttribute("href", "https://gemini.google.com");
    expect(gemini).toHaveAttribute("target", "_blank");
    seed(10); // t3, whose steps name workshop files
  });

  it("links the workshop files named in Task 2's steps", async () => {
    seed(10);
    render(<App />);
    await screen.findByText("Task 2: The Privacy-First EDA Scaffold");
    const link = screen.getAllByRole("link", { name: "prompts/eda_prompt.txt" })[0];
    expect(link).toHaveAttribute("href", "files/prompts/eda_prompt.txt");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("explains how each knowledge check works before the game", async () => {
    await goToTask1();
    next();
    await screen.findByText("Knowledge check: Fix the Brief");
    expect(screen.getByText(/How this check works/)).toBeInTheDocument();
    expect(screen.getByText(/click the one repair you would actually ship/)).toBeInTheDocument();
  });
});

describe("sprint and ticket clocks", () => {
  it("starts the 45-minute sprint clock as soon as the learner leaves the first page", async () => {
    render(<App />);
    await screen.findByPlaceholderText("Your name");
    expect(screen.queryByTestId("sprint-clock")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Amina" } });
    fireEvent.click(screen.getByText("Start the sprint"));
    await screen.findByText("Five problems every data team recognises");
    expect(screen.getByTestId("sprint-clock").textContent).toMatch(/sprint 4[45]:/);
  });

  it("starts the ticket clock at 15 minutes when Task 1 opens and not before", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await startSprint();
    expect(screen.queryByTestId("ticket-clock")).toBeNull();
    next(); next(); // setup, m1
    expect(screen.queryByTestId("ticket-clock")).toBeNull();
    next(); // t1: clock starts
    await screen.findByText("Task 1: The Data Cleaning Playbook Gem");
    expect(screen.getByTestId("ticket-clock").textContent).toMatch(/ticket 1[45]:/);
  });

  it("keeps counting across the milestone's pages and stops at the next milestone", async () => {
    await goToTask1();
    await completeFixTheBrief();
    expect(screen.getByTestId("ticket-clock")).toBeInTheDocument(); // on t1c
    next(); // r1: same milestone, clock still visible
    await screen.findByText("Milestone 1: what you learned");
    expect(screen.getByTestId("ticket-clock")).toBeInTheDocument();
    next(); // m2: Task 2 not started yet, no clock
    await screen.findByText("Explore Safely (Gemini on Colab)");
    expect(screen.queryByTestId("ticket-clock")).toBeNull();
  });

  it("shows an overtime alert once the 15 minutes are spent", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await goToTask1();
    expect(screen.queryByTestId("overtime-alert")).toBeNull();
    act(() => { vi.setSystemTime(Date.now() + 16 * 60 * 1000); vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId("ticket-clock")).toHaveTextContent("ticket 0:00");
    expect(screen.getByTestId("overtime-alert")).toHaveTextContent(/The 15 minutes for Task 1 are up/);
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
});

describe("Task 3 knowledge check", () => {
  it("quizzes the supervision calls and then offers the optional profiling exercise", async () => {
    seed(16); // t5, the agentic ETL build
    render(<App />);
    await screen.findByText("Task 3: The Self-Correcting ETL Build");
    expect(screen.queryByTestId("optional-offer")).toBeNull(); // offer waits for the check
    next(); // t5c
    await screen.findByText("Knowledge check: Supervise the Build");
    fireEvent.click(screen.getByText(/Read it and adjust or reject any step that conflicts with the spec/));
    fireEvent.click(screen.getByText(/It catches rule drift introduced during the fix loop/));
    await screen.findByText(/2 of 2 supervision calls right/);
    const offer = await screen.findByTestId("optional-offer");
    expect(within(offer).getByText("Try the optional exercise")).toBeInTheDocument();
  });

  it("counts the quiz toward the performance highlights", async () => {
    seed(24, { games: { t5: { picks: { 0: 0, 1: 3 }, right: 2, total: 2 } } });
    render(<App />);
    await screen.findByText(/top moment/);
    expect(screen.getByText("Supervising an agentic build")).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 supervision calls right/)).toBeInTheDocument();
  });
});

describe("performance highlights", () => {
  it("shows at most the top three results and no export or share controls", async () => {
    seed(24, { games: { t1: 4, t2: { hits: 4, misses: 0 }, t3: 6, t4: true } });
    render(<App />);
    await screen.findByText("Amina's top 3 moments");
    expect(screen.getAllByText(/🥇|🥈|🥉/)).toHaveLength(3);
    expect(screen.queryByText(/Download JSON|Download CSV|Print/)).toBeNull();
  });

  it("invites the learner to play a knowledge check when nothing is attempted", async () => {
    seed(24, { games: {} });
    render(<App />);
    await screen.findByText(/Complete a knowledge check and your highlights will appear here/);
  });
});

describe("further practice", () => {
  it("keeps all four optional exercises reachable, including the agent-skill one", async () => {
    seed(25);
    render(<App />);
    await screen.findByText(/The optional exercises, any time you want them/);
    expect(screen.getByText("Package the Playbook as an Agent Skill")).toBeInTheDocument();
    const openButtons = screen.getAllByText("Open");
    expect(openButtons).toHaveLength(4);
    fireEvent.click(openButtons[3]);
    await screen.findByText("Optional exercise: Package the Playbook as an Agent Skill");
    expect(screen.getByText(/The SKILL.md template/)).toBeInTheDocument();
  });
});

describe("persistence", () => {
  it("saves progress under the v3 storage key as the learner navigates", async () => {
    await startSprint();
    next();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(saved.page).toBeGreaterThan(0);
      expect(saved.state.student.name).toBe("Amina");
    });
  });
});
