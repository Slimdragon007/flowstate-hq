/**
 * Tests for the Anthropic SDK wrapper (anthropic.ts).
 * Tests the callAgent function with real API calls.
 * Requires ANTHROPIC_API_KEY in .env.local.
 */

import { callAgent } from "@/lib/anthropic";

describe("Anthropic Wrapper: anthropic.ts", () => {
  // These tests make real API calls, so they're slow
  jest.setTimeout(30000);

  it("returns success with output for a simple prompt", async () => {
    const result = await callAgent({
      name: "Test Agent",
      prompt_template: "Say exactly: HELLO TEST. Nothing else.",
      mcp_target: null,
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.error).toBeUndefined();
  });

  it("replaces {{CONTEXT}} in the prompt template", async () => {
    const result = await callAgent(
      {
        name: "Context Agent",
        prompt_template:
          "The context is: {{CONTEXT}}. Repeat back the context word for word. Nothing else.",
        mcp_target: null,
      },
      "BANANA_PHONE_42"
    );

    expect(result.success).toBe(true);
    expect(result.output).toContain("BANANA_PHONE_42");
  });

  it("uses default context when none provided", async () => {
    const result = await callAgent({
      name: "No Context Agent",
      prompt_template:
        "The context is: {{CONTEXT}}. If the context mentions 'No additional context', say YES. Otherwise say NO.",
      mcp_target: null,
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("YES");
  });

  it("catches errors gracefully and never throws", async () => {
    // This should NOT throw, even with a broken prompt
    const result = await callAgent({
      name: "Error Agent",
      prompt_template: "", // Empty prompt
      mcp_target: null,
    });

    // Either succeeds with empty-ish output or returns an error
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.output).toBe("string");
  });

  it("returns structured CallResult type", async () => {
    const result = await callAgent({
      name: "Type Check Agent",
      prompt_template: "Say OK.",
      mcp_target: null,
    });

    // Verify shape
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("output");
    // error is optional
    if (!result.success) {
      expect(result).toHaveProperty("error");
    }
  });
});
