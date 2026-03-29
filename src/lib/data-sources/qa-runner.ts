/**
 * QA Runner data source.
 * Executes npm test and npm run build, returns results.
 * Only runs server-side in API routes.
 */

import { execFileSync } from "child_process";

const PROJECT_ROOT = process.cwd();

export async function runTests(): Promise<string> {
  const lines: string[] = ["QA TEST RESULTS:"];

  try {
    const testOutput = execFileSync("npx", ["jest", "--verbose", "--no-coverage"], {
      cwd: PROJECT_ROOT,
      timeout: 60000,
      encoding: "utf-8",
      env: { ...process.env, CI: "true" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const summaryMatch = testOutput.match(/Tests:\s+(.+)/);
    const suiteMatch = testOutput.match(/Test Suites:\s+(.+)/);

    lines.push(`\nTest Suites: ${suiteMatch?.[1] ?? "unknown"}`);
    lines.push(`Tests: ${summaryMatch?.[1] ?? "unknown"}`);

    if (testOutput.includes("FAIL")) {
      const failedTests = testOutput
        .split("\n")
        .filter((l) => l.includes("✕") || l.includes("FAIL"))
        .slice(0, 5);
      lines.push("\nFailed:");
      failedTests.forEach((l) => lines.push(`  ${l.trim()}`));
    } else {
      lines.push("Status: ALL PASSING");
    }
  } catch (err) {
    if (err instanceof Error && "stdout" in err) {
      const output = String((err as { stdout: unknown }).stdout);
      const summaryMatch = output.match(/Tests:\s+(.+)/);
      lines.push(`Tests: ${summaryMatch?.[1] ?? "execution failed"}`);
      lines.push("Status: FAILURES DETECTED");

      const failedTests = output
        .split("\n")
        .filter((l) => l.includes("✕") || l.includes("FAIL"))
        .slice(0, 5);
      if (failedTests.length > 0) {
        lines.push("\nFailed:");
        failedTests.forEach((l) => lines.push(`  ${l.trim()}`));
      }
    } else {
      lines.push(`Test runner error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return lines.join("\n");
}

export async function runBuildCheck(): Promise<string> {
  try {
    execFileSync("npx", ["next", "build"], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: "utf-8",
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    return "BUILD: PASS (compiled successfully)";
  } catch (err) {
    if (err instanceof Error && "stdout" in err) {
      const output = String((err as { stdout: unknown }).stdout);
      const errorLines = output
        .split("\n")
        .filter((l) => l.includes("Error") || l.includes("error"))
        .slice(0, 5);
      return `BUILD: FAIL\n${errorLines.join("\n")}`;
    }
    return `BUILD: FAIL (${err instanceof Error ? err.message : String(err)})`;
  }
}
