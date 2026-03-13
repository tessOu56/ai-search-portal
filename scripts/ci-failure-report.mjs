#!/usr/bin/env node
/**
 * CI 失敗時產出說明報告（Markdown），供下載或寫入 GITHUB_STEP_SUMMARY。
 * 讀取 reports/eslint-report.json、reports/vitest-results.json（若存在）並彙整成簡要說明。
 * 使用方式：CI 失敗後執行 node scripts/ci-failure-report.mjs > reports/ci-failure-summary.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");

const eslintPath = path.join(reportsDir, "eslint-report.json");
const vitestPath = path.join(reportsDir, "vitest-results.json");

const lines = ["# CI 失敗說明報告", "", "以下為本次執行產出的摘要，詳細請下載 Artifacts 中的報告檔。", ""];

// ESLint（-f json 產出為陣列）
if (fs.existsSync(eslintPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(eslintPath, "utf-8"));
    const list = Array.isArray(data) ? data : [];
    const count = list.reduce((acc, f) => acc + (f.errorCount ?? 0) + (f.warningCount ?? 0), 0);
    lines.push("## ESLint");
    lines.push(`- 總計問題數：${count}`);
    const withErrors = list.filter((f) => (f.errorCount ?? 0) + (f.warningCount ?? 0) > 0);
    if (withErrors.length > 0) {
      lines.push("- 有問題的檔案（前 15 筆）：");
      withErrors.slice(0, 15).forEach((f) => {
        const n = (f.errorCount ?? 0) + (f.warningCount ?? 0);
        const rel = path.relative(root, f.filePath ?? "").replace(/\\/g, "/") || "(unknown)";
        lines.push(`  - \`${rel}\`: ${n} 則`);
      });
    }
    lines.push("");
  } catch (e) {
    lines.push("## ESLint — 報告無法解析");
    lines.push("");
  }
}

// Vitest（Jest 相容格式：numTotalTests, testResults[]）
if (fs.existsSync(vitestPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(vitestPath, "utf-8"));
    const numTotal = data.numTotalTests ?? 0;
    const numPassed = data.numPassedTests ?? 0;
    const numFailed = data.numFailedTests ?? 0;
    lines.push("## 測試 (Vitest)");
    lines.push(`- 總計：${numTotal}，通過：${numPassed}，失敗：${numFailed}`);
    const results = data.testResults ?? [];
    const failed = results.filter(
      (r) => r.status === "failed" || (r.assertionResults ?? []).some((a) => a.status === "failed")
    );
    if (failed.length > 0) {
      lines.push("- 失敗的測試（前 10 筆）：");
      failed.slice(0, 10).forEach((r) => {
        const name = r.name ?? r.fullName ?? r.testFilePath ?? "?";
        const assertions = (r.assertionResults ?? []).filter((a) => a.status === "failed");
        assertions.slice(0, 3).forEach((a) => {
          const msg = (a.failureMessages?.[0] ?? a.failureMessage ?? "").split("\n")[0]?.slice(0, 80) ?? "";
          lines.push(`  - \`${name}\`: ${a.title ?? a.fullName ?? "assertion"} — ${msg}`);
        });
      });
    }
    lines.push("");
  } catch (e) {
    lines.push("## 測試 — 報告無法解析");
    lines.push("");
  }
}

if (lines.length <= 4) {
  lines.push("（無 ESLint 或 Vitest 報告檔，可能為 build 階段失敗或報告未產出。）");
  lines.push("");
}

process.stdout.write(lines.join("\n"));
