import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MCP_SERVERS: Record<string, string> = {
  notion: "https://mcp.notion.com/mcp",
  gmail: "https://gmail.mcp.claude.com/mcp",
  calendar: "https://gcal.mcp.claude.com/mcp",
  supabase: "https://mcp.supabase.com/mcp",
  vercel: "https://mcp.vercel.com",
};

interface Agent {
  name: string;
  prompt_template: string;
  mcp_target: string | null;
}

interface CallResult {
  success: boolean;
  output: string;
  error?: string;
}

/** Call an agent via Anthropic SDK with optional MCP server */
export async function callAgent(
  agent: Agent,
  context?: string
): Promise<CallResult> {
  try {
    const prompt = agent.prompt_template.replace(
      "{{CONTEXT}}",
      context ?? "No additional context provided."
    );

    // Build MCP servers array if agent has a target
    const mcpServers = agent.mcp_target
      ? [
          {
            type: "url" as const,
            url: MCP_SERVERS[agent.mcp_target],
            name: agent.mcp_target,
          },
        ]
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams: any = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    };
    // MCP servers ready but commented until auth flow is wired
    if (mcpServers) {
      createParams.mcp_servers = mcpServers;
    }

    const response = await anthropic.messages.create(createParams);

    const output = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    return { success: true, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: message };
  }
}
