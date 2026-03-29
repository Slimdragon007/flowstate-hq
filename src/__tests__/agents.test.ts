/**
 * Integration tests for the data abstraction layer (agents.ts).
 * These hit the real Supabase database to verify the data layer works.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.
 */

import {
  getOrganization,
  getAgents,
  getAgent,
  getAgentsByZone,
  getTeams,
  getActivityLog,
  getAgentMessages,
  updateAgentStatus,
  saveAgentOutput,
  logActivity,
  sendAgentMessage,
} from "@/lib/agents";

let orgId: string;
let oracleId: string;

describe("Data Layer: agents.ts", () => {
  // Get org and oracle ID once for all tests
  beforeAll(async () => {
    const org = await getOrganization("flowstate");
    orgId = org.id;

    const agents = await getAgents(orgId);
    const oracle = agents.find((a) => a.name === "Oracle");
    if (!oracle) throw new Error("Oracle agent not found in test setup");
    oracleId = oracle.id;
  });

  describe("getOrganization", () => {
    it("returns the FlowstateAI org by slug", async () => {
      const org = await getOrganization("flowstate");
      expect(org).toBeDefined();
      expect(org.slug).toBe("flowstate");
      expect(org.name).toBe("FlowstateAI");
      expect(org.is_active).toBe(true);
    });

    it("rejects on invalid slug", async () => {
      await expect(getOrganization("nonexistent")).rejects.toBeDefined();
    });
  });

  describe("getAgents", () => {
    it("returns all 12 agents for the org", async () => {
      const agents = await getAgents(orgId);
      expect(agents).toHaveLength(12);
    });

    it("agents are ordered by display_order", async () => {
      const agents = await getAgents(orgId);
      for (let i = 1; i < agents.length; i++) {
        expect(agents[i].display_order).toBeGreaterThanOrEqual(
          agents[i - 1].display_order
        );
      }
    });

    it("every agent has required fields", async () => {
      const agents = await getAgents(orgId);
      for (const agent of agents) {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeTruthy();
        expect(agent.role).toBeTruthy();
        expect(agent.zone).toBeTruthy();
        expect(agent.emoji).toBeTruthy();
        expect(agent.color).toBeTruthy();
        expect(agent.prompt_template).toBeTruthy();
        expect(["idle", "working", "done", "error"]).toContain(agent.status);
      }
    });
  });

  describe("getAgent", () => {
    it("returns a single agent by ID", async () => {
      const agent = await getAgent(oracleId);
      expect(agent).toBeDefined();
      expect(agent.name).toBe("Oracle");
      expect(agent.zone).toBe("core");
    });

    it("rejects on invalid ID", async () => {
      await expect(
        getAgent("00000000-0000-0000-0000-000000000000")
      ).rejects.toBeDefined();
    });
  });

  describe("getAgentsByZone", () => {
    it("returns agents filtered by zone", async () => {
      const yelp = await getAgentsByZone(orgId, "yelp");
      expect(yelp.length).toBe(3);
      for (const agent of yelp) {
        expect(agent.zone).toBe("yelp");
      }
    });

    it("returns empty array for unknown zone", async () => {
      const agents = await getAgentsByZone(orgId, "nonexistent");
      expect(agents).toHaveLength(0);
    });
  });

  describe("getTeams", () => {
    it("returns 4 teams with member counts", async () => {
      const teams = await getTeams(orgId);
      expect(teams).toHaveLength(4);
      for (const team of teams!) {
        expect(team.name).toBeTruthy();
        expect(team.member_count).toBeGreaterThan(0);
      }
    });
  });

  describe("updateAgentStatus", () => {
    it("updates agent status and reverts", async () => {
      // Get current status
      const before = await getAgent(oracleId);
      const originalStatus = before.status;

      // Update to working
      await updateAgentStatus(oracleId, "working");
      const during = await getAgent(oracleId);
      expect(during.status).toBe("working");

      // Revert
      await updateAgentStatus(
        oracleId,
        originalStatus as "idle" | "working" | "done" | "error"
      );
      const after = await getAgent(oracleId);
      expect(after.status).toBe(originalStatus);
    });
  });

  describe("saveAgentOutput", () => {
    it("saves output and updates last_run_at", async () => {
      const testOutput = `Test output at ${new Date().toISOString()}`;
      await saveAgentOutput(oracleId, testOutput);

      const agent = await getAgent(oracleId);
      expect(agent.last_output).toBe(testOutput);
      expect(agent.last_run_at).toBeTruthy();
    });
  });

  describe("logActivity", () => {
    it("creates an activity log entry", async () => {
      const action = `test-${Date.now()}`;
      await logActivity(orgId, oracleId, action, "Test detail", "core");

      const log = await getActivityLog(orgId, 5);
      const entry = log.find((e) => e.action === action);
      expect(entry).toBeDefined();
      expect(entry!.detail).toBe("Test detail");
      expect(entry!.zone).toBe("core");
    });
  });

  describe("getActivityLog", () => {
    it("returns activity entries newest first", async () => {
      const log = await getActivityLog(orgId, 10);
      expect(log.length).toBeGreaterThan(0);
      for (let i = 1; i < log.length; i++) {
        expect(new Date(log[i - 1].created_at).getTime()).toBeGreaterThanOrEqual(
          new Date(log[i].created_at).getTime()
        );
      }
    });

    it("respects limit parameter", async () => {
      const log = await getActivityLog(orgId, 2);
      expect(log.length).toBeLessThanOrEqual(2);
    });
  });

  describe("sendAgentMessage + getAgentMessages", () => {
    it("sends a message and retrieves it", async () => {
      const testMsg = `test-msg-${Date.now()}`;
      await sendAgentMessage(
        orgId,
        oracleId,
        null,
        "status_update",
        testMsg
      );

      const messages = await getAgentMessages(orgId, 5);
      const found = messages.find((m) => m.message === testMsg);
      expect(found).toBeDefined();
      expect(found!.channel).toBe("status_update");
    });
  });
});
