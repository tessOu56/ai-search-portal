import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { toJUnitXml } from "./junit-report.js";
import { runGoldenCase } from "./run-case.js";
import type { GoldenCase } from "./score.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "..", "fixtures", "golden.jsonl");
const reportDir = join(here, "..", "..", "..", "reports");

async function main(): Promise<void> {
  const raw = await readFile(fixturePath, "utf8");
  const cases: GoldenCase[] = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldenCase);

  const results = [];
  let failed = 0;
  for (const c of cases) {
    const result = await runGoldenCase(c);
    results.push(result);
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(`${mark} ${result.id} (events=${result.eventCount})`);
    if (!result.pass) {
      failed++;
      for (const r of result.reasons) console.log(`  - ${r}`);
    }
  }

  await mkdir(reportDir, { recursive: true });
  const reportPath = join(
    reportDir,
    `eval-${new Date().toISOString().slice(0, 10)}.json`
  );
  const payload = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed,
    results,
  };
  await writeFile(reportPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Report: ${reportPath}`);

  const junitPath = join(
    reportDir,
    `eval-${new Date().toISOString().slice(0, 10)}.xml`
  );
  await writeFile(junitPath, toJUnitXml(results, "lab-eval-runner"), "utf8");
  console.log(`JUnit: ${junitPath}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
