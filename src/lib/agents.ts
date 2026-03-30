import { createAdminClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient;
function getSupabase() {
  return (_supabase ??= createAdminClient());
}

/** Get all agents for an org, ordered by display_order */
export async function getAgents(orgId: string) {
  const { data, error } = await getSupabase()
    .from("agents")
    .select("*")
    .eq("org_id", orgId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

/** Get a single agent with team info */
export async function getAgent(agentId: string) {
  const { data, error } = await getSupabase()
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();
  if (error) throw error;
  return data;
}

/** Get agents filtered by zone */
export async function getAgentsByZone(orgId: string, zone: string) {
  const { data, error } = await getSupabase()
    .from("agents")
    .select("*")
    .eq("org_id", orgId)
    .eq("zone", zone)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
}

/** Set agent status (idle, working, done, error) */
export async function updateAgentStatus(
  agentId: string,
  status: "idle" | "working" | "done" | "error"
) {
  const { error } = await getSupabase()
    .from("agents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", agentId);
  if (error) throw error;
}

/** Store last_output and last_run_at */
export async function saveAgentOutput(agentId: string, output: string) {
  const { error } = await getSupabase()
    .from("agents")
    .update({
      last_output: output,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);
  if (error) throw error;
}

/** Write to activity_log */
export async function logActivity(
  orgId: string,
  agentId: string | null,
  action: string,
  detail: string,
  zone: string
) {
  const { error } = await getSupabase().from("activity_log").insert({
    org_id: orgId,
    agent_id: agentId,
    action,
    detail,
    zone,
  });
  if (error) throw error;
}

/** Get recent activity, newest first */
export async function getActivityLog(orgId: string, limit: number = 50) {
  const { data, error } = await getSupabase()
    .from("activity_log")
    .select("*, agents(name, emoji)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Get org by slug */
export async function getOrganization(slug: string) {
  const { data, error } = await getSupabase()
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

/** Get teams with member counts */
export async function getTeams(orgId: string) {
  const { data, error } = await getSupabase()
    .from("teams")
    .select("*, agent_team_members(agent_id)")
    .eq("org_id", orgId);
  if (error) throw error;
  return data?.map((team) => ({
    ...team,
    member_count: team.agent_team_members?.length ?? 0,
  }));
}

/** Get recent agent messages */
export async function getAgentMessages(orgId: string, limit: number = 50) {
  const { data, error } = await getSupabase()
    .from("agent_messages")
    .select(
      "*, from_agent:agents!agent_messages_from_agent_id_fkey(name, emoji, color), to_agent:agents!agent_messages_to_agent_id_fkey(name, emoji)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Send an agent message */
export async function sendAgentMessage(
  orgId: string,
  fromAgentId: string | null,
  toAgentId: string | null,
  channel: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await getSupabase().from("agent_messages").insert({
    org_id: orgId,
    from_agent_id: fromAgentId,
    to_agent_id: toAgentId,
    channel,
    message,
    metadata: metadata ?? null,
  });
  if (error) throw error;
}
