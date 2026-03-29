# FlowstateAI HQ — Pass 2: Mission Control UI

Read the CLAUDE.md in the project root first. It has the data contract, design direction, and architecture rules.

## What exists from Pass 1
- Next.js 14 scaffold with Tailwind
- Supabase client (browser, server, admin) at /src/lib/supabase.ts
- Data abstraction layer at /src/lib/agents.ts (9 functions)
- Anthropic SDK wrapper at /src/lib/anthropic.ts
- API routes: POST /api/agents/[id]/run, POST /api/briefing/boot
- Supabase project zxgzlrmrnqgrwhahokja with 12 agents, 4 teams, 8 blueprints seeded
- Build passes, Oracle endpoint verified working

## Design System (from CLAUDE.md)
```
Background:  #0a0a18 (base), #0f0f24 (surface), #161632 (elevated)
Borders:     #1a1a3e
Green:       #00ff88 (active/healthy/done)
Amber:       #ffcc00 (working/processing)
Red:         #ff4444 (errors)
Muted:       #666688 (idle/inactive text)
White:       #ffffff (primary text)
Fonts:       Space Mono (headings, agent names), Inter (body), Press Start 2P (logo accent only)
```

## Pass 2 Tasks (execute in order)

### 2.1 Install UI dependencies
```
npm install next-themes
```
Note: We already have Tailwind. Add Space Mono and Inter via next/font.

### 2.2 Set up global theme
Update /src/app/layout.tsx:
- Import Space Mono and Inter from next/font/google
- Set dark background (#0a0a18) as default
- Add CSS variables for the design tokens listed above
- Set metadata: title "FlowstateAI HQ", description "AI Operations Center"

Update /src/app/globals.css:
- Remove all default Next.js styles
- Add dark theme CSS variables
- Add utility classes for status colors (text-status-idle, text-status-working, text-status-done, text-status-error)
- Add a subtle grid background pattern on body (optional, mission-control aesthetic)

### 2.3 Build shared components

#### /src/components/status-badge.tsx
- Renders a colored dot + status text
- Colors: idle = muted, working = amber (pulse animation), done = green, error = red
- Small pill shape with border

#### /src/components/agent-card.tsx
- Card for a single agent
- Shows: emoji, name (Space Mono), role, zone badge, status badge
- Color accent bar on left edge (agent.color)
- Click triggers run (calls POST /api/agents/[id]/run)
- While running: pulse/glow animation, status updates optimistically
- On completion: shows truncated last_output (first 120 chars)
- Timestamp of last_run_at in relative format ("2m ago")

#### /src/components/team-section.tsx
- Groups agents by team
- Team header: icon + name + member count
- Grid of agent-cards (2 col on desktop, 1 col on mobile)

#### /src/components/activity-feed.tsx
- Scrollable list of recent activity_log entries
- Each entry: agent emoji + action text + relative timestamp
- Auto-refreshes every 10 seconds (polling with setInterval)
- Max height with overflow scroll
- Empty state: "No activity yet. Run an agent to get started."

#### /src/components/boot-button.tsx
- Large prominent button: "Boot Morning Briefing"
- Calls POST /api/briefing/boot
- While running: shows progress ("Oracle booting...", "Running batch 1/4...")
- Disabled while any briefing is in progress
- Green glow animation on hover

#### /src/components/header.tsx
- Top bar with:
  - Logo: "FLOWSTATE" in Press Start 2P (small, like 0.7rem) + "HQ" in green
  - Org name pill: "FlowstateAI"
  - Status indicator: green dot + "Online"
- Sticky top, z-50

### 2.4 Build the main dashboard page

Replace /src/app/page.tsx with the Mission Control dashboard:

Layout (desktop):
```
[Header - full width, sticky]
[Boot Button - centered, full width]
[Team Grid (left 2/3)          ] [Activity Feed (right 1/3)]
  [Command Team Section        ] [Feed entries...          ]
  [Yelp Ops Team Section       ] [                         ]
  [FlowstateAI Lab Section     ] [                         ]
  [Personal Stack Section      ] [                         ]
```

Layout (mobile, < 768px):
```
[Header]
[Boot Button]
[Activity Feed - collapsed, expandable]
[Command Team Section]
[Yelp Ops Team Section]
[FlowstateAI Lab Section]
[Personal Stack Section]
```

Data fetching:
- Server component at the page level fetches agents, teams, and recent activity via agents.ts functions
- Pass data to client components for interactivity
- Client components handle polling and optimistic updates

### 2.5 Build /src/app/api/agents/route.ts
GET endpoint that returns all agents for the FlowstateAI org. Needed for client-side polling/refresh.

### 2.6 Build /src/app/api/activity/route.ts
GET endpoint that returns recent activity log (last 50 entries). Needed for the activity feed polling.

### 2.7 Skeleton loaders
Add skeleton states for:
- Agent cards (pulsing gray rectangles matching card layout)
- Activity feed entries (3 placeholder rows)
- Show skeletons while initial data loads

### 2.8 Verify and commit

VERIFICATION GATE 2:
- [ ] npm run build passes with zero errors
- [ ] Dashboard renders at localhost:3000 with all 4 team sections
- [ ] 12 agent cards visible, grouped by team
- [ ] Clicking an agent card triggers the run and shows status update
- [ ] Boot button triggers full briefing sequence
- [ ] Activity feed populates after running agents
- [ ] Activity feed auto-refreshes
- [ ] Mobile layout works at 375px
- [ ] No API keys or secrets exposed in client bundle

Only after ALL checks pass:
```
git add .
git commit -m "pass 2: mission control dashboard - agent cards, team sections, activity feed, boot sequence"
```

## Rules
- All data fetching uses /lib/agents.ts functions (server-side) or the new API routes (client-side polling)
- No direct Supabase calls from components
- No Anthropic calls from components (only via API routes)
- Client components only where interactivity is needed (agent card click, boot button, feed polling)
- Server components by default
- Tailwind only, no CSS modules, no styled-components
- All status colors from the design system, no arbitrary values
- Test on mobile viewport (375px) before committing
- Do NOT proceed to Pass 3 until I confirm all verification gates pass
