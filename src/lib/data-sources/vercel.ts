/**
 * Vercel API data source.
 * Fetches deployment status across all projects.
 */

const VERCEL_API = "https://api.vercel.com";

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: string;
  target: string | null;
}

interface VercelProject {
  id: string;
  name: string;
  latestDeployments?: VercelDeployment[];
}

export async function getVercelDeployments(): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return "VERCEL: No VERCEL_TOKEN configured. Cannot fetch deployment data.";
  }

  try {
    // Get recent deployments across all projects
    const res = await fetch(`${VERCEL_API}/v6/deployments?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return `VERCEL: API returned ${res.status} ${res.statusText}`;
    }

    const data = await res.json();
    const deployments: VercelDeployment[] = data.deployments || [];

    if (deployments.length === 0) {
      return "VERCEL: No deployments found.";
    }

    // Group by project name
    const byProject: Record<string, VercelDeployment[]> = {};
    for (const d of deployments) {
      if (!byProject[d.name]) byProject[d.name] = [];
      byProject[d.name].push(d);
    }

    const lines: string[] = ["VERCEL DEPLOYMENT STATUS:"];

    for (const [project, deploys] of Object.entries(byProject)) {
      const latest = deploys[0];
      const age = Math.floor((Date.now() - latest.created) / 1000 / 60);
      const ageStr =
        age < 60 ? `${age}m ago` : age < 1440 ? `${Math.floor(age / 60)}h ago` : `${Math.floor(age / 1440)}d ago`;

      const failures = deploys.filter((d) => d.state === "ERROR").length;
      const status = latest.state === "READY" ? "HEALTHY" : latest.state;

      lines.push(`- ${project}: ${status} (last deploy: ${ageStr}${failures > 0 ? `, ${failures} failures in last 20` : ""})`);
    }

    return lines.join("\n");
  } catch (err) {
    return `VERCEL: Error fetching deployments: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function getVercelProjects(): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return "VERCEL: No VERCEL_TOKEN configured.";
  }

  try {
    const res = await fetch(`${VERCEL_API}/v9/projects?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return `VERCEL: API returned ${res.status}`;
    }

    const data = await res.json();
    const projects: VercelProject[] = data.projects || [];

    const lines: string[] = [`VERCEL PROJECTS (${projects.length}):`];
    for (const p of projects) {
      lines.push(`- ${p.name}`);
    }

    return lines.join("\n");
  } catch (err) {
    return `VERCEL: Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
