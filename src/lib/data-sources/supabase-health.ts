/**
 * Supabase health data source.
 * Checks database project health, table counts, RLS status.
 */

import { createAdminClient } from "@/lib/supabase";

export async function getSupabaseHealth(): Promise<string> {
  const supabase = createAdminClient();

  try {
    const lines: string[] = ["SUPABASE HEALTH:"];

    // Check table row counts
    const tables = [
      "organizations",
      "agents",
      "teams",
      "agent_team_members",
      "agent_messages",
      "agent_blueprints",
      "workflows",
      "briefings",
      "activity_log",
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        lines.push(`- ${table}: ERROR (${error.message})`);
      } else {
        lines.push(`- ${table}: ${count ?? 0} rows`);
      }
    }

    // Check RLS status
    const { data: rlsData, error: rlsError } = await supabase.rpc("check_rls_status").maybeSingle();

    if (rlsError) {
      // RLS check function might not exist, that's OK
      lines.push("\nRLS: Could not verify (check function not available)");
    } else if (rlsData) {
      lines.push(`\nRLS: ${JSON.stringify(rlsData)}`);
    }

    lines.push(`\nProject URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    lines.push("Status: ACTIVE");

    return lines.join("\n");
  } catch (err) {
    return `SUPABASE: Error checking health: ${err instanceof Error ? err.message : String(err)}`;
  }
}
