# FlowstateAI HQ: Agent Structure v2 (Data Contract)

Status: DRAFT. Do not build until approved.

## Context

Client zero: Michael Haslim (Slim). Senior Partner Account Executive at Yelp (West Region), Founder of FlowstateAI, wedding photographer.

This structure is designed around how Slim actually works, based on his Notion Command Center, Build SOPs, and daily workflow. Every agent earns its desk by solving a real problem he has today.

## Design Principles

1. **Anthropic SDK agent pattern**: Each team lead is an orchestrator agent that delegates to members using tool_use
2. **Less is more**: Every agent solves one problem well. No decorative agents.
3. **Real data sources**: Option B (fetch data ourselves, pass as context to Claude) for v2. MCP auth (Option A) in v3.
4. **Multi-tenant ready**: org_id on everything. Slim is client zero but the schema works for any client.

## Team Structure (5 teams, 14 agents)

### Executive (1 agent)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Chief of Staff** | Orchestrator | Boots first. Reads Command Center "Now" section. Builds context summary. Passes to all team leads. | Notion API (Command Center page) | Read only. Produces daily briefing. |

Why: This replaces Oracle. Same context-first pattern, cleaner name for product.

### Operations (3 agents)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Ops Lead** | Team orchestrator | Coordinates inbox, calendar, and task tracking. Summarizes "what needs attention today." | Aggregates from members | Read + summarize |
| **Inbox** | Email triage | Reads recent emails, categorizes by urgency (action needed / FYI / can wait), flags time-sensitive items. | Gmail API (read-only) | Read only. Categorize. |
| **Calendar** | Schedule manager | Reads today + tomorrow events, finds conflicts, identifies open blocks for deep work. | Google Calendar API | Read only. Analyze. |

Why: Slim checks email and calendar every morning. These three agents automate that 15-minute routine.

### Finance (2 agents)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Finance Lead** | Team orchestrator | Coordinates invoice tracking and budget analysis. Flags anything overdue or off-budget. | Aggregates from members | Read + summarize |
| **Invoice Tracker** | AP/AR monitor | Reads Notion pipeline for pending invoices, SOWs, and payment status. Flags overdue items. | Notion API (Pipeline DB) | Read only. Flag. |

Why: Slim has active SOWs (Takari, Queen's Corn, Twenty5) and needs to track who owes what. YNAB budgeting is personal (out of scope for HQ).

### Marketing (2 agents)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Content Lead** | Team orchestrator | Coordinates content pipeline. Tracks what's published, what's drafted, what's next. | Aggregates from members | Read + summarize |
| **Publisher** | Content tracker | Reads Notion content tracker DB for Substack posts. Reports: published count, drafts in progress, next scheduled post, engagement metrics if available. | Notion API (Content Tracker DB) | Read only. Report. |

Why: Slim has a Substack ("Context Over Compute") with a content calendar through Post 5. This agent tracks that pipeline.

### Engineering (4 agents)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Tech Lead** | Team orchestrator | Coordinates deploy monitoring, code review, and project health. Morning standup for all active builds. | Aggregates from members | Read + summarize |
| **Deploy Monitor** | CI/CD tracker | Checks Vercel deployments across all projects (Julie's Cookbook, AI Tuner, Photography site, FlowstateAI HQ). Reports: last deploy time, build status, any failures. | Vercel API | Read only. Report. |
| **Project Scanner** | Build health | Reads Notion project table. For each active project: status, pending items, blockers. Produces the "Active Projects" standup. | Notion API (Projects table in Command Center) | Read only. Scan. |
| **QA Agent** | Automated tester | Runs the test suite (npm test) and reports results. Checks if build passes (npm run build). Reports pass/fail with details on failures. | Local: jest + next build | Execute tests. Report. |

Why: Slim has 9+ active projects across multiple Vercel deployments. He needs a single view of "is everything healthy." The QA agent is the automated test runner you asked for.

### Security & Compliance (2 agents)

| Agent | Role | What It Does | Data Source | Actions |
|-------|------|-------------|-------------|---------|
| **Compliance Lead** | Team orchestrator | Coordinates database health and access monitoring. Flags security issues. | Aggregates from members | Read + summarize |
| **Data Guardian** | Database monitor | Checks Supabase project health: active/paused status, storage usage, RLS enabled on all tables. Lists all projects and their state. | Supabase API | Read only. Audit. |

Why: Slim has multiple Supabase projects (Julie's Cookbook, FlowstateAI HQ, possibly paused free-tier projects). This agent prevents the "my Supabase got paused and I didn't notice" problem.

## What Got Cut (and why)

| Old Agent | Reason |
|-----------|--------|
| Scout (Yelp Prospector) | Too specific to Slim's Yelp role. Not relevant for other clients. Prospecting data moves to the Pipeline DB and Finance tracks it. |
| Metric (Performance Analyst) | Merged into Content Lead (marketing metrics) and Finance Lead (revenue metrics). |
| Herald (Outreach Composer) | Write actions (sending emails) are v3. For now, Inbox reads and categorizes. |
| Kettle, Atlas, Pawn (client-specific) | These were Slim-specific client agents. In v2, Project Scanner covers all projects generically. Individual client agents come back when those clients onboard. |
| Tempo, Mercury, Ledger | Merged into Operations (Calendar, Inbox) and Engineering (Project Scanner). Less overlap. |

## Data Source Authentication Plan

| Source | Auth Method | Status | Notes |
|--------|-----------|--------|-------|
| Notion API | Integration token | Need to create | Internal integration, scoped to Slim's workspace |
| Gmail API | OAuth 2.0 | Need to set up | Google Cloud project + OAuth consent screen |
| Google Calendar API | OAuth 2.0 | Shares Gmail OAuth | Same Google Cloud project |
| Vercel API | Bearer token | Have it | VERCEL_TOKEN from CLI |
| Supabase API | Service role key | Have it | Already in .env.local |
| Jest / npm build | Local execution | Works now | Runs in the API route server-side |

## Env Vars Required (v2)

```
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=

# New for v2
NOTION_API_KEY=          # Internal integration token
GOOGLE_CLIENT_ID=        # OAuth for Gmail + Calendar
GOOGLE_CLIENT_SECRET=    # OAuth for Gmail + Calendar
GOOGLE_REFRESH_TOKEN=    # Stored after initial OAuth
VERCEL_TOKEN=            # For deployment status checks
```

## Schema Changes

### Modified: agents table
- Update existing rows to match new team structure
- Same schema, just different data

### Modified: teams table
- 5 teams instead of 4: Executive, Operations, Finance, Marketing, Engineering, Security

### New: agent_tools table (for Anthropic SDK tool_use)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| agent_id | uuid FK | Which agent owns this tool |
| name | text | Tool name (e.g., "read_notion_page") |
| description | text | What the tool does (for Claude) |
| input_schema | jsonb | JSON Schema for tool parameters |
| handler | text | Which API handler to call |
| created_at | timestamptz | Auto |

This table maps each agent's capabilities to actual tool definitions that the Anthropic SDK can use.

## Orchestration Flow

```
Boot Morning Briefing:
  1. Chief of Staff reads Notion Command Center -> context
  2. Pass context to all 5 team leads in parallel
  3. Each team lead runs their members in parallel
  4. Members fetch from their data sources, pass results to lead
  5. Leads summarize team report
  6. Chief of Staff aggregates all team reports into daily briefing
  7. Store briefing in briefings table
  8. Display in UI
```

## Verification Gates (per SOP-004)

Before building:
- [ ] Data contract approved by Slim
- [ ] All existing tests still pass (npm test)
- [ ] New env vars documented
- [ ] Notion API integration token created
- [ ] Google OAuth flow designed (can be deferred if Gmail/Calendar agents are last)

After building:
- [ ] npm run build passes
- [ ] npm test passes (21+ existing tests + new tests for v2 agents)
- [ ] Chief of Staff returns real Notion data
- [ ] Deploy Monitor returns real Vercel data
- [ ] QA Agent runs tests and reports results
- [ ] Activity log and comms populated after briefing
- [ ] Office view shows new team layout
