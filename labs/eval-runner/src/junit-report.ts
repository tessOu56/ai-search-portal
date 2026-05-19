import type { EvalResult } from "./score.js";

export function toJUnitXml(results: EvalResult[], suiteName: string): string {
  const failed = results.filter((r) => !r.pass).length;
  const cases = results
    .map((r) => {
      if (r.pass) {
        return `    <testcase classname="eval" name="${escapeXml(r.id)}"/>`;
      }
      const msg = escapeXml(r.reasons.join("; "));
      return `    <testcase classname="eval" name="${escapeXml(r.id)}">
      <failure message="${msg}">${msg}</failure>
    </testcase>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="${escapeXml(suiteName)}" tests="${results.length}" failures="${failed}">
${cases}
</testsuite>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
