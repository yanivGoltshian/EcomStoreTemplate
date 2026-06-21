// Picks the persistence backend. If GitHub credentials are present we are running
// in production (Static Web Apps managed Functions) and commit to the repo;
// otherwise fall back to the local filesystem for development.
import * as github from "./github.mjs";
import * as localfs from "./localfs.mjs";

export function getBackend() {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) return github;
  return localfs;
}

export function backendName() {
  return process.env.GITHUB_TOKEN && process.env.GITHUB_REPO ? "github" : "localfs";
}
