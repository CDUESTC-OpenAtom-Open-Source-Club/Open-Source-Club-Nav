export type DeployPhase = "idle" | "checking" | "deploying" | "success" | "failed";

export type DeployStatus = {
  phase: DeployPhase;
  job_id?: string;
  current_tag?: string;
  current_commit?: string;
  latest_tag?: string;
  has_update?: boolean;
  repo_path?: string;
  update_script?: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
  logs?: string[];
};

async function readDeployResponse(response: Response): Promise<DeployStatus> {
  const data = await response.json().catch(() => null);
  if (response.ok) return (data || {}) as DeployStatus;
  const status = data?.status as DeployStatus | undefined;
  const message = data?.error || "deploy request failed";
  throw Object.assign(new Error(message), { status });
}

export async function checkUpdates(): Promise<DeployStatus> {
  const response = await fetch("/api/admin/deploy/check-updates", { cache: "no-store" });
  return readDeployResponse(response);
}

export async function triggerDeploy(): Promise<DeployStatus> {
  const response = await fetch("/api/admin/deploy/trigger", {
    method: "POST",
    cache: "no-store",
  });
  return readDeployResponse(response);
}

export async function getDeployStatus(): Promise<DeployStatus> {
  const response = await fetch("/api/admin/deploy/status", { cache: "no-store" });
  return readDeployResponse(response);
}
