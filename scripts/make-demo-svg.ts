/**
 * Generates docs/images/demo.svg: an animated terminal recording of `mcp-detector demo`.
 *
 * The text is the tool's real output (it runs the bundled unsafe demo server through the real scanner and the
 * real terminal renderer), not a mock-up. Regenerate it whenever the report format changes:  npm run docs:demo
 */
import { writeFileSync } from "node:fs";
import { defaultConfig } from "../src/config/default-config.js";
import { demoServerSpec } from "../src/core/demo.js";
import { runScan } from "../src/core/detector.js";
import { renderReport } from "../src/reporting/report-generator.js";

const COMMAND = "mcp-detector demo";
const MAX_COLS = 96;
const MAX_LINES = 38;

// GitHub dark palette
const COLORS: Record<string, string> = {
  "31": "#ff7b72", // red
  "32": "#3fb950", // green
  "33": "#d29922", // yellow
  "35": "#d2a8ff", // magenta
  "36": "#79c0ff", // cyan
  "2": "#8b949e", // dim
};
const FG = "#c9d1d9";
const BG = "#0d1117";

interface Seg {
  text: string;
  color?: string;
  bold?: boolean;
}

/** Minimal SGR parser: supports bold, dim and the basic foreground colours picocolors emits. */
function parseAnsi(line: string): Seg[] {
  const segs: Seg[] = [];
  let color: string | undefined;
  let bold = false;
  let dim = false;
  let last = 0;
  const re = /\x1b\[([0-9;]*)m/g;
  const push = (text: string) => {
    if (text) segs.push({ text, color: dim ? COLORS["2"] : color, bold });
  };
  for (let m; (m = re.exec(line)); ) {
    push(line.slice(last, m.index));
    last = m.index + m[0].length;
    for (const code of m[1].split(";")) {
      if (code === "0" || code === "") (color = undefined), (bold = false), (dim = false);
      else if (code === "1") bold = true;
      else if (code === "2") dim = true;
      else if (code === "22") (bold = false), (dim = false);
      else if (code === "39") color = undefined;
      else if (COLORS[code]) color = COLORS[code];
    }
  }
  push(line.slice(last));
  return segs;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** Truncate a line of segments to `max` visible columns. */
function clip(segs: Seg[], max: number): Seg[] {
  const out: Seg[] = [];
  let n = 0;
  for (const s of segs) {
    const chars = [...s.text];
    if (n + chars.length <= max) {
      out.push(s);
      n += chars.length;
    } else {
      out.push({ ...s, text: chars.slice(0, Math.max(0, max - n - 1)).join("") + "…" });
      break;
    }
  }
  return out;
}

async function main() {
  const { result } = await runScan({ ...defaultConfig(), server: demoServerSpec("vulnerable") });
  const report = renderReport(result, "terminal", { color: true });
  const all = report.split("\n");

  // Keep the part people care about: header, score, categories, security and the first findings.
  const findingsAt = all.findIndex((l) => plain(l).startsWith("Findings:"));
  let body = all.slice(0, Math.min(all.length, MAX_LINES));
  // Drop the optional "Target:" line (a long local path that means nothing to a reader).
  body = body.filter((l) => !plain(l).startsWith("Target:"));
  // Trim a trailing partial finding so the recording ends on a whole one.
  while (body.length > findingsAt + 1 && plain(body[body.length - 1]).startsWith("   ")) body.pop();
  while (body.length && plain(body[body.length - 1]).trim() === "") body.pop();
  const remaining = result.findings.length - body.filter((l) => /MCP-\d{3}/.test(plain(l)) && /^\S/.test(plain(l).replace(/^[^\w]*/, ""))).length;
  const lines: Seg[][] = [
    ...body.map((l) => clip(parseAnsi(l), MAX_COLS)),
    [],
    [{ text: `… ${result.findings.length} findings in total. Run the command yourself to see them all and how to fix each.`, color: COLORS["2"] }],
  ];

  // Layout
  const charW = 8.4;
  const lineH = 19;
  const padX = 22;
  const top = 58;
  const width = Math.ceil(MAX_COLS * charW + padX * 2);
  const height = top + (lines.length + 3) * lineH + 20;

  // Timing: type the command, then reveal the output in short bursts; hold; loop.
  const TYPE_START = 0.6;
  const TYPE_DUR = 1.4;
  const OUT_START = TYPE_START + TYPE_DUR + 0.9;
  const step = 0.11;
  const total = Math.round((OUT_START + lines.length * step + 5) * 10) / 10;
  const pct = (t: number) => ((t / total) * 100).toFixed(3);

  const css: string[] = [];
  const els: string[] = [];

  // Typed command
  const promptY = top;
  const cmdChars = COMMAND.length;
  els.push(`<text x="${padX}" y="${promptY}" class="t"><tspan fill="#3fb950">$</tspan> <tspan class="cmd">${esc(COMMAND)}</tspan></text>`);
  css.push(
    `@keyframes typing{0%{clip-path:inset(0 100% 0 0)}${pct(TYPE_START)}%{clip-path:inset(0 100% 0 0)}${pct(TYPE_START + TYPE_DUR)}%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 0)}}`,
    `.cmd{animation:typing ${total}s steps(${cmdChars},end) infinite;display:inline-block}`,
  );

  let y = promptY + lineH * 1.6;
  lines.forEach((segs, i) => {
    const appear = OUT_START + i * step;
    css.push(
      `@keyframes l${i}{0%{opacity:0}${pct(appear)}%{opacity:0}${pct(appear + 0.01)}%{opacity:1}97%{opacity:1}100%{opacity:0}}`,
      `.l${i}{animation:l${i} ${total}s linear infinite;opacity:0}`,
    );
    const spans = segs
      .map((s) => `<tspan${s.color ? ` fill="${s.color}"` : ""}${s.bold ? ' font-weight="700"' : ""}>${esc(s.text)}</tspan>`)
      .join("");
    els.push(`<text x="${padX}" y="${y.toFixed(1)}" class="t l${i}" xml:space="preserve">${spans}</text>`);
    y += lineH;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Animated terminal recording: running mcp-detector demo scans a deliberately unsafe example server and prints a score of ${result.score} out of 100 with critical findings such as tool poisoning and dangerous shell access.">
<title>mcp-detector demo</title>
<style>
.t{font:14px ui-monospace,SFMono-Regular,Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace;fill:${FG};white-space:pre}
.cmd{fill:${FG}}
${css.join("\n")}
@media (prefers-reduced-motion:reduce){[class*="l"]{animation:none!important;opacity:1!important}.cmd{animation:none!important}}
</style>
<rect width="${width}" height="${height}" rx="10" fill="${BG}"/>
<rect width="${width}" height="34" rx="10" fill="#161b22"/><rect y="24" width="${width}" height="10" fill="#161b22"/>
<circle cx="20" cy="17" r="6" fill="#ff5f56"/><circle cx="40" cy="17" r="6" fill="#ffbd2e"/><circle cx="60" cy="17" r="6" fill="#27c93f"/>
<text x="${width / 2}" y="22" text-anchor="middle" style="font:12px system-ui,sans-serif;fill:#8b949e">mcp-detector</text>
${els.join("\n")}
</svg>
`;
  writeFileSync("docs/images/demo.svg", svg, "utf8");
  console.log(`Wrote docs/images/demo.svg (${lines.length} lines, ${total}s loop, ${(svg.length / 1024).toFixed(1)} kB, score ${result.score}, ${remaining >= 0 ? "" : ""}${result.findings.length} findings)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
