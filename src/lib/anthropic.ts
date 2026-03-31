import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MAX_TOOL_STEPS = 5;

interface Agent {
  name: string;
  prompt_template: string;
  mcp_target: string | null;
}

interface CallResult {
  success: boolean;
  output: string;
  error?: string;
  toolCalls?: { name: string; input: Record<string, unknown> }[];
}

// Built-in tools agents can use (extensible per agent later)
const BUILT_IN_TOOLS: Tool[] = [
  {
    name: "get_current_time",
    description: "Returns the current UTC time in ISO 8601 format.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "report_status",
    description:
      "Report structured status using scrum format. Use this to return your final output.",
    input_schema: {
      type: "object" as const,
      properties: {
        done: {
          type: "string",
          description: "What was completed",
        },
        doing: {
          type: "string",
          description: "What is in progress",
        },
        blocked: {
          type: "string",
          description: "What is blocked and why (or 'nothing')",
        },
        summary: {
          type: "string",
          description: "One-sentence summary of overall status",
        },
      },
      required: ["done", "doing", "blocked", "summary"],
    },
  },
];

// Execute a tool call and return the result string
function executeTool(
  name: string,
  input: Record<string, unknown>
): string {
  switch (name) {
    case "get_current_time":
      return new Date().toISOString();
    case "report_status":
      return JSON.stringify(input);
    default:
      return `Unknown tool: ${name}`;
  }
}

/** Call an agent with multi-step tool_use support */
export async function callAgent(
  agent: Agent,
  context?: string
): Promise<CallResult> {
  try {
    const prompt = agent.prompt_template.replaceAll(
      "{{CONTEXT}}",
      context ?? "No additional context provided."
    );

    const messages: MessageParam[] = [
      { role: "user", content: prompt },
    ];

    const toolCalls: { name: string; input: Record<string, unknown> }[] = [];
    let finalOutput = "";

    // Multi-step tool_use loop
    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are ${agent.name}, an AI agent in the FlowstateAI virtual office. Be concise and structured in your responses. When reporting your status, use the report_status tool.`,
        tools: BUILT_IN_TOOLS,
        messages,
      });

      // Collect text blocks for output
      const textParts: string[] = [];
      const toolUseBlocks: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      }[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          textParts.push(block.text);
        } else if (block.type === "tool_use") {
          toolUseBlocks.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      if (textParts.length > 0) {
        finalOutput += textParts.join("\n");
      }

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        break;
      }

      // Execute tools and build the next turn
      // Add assistant message with all content blocks
      messages.push({
        role: "assistant",
        content: response.content as ContentBlockParam[],
      });

      // Add tool results
      const toolResults: ToolResultBlockParam[] = toolUseBlocks.map(
        (tool) => {
          const result = executeTool(tool.name, tool.input);
          toolCalls.push({ name: tool.name, input: tool.input });

          // report_status is the authoritative final output, replacing any
          // preceding text. The structured JSON is what the UI parses.
          if (tool.name === "report_status") {
            finalOutput = result;
          }

          return {
            type: "tool_result" as const,
            tool_use_id: tool.id,
            content: result,
          };
        }
      );

      messages.push({ role: "user", content: toolResults });
    }

    return {
      success: true,
      output: finalOutput || "(no output)",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: message };
  }
}
