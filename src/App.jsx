import React, { useState, useEffect, useRef } from "react";

/* From Brief to Production: interactive companion app (v3, GitHub Pages ready)
   Palette: teal #0F766E, coral #E8604C, slate #1E293B, mint #E7F4F2
   Progress, knowledge-check answers, and checkpoint results persist in
   localStorage and feed the performance report at the end of the sprint. */

const CORAL = "#E8604C";
const CORAL_SOFT = "#FBEAE6";
const MINT = "#E7F4F2";
const SKIN = "#8D5A3C";
const HAIR = "#1C1816";

/* ---------------- storage (localStorage; works on any static host) ---------------- */
const store = {
  async get(key) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  },
  async set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode: fine */ }
  },
};

/* ---------------- inline text formatting: `code` spans ---------------- */
const fmt = (s) =>
  s.split("`").map((part, i) =>
    i % 2 ? (
      <code key={i} className="font-mono text-xs bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-slate-800 break-words">{part}</code>
    ) : (
      <span key={i}>{part}</span>
    )
  );

/* ---------------- resource links (served from this repository's public/files) ---------------- */
const RES = (p) => `files/${p}`;
const FileChip = ({ name, path }) => (
  <a href={RES(path || name)} download target="_blank" rel="noreferrer"
    className="hover-lift inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border border-teal-200 bg-white text-teal-800 hover:bg-teal-50 transition-colors">
    <span aria-hidden>{"\u2193"}</span>{name}
  </a>
);

/* ---------------- persona and prop illustrations (inline SVG) ---------------- */
function PersonaBust({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Your data scientist persona" role="img">
      <circle cx="60" cy="118" r="46" fill="#0F766E" />
      <circle cx="60" cy="24" r="11" fill={HAIR} />
      <circle cx="60" cy="12" r="4" fill={CORAL} />
      <circle cx="60" cy="52" r="30" fill={HAIR} />
      <circle cx="60" cy="56" r="25" fill={SKIN} />
      <path d="M 35 56 A 25 25 0 0 1 85 56 L 85 50 A 25 27 0 0 0 35 50 Z" fill={HAIR} />
      <circle cx="34.5" cy="60" r="3" fill={CORAL} />
      <circle cx="85.5" cy="60" r="3" fill={CORAL} />
      <circle cx="51" cy="58" r="2.4" fill="#1E293B" />
      <circle cx="69" cy="58" r="2.4" fill="#1E293B" />
      <path d="M 52 68 Q 60 75 68 68" stroke="#1E293B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const GemProp = ({ s = 80 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <polygon points="20,38 35,18 65,18 80,38 50,82" fill={CORAL} />
    <polygon points="20,38 80,38 50,82" fill="#C94A38" />
    <polygon points="36,38 64,38 50,82" fill="#F07B69" />
    <polygon points="84,14 87,21 94,24 87,27 84,34 81,27 74,24 81,21" fill="#0F766E" />
  </svg>
);

const LaptopProp = ({ s = 96 }) => (
  <svg width={s} height={s * 0.75} viewBox="0 0 130 96">
    <rect x="18" y="6" width="94" height="64" rx="8" fill="#1E293B" />
    <rect x="24" y="12" width="82" height="52" rx="5" fill="#fff" />
    <rect x="32" y="44" width="10" height="14" rx="3" fill="#0F766E" />
    <rect x="46" y="34" width="10" height="24" rx="3" fill="#0F766E" />
    <rect x="60" y="40" width="10" height="18" rx="3" fill={CORAL} />
    <path d="M 92 18 L 106 18 L 106 32 L 99 39 L 92 32 Z" fill="#0F766E" />
    <path d="M 95 26 L 98 30 L 104 22" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
    <polygon points="8,84 122,84 112,70 18,70" fill="#2D3A50" />
  </svg>
);

const TerminalProp = ({ s = 96 }) => (
  <svg width={s} height={s * 0.72} viewBox="0 0 130 94">
    <rect x="4" y="4" width="122" height="86" rx="10" fill="#1E293B" />
    <rect x="4" y="4" width="122" height="22" rx="10" fill="#2D3A50" />
    <rect x="4" y="16" width="122" height="10" fill="#2D3A50" />
    <circle cx="18" cy="15" r="4" fill={CORAL} />
    <circle cx="30" cy="15" r="4" fill="#F0B43C" />
    <circle cx="42" cy="15" r="4" fill="#0F766E" />
    <text x="14" y="52" fontFamily="monospace" fontWeight="bold" fontSize="18" fill="#6EE7B7">&gt;_ etl.py</text>
    <rect x="14" y="62" width="100" height="8" rx="4" fill="#334155" />
    <rect x="14" y="62" width="76" height="8" rx="4" fill="#0F766E" />
    <text x="14" y="84" fontFamily="monospace" fontSize="10" fill="#D6ECE8">tests passed</text>
  </svg>
);

const CelebrateProps = () => (
  <svg width="120" height="46" viewBox="0 0 120 46">
    {[[8, 10], [26, 30], [44, 8], [66, 26], [88, 12], [106, 32], [116, 10]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 3} fill={i % 3 === 0 ? CORAL : i % 3 === 1 ? "#0F766E" : "#9CD6CC"} />
    ))}
  </svg>
);

/* Full-screen celebratory burst; pieces fall then the layer unmounts (see index.css). */
const CONFETTI_COLORS = ["#0F766E", CORAL, "#9CD6CC", "#F0B43C"];
const Confetti = () => (
  <div className="confetti" aria-hidden>
    {Array.from({ length: 28 }, (_, i) => (
      <span key={i} style={{
        left: `${(i * 37) % 100}%`, background: CONFETTI_COLORS[i % 4],
        width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3,
        borderRadius: i % 2 ? "50%" : "2px",
        animationDelay: `${(i % 7) * 0.06}s`, animationDuration: `${0.9 + (i % 5) * 0.18}s`,
      }} />
    ))}
  </div>
);

const SceneCard = ({ prop, children }) => (
  <div className="flex items-center gap-5 rounded-2xl p-5 my-4 flex-wrap" style={{ background: MINT }}>
    <PersonaBust size={84} />
    <div className="shrink-0">{prop}</div>
    <p className="text-sm text-slate-700 italic flex-1 min-w-[200px]">{children}</p>
  </div>
);

/* ---------------- long workplace prompts (full length) ---------------- */
const EDA_PROMPT = `CONTEXT
You are helping the DukaLink analytics team investigate retailer churn,
which is up 18 percent quarter on quarter. I am working in a Colab
notebook on a pseudonymized copy of our customer table (5,150 rows;
national IDs removed, phone numbers hashed). Here is the exact structure,
pasted from the live dataframe:

<paste your df.info() output here>

<paste your df.describe(include="all") output here>

Notes you must account for:
- avg_order_value_kes is in Kenyan Shillings; a handful of accounts are
  large distributors averaging above KES 200,000, legitimate, not errors
- business_type has missing values; treat missing as its own category
- churned is the target: 1 means the retailer stopped ordering
- signup_date arrives as a string and needs parsing
- the table still contains duplicate rows; do not assume uniqueness

TASK
Generate a complete EDA scaffold as separate notebook cells:
1. Distributions of every numeric column, log scale where skewed
2. Frequency tables and bar charts for every categorical column
3. A correlation heatmap of the numeric columns
4. A missingness summary: count and percent per column, sorted descending

CONSTRAINTS
- seaborn; one markdown-headed section per component
- every chart titled, axes labelled with units (KES where relevant)
- where sensible, split or colour charts by churned vs retained
- no row-level printing anywhere: this data is pseudonymized, not anonymous
- each section must run independently after a single imports cell`;

const ETL_PROMPT = `CONTEXT
DukaLink (Nairobi e-commerce marketplace) needs a monthly-refresh ETL for
the retailer churn analysis. It runs on an analyst laptop today and a
scheduled runner later, so plain Python scripts, no notebook code.
Environment: Python 3.10, pandas, pyarrow.

INPUTS
- dukalink_customers.csv (5,150 rows; contains known quality issues)
- dukalink_orders.csv (76,503 rows covering 12 months)
Schemas below, pasted from df.info():

<paste both schemas here>

CLEANING RULES (verbatim from the team playbook; do not reinterpret)
1. Categorical nulls become "Unknown" plus a boolean <col>_was_missing flag
2. Numeric nulls above 5 percent: stop and report; do not impute
3. Numeric nulls at or below 5 percent: median impute and log the count
4. Values beyond 1.5 IQR: mark in an outlier_flag column, never drop rows;
   revenue outliers are legitimate large distributors
5. Exact duplicate rows: drop and log the count
6. Duplicate customer_ids with conflicting values: write them to
   escalations.csv and exclude from the clean output; never auto-resolve

REQUIREMENTS
- Validation runs BEFORE transformation: row counts, required columns,
  dtypes, customer_id uniqueness after dedup; fail loudly with a clear
  message naming the check that failed
- Output: clean_customers.parquet with explicit dtypes, plus one printed
  summary line per cleaning rule applied (rule, rows affected)
- Deterministic: same inputs must produce identical output
- No hard-coded absolute paths; paths live as constants at the top
- Small unit-testable functions; docstrings with parameter types

NON-GOALS
- No modeling, no plotting, no database writes in this version

DEFINITION OF DONE
- Runs end to end from a fresh terminal; re-running is identical
- escalations.csv contains the 30 conflicting IDs planted in the data

Give me your plan first as numbered steps. Do not write any code until
I confirm the plan.`;

const GEM_PLAYBOOK_PROMPT = `ROLE
You are a data cleaning advisor for the DukaLink analytics team, a Nairobi
e-commerce marketplace. Analysts consult you before making any cleaning
decision on our customer and orders tables. Answer from our playbook below,
never from generic best practice.

CLEANING RULES (the playbook; apply verbatim)
1. Categorical nulls: replace with "Unknown" and add a boolean
   <col>_was_missing flag; never guess a category.
2. Numeric nulls above 5 percent of the column: stop and investigate with
   the data owner before any imputation.
3. Numeric nulls at or below 5 percent: median impute and document the
   count in the cleaning log.
4. Values beyond 1.5 IQR: mark in an outlier_flag column; never drop rows.
   Revenue outliers are usually legitimate large distributors and need a
   business reason before any exclusion.
5. Exact duplicate rows: drop and log the count.
6. Duplicate customer_ids with conflicting values: write them to
   escalations.csv and exclude from the clean output; never auto-resolve.

OUTPUT FORMAT
Respond to every question with exactly four sections:
Decision, Rule applied, Code snippet (pandas), Caveats.

REFUSAL RULES
- Never invent column names or values you have not been shown.
- If a situation is not covered by this playbook, say "The playbook does
  not cover this" and name who should decide, instead of improvising.`;

const GEM_REVIEWER_PROMPT = `ROLE
You are a code reviewer enforcing the DukaLink analytics team conventions
on Python code heading for our shared repository. Much of it is
AI-generated, so assume nothing about intent; review what is written.

CONVENTIONS TO ENFORCE
1. Every function has a docstring stating parameter types and return type.
2. No iterrows or itertuples in production code; vectorize instead.
3. No chained pandas assignment; the write is silently lost.
4. Explicit dtype handling on every read_csv; never trust inference.
5. No hard-coded absolute paths; paths live as constants at the top.
6. No mutable default arguments.

OUTPUT FORMAT
A table with columns: Issue, Severity (High / Medium / Low), Line
reference, Suggested fix. After the table, one verdict line: block or
approve. Block on any High severity issue.

REFUSAL RULES
- If the code's purpose is unclear, ask what it is meant to do before
  reviewing; a context-free review is confident noise.
- Enforce only the conventions above. Anything else you notice goes in a
  separate "outside conventions" list so the team can decide whether to
  adopt it.`;

const INTERPRET_PROMPT = `CONTEXT
You are helping the DukaLink analytics team read the outputs of a baseline
churn model (random forest, scikit-learn) trained on 5,150 retailers,
80 percent retained and 20 percent churned. I am pasting three outputs
from the notebook exactly as printed:

<paste the class balance output here>

<paste the confusion matrix and classification report here>

<paste the top ten SHAP values here>

TASK
1. A business-language interpretation for a Head of Growth who does not
   know what recall is: what the model catches, what it misses, and what
   that costs us in practice. Amounts in KES where relevant.
2. A list of ways this result could mislead someone reading it quickly,
   ordered by how expensive the misreading would be.
3. The top three churn drivers from the SHAP values, stated as testable
   hypotheses ("retailers with X churn more; we could verify by Y"),
   never as conclusions.

CONSTRAINTS
- Every claim must point at a specific number in the outputs above.
- Do not soften the weaknesses; the team pays for missed churners, not
  for a flattering summary.
- If a claim cannot be supported by the pasted numbers alone, label it
  "needs verification" instead of asserting it.`;

const OPTIMIZE_PROMPT = `CONTEXT
slow_pipeline.py builds a customer order summary from dukalink_orders.csv
(76,503 rows covering 12 months). It takes about 100 seconds on an analyst
laptop and runs monthly. Python 3.10, pandas.

TASK, IN THIS ORDER
1. Profile the script with cProfile and report the top three time sinks
   as: function, cumulative seconds, percent of total runtime. Do not
   change any code yet.
2. Stop and wait for my confirmation of the profile.
3. Only then rewrite the hot paths, under these constraints:
   - Output must be identical to the original script's output; write the
     comparison check yourself and show it passing.
   - The diff must be reviewable function by function; no wholesale
     rewrite of untouched code.
   - Record before and after wall-clock timings in a short table.

NON-GOALS
- No new dependencies (no polars, no dask); pandas only this round.
- No behaviour changes, however tempting; file them as suggestions at
  the end instead.`;

/* ---------------- tasks ---------------- */
const TASKS = {
  t1: {
    num: 1, time: "15 min", required: true, title: "The Data Cleaning Playbook Gem", tool: "Gemini Gems",
    concept: "Writing effective Gem instructions (role, constraints, output format, refusal rules) and encoding team cleaning rules into a reusable Playbook Gem.",
    snapshot: {
      def: "A Gem briefed with four elements that answers every cleaning question with your team's rules for nulls, outliers, and duplicates instead of generic advice.",
      why: "Cleaning decisions are where analyses silently diverge; encoding the rules once keeps results reproducible and auditable.",
      use: "Onboarding, recurring reports, any project where more than one person or one AI touches the data.",
      who: "Data scientists and analysts making daily cleaning calls, analytics engineers on shared datasets, team leads standardizing juniors' calls.",
    },
    story: "Before touching the churn data, you write DukaLink's cleaning rules into a Gem so every later step, including the pipeline the agent builds in Milestone 3, obeys the same playbook. Then you test it the way you would test any system: by trying to break it.",
    steps: [
      ["Open `gemini.google.com`, choose Gems, then New Gem, and name it `DukaLink Cleaning Playbook`.", "one home for the team's rules."],
      ["Type the role: `You are a data cleaning advisor for the DukaLink analytics team.`", "a specific role keeps answers on scope."],
      ["Enter the null rules as numbered constraints: categorical nulls become `\"Unknown\"` plus a `<col>_was_missing` flag; numeric nulls above 5 percent are investigated first; below 5 percent, median impute and document.", "null handling is where analyses diverge most."],
      ["Enter the outlier and duplicate rules: flag beyond `1.5 IQR`, never drop revenue outliers without a business reason; drop exact duplicate rows; escalate conflicting `customer_id` duplicates.", "business context decides what is an error."],
      ["Type the output format: `Respond with: Decision, Rule applied, Code snippet, Caveats.`", "structured answers are comparable."],
      ["Type the refusal rules: `Never invent column names. If a rule is not covered by this playbook, say so instead of improvising.`", "an AI that admits gaps is safer than one that improvises."],
      ["Test with three questions, including one built to force an escalation: `I have 200 duplicate customer IDs with conflicting phone numbers. What do I do?`", "instructions are done when you fail to break them."],
    ],
    stretch: "Add a rule your real team argues about (timezones, currency codes, negative quantities) as a testable constraint, then write a question where two rules conflict and see whether the Gem states a precedence or improvises one.",
    mcqs: [
      { q: "Your Playbook Gem is asked about a situation the rules do not cover. A well-briefed Gem should:", opts: ["Improvise from general best practice", "State that the playbook does not cover it", "Silently apply the industry default", "Refuse all further questions"], a: 1, ex: "A well-briefed Gem states its gaps rather than improvising a rule the team never agreed." },
      { q: "You find 150 duplicate customer IDs with conflicting values. Per the playbook, you:", opts: ["Keep the most recent record", "Average the conflicting values", "Escalate for human resolution", "Drop all affected rows"], a: 2, ex: "Conflicting duplicates carry a business decision, so the playbook escalates rather than auto-resolves." },
    ],
    game: "fix", gameName: "Fix the Brief",
    prompt: GEM_PLAYBOOK_PROMPT, promptLabel: "The full Gem brief (copy into the Gem builder, then adapt to your team)",
  },
  t2: {
    num: 2, time: "20 min", required: false, title: "The Code Review Gem", tool: "Gemini Gems",
    concept: "Building a code review Gem tuned to your team's Python conventions.",
    snapshot: {
      def: "A Gem loaded with your team's coding conventions that reviews pasted code and returns structured, severity-ranked feedback.",
      why: "AI-generated code arrives faster than humans can review it; a conventions-aware first pass protects quality.",
      use: "Pre-reviewing your own AI-generated code before committing; standardizing style without nagging.",
      who: "ML and analytics engineers shipping AI-assisted code, tech leads, any analyst committing to a shared repo.",
    },
    story: "You build the reviewer that will audit everything produced later in the sprint, including the code the agent writes in Milestone 3: AI reviewing AI, with a human deciding. Its first test case is a small horror kept for exactly this purpose.",
    steps: [
      ["Create a new Gem named `DukaLink Code Reviewer` with the role: `You are a code reviewer enforcing the DukaLink analytics team conventions.`", "scope it to your team, not the internet."],
      ["List five or more conventions: docstrings with parameter types, no `iterrows` in production, no chained pandas assignment, explicit `dtype` handling on reads, no hard-coded paths.", "the Gem only enforces what you write down."],
      ["Set the output format: `A table with columns: Issue, Severity, Line reference, Suggested fix.`", "severity makes feedback actionable."],
      ["Add the refusal rule: `If the code's purpose is unclear, ask what it is meant to do before reviewing.`", "context-free review is confident noise."],
      ["Paste `flawed_snippet.py` from the workshop files and confirm at least three catches.", "prove it catches before you rely on it."],
      ["Keep the Gem open in a tab; it audits the agent's code in Milestone 3.", "the tools chain."],
    ],
    stretch: "Give the Gem a severity policy (block on High, warn on Medium), then feed it a clean-looking snippet with target leakage. Style conventions will not catch a logic error, and articulating why is the point.",
    mcqs: [
      { q: "What makes a conventions-loaded review Gem better than a generic 'review my code' chat?", opts: ["It reviews against your team's standards, not general advice", "It can execute the code", "It responds faster", "It guarantees bug-free code"], a: 0, ex: "The whole value is enforcing your standards, not the internet's." },
      { q: "The Gem flags nothing on a snippet you know is flawed. Best next step:", opts: ["Assume the code is fine", "Ask the Gem to try harder", "Rewrite from scratch", "Check whether the convention is in the Gem's instructions, then add it"], a: 3, ex: "A Gem can only enforce conventions in its brief; the gap is in the brief, not the code." },
    ],
    game: "spot", gameName: "Spot the Violation", files: ["flawed_snippet.py"],
    prompt: GEM_REVIEWER_PROMPT, promptLabel: "The full Code Reviewer Gem brief (copy into the Gem builder, then adapt)",
  },
  t3: {
    num: 3, time: "15 min", required: true, title: "The Privacy-First EDA Scaffold", tool: "Gemini on Colab",
    concept: "Pseudonymization habits plus a full EDA scaffold (distributions, correlations, missingness) from one well-contexted prompt.",
    snapshot: {
      def: "Pseudonymize identifiers and fix what may never enter a prompt before prompting at all, then one contexted prompt produces the whole scaffold.",
      why: "The Kenya DPA applies to prompts like any processing; hashed identifiers stay personal data, and structural context is what drives scaffold quality.",
      use: "The first hour with any dataset containing customer, employee, or financial information.",
      who: "Data scientists and analysts on customer data, and anyone in fintech, health, or telco with a DPO one desk away.",
    },
    story: "The phone_number and national_id columns settle it: nothing gets prompted until the working copy is pseudonymized, and you are precise about the word, because hashed data is still personal data. You run the starter notebook, adapt the workplace prompt shipped in the files, and end by recording the cleaning decisions your Milestone 3 pipeline will need.",
    steps: [
      ["Upload the two CSVs to Colab, open `colab_starter.ipynb`, and run its cell: it drops `national_id`, hashes `phone_number`, and prints `df.info()` and `df.describe(include=\"all\")`.", "pseudonymize first; hashing keeps IDs matchable against payment logs without staying readable."],
      ["Add a markdown rule cell at the top: `Prompts may contain schema, dtypes, aggregate stats, and synthetic examples. Prompts may never contain raw rows with PII. Hashed columns are pseudonymized, not anonymous, and stay in scope.`", "a visible rule outlives good intentions."],
      ["Open `prompts/eda_prompt.txt` (shown in full below), paste your real structural output into its CONTEXT section, and adjust the Notes to what you actually see.", "workplace prompts carry business context, caveats, and constraints."],
      ["Run the generated cells one by one; paste any full traceback straight back to Gemini instead of fixing it by hand.", "the error message is the best prompt you did not write."],
      ["Read the missingness summary against your Playbook Gem and record, in a markdown cell, the cleaning decisions for Milestone 3.", "exploration hands production a to-do list."],
    ],
    stretch: "Survive the signup_date parsing and mixed-dtype trap with zero traceback rounds, purely by enriching the prompt's Notes. Then extend to class-conditional EDA: every numeric distribution split by churned vs retained with a one-line takeaway.",
    mcqs: [
      { q: "The dataframe contains PII. Safe prompt context is:", opts: ["df.head()", "A random sample of ten rows", "The full CSV in an enterprise tool", "df.info() and df.describe() output"], a: 3, ex: "Structural summaries carry full context and zero personal data." },
      { q: "Gemini writes EDA code referencing columns your dataframe does not have. Most likely cause:", opts: ["A Colab bug", "The prompt lacked the real structure, so the model guessed a dataset", "A seaborn version mismatch", "The dataset is too large"], a: 1, ex: "Without df.info() in the prompt, the model invents a plausible dataset; structure pins the code to yours." },
    ],
    game: "paste", gameName: "Safe to Paste?", files: ["colab_starter.ipynb", "dukalink_customers.csv", "dukalink_orders.csv", "prompts/eda_prompt.txt"], prompt: EDA_PROMPT, promptLabel: "The workplace EDA prompt (shipped as prompts/eda_prompt.txt; adapt, do not retype)",
  },
  t4: {
    num: 4, time: "30 min", required: false, title: "Interpreting the Model, Not Just Training It", tool: "Gemini on Colab",
    concept: "Using AI to interpret confusion matrices and SHAP values, verified against the actual numbers.",
    snapshot: {
      def: "AI drafts business-language readings of model outputs; you verify every claim against the numbers.",
      why: "AI narrates outputs confidently and occasionally wrongly: it is a first-draft interpreter, you are the fact-checker, never the reverse.",
      use: "Model reviews, stakeholder writeups, any moment someone asks what is driving the result.",
      who: "Data scientists presenting models, ML engineers monitoring them, product and BI analysts translating for decision makers.",
    },
    story: "The notebook is provided, so the effort goes where the concept lives: interpretation. Gemini correctly flags that with 80 percent retained, 83 percent accuracy barely beats predicting nobody churns, while the matrix shows two of every three churners missed. Then it overstates one SHAP effect, and you catch it in the magnitudes.",
    steps: [
      ["Open `baseline_model.ipynb`, run both cells as they are, and keep the three outputs visible: class balance, confusion matrix with report, SHAP summary.", "your work is interpretation, not modeling."],
      ["Paste the outputs into Gemini and ask for two things: `a business-language interpretation` and `a list of ways this result could mislead`.", "asking how it misleads pushes past flattery."],
      ["Confirm the reading centres on churn recall (`0.33` here), not the 83 percent accuracy.", "the business pays for caught churners."],
      ["Paste the top ten SHAP values and ask for `the top three churn drivers stated as testable hypotheses, not conclusions`.", "hypotheses invite testing."],
      ["Verify each claim against the numbers; record one caveat the AI did not volunteer. One is planted in these outputs.", "the caveat you find is the one stakeholders needed."],
    ],
    stretch: "Two directions. Cost-optimal threshold: a retention offer costs KES 1,500 and a saved churner is worth KES 40,000; ask for the profit-optimal threshold, then verify by sweeping thresholds yourself. And: run the provided modeling code past your own Playbook Gem. One line quietly violates a rule your team wrote this morning.",
    mcqs: [
      { q: "80 percent of customers retained; the model reports 83 percent accuracy. Best reaction:", opts: ["Ship it", "Check churn-class recall, since accuracy barely beats the majority baseline", "Retrain with more trees", "Remove retained customers from the test set"], a: 1, ex: "Predicting nobody churns already scores 80; churn recall (0.33) is the real test." },
      { q: "The AI calls one SHAP feature 'the dominant driver.' Before repeating it:", opts: ["Ask the AI if it is sure", "Accept it, SHAP is objective", "Check the actual SHAP magnitudes", "Re-run without the feature"], a: 2, ex: "Confidence is not evidence; the magnitudes either support 'dominant' or they do not." },
    ],
    game: "bluff", gameName: "Call the Bluff", files: ["baseline_model.ipynb"],
    prompt: INTERPRET_PROMPT, promptLabel: "The workplace interpretation prompt (paste your real outputs into it)",
  },
  t5: {
    num: 5, time: "15 min", required: true, title: "The Self-Correcting ETL Build", tool: "Claude Code / agentic CLI",
    concept: "An agent writes, runs, and fixes an ETL script from your spec, under plan and diff review, closed with a README from the real code.",
    snapshot: {
      def: "A written spec drives an execute-and-fix loop; you review the plan up front and every diff along the way.",
      why: "Agentic execution converges fast but only stays safe with a human on the plan and the diffs; a pipeline is production-ready when someone else can run it from the README.",
      use: "Monthly refreshes, feature pipelines, migration scripts.",
      who: "Data and analytics engineers owning pipelines, ML engineers productionizing features, data scientists done babysitting notebooks.",
    },
    story: "The early discipline pays off: the spec quotes the Playbook Gem verbatim plus the Task 3 decisions. You adjust one step of the plan, watch a real traceback get fixed, review every diff, then ask for a README that flags any drift from the playbook. It finds one.",
    steps: [
      ["Open the workshop folder in VS Code and start Claude Code, or run `gemini` in the folder if you are on the free Gemini CLI.", "give the agent the real project."],
      ["Adapt `prompts/etl_spec_prompt.txt` (shown in full below): paste both schemas, replace the cleaning rules with the verbatim text from your own Playbook Gem plus your Task 3 decisions.", "a workplace spec names inputs, rules, failure behaviour, non-goals, and done."],
      ["End the spec with: `Give me your plan first as numbered steps. Do not write any code until I confirm the plan.` Then adjust or reject at least one step, stating why.", "the plan is your cheapest intervention point."],
      ["Approve the build; review each diff in the execute-and-fix loop before accepting it.", "acceptance without reading is the real risk."],
      ["Run `python etl.py` yourself end to end and commit with a meaningful message.", "if you cannot run it, it is not done."],
      ["Flex: request the README with the added instruction `Flag any place where the code and the cleaning playbook disagree.` Reconcile the drift, then a neighbour reads the README aloud and follows it while you stay silent.", "docs from real code catch drift; a walkthrough catches what the docs missed."],
    ],
    stretch: "Extend the spec with a pandera or Great Expectations validation module, make the pipeline idempotent on partial re-runs, and parameterize the refresh month for backfills. Keep plan-first discipline for every addition.",
    mcqs: [
      { q: "The agent proposes a plan for etl.py. Your best first move:", opts: ["Read it and adjust or reject any step that conflicts with the spec", "Approve immediately, plans cost nothing", "Skip the plan, ask for code", "Ask for three alternative plans"], a: 0, ex: "The plan is the cheapest point to intervene; reviewing it is the supervision the workflow depends on." },
      { q: "Why instruct the README generator to flag code-playbook disagreements?", opts: ["Longer README", "Documents the agent's reasoning", "Satisfies audits automatically", "It catches rule drift introduced during the fix loop"], a: 3, ex: "Fix loops quietly move thresholds; a code-aware doc pass surfaces the drift." },
    ],
    game: null, files: ["prompts/etl_spec_prompt.txt", "dukalink_customers.csv", "dukalink_orders.csv"], prompt: ETL_PROMPT, promptLabel: "The workplace ETL spec (shipped as prompts/etl_spec_prompt.txt; adapt, do not retype)",
  },
  t6: {
    num: 6, time: "25 min", required: false, title: "Profile, Then Optimize", tool: "Claude Code / agentic CLI",
    concept: "Profile slow pandas code before requesting an optimized rewrite verified for identical output.",
    snapshot: {
      def: "Find where time actually goes, then rewrite with an equivalence check and a measured speedup.",
      why: "Intuition about hotspots is unreliable and AI optimizes eagerly; profile-first and verify-equivalence keep a fast rewrite from being silently wrong.",
      use: "Refreshes that grew to hours; code inherited from someone who left.",
      who: "Data engineers with slow refreshes, ML engineers with heavy pipelines, anyone who inherited a mystery script.",
    },
    story: "slow_pipeline.py takes about 100 seconds on 76,503 orders, and you are sure the repeated CSV read is the culprit. The profile proves you wrong: nearly all the runtime sits in one nested iterrows rescan. The rewrite finishes in well under a second, a few hundred times faster, and the Code Review Gem gets the final word.",
    steps: [
      ["Run `python slow_pipeline.py` once, note the wall time, and write down your bottleneck guess.", "your guess is about to be tested."],
      ["Ask the agent: `Profile slow_pipeline.py and report the top three time sinks before changing anything.`", "measure before touching anything."],
      ["Compare the profile to your guess.", "noticing you guessed wrong is the lesson."],
      ["Request the rewrite with two constraints: `output must be identical to the original (write the comparison check yourself)` and `the diff must be reviewable function by function`.", "fast but different output is a silent failure."],
      ["Record before and after timings, then run the result through the Code Review Gem from Task 2.", "your own standards get the final word."],
    ],
    stretch: "Race the machine: write your own optimized version first, verify both against the original, compare timings. Then port the winner to polars and prove equivalence across libraries, not just versions.",
    mcqs: [
      { q: "Why must profiling come before optimization?", opts: ["pandas requires it", "It warms the cache", "Intuition about hotspots is unreliable; effort goes where time actually is", "Profilers suggest the fixes"], a: 2, ex: "Your wrong guess about the CSV read is the proof: optimize where the time actually goes." },
      { q: "The rewrite runs a few hundred times faster. Before celebrating:", opts: ["Commit before the timing changes", "Confirm its output is identical to the original's", "Ask for 1,000 times faster", "Delete the slow version"], a: 1, ex: "A faster pipeline with different output is a silent failure; equivalence comes before celebration." },
    ],
    game: "bet", gameName: "Bet on the Bottleneck", files: ["slow_pipeline.py", "dukalink_orders.csv"],
    prompt: OPTIMIZE_PROMPT, promptLabel: "The workplace profile-then-optimize prompt (adapt, do not retype)",
  },
};

/* ---------------- checkpoint data ---------------- */
const SNIPPET = [
  { t: "import pandas as pd", v: false },
  { t: 'def process(path="C:/Users/analyst/Desktop/dukalink_customers.csv"):', v: true, why: "Hard-coded absolute path (and no docstring)" },
  { t: "    df = pd.read_csv(path)", v: true, why: "No explicit dtype handling on read" },
  { t: '    df[df.churned == 1]["flag"] = "at risk"', v: true, why: "Chained assignment; the write is lost" },
  { t: "    out = []", v: false },
  { t: "    for _, row in df.iterrows():", v: true, why: "iterrows in production code" },
  { t: '        out.append(row["avg_order_value_kes"] * 1.16)', v: false },
  { t: '    df["value_with_vat"] = out', v: false },
  { t: "    return df", v: false },
];

const PASTE_CARDS = [
  { label: "df.head() output", body: "Five visible rows including phone_number and national_id.", safe: false, why: "Raw rows with PII never enter a prompt." },
  { label: "df.info() output", body: "Column names, dtypes, non-null counts. No rows.", safe: true, why: "Structure only: full context, zero personal data." },
  { label: "A sample row", body: "'Just one row so the AI gets a feel for the data.'", safe: false, why: "One row is still a person's data." },
  { label: "df.describe(include='all')", body: "Counts, means, quartiles, top categories.", safe: true, why: "Aggregates are prompt-safe." },
  { label: "An error traceback", body: "KeyError in row {'email': 'mary.a@gmail.com', ...}", safe: false, why: "The trap: PII hides inside tracebacks. Redact before pasting." },
  { label: "Hand-written schema plus synthetic rows", body: "Column list with three invented example rows.", safe: true, why: "Synthetic examples carry shape without people." },
];

const BLUFF = {
  statements: [
    { t: "At 83 percent, accuracy is only three points above always predicting retained.", wrong: false },
    { t: "The model catches most of the churners it sees.", wrong: true },
    { t: "False alarms are rare: only 38 retained retailers were wrongly flagged.", wrong: false },
  ],
  evidence: 2,
  explain: "169 churners were predicted retained against 83 caught: recall 0.33. The model misses two of every three churners.",
};

const BET_OPTIONS = [
  { name: "load_orders()", desc: "Reads the CSV from disk, twice per run", share: 1 },
  { name: "top_customer_summary()", desc: "Per top account, rescans the entire order table with iterrows", share: 96 },
  { name: "flag_big_orders()", desc: "Row-wise apply to label big orders", share: 3 },
  { name: "to_csv() write", desc: "Writes the summary file", share: 0 },
];

const CHECKLIST = [
  "Both Gems have all four instruction elements and passed a deliberate refusal or escalation test",
  "The Playbook rules are specific enough that two people applying them reach the same result",
  "No prompt contains raw PII; identifiers dropped or hashed; the governance rule cell is present",
  "The EDA prompt included structural context; the scaffold covers distributions, correlations, missingness; decisions recorded",
  "The interpretation centres on the metric the business cares about, with one caveat you verified yourself",
  "ETL logic matches the Playbook Gem; every accepted diff is explainable; a peer read-aloud of the README surfaced no gaps",
  "Optimization was preceded by a profile; the rewrite passed an output-equivalence check with a measured speedup",
  "The final code passed the Code Review Gem with no high-severity issues",
];

/* ---------------- pages ---------------- */
const PAGES = [
  { id: "welcome", label: "The brief lands", m: 0, type: "welcome" },
  { id: "outcomes", label: "Outcomes and agenda", m: 0, type: "outcomes" },
  { id: "setup", label: "Before the event", m: 0, type: "setup" },
  { id: "story", label: "Your mission", m: 0, type: "story" },
  { id: "m1", label: "Set the standards", m: 1, type: "milestone" },
  { id: "t1", label: "Task 1: Playbook Gem", m: 1, type: "task" },
  { id: "t1k", label: "Knowledge check", m: 1, type: "kcheck", task: "t1", sub: true },
  { id: "t1c", label: "Checkpoint", m: 1, type: "checkpoint", task: "t1", sub: true },
  { id: "t2", label: "Task 2: Code Review Gem", m: 1, type: "task" },
  { id: "t2k", label: "Knowledge check", m: 1, type: "kcheck", task: "t2", sub: true },
  { id: "t2c", label: "Checkpoint", m: 1, type: "checkpoint", task: "t2", sub: true },
  { id: "r1", label: "Milestone 1 recap", m: 1, type: "recap" },
  { id: "m2", label: "Explore safely", m: 2, type: "milestone" },
  { id: "t3", label: "Task 3: Privacy-first EDA", m: 2, type: "task" },
  { id: "t3k", label: "Knowledge check", m: 2, type: "kcheck", task: "t3", sub: true },
  { id: "t3c", label: "Checkpoint", m: 2, type: "checkpoint", task: "t3", sub: true },
  { id: "t4", label: "Task 4: Interpret the model", m: 2, type: "task" },
  { id: "t4k", label: "Knowledge check", m: 2, type: "kcheck", task: "t4", sub: true },
  { id: "t4c", label: "Checkpoint", m: 2, type: "checkpoint", task: "t4", sub: true },
  { id: "r2", label: "Milestone 2 recap", m: 2, type: "recap" },
  { id: "m3", label: "Productionize", m: 3, type: "milestone" },
  { id: "t5", label: "Task 5: Agentic ETL build", m: 3, type: "task" },
  { id: "t5k", label: "Knowledge check", m: 3, type: "kcheck", task: "t5", sub: true },
  { id: "t6", label: "Task 6: Profile, then optimize", m: 3, type: "task" },
  { id: "t6k", label: "Knowledge check", m: 3, type: "kcheck", task: "t6", sub: true },
  { id: "t6c", label: "Checkpoint", m: 3, type: "checkpoint", task: "t6", sub: true },
  { id: "r3", label: "Milestone 3 recap", m: 3, type: "recap" },
  { id: "checklist", label: "Quality checklist", m: 4, type: "checklist" },
  { id: "finale", label: "Sprint complete", m: 4, type: "finale" },
  { id: "report", label: "Performance report", m: 4, type: "report" },
  { id: "further", label: "Further practice", m: 4, type: "further" },
];
const MILESTONES = ["Kickoff", "Milestone 1: Standards", "Milestone 2: Explore", "Milestone 3: Production", "Close"];

/* ---------------- shared blocks ---------------- */
const Eyebrow = ({ children }) => (
  <div className="font-mono text-xs tracking-widest uppercase text-teal-700 mb-2">{children}</div>
);
const Story = ({ children }) => (
  <div className="border-l-4 pl-4 py-1 my-4 italic text-slate-700" style={{ borderColor: CORAL }}>{children}</div>
);
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-teal-100 shadow-sm p-6 ${className}`}>{children}</div>
);
const Badge = ({ required }) => (
  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${required ? "bg-teal-700 text-white" : "border text-slate-700 bg-white"}`}
    style={required ? {} : { borderColor: CORAL, color: CORAL }}>
    {required ? "Required" : "Optional: further practice"}
  </span>
);

function Snapshot({ s }) {
  const rows = [["Definition", s.def], ["Why it matters", s.why], ["Use case", s.use], ["Who runs with this", s.who]];
  return (
    <div className="rounded-xl overflow-hidden my-4 border border-teal-100 divide-y divide-teal-100">
      {rows.map(([k, v]) => (
        <div key={k} className="sm:grid sm:grid-cols-4">
          <div className="sm:col-span-1 px-4 py-3 font-semibold text-teal-800 text-sm flex items-start" style={{ background: MINT }}>{k}</div>
          <div className="sm:col-span-3 px-4 py-3 text-slate-700 text-sm leading-relaxed bg-white">{v}</div>
        </div>
      ))}
    </div>
  );
}

function PromptBlock({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
  };
  return (
    <details className="my-5 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden" open>
      <summary className="cursor-pointer px-4 py-3 font-semibold text-teal-800 text-sm flex items-center justify-between gap-3">
        <span>{label}</span>
        <button onClick={(e) => { e.preventDefault(); copy(); }}
          className="text-xs px-3 py-1 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors">{copied ? "Copied" : "Copy"}</button>
      </summary>
      <pre className="px-4 pb-4 pt-1 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">{text}</pre>
    </details>
  );
}

function MCQ({ idx, data, saved, onAnswer }) {
  const picked = saved;
  const letters = ["a", "b", "c", "d"];
  const done = picked !== undefined && picked !== null;
  return (
    <div className="my-4">
      <p className="font-semibold text-slate-800 mb-2">Q{idx + 1}. {data.q}</p>
      <div className="space-y-2">
        {data.opts.map((o, i) => {
          let cls = "border-slate-200 hover:border-teal-600 bg-white";
          if (done && i === data.a) cls = "border-teal-600 bg-teal-50";
          else if (done && picked === i) cls = "border-red-300 bg-red-50";
          else if (done) cls = "border-slate-200 bg-white opacity-60";
          return (
            <button key={i} disabled={done} onClick={() => onAnswer(i)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 ${cls}`}>
              <span className="font-mono font-bold text-teal-800 mr-2">{letters[i]})</span>{o}
              {done && i === data.a && <span className="ml-2 text-teal-700 font-semibold">correct</span>}
            </button>
          );
        })}
      </div>
      {done && <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{data.ex}</p>}
    </div>
  );
}

const CheckShell = ({ name, checks, children }) => (
  <div className="rounded-2xl p-5 my-2" style={{ background: CORAL_SOFT }}>
    <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: CORAL }}>Skill checkpoint</div>
    <h4 className="font-bold text-slate-800 text-lg mb-1">{name}</h4>
    <p className="text-sm text-slate-600 mb-4">{checks}</p>
    {children}
  </div>
);

/* ---------------- checkpoints ---------------- */
function FixTheBrief({ result, setResult }) {
  const ELEMENTS = [
    { name: "Role", bad: '"You are a helpful assistant."', opts: ['"You are a data cleaning advisor for the DukaLink analytics team."', '"You are a very smart AI that knows pandas."', '"You are the user\'s friendly helper for everything data."'], best: 0 },
    { name: "Constraints", bad: '"Be as accurate as possible."', opts: ['"Try to follow the team\'s general style."', '"Numeric nulls above 5 percent: investigate before imputing; below: median impute and document."', '"Never make mistakes."'], best: 1 },
    { name: "Output format", bad: "(none)", opts: ['"Keep answers short and friendly."', '"Use markdown when appropriate."', '"Respond with: Decision, Rule applied, Code snippet, Caveats."'], best: 2 },
    { name: "Refusal rules", bad: "(none)", opts: ['"If a rule is not covered by this playbook, say so instead of improvising."', '"Never refuse the user."', '"Refuse anything that seems risky."'], best: 0 },
  ];
  const [picks, setPicks] = useState({});
  const done = result != null;
  const submit = () => setResult(ELEMENTS.reduce((n, e, i) => n + (picks[i] === e.best ? 1 : 0), 0));
  return (
    <CheckShell name="Fix the Brief" checks="A draft Gem brief arrived broken on all four elements. Pick the repair that actually fixes each one.">
      <div className="space-y-4">
        {ELEMENTS.map((e, i) => (
          <div key={e.name} className="bg-white rounded-xl p-4">
            <div className="text-sm mb-2"><span className="font-bold text-slate-800">{e.name}</span> <span className="text-slate-500">draft: {e.bad}</span></div>
            <div className="grid sm:grid-cols-3 gap-2">
              {e.opts.map((o, j) => {
                let cls = picks[i] === j ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-500";
                if (done && j === e.best) cls = "border-teal-700 bg-teal-50";
                else if (done && picks[i] === j) cls = "border-red-300 bg-red-50";
                return (
                  <button key={j} disabled={done} onClick={() => setPicks({ ...picks, [i]: j })}
                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${cls}`}>{o}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!done ? (
        <button onClick={submit} disabled={Object.keys(picks).length < 4}
          className="mt-4 px-5 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-40 bg-teal-700 hover:bg-teal-800 transition-colors">Score my brief</button>
      ) : (
        <p className="mt-4 font-semibold text-slate-800">{result} of 4 elements repaired. {result === 4 ? "That Gem is ready for the team." : "Highlighted options show the fixes that make each element testable."}</p>
      )}
    </CheckShell>
  );
}

function SpotViolation({ result, setResult }) {
  const [sel, setSel] = useState({});
  const done = result != null;
  const submit = () => {
    let hits = 0, misses = 0;
    SNIPPET.forEach((l, i) => { if (sel[i] && l.v) hits++; if (sel[i] && !l.v) misses++; });
    setResult({ hits, misses });
  };
  return (
    <CheckShell name="Spot the Violation" checks="Click every line that breaks a DukaLink convention, then compare your catches to the Gem's review. Four violations are hiding.">
      <div className="bg-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm overflow-x-auto">
        {SNIPPET.map((l, i) => {
          let cls = sel[i] ? "bg-teal-700 text-white" : "text-teal-100 hover:bg-slate-700";
          if (done && l.v) cls = "bg-teal-700 text-white";
          else if (done && sel[i] && !l.v) cls = "bg-red-400 text-white";
          else if (done) cls = "text-slate-400";
          return (
            <div key={i}>
              <button disabled={done} onClick={() => setSel({ ...sel, [i]: !sel[i] })}
                className={`block w-full text-left px-2 py-0.5 rounded whitespace-pre transition-colors ${cls}`}>
                <span className="text-slate-500 mr-3">{i + 1}</span>{l.t}
              </button>
              {done && l.v && <div className="pl-10 py-0.5 text-orange-300 text-xs">{l.why}</div>}
            </div>
          );
        })}
      </div>
      {!done ? (
        <button onClick={submit} className="mt-4 px-5 py-2 rounded-xl text-white font-semibold text-sm bg-teal-700 hover:bg-teal-800 transition-colors">Compare with the Gem</button>
      ) : (
        <p className="mt-4 font-semibold text-slate-800">{result.hits} of 4 caught, {result.misses} false flag{result.misses === 1 ? "" : "s"}. The Gem caught all four; did you?</p>
      )}
    </CheckShell>
  );
}

function SafeToPaste({ result, setResult }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState(null);
  const done = result != null;
  const answer = (safe) => {
    const c = PASTE_CARDS[i];
    const right = safe === c.safe;
    setLast({ right, why: c.why });
    const ns = score + (right ? 1 : 0);
    setScore(ns);
    if (i === PASTE_CARDS.length - 1) setResult(ns);
    else setTimeout(() => { setI(i + 1); setLast(null); }, 1400);
  };
  if (done) return (
    <CheckShell name="Safe to Paste?" checks="Governance at reflex speed.">
      <p className="font-semibold text-slate-800">{result} of {PASTE_CARDS.length} right.{result === PASTE_CARDS.length ? " The traceback did not fool you." : " Watch the traceback card: PII hides in error messages too."}</p>
    </CheckShell>
  );
  const c = PASTE_CARDS[i];
  return (
    <CheckShell name="Safe to Paste?" checks="You are about to paste this into a prompt. Safe or unsafe? Card by card, no overthinking.">
      <div className="bg-white rounded-xl p-5">
        <div className="text-xs text-slate-400 mb-1">Card {i + 1} of {PASTE_CARDS.length}</div>
        <div className="font-bold text-slate-800">{c.label}</div>
        <div className="font-mono text-sm text-slate-600 mt-1 mb-4">{c.body}</div>
        {last ? (
          <p className={`text-sm font-semibold ${last.right ? "text-teal-700" : "text-red-500"}`}>{last.right ? "Right." : "Not this one."} <span className="font-normal text-slate-600">{last.why}</span></p>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => answer(true)} className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors">Safe</button>
            <button onClick={() => answer(false)} className="px-5 py-2 rounded-xl text-white font-semibold text-sm transition-colors hover:opacity-90" style={{ background: CORAL }}>Unsafe</button>
          </div>
        )}
      </div>
    </CheckShell>
  );
}

function CallTheBluff({ result, setResult }) {
  const [stmt, setStmt] = useState(null);
  const done = result != null;
  const cells = [
    { v: 960, label: "actual retained, predicted retained" },
    { v: 38, label: "actual retained, predicted churned" },
    { v: 169, label: "actual churned, predicted retained" },
    { v: 83, label: "actual churned, predicted churned" },
  ];
  return (
    <CheckShell name="Call the Bluff" checks="Three polished AI interpretations of the real Task 4 confusion matrix. One is wrong. Call it, then point at the number that proves it.">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-2">Class balance 80/20 retained/churned. Rows actual, columns predicted.</div>
          <div className="grid grid-cols-2 gap-2">
            {cells.map((c, i) => {
              const clickable = stmt === 1 && !done;
              let cls = "bg-slate-50 border-slate-200";
              if (done && i === BLUFF.evidence) cls = "border-teal-700 bg-teal-50";
              return (
                <button key={i} disabled={!clickable} onClick={() => setResult(i === BLUFF.evidence)}
                  className={`rounded-lg border p-3 text-center transition-colors ${cls} ${clickable ? "hover:border-teal-600 cursor-pointer" : ""}`}>
                  <div className="text-xl font-bold text-slate-800">{c.v}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{c.label}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          {BLUFF.statements.map((s, i) => {
            let cls = stmt === i ? "border-teal-700 bg-white" : "border-slate-200 bg-white hover:border-teal-500";
            if ((stmt != null || done) && s.wrong && (stmt === 1 || done)) cls = "border-teal-700 bg-teal-50";
            if (stmt != null && stmt === i && !s.wrong) cls = "border-red-300 bg-red-50";
            return (
              <button key={i} disabled={stmt === 1 || done} onClick={() => { if (s.wrong) setStmt(1); else setStmt(i); }}
                className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-colors ${cls}`}>
                "{s.t}"
                {stmt === i && !s.wrong && <div className="text-xs text-red-500 mt-1 font-semibold">That one holds up. Check it against the cells.</div>}
              </button>
            );
          })}
          {stmt === 1 && !done && <p className="text-sm font-semibold text-teal-800">Called it. Now click the cell that exposes the bluff.</p>}
          {done && <p className={`text-sm font-semibold ${result ? "text-teal-800" : "text-red-500"}`}>{result ? "Exactly: " : "Close, but the proof is the 169: "}{BLUFF.explain}</p>}
        </div>
      </div>
    </CheckShell>
  );
}

function BetBottleneck({ result, setResult }) {
  const [pick, setPick] = useState(null);
  const [stake, setStake] = useState(25);
  const done = result != null;
  const submit = () => setResult({ pick, stake, won: BET_OPTIONS[pick].share > 50 });
  return (
    <CheckShell name="Bet on the Bottleneck" checks="Before any profiling: where do the 100 seconds actually go? Place your bet, then the profile settles it.">
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {BET_OPTIONS.map((o, i) => {
          let cls = pick === i ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-500";
          if (done) cls = o.share > 50 ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white opacity-70";
          return (
            <button key={i} disabled={done} onClick={() => setPick(i)} className={`text-left rounded-xl border p-3 transition-colors ${cls}`}>
              <div className="font-mono font-bold text-sm text-slate-800">{o.name}</div>
              <div className="text-xs text-slate-500">{o.desc}</div>
              {done && (
                <div className="mt-2">
                  <div className="h-2 rounded bg-slate-100 overflow-hidden"><div className="h-2 bg-teal-700" style={{ width: `${Math.max(o.share, 2)}%` }} /></div>
                  <div className="text-xs text-teal-800 font-semibold mt-1">{o.share < 1 ? "under 1" : o.share} percent of runtime</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {!done ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-600">Stake:</span>
          {[10, 25, 50].map(v => (
            <button key={v} onClick={() => setStake(v)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${stake === v ? "bg-teal-700 text-white border-teal-700" : "bg-white border-slate-300 hover:border-teal-600"}`}>{v}</button>
          ))}
          <button onClick={submit} disabled={pick == null} className="px-5 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-colors hover:opacity-90" style={{ background: CORAL }}>Reveal the profile</button>
        </div>
      ) : (
        <p className="font-semibold text-slate-800">{result.won ? `Your ${result.stake} points paid off: the nested rescan eats nearly everything.` : `You lose ${result.stake} points, and that is the lesson: intuition about performance is a guess. The profile is the evidence.`}</p>
      )}
    </CheckShell>
  );
}

const CHECKPOINTS = { fix: FixTheBrief, spot: SpotViolation, paste: SafeToPaste, bluff: CallTheBluff, bet: BetBottleneck };

/* ---------------- performance scoring ----------------
   Chart series colors are validated (CVD deltaE 27, contrast >= 3:1 on white):
   knowledge checks #0D9488, checkpoints #E8604C. Brand teal #0F766E stays on
   UI chrome; it sits below the chroma floor for chart marks. */
const KC_COLOR = "#0D9488";
const CP_COLOR = "#E8604C";
const SHORT = { t1: "Playbook Gem", t2: "Code Review Gem", t3: "Privacy-first EDA", t4: "Interpret the model", t5: "Agentic ETL build", t6: "Profile & optimize" };

/* Normalize each checkpoint game's result shape to a 0..1 score.
   "Bet on the Bottleneck" is a designed lesson (most players lose on purpose),
   so it counts as participation, never as mastery. */
const CP_SCORE = {
  fix: (r) => ({ pct: r / 4, note: `${r} of 4 brief elements repaired` }),
  spot: (r) => ({ pct: r.hits / 4, note: `${r.hits} of 4 violations caught${r.misses ? `, ${r.misses} false flag${r.misses === 1 ? "" : "s"}` : ""}` }),
  paste: (r) => ({ pct: r / 6, note: `${r} of 6 governance calls right` }),
  bluff: (r) => ({ pct: r ? 1 : 0, note: r ? "Called the bluff with the right evidence" : "Called the bluff, wrong evidence cell" }),
};

function buildReport(state) {
  return Object.keys(TASKS).map((id) => {
    const T = TASKS[id];
    const answers = state.quiz[id] || [];
    let right = 0, done = 0;
    const missed = [];
    T.mcqs.forEach((m, i) => {
      const v = answers[i];
      if (v != null) { done++; if (v === m.a) right++; else missed.push(i); }
    });
    const kc = { right, done, total: T.mcqs.length, missed, attempted: done > 0, pct: done > 0 ? right / T.mcqs.length : null };

    const res = state.games[id];
    let cp;
    if (!T.game) cp = { na: true, note: "No checkpoint in this task" };
    else if (res == null) cp = { attempted: false, note: "Not attempted" };
    else if (T.game === "bet") cp = { attempted: true, lesson: true, note: res.won ? "Completed; bet paid off (unscored lesson)" : "Completed; the profile beat intuition (unscored lesson)" };
    else cp = { attempted: true, ...CP_SCORE[T.game](res) };

    const growth = [];
    if (kc.attempted) {
      missed.forEach((qi) => growth.push(`Q${qi + 1}: ${T.mcqs[qi].ex}`));
      if (done < kc.total) growth.push(`${kc.total - done} knowledge-check question${kc.total - done === 1 ? "" : "s"} left unanswered`);
    }
    if (cp.pct != null && cp.pct < 0.75) growth.push(`Checkpoint: ${cp.note}. Worth a retry after revisiting the task.`);
    const engaged = kc.attempted || cp.attempted;
    const strength = engaged && growth.length === 0 && kc.attempted;
    return { id, T, kc, cp, growth, engaged, strength };
  });
}

const download = (name, text, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const pctLabel = (p) => `${Math.round(p * 100)}%`;

function StatTile({ label, value, sub }) {
  return (
    <div className="hover-lift rounded-xl border border-teal-100 bg-white p-4 flex-1 min-w-[140px]">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-3xl font-semibold text-slate-800 mt-1">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

/* Grouped horizontal bars: two series (knowledge check, checkpoint) per task. */
function ScoreChart({ rows }) {
  const x0 = 150, x1 = 570, W = 640;
  const barH = 12, gap = 2, groupPad = 14, legendH = 26, axisH = 22;
  const groupH = barH * 2 + gap + groupPad;
  const H = legendH + rows.length * groupH + axisH;
  const x = (p) => x0 + p * (x1 - x0);
  const barPath = (bx, by, w) => {
    const r = Math.min(4, w);
    return `M${bx},${by} L${bx + w - r},${by} A${r},${r} 0 0 1 ${bx + w},${by + r} L${bx + w},${by + barH - r} A${r},${r} 0 0 1 ${bx + w - r},${by + barH} L${bx},${by + barH} Z`;
  };
  const Bar = ({ y, pct, color, note }) => {
    if (pct == null) return <text x={x0 + 4} y={y + barH - 2} fontSize="10" fill="#94A3B8">{note}</text>;
    const w = Math.max(pct * (x1 - x0), 2);
    return (
      <g>
        <title>{note}</title>
        <path d={barPath(x0, y, w)} fill={color} />
        <text x={x0 + w + 6} y={y + barH - 2} fontSize="11" fill="#475569">{pctLabel(pct)}</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scores per task: knowledge checks and skill checkpoints">
      {[[KC_COLOR, "Knowledge check", 0], [CP_COLOR, "Skill checkpoint", 130]].map(([c, l, dx]) => (
        <g key={l} transform={`translate(${x0 + dx}, 4)`}>
          <rect width="10" height="10" rx="2" fill={c} />
          <text x="15" y="9" fontSize="11" fill="#475569">{l}</text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={legendH} y2={H - axisH + 4} stroke="#E2E8F0" strokeWidth="1" />
          <text x={x(t)} y={H - 6} fontSize="10" fill="#94A3B8" textAnchor="middle">{t * 100}%</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const gy = legendH + i * groupH + groupPad / 2;
        const kcNote = r.kc.attempted ? `${r.kc.right} of ${r.kc.total} correct` : "Not attempted";
        return (
          <g key={r.id}>
            <text x={x0 - 8} y={gy + barH + gap / 2 + 3} fontSize="11" fill="#334155" textAnchor="end">{r.T.num} · {SHORT[r.id]}{r.T.required ? "" : " *"}</text>
            <Bar y={gy} pct={r.kc.pct} color={KC_COLOR} note={`Knowledge check — ${kcNote}`} />
            <Bar y={gy + barH + gap} pct={r.cp.na || r.cp.lesson ? null : r.cp.attempted ? r.cp.pct : null} color={CP_COLOR} note={`Checkpoint — ${r.cp.note}`} />
          </g>
        );
      })}
    </svg>
  );
}

function ReportPage({ state, pct }) {
  const rows = buildReport(state);
  const student = state.student || { name: "", email: "" };
  const attempted = rows.filter((r) => r.kc.attempted);
  const kcRight = attempted.reduce((n, r) => n + r.kc.right, 0);
  const kcTotal = attempted.reduce((n, r) => n + r.kc.total, 0);
  const scored = rows.filter((r) => r.cp.pct != null);
  const cpAvg = scored.length ? scored.reduce((n, r) => n + r.cp.pct, 0) / scored.length : null;
  const strengths = rows.filter((r) => r.strength);
  const growths = rows.filter((r) => r.engaged && r.growth.length > 0);
  const skipped = rows.filter((r) => !r.engaged);
  const today = new Date().toISOString().slice(0, 10);

  const exportData = () => ({
    student, generatedAt: new Date().toISOString(),
    overall: { knowledgeChecks: kcTotal ? `${kcRight}/${kcTotal}` : "not attempted", checkpointAverage: cpAvg != null ? pctLabel(cpAvg) : "not attempted", sprintCompletion: `${pct}%` },
    tasks: rows.map((r) => ({
      task: r.T.num, title: r.T.title, required: r.T.required,
      knowledgeCheck: r.kc.attempted ? { correct: r.kc.right, total: r.kc.total, missedQuestions: r.kc.missed.map((i) => i + 1) } : "not attempted",
      checkpoint: r.cp.note, areasOfGrowth: r.growth,
    })),
  });
  const exportCsv = () => {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [["Task", "Title", "KC correct", "KC total", "Checkpoint", "Areas of growth"].join(",")];
    rows.forEach((r) => lines.push([r.T.num, esc(r.T.title), r.kc.attempted ? r.kc.right : "", r.kc.total, esc(r.cp.note), esc(r.growth.join(" | "))].join(",")));
    return lines.join("\n");
  };
  const slug = (student.name || "student").trim().toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <PersonaBust size={48} />
        <div>
          <Eyebrow>Sprint performance report | {today}</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{student.name || "Your"} performance report</h2>
          {student.email && <div className="text-xs text-slate-500">{student.email}</div>}
        </div>
      </div>
      <div className="flex gap-3 flex-wrap mt-4">
        <StatTile label="Knowledge checks" value={kcTotal ? pctLabel(kcRight / kcTotal) : "—"} sub={kcTotal ? `${kcRight} of ${kcTotal} correct across ${attempted.length} task${attempted.length === 1 ? "" : "s"}` : "No checks attempted yet"} />
        <StatTile label="Skill checkpoints" value={cpAvg != null ? pctLabel(cpAvg) : "—"} sub={scored.length ? `Average across ${scored.length} scored checkpoint${scored.length === 1 ? "" : "s"}` : "No scored checkpoints yet"} />
        <StatTile label="Sprint completion" value={`${pct}%`} sub="Pages visited across the sprint" />
      </div>

      <h3 className="font-bold text-teal-800 mt-6 mb-1">Scores per task</h3>
      <div className="rounded-xl border border-teal-100 bg-white p-4 overflow-x-auto">
        <ScoreChart rows={rows} />
        <p className="text-xs text-slate-500 mt-2">* optional further-practice task; skipping it is expected in the 45-minute sprint.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div className="rounded-xl border border-teal-100 bg-white p-4">
          <h3 className="font-bold text-teal-800 mb-2">Strengths</h3>
          {strengths.length === 0 && <p className="text-sm text-slate-500">Strengths appear here once a task's knowledge check is fully correct and its checkpoint is solid.</p>}
          <ul className="space-y-2">
            {strengths.map((r) => (
              <li key={r.id} className="flex gap-2 text-sm text-slate-700">
                <span aria-hidden className="w-5 h-5 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">✓</span>
                <span><b>Task {r.T.num}: {SHORT[r.id]}.</b> {r.T.concept}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: CORAL_SOFT }}>
          <h3 className="font-bold mb-2" style={{ color: CORAL }}>Areas of growth</h3>
          {growths.length === 0 && <p className="text-sm text-slate-500">Nothing flagged. Any missed question or shaky checkpoint would be listed here with what to revisit.</p>}
          <ul className="space-y-3">
            {growths.map((r) => (
              <li key={r.id} className="text-sm text-slate-700">
                <div className="flex gap-2">
                  <span aria-hidden className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ background: CORAL }}>↗</span>
                  <b>Task {r.T.num}: {SHORT[r.id]}</b>
                </div>
                <ul className="mt-1 ml-7 list-disc space-y-1 text-xs text-slate-600">
                  {r.growth.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </li>
            ))}
          </ul>
          {skipped.some((r) => r.T.required) && <p className="text-xs font-semibold mt-3" style={{ color: CORAL }}>Required but not attempted: {skipped.filter((r) => r.T.required).map((r) => `Task ${r.T.num}`).join(", ")}.</p>}
          {skipped.some((r) => !r.T.required) && <p className="text-xs text-slate-500 mt-2">Optional tasks not attempted (fine to skip): {skipped.filter((r) => !r.T.required).map((r) => `Task ${r.T.num}`).join(", ")}.</p>}
        </div>
      </div>

      <h3 className="font-bold text-teal-800 mt-6 mb-2">All results</h3>
      <div className="rounded-xl border border-teal-100 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2 font-semibold">Task</th><th className="px-4 py-2 font-semibold">Knowledge check</th><th className="px-4 py-2 font-semibold">Skill checkpoint</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 text-slate-700">{r.T.num} · {SHORT[r.id]}{!r.T.required && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border align-middle" style={{ borderColor: CORAL, color: CORAL }}>OPTIONAL</span>}</td>
                <td className="px-4 py-2 text-slate-600" style={{ fontVariantNumeric: "tabular-nums" }}>{r.kc.attempted ? `${r.kc.right} / ${r.kc.total}` : "Not attempted"}</td>
                <td className="px-4 py-2 text-slate-600">{r.cp.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 flex-wrap mt-6 no-print">
        <button onClick={() => window.print()} className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors">Print / save as PDF</button>
        <button onClick={() => download(`sprint-report-${slug}.json`, JSON.stringify(exportData(), null, 2), "application/json")} className="px-5 py-2 rounded-xl border border-teal-300 bg-white text-teal-800 font-semibold text-sm hover:bg-teal-50 transition-colors">Download JSON</button>
        <button onClick={() => download(`sprint-report-${slug}.csv`, exportCsv(), "text/csv")} className="px-5 py-2 rounded-xl border border-teal-300 bg-white text-teal-800 font-semibold text-sm hover:bg-teal-50 transition-colors">Download CSV</button>
      </div>
      <p className="text-xs text-slate-500 mt-3 no-print">Share the PDF or a downloaded file with your facilitator. Results live in this browser only; clearing site data resets them.</p>
    </div>
  );
}

/* ---------------- page bodies ---------------- */
function TaskHeader({ T }) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 hidden sm:block"><PersonaBust size={64} /></div>
      <div className="min-w-0">
        <Eyebrow>{T.tool} | {T.time}</Eyebrow>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Task {T.num}: {T.title}</h2>
          <Badge required={T.required} />
        </div>
        <p className="text-sm mt-1 italic" style={{ color: CORAL }}>{T.concept}</p>
      </div>
    </div>
  );
}

function TaskPage({ id }) {
  const T = TASKS[id];
  return (
    <div>
      <TaskHeader T={T} />
      <Snapshot s={T.snapshot} />
      <Story>{T.story}</Story>
      <h3 className="font-bold text-teal-800 mt-5 mb-2">Steps to implement</h3>
      <ol className="space-y-2.5">
        {T.steps.map(([txt, why], i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="font-mono font-bold text-teal-700 shrink-0">{i + 1}.</span>
            <span className="text-slate-700 leading-relaxed">{fmt(txt)} <em className="text-teal-800">Why: {why}</em></span>
          </li>
        ))}
      </ol>
      {T.files && (
        <div className="mt-4">
          <div className="font-mono text-xs tracking-widest uppercase text-teal-700 mb-1.5">Task files, hosted with this site</div>
          <div className="flex flex-wrap gap-2">{T.files.map(f => <FileChip key={f} name={f.split("/").pop()} path={f} />)}</div>
        </div>
      )}
      {T.prompt && <PromptBlock text={T.prompt} label={T.promptLabel} />}
      <p className="text-xs text-slate-500 mt-5">Next up: the knowledge check for this task.</p>
    </div>
  );
}

function KnowledgeCheckPage({ taskId, state, setState, celebrate, who }) {
  const T = TASKS[taskId];
  const answers = state.quiz[taskId] || [];
  const setAnswer = (qi, v) => setState({ ...state, quiz: { ...state.quiz, [taskId]: Object.assign([], answers, { [qi]: v }) } });
  const answered = T.mcqs.filter((_, i) => answers[i] != null).length;
  const prevAnswered = useRef(answered);
  useEffect(() => {
    if (answered === T.mcqs.length && prevAnswered.current < T.mcqs.length) celebrate();
    prevAnswered.current = answered;
  }, [answered]);
  return (
    <div>
      <div className="flex items-center gap-3">
        <PersonaBust size={48} />
        <div>
          <Eyebrow>Task {T.num} | {T.title}</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Knowledge check</h2>
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-2">Two questions, {who}. Instant feedback; answer before moving on.</p>
      {T.mcqs.map((q, qi) => <MCQ key={qi} idx={qi} data={q} saved={answers[qi]} onAnswer={(v) => setAnswer(qi, v)} />)}
    </div>
  );
}

function CheckpointPage({ taskId, state, setState, celebrate }) {
  const T = TASKS[taskId];
  const Comp = CHECKPOINTS[T.game];
  const result = state.games[taskId];
  const hadResult = useRef(result != null);
  useEffect(() => {
    if (result != null && !hadResult.current) { celebrate(); hadResult.current = true; }
  }, [result]);
  const setResult = (v) => setState({ ...state, games: { ...state.games, [taskId]: v } });
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <PersonaBust size={48} />
        <div>
          <Eyebrow>Task {T.num} | {T.title}</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Skill checkpoint: {T.gameName}</h2>
        </div>
      </div>
      <Comp result={state.games[taskId]} setResult={setResult} />
    </div>
  );
}

function MilestoneIntro({ n, title, intro, prop, scene, tickets }) {
  return (
    <div>
      <Eyebrow>Milestone {n}</Eyebrow>
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">{title}</h2>
      <SceneCard prop={prop}>{scene}</SceneCard>
      <p className="text-sm text-slate-700 leading-relaxed mb-4">{intro}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {tickets.map((t, i) => (
          <div key={i} className="hover-lift rounded-xl p-4 border border-teal-100 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-teal-700">TICKET DL-{n}0{i + 1}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-teal-700 text-white" : "border"}`}
                style={i === 0 ? {} : { borderColor: CORAL, color: CORAL }}>{i === 0 ? "REQUIRED" : "OPTIONAL"}</span>
            </div>
            <div className="font-semibold text-slate-800 text-sm">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecapPage({ title, points, transition }) {
  return (
    <div>
      <Eyebrow>Recap</Eyebrow>
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">{title}</h2>
      <div className="rounded-2xl p-5" style={{ background: MINT }}>
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-teal-700 font-bold">•</span>{p}</li>
          ))}
        </ul>
      </div>
      {transition && <Story>{transition}</Story>}
    </div>
  );
}

/* ---------------- main ---------------- */
export default function App() {
  const [page, setPage] = useState(0);
  const [state, setState] = useState({ visited: { 0: true }, quiz: {}, games: {}, checks: {}, student: { name: "", email: "" } });
  const [loaded, setLoaded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const mainRef = useRef(null);
  const celebrate = () => setBurst(Date.now());
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 2000);
    return () => clearTimeout(t);
  }, [burst]);
  useEffect(() => { if (loaded && PAGES[page].id === "finale") celebrate(); }, [page, loaded]);

  useEffect(() => {
    (async () => {
      const saved = await store.get("sprint-progress");
      if (saved) { setState(s => ({ ...s, ...saved.state })); setPage(saved.page || 0); }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) store.set("sprint-progress", { page, state }); }, [page, state, loaded]);

  const go = (i) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, i));
    setPage(n);
    setState(s => ({ ...s, visited: { ...s.visited, [n]: true } }));
    setNavOpen(false);
    if (mainRef.current) mainRef.current.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  const doneCount = Object.keys(state.visited).length;
  const pct = Math.round((doneCount / PAGES.length) * 100);
  const quizScore = Object.entries(state.quiz).reduce((acc, [id, arr]) => {
    (arr || []).forEach((v, i) => { if (v != null && TASKS[id]) { acc.total++; if (v === TASKS[id].mcqs[i].a) acc.right++; } });
    return acc;
  }, { right: 0, total: 0 });
  const setChecks = (i) => setState({ ...state, checks: { ...state.checks, [i]: !state.checks[i] } });
  const who = ((state.student || {}).name || "").trim() || "Data Scientist";

  const content = () => {
    const pg = PAGES[page];
    switch (pg.type) {
      case "welcome": return (
        <div>
          <div className="flex items-start gap-5 flex-wrap">
            <PersonaBust size={90} />
            <div className="min-w-0 flex-1">
              <Eyebrow>A hands-on workshop for working professionals</Eyebrow>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800">Data Science AI Integration</h1>
              <p className="text-xl font-semibold text-teal-700 mt-1">From Brief to Production: a hands-on sprint</p>
            </div>
          </div>
          <Story>Monday morning. The Head of Growth stops at your desk: retailer churn is up 18 percent quarter on quarter and nobody knows why. You have the next sprint to work on this project — 45 minutes, five deliverables. And it is the one you have been waiting for: real stakes, real data, and every part of it matching something one of three AI tools claims to do.</Story>
          <p className="text-slate-700 text-sm leading-relaxed">You are the data scientist at DukaLink, a Nairobi e-commerce marketplace, proving three tools on live work: <b>Gemini Gems</b> to set the standards, <b>Gemini on Colab</b> to explore safely, and <b>Claude Code</b> (or any agentic CLI) to productionize. Each tool has one required task and one optional further-practice task. Every task is followed by a knowledge check on its own page, and most by a skill checkpoint.</p>
          <div className="mt-6 rounded-2xl border border-teal-100 bg-white p-5 max-w-md">
            <div className="font-bold text-slate-800 text-sm">Who is running this sprint?</div>
            <p className="text-xs text-slate-500 mt-1 mb-3">Your knowledge-check and checkpoint results are tracked on this device and compiled into a performance report you can share once the sprint is complete.</p>
            <input value={(state.student || {}).name || ""} onChange={(e) => setState({ ...state, student: { ...state.student, name: e.target.value } })}
              placeholder="Your name" aria-label="Your name"
              className="w-full mb-3 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-teal-600" />
            <button onClick={() => go(1)} disabled={!((state.student || {}).name || "").trim()}
              className="hover-pop px-6 py-3 rounded-xl text-white font-bold bg-teal-700 hover:bg-teal-800 transition-colors disabled:opacity-40">Start the sprint</button>
          </div>
        </div>
      );
      case "outcomes": return (
        <div>
          <Eyebrow>Learning outcomes</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">Five problems every data team recognises</h2>
          {[
            ["Inconsistent cleaning decisions", "encode team rules into a Playbook Gem with role, constraints, output format, refusal rules"],
            ["Unreviewed AI-generated code", "a Code Review Gem that enforces your conventions before code reaches a repo"],
            ["Risky prompting on real data", "pseudonymize identifiers first, then one contexted prompt builds the whole EDA scaffold"],
            ["Models nobody can explain", "AI drafts the interpretation; you verify every claim against the numbers"],
            ["Notebooks that never ship", "build, optimize, and document a pipeline with an agent, reviewing plans and diffs"],
          ].map(([a, b], i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm py-2 border-b border-slate-100 last:border-0">
              <span className="font-bold text-slate-800 sm:w-64 shrink-0">{a}.</span><span className="text-slate-600">{b}</span>
            </div>
          ))}
          <p className="text-xs text-slate-500 mt-4">The three required tasks are the 45-minute sprint. The optional further-practice tasks are for fast finishers and for after the session, and the stretch challenges live at the end as after-workshop learning.</p>
        </div>
      );
      case "setup": return (
        <div>
          <Eyebrow>Complete before the event</Eyebrow>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">Set up before the event</h2>
          <p className="text-sm text-slate-600 mb-4">There is no setup time in the session; the first task begins a few minutes in.</p>
          <div className="mb-3"><div className="font-bold text-teal-800 text-sm">Accounts</div>
            <div className="text-sm text-slate-700 leading-relaxed">A Google account with Gemini and Gems, plus Colab with Gemini enabled. A Claude account (Pro or Team) with Claude Code in VS Code. No Claude subscription? Gemini CLI is free with a personal Google account: {fmt("`npm install -g @google/gemini-cli`")}, then run {fmt("`gemini`")} in the project folder. Milestone 3 works with any agentic coding tool.</div></div>
          <div className="mb-3"><div className="font-bold text-teal-800 text-sm">Software</div>
            <div className="text-sm text-slate-700">VS Code with a terminal, Git, Python 3.10 or newer with pandas, seaborn, scikit-learn, and shap.</div></div>
          <div className="mb-3"><div className="font-bold text-teal-800 text-sm">Workshop files</div>
            <div className="text-sm text-slate-700 leading-relaxed mb-2">Every resource is hosted in this same repository, so the links below work wherever this site is deployed. Grab the whole bundle, or pick files as each task asks for them; the relevant ones reappear on every task page.</div>
            <a href={RES("workshop_files.zip")} download className="inline-block px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors mb-2">Download all files (workshop_files.zip)</a>
            <div className="flex flex-wrap gap-2">
              {["dukalink_customers.csv", "dukalink_orders.csv", "colab_starter.ipynb", "baseline_model.ipynb", "flawed_snippet.py", "slow_pipeline.py", "prompts/eda_prompt.txt", "prompts/etl_spec_prompt.txt"].map(f => <FileChip key={f} name={f.split("/").pop()} path={f} />)}
            </div>
            <div className="text-xs text-slate-500 mt-2">5,150 retailers and 76,503 reconciling orders, the starter and model notebooks, two workplace prompts, the flawed snippet, and the 100-second pipeline.</div></div>
        </div>
      );
      case "story": {
        return (
          <div>
            <Eyebrow>Your mission</Eyebrow>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome, {who}</h2>
            <div className="flex items-center gap-4 rounded-2xl p-4 my-4" style={{ background: MINT }}>
              <PersonaBust size={72} />
              <div>
                <div className="font-bold text-slate-800">{who}</div>
                <div className="text-sm text-teal-700 font-semibold">Data Scientist, DukaLink, Nairobi</div>
                <div className="text-xs text-slate-500">Months of reading about AI workflows. Zero of it proven on real work. Until Monday.</div>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">Your brief: a cleaned, documented customer dataset; an EDA summary of what distinguishes churned retailers; a baseline churn model with an interpretation; a fast production ETL pipeline with a README; and reusable team AI assets.</p>
            <Story>You sketch three milestones on your board: set the standards, explore safely, productionize. Each gets a required ticket and an optional one if you finish early. If the tools are worth adopting, they will earn it here. Standards first, then speed.</Story>
          </div>
        );
      }
      case "milestone": {
        if (pg.id === "m1") return <MilestoneIntro n={1} title="Set the Standards (Gemini Gems)" prop={<GemProp />}
          scene={`Monday, ${who}. You resist the urge to open the CSV and pick up a marker instead: the team's tribal knowledge is about to become written, testable standards.`}
          intro="Before a single row is read, this milestone turns your team's habits into instructions an AI can follow. The required ticket builds the Cleaning Playbook Gem; the optional one adds a Code Review Gem that will audit everything the sprint produces later."
          tickets={["Write the Cleaning Playbook Gem and try to break it", "Build the Code Review Gem and feed it a horror"]} />;
        if (pg.id === "m2") return <MilestoneIntro n={2} title="Explore Safely (Gemini on Colab)" prop={<LaptopProp />}
          scene={`Tuesday, ${who}. Standards in hand, you open the data, and the first column staring back at you is a national ID. Exploration starts with governance.`}
          intro="This milestone takes the standards into the data. The required ticket pseudonymizes the working copy and scaffolds the whole EDA from one workplace-grade prompt; the optional one interprets the provided churn model and fact-checks the AI's narration."
          tickets={["Pseudonymize, then scaffold the EDA in one prompt", "Run the provided model; interpret and verify"]} />;
        return <MilestoneIntro n={3} title="Productionize (Claude Code / agentic CLI)" prop={<TerminalProp />}
          scene={`Thursday, ${who}. The notebook knows the answers; now the work has to run without you. You close Colab and open a terminal.`}
          intro="The final milestone moves from exploration to a pipeline anyone can run. The required ticket supervises an agent through spec, plan, diffs, and a drift-checking README; the optional one profiles the 100-second pipeline and proves a rewrite that is a few hundred times faster."
          tickets={["Spec, plan, supervise the ETL build; README with drift check", "Profile the slow pipeline, then optimize with proof"]} />;
      }
      case "task": return <TaskPage id={pg.id} />;
      case "report": return <ReportPage state={state} pct={pct} />;
      case "kcheck": return <KnowledgeCheckPage taskId={pg.task} state={state} setState={setState} celebrate={celebrate} who={who} />;
      case "checkpoint": return <CheckpointPage taskId={pg.task} state={state} setState={setState} celebrate={celebrate} />;
      case "recap": {
        if (pg.id === "r1") return <RecapPage title="Milestone 1: what you learned" points={[
          "AI is briefed like a new hire: role, testable constraints, output format, and permission to say 'not covered.'",
          "You own two reusable assets: a Playbook that escalates what it should not decide, and a Reviewer that enforces your conventions.",
          "Standards were set before the data was opened, so everything downstream inherits them.",
        ]} transition="With both Gems saved, you finally open the data. Tuesday morning, coffee in hand, a new Colab notebook, and the first thing staring back at you is a column of national IDs." />;
        if (pg.id === "r2") return <RecapPage title="Milestone 2: what you learned" points={[
          "Pseudonymize before you prompt: structure and aggregates in, PII never, and hashed columns are still personal data.",
          "One contexted prompt beats ten lazy ones, and a traceback is prompt material too.",
          "AI writes the first draft of an interpretation; you check it against the numbers before anyone else hears it.",
          "The recorded cleaning decisions are the handover to production.",
        ]} transition={`By Thursday the exploration has answered the what: late deliveries and young accounts are where churn lives. But a notebook only you can run is not a deliverable, ${who}. You close Colab, open VS Code, and pull the last two tickets.`} />;
        return <RecapPage title="Milestone 3: what you learned" points={[
          "You supervised an agent: plan reviewed, every diff read, final script run by you.",
          "Profile first, verify output equivalence, then trust the speedup.",
          "A README generated from real code caught the playbook drift a manual writeup would have missed.",
          "The Gems from Milestone 1 audited the code from Milestone 3: not three tools, one workflow.",
        ]} transition="Friday afternoon. The pipeline runs in under a second, the README survived a neighbour's read-aloud, and both Gems belong to the whole team. Before emailing the Head of Growth, you run the whole sprint through your checklist." />;
      }
      case "checklist": {
        const done = Object.values(state.checks).filter(Boolean).length;
        return (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PersonaBust size={48} />
              <div>
                <Eyebrow>{done} of {CHECKLIST.length} verified</Eyebrow>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{who}'s quality checklist</h2>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              {CHECKLIST.map((c, i) => (
                <button key={i} onClick={() => setChecks(i)} className={`w-full flex items-start gap-3 text-left text-sm px-4 py-3 rounded-xl border transition-colors ${state.checks[i] ? "border-teal-600 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-400"}`}>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 text-xs font-bold ${state.checks[i] ? "bg-teal-700 border-teal-700 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                  <span className={state.checks[i] ? "text-slate-500 line-through" : "text-slate-700"}>{c}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "finale": return (
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <PersonaBust size={84} />
            <div>
              <CelebrateProps />
              <Eyebrow>Sprint complete</Eyebrow>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">What the sprint taught</h2>
            </div>
          </div>
          <div className="flex gap-2 my-4 flex-wrap">
            {["Standards first", "Governance before prompting", "AI drafts, you verify", "One workflow"].map((t, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: i % 2 ? CORAL : "#0F766E" }}>{t}</span>
            ))}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">The Playbook Gem wrote the ETL spec, the EDA notes fed the cleaning decisions, and the Code Review Gem audited the agent's output. Knowledge checks: <b>{quizScore.right} of {quizScore.total || 12}</b> answered correctly.</p>
          <Story>{state.student && state.student.name.trim() ? `Monday, ${state.student.name.trim()} was` : "Monday, you were"} a data scientist who had read about AI integration. Friday, you are one who has shipped with it. The sprint did not test whether you could use AI. It tested whether you could supervise it, and that turned out to be the actual skill.</Story>
          <button onClick={() => go(page + 1)} className="mt-2 px-6 py-3 rounded-xl text-white font-bold transition-colors hover:opacity-90" style={{ background: CORAL }}>See your performance report</button>
        </div>
      );
      case "further": return (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PersonaBust size={48} />
            <div>
              <Eyebrow>After the workshop</Eyebrow>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Further practice and learning</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">These stretch challenges are for after the session, once the sprint is done. Come back to them with the workshop files: they travel well, and each one deepens exactly one habit you built today.</p>
          <div className="space-y-3">
            {Object.values(TASKS).map(T => (
              <div key={T.num} className="rounded-xl border border-dashed border-teal-300 bg-white p-4">
                <div className="font-mono text-xs text-teal-700 mb-1">FROM TASK {T.num}: {T.title.toUpperCase()}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{T.stretch}</p>
              </div>
            ))}
          </div>
          <div className="mt-4"><FileChip name="workshop_files.zip" /></div>
          <p className="text-xs text-slate-500 mt-5">Asante sana, and see you at the next sprint.</p>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <header className="no-print sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => setNavOpen(!navOpen)} className="md:hidden px-2 py-1 rounded-lg border border-slate-300 text-sm font-semibold">Board</button>
          <div className="font-bold tracking-tight">Data Science AI Integration</div>
          <div className="font-mono text-xs text-slate-400 hidden sm:block">DukaLink sprint</div>
          <a href={RES("workshop_files.zip")} download className="hidden sm:inline text-xs font-semibold text-teal-700 hover:underline">Workshop files</a>
          <div className="ml-auto flex items-center gap-2 w-40 sm:w-56">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-2 bg-teal-700 transition-all" style={{ width: `${pct}%` }} /></div>
            <span className="font-mono text-xs text-slate-500">{pct}%</span>
          </div>
        </div>
      </header>

      <div className="flex max-w-6xl mx-auto">
        <nav className={`${navOpen ? "block" : "hidden"} no-print md:block w-64 shrink-0 border-r border-slate-200 bg-white md:bg-transparent absolute md:static z-10 md:z-auto h-full md:h-auto overflow-y-auto`}>
          <div className="p-4 space-y-4">
            {MILESTONES.map((m, mi) => (
              <div key={mi}>
                <div className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-1.5">{m}</div>
                <div className="space-y-1">
                  {PAGES.map((p, i) => p.m === mi && (
                    <button key={p.id} onClick={() => go(i)}
                      className={`w-full flex items-center gap-2 text-left text-xs py-1.5 rounded-lg border-l-4 transition-all duration-150 hover:translate-x-0.5 ${p.sub ? "pl-6 pr-2" : "px-2.5"} ${i === page ? "bg-white shadow-sm font-semibold" : "border-transparent hover:bg-white hover:shadow-sm"}`}
                      style={i === page ? { borderLeftColor: CORAL } : {}}>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] shrink-0 ${state.visited[i] ? "bg-teal-700 border-teal-700 text-white" : "border-slate-300"}`}>{state.visited[i] ? "✓" : ""}</span>
                      <span className={state.visited[i] && i !== page ? "text-slate-500" : "text-slate-700"}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <main ref={mainRef} className="flex-1 min-w-0 p-4 sm:p-8">
          {burst > 0 && <Confetti key={burst} />}
          <div key={page} className="page-enter"><Card className="min-h-[60vh]">{content()}</Card></div>
          <div className="no-print flex justify-between mt-4">
            <button onClick={() => go(page - 1)} disabled={page === 0}
              className="hover-pop px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold disabled:opacity-30 hover:border-teal-600 transition-colors">← Back</button>
            <button onClick={() => go(page + 1)} disabled={page === PAGES.length - 1}
              className="hover-pop px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-30 bg-teal-700 hover:bg-teal-800 transition-colors">Next →</button>
          </div>
        </main>
      </div>
    </div>
  );
}
