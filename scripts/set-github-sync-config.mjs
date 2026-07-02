import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".github.env");

if (!existsSync(envPath)) {
  fail("Missing .github.env. Copy .github.env.example to .github.env and fill in the values.");
}

const config = parseEnvFile(readFileSync(envPath, "utf8"));
const originRepository = getOriginRepository();

requireValue(config, "SYNC_TARGET_TOKEN");
requireValue(config, "SYNC_TARGET_REPO");

run("gh", ["auth", "status"]);
setSecret("SYNC_TARGET_TOKEN", config.SYNC_TARGET_TOKEN);
setVariable("SYNC_TARGET_REPO", config.SYNC_TARGET_REPO);

if (config.SYNC_TARGET_BRANCH) {
  setVariable("SYNC_TARGET_BRANCH", config.SYNC_TARGET_BRANCH);
}

console.log("GitHub Actions sync settings registered on the origin repository.");

function parseEnvFile(content) {
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = stripQuotes(line.slice(separator + 1).trim());
    entries[key] = value;
  }

  return entries;
}

function stripQuotes(value) {
  if (value.length < 2) return value;
  const first = value.at(0);
  const last = value.at(-1);

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}

function requireValue(config, key) {
  if (!config[key]) {
    fail(`Missing ${key} in .github.env.`);
  }
}

function getOriginRepository() {
  const remoteUrl = runCapture("git", ["remote", "get-url", "origin"]).trim();
  const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);

  if (!match) {
    fail(`Could not detect GitHub origin repository from: ${remoteUrl}`);
  }

  return match[1];
}

function setSecret(name, value) {
  console.log(`Setting secret: ${name}`);
  run("gh", ["secret", "set", name, "--repo", originRepository], value);
}

function setVariable(name, value) {
  console.log(`Setting variable: ${name}`);
  run("gh", ["variable", "set", name, "--repo", originRepository, "--body", value]);
}

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    encoding: "utf8",
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(" ")}\n${result.stderr}`);
  }

  return result.stdout;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
