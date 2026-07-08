// Generates public/files/setup_instructions.pdf: a single-page, text-only PDF
// with the pre-event setup instructions from the app's setup page.
// Run with: node scripts/make_setup_pdf.mjs
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "files", "setup_instructions.pdf");

// [text, bold, sizeOverride]
const LINES = [
  ["Data Science AI Integration: From Brief to Production", true, 16],
  ["Set up before the event", true, 12],
  [""],
  ["There is no setup time in the session; the first task begins a few"],
  ["minutes in. Arrive with everything below already working."],
  [""],
  ["ACCOUNTS", true],
  ["- A Google account with Gemini and Gems (gemini.google.com), plus"],
  ["  Colab with Gemini enabled (colab.research.google.com)."],
  ["- A Claude account (Pro or Team) with Claude Code in VS Code."],
  ["- No Claude subscription? The open-source Gemini CLI is free with a"],
  ["  personal Google account: npm install -g @google/gemini-cli, then"],
  ["  run gemini in the project folder. The agentic milestone works with"],
  ["  any agentic coding tool."],
  [""],
  ["SOFTWARE", true],
  ["- VS Code with a terminal, and Git."],
  ["- Python 3.10 or newer with pandas, seaborn, scikit-learn, and shap:"],
  ["  pip install pandas seaborn scikit-learn shap"],
  [""],
  ["WORKSHOP FILES", true],
  ["- Download workshop_files.zip from the workshop site and unzip it"],
  ["  into a working folder you can open in VS Code."],
  ["- Contents: dukalink_customers.csv, dukalink_orders.csv,"],
  ["  colab_starter.ipynb, baseline_model.ipynb, flawed_snippet.py,"],
  ["  slow_pipeline.py, and the prompts folder (eda_prompt.txt,"],
  ["  etl_spec_prompt.txt)."],
  [""],
  ["QUICK SELF-TEST (five minutes, the night before)", true],
  ["1. Open gemini.google.com and confirm you can create a Gem."],
  ["2. Open a Colab notebook and confirm Gemini is available in it."],
  ["3. In VS Code, open the unzipped folder and start your agentic CLI"],
  ["   (Claude Code, or gemini) without errors."],
  ["4. Run: python -c \"import pandas, seaborn, sklearn, shap\""],
  [""],
  ["See you at the sprint. Asante sana!"],
];

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

let stream = "BT\n1 0 0 1 60 740 Tm\n";
for (const [text = "", bold = false, size] of LINES) {
  const sz = size || 10.5;
  const leading = size ? size + 8 : 15;
  stream += `/${bold ? "F2" : "F1"} ${sz} Tf\n${leading} TL\n(${esc(text)}) Tj\nT*\n`;
}
stream += "ET\n";

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
  `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xref = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const o of offsets) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, pdf, "latin1");
console.log(`wrote ${out} (${pdf.length} bytes)`);
