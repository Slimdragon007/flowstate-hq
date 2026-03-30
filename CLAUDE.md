# CLAUDE.md - FlowstateAI HQ

## Project Identity
- **Name:** FlowstateAI HQ
- **Purpose:** Visual AI operations center with build orchestration, morning briefings, and real-time agent monitoring
- **Owner:** Michael Haslim (Slim)
- **GitHub:** Slimdragon007/flowstate-hq
- **Stack:** Next.js 14 (App Router) + Tailwind CSS + Anthropic TypeScript SDK + Supabase + Vercel

## Supabase
- **Project ID:** zxgzlrmrnqgrwhahokja
- **URL:** https://zxgzlrmrnqgrwhahokja.supabase.co
- **Anon Key:** (see .env.local)
- **Region:** us-east-1
- **Tables:** organizations (1 row: FlowstateAI), agents (12 rows seeded, linked to org), agent_blueprints (8 starter templates), workflows, briefings, activity_log
- **Multi-tenant:** All tables have org_id column. Every query must filter by org_id. RLS will scope to org when multi-tenant is enabled.
- **RLS:** Enabled on all tables. Authenticated read/write. Service role full access.

## Env Vars Required
```
NEXT_PUBLIC_SUPABASE_URL=(see .env.local)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(see .env.local)
SUPABASE_SERVICE_ROLE_KEY=(see .env.local)
ANTHROPIC_API_KEY=(see .env.local)
```

## Data Contract

### Table: agents
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK, auto-generated |
| name | text | Display name (Oracle, Scout, etc.) |
| role | text | Role description |
| zone | text | core, yelp, flowstate, personal |
| emoji | text | Display emoji |
| color | text | Hex color |
| mcp_target | text | notion, gmail, calendar, supabase, vercel |
| prompt_template | text | Prompt with {{CONTEXT}} placeholder |
| status | text | idle, working, done, error |
| last_output | text | Most recent response |
| last_run_at | timestamptz | When last ran |
| is_active | boolean | Default true |
| display_order | integer | Sort within zone |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto on change |

### Table: workflows
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Display name |
| description | text | What it does |
| zone | text | yelp, flowstate, personal |
| trigger_type | text | api_call, mcp_action, claude_prompt |
| trigger_config | jsonb | Config payload |
| icon | text | Emoji |
| is_active | boolean | Default true |
| last_triggered_at | timestamptz | When last run |
| last_result | text | Output of last run |
| created_at | timestamptz | Auto |

### Table: briefings
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| briefing_date | date | Date covered |
| zone | text | yelp, flowstate, personal, all |
| content | jsonb | Structured briefing data |
| generated_at | timestamptz | When generated |
| ttl_minutes | integer | Default 60 |

### Table: activity_log
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid FK | Which organization |
| agent_id | uuid FK | Which agent (nullable) |
| workflow_id | uuid FK | Which workflow (nullable) |
| action | text | What happened |
| detail | text | Extended output |
| zone | text | core, yelp, flowstate, personal |
| created_at | timestamptz | Auto |

### Table: organizations
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Display name |
| slug | text | URL-safe unique identifier |
| owner_email | text | Primary contact |
| plan | text | starter, growth, enterprise |
| is_active | boolean | Default true |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto on change |

### Table: agent_blueprints
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| name | text | Display name (Invoice Bot, Lead Scout, etc.) |
| role | text | Role description |
| zone | text | operations, sales, support, finance, marketing, custom |
| emoji | text | Display emoji |
| color | text | Hex color |
| mcp_target | text | Which service to connect |
| prompt_template | text | Prompt with {{CONTEXT}} placeholder |
| description | text | What this agent does (client-facing) |
| category | text | Grouping category |
| is_public | boolean | Visible in blueprint catalog |
| created_at | timestamptz | Auto |

### Table: agent_messages (inter-agent communication)
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid FK | Which organization |
| from_agent_id | uuid FK | Sender agent (nullable for system messages) |
| to_agent_id | uuid FK | Recipient (nullable for broadcast) |
| channel | text | general, handoff, alert, request, status_update |
| message | text | The message content |
| metadata | jsonb | Structured data (task IDs, context, etc.) |
| is_read | boolean | Default false |
| created_at | timestamptz | Auto |

### Table: teams (departments)
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| org_id | uuid FK | Which organization |
| name | text | Team name (Yelp Ops, FlowstateAI Lab, etc.) |
| description | text | What this team does |
| icon | text | Display emoji |
| color | text | Hex color |
| created_at | timestamptz | Auto |

### Table: agent_team_members (many-to-many)
| Field | Type | Notes |
| --- | --- | --- |
| agent_id | uuid FK | PK (composite) |
| team_id | uuid FK | PK (composite) |
| role_in_team | text | lead or member |

## Current Team Roster (FlowstateAI org)
- Command: Oracle (lead)
- Yelp Ops: Scout (lead), Metric, Herald
- FlowstateAI Lab: Forge (lead), Kettle, Atlas, Pawn
- Personal Stack: Ledger (lead), Tempo, Vault, Mercury

## Agent Communication Architecture
Agents communicate via the agent_messages table. Message channels:
- **general:** Status updates visible to all agents in the org
- **handoff:** Agent A completes a task and passes context to Agent B
- **alert:** Urgent notifications
- **request:** Agent A asks Agent B for data
- **status_update:** Periodic "I'm working on X" updates for the activity feed

The communication flow works like this:
1. Oracle boots and loads context from Notion (Command Center, recent activity)
2. Oracle broadcasts context to all teams via general channel
3. Team leads receive context and run their specialized queries
4. Team leads post results to general channel + handoff channel if action needed
5. Member agents pick up handoffs and execute
6. All activity logged to activity_log table and visible in the feed

## Product Architecture (Multi-Tenant Ready)
- Every table has org_id. Every query filters by org_id.
- Agent blueprints are the "hire an agent" catalog.
- When onboarding a new client: create organization -> clone selected blueprints into agents table with their org_id -> configure prompt templates for their stack.
- Slim's org (slug: "flowstate") is the reference implementation.

## Architecture Rules
1. ALL Supabase calls go through `/lib/supabase.ts` (3 clients: browser, server, admin)
2. ALL agent logic goes through `/lib/agents.ts` (data abstraction layer)
3. ALL Anthropic SDK calls go through `/lib/anthropic.ts` (wrapper with error handling)
4. Server-side API routes ONLY. No client-side API keys exposed.
5. Agent prompts use `{{CONTEXT}}` placeholder. Oracle output fills this for all other agents.
6. MCP server passthrough: Anthropic SDK `mcp_servers` param in API route calls.

## MCP Server URLs
| Service | URL |
| --- | --- |
| Notion | https://mcp.notion.com/mcp |
| Gmail | https://gmail.mcp.claude.com/mcp |
| Google Calendar | https://gcal.mcp.claude.com/mcp |
| Supabase | https://mcp.supabase.com/mcp |
| Vercel | https://mcp.vercel.com |

## Design Direction: Mission Control
- Dark theme: #0a0a18 base background
- Green (#00ff88) for active/healthy
- Amber (#ffcc00) for working/processing
- Red (#ff4444) for errors
- Fonts: Space Mono (display), Inter (body), Press Start 2P (accents only)
- Pixel art agents at desks (SVG, inline)
- Responsive: 1 col mobile, 2-3 col desktop
- Skeleton loaders on all data views
- Optimistic UI updates

## Build Rules
- Separate git commits per pass (not per task)
- Verification gates between passes (see build plan)
- Never proceed to next pass without confirming all checks pass
- Run `npm run build` after every pass before committing
- Test on mobile viewport (375px) after Pass 2+

## Communication Rules (apply to all generated text)
- NEVER use em dashes
- NEVER use sycophantic phrases
- Peer-to-peer tone
- Arrows (->) for workflows
- Concise, structured output

## Notion Reference IDs
- Command Center: 32316230-665c-81ae-a6ee-c24d13b7fb17
- Claude OS Hub: 31916230-665c-8122-9894-f14fc1e14d9f
- Build SOPs: 31f16230-665c-818a-9119-fa0a1f918e0a
- Julie's Cookbook: 31e16230-665c-8107-91e5-ee03d6cbd636
- CLAUDE.md Library: 31916230-665c-812b-a985-ee9a847911b6
