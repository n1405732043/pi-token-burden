/**
 * Filesystem-based skill discovery.
 *
 * Scans the same directories pi uses to find skills, reads SKILL.md
 * frontmatter, deduplicates by name (first wins), and computes each
 * skill's disable state from settings.json + frontmatter.
 *
 * Directory scan order (matches pi's resource-loader):
 *   1. .pi/skills/         (project)
 *   2. .agents/skills/     (cwd + ancestors up to git root)
 *   3. ~/.pi/agent/skills/ (user)
 *   4. ~/.agents/skills/   (user)
 *   5. Explicit paths from settings.json skills arrays
 *   6. Paths from installed packages
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { DisableMode } from "./enums.js";
import { estimateTokens } from "./parser.js";
import type { Settings, SkillInfo } from "./types.js";

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

interface FrontmatterResult {
  name: string;
  description: string;
  disableModelInvocation: boolean;
}

export function parseFrontmatter(
  content: string,
  fallbackName: string
): FrontmatterResult {
  if (!content.startsWith("---")) {
    return {
      name: fallbackName,
      description: "",
      disableModelInvocation: false,
    };
  }

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return {
      name: fallbackName,
      description: "",
      disableModelInvocation: false,
    };
  }

  const frontmatter = content.slice(4, endIndex);
  let name = fallbackName;
  let description = "";
  let disableModelInvocation = false;

  for (const line of frontmatter.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === "name") {
      name = value;
    }
    if (key === "description") {
      description = value;
    }
    if (key === "disable-model-invocation") {
      disableModelInvocation = value.toLowerCase() === "true";
    }
  }

  return { name, description, disableModelInvocation };
}

// ---------------------------------------------------------------------------
// Directory scanning
// ---------------------------------------------------------------------------

interface RawSkill {
  name: string;
  description: string;
  filePath: string;
  disableModelInvocation: boolean;
}

function loadRawSkill(
  filePath: string,
  skills: RawSkill[],
  visitedRealPaths: Set<string>
): void {
  try {
    let realPath: string;
    try {
      realPath = fs.realpathSync(filePath);
    } catch {
      realPath = filePath;
    }

    if (visitedRealPaths.has(realPath)) {
      return;
    }
    visitedRealPaths.add(realPath);

    const content = fs.readFileSync(filePath, "utf8");
    const parentDirName = path.basename(path.dirname(filePath));
    const { name, description, disableModelInvocation } = parseFrontmatter(
      content,
      parentDirName
    );

    if (!description) {
      return;
    }

    skills.push({ name, description, filePath, disableModelInvocation });
  } catch {
    // Skip invalid skill files
  }
}

export function scanSkillDir(
  dir: string,
  skills: RawSkill[],
  visitedRealPaths: Set<string>,
  visitedDirs?: Set<string>
): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  const visited = visitedDirs ?? new Set<string>();
  let realDir: string;
  try {
    realDir = fs.realpathSync(dir);
  } catch {
    realDir = dir;
  }
  if (visited.has(realDir)) {
    return;
  }
  visited.add(realDir);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }
      if (entry.name === "node_modules") {
        continue;
      }

      const entryPath = path.join(dir, entry.name);

      let isDirectory = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          const stats = fs.statSync(entryPath);
          isDirectory = stats.isDirectory();
          isFile = stats.isFile();
        } catch {
          continue;
        }
      }

      if (isDirectory) {
        scanSkillDir(entryPath, skills, visitedRealPaths, visited);
      } else if (isFile && entry.name === "SKILL.md") {
        loadRawSkill(entryPath, skills, visitedRealPaths);
      }
    }
  } catch {
    // Skip inaccessible directories
  }
}

// ---------------------------------------------------------------------------
// Token estimation for skill prompt entries
// ---------------------------------------------------------------------------

/**
 * Estimate the token cost of a skill's XML entry in the system prompt.
 *
 * Pi formats each skill as:
 *   <skill>
 *     <name>{name}</name>
 *     <description>{description}</description>
 *     <location>{filePath}</location>
 *   </skill>
 */
export function estimateSkillPromptTokens(skill: {
  name: string;
  description: string;
  filePath: string;
}): number {
  const xml = [
    "  <skill>",
    `    <name>${skill.name}</name>`,
    `    <description>${skill.description}</description>`,
    `    <location>${skill.filePath}</location>`,
    "  </skill>",
  ].join("\n");
  return estimateTokens(xml);
}

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

function normalizePath(p: string): string {
  const trimmed = p.trim();
  if (trimmed === "~") {
    return os.homedir();
  }
  if (trimmed.startsWith("~/")) {
    return path.join(os.homedir(), trimmed.slice(2));
  }
  if (trimmed.startsWith("~")) {
    return path.join(os.homedir(), trimmed.slice(1));
  }
  return path.resolve(trimmed);
}

function getDisabledPaths(settings: Settings): Set<string> {
  const disabled = new Set<string>();
  const skills = settings.skills ?? [];
  for (const entry of skills) {
    if (typeof entry === "string" && entry.startsWith("-")) {
      const rawPath = entry.slice(1);
      const absolutePath = normalizePath(rawPath);
      disabled.add(absolutePath);
      disabled.add(path.join(absolutePath, "SKILL.md"));
    }
  }
  return disabled;
}

function isSkillDisabled(
  filePath: string,
  disabledPaths: Set<string>
): boolean {
  const normalized = path.normalize(filePath);
  const dir = path.dirname(filePath);
  return disabledPaths.has(normalized) || disabledPaths.has(dir);
}

// ---------------------------------------------------------------------------
// Ancestor .agents/skills/ directory collection
// ---------------------------------------------------------------------------

function findGitRepoRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

function collectAncestorAgentsSkillDirs(startDir: string): string[] {
  const dirs: string[] = [];
  const resolved = path.resolve(startDir);
  const gitRoot = findGitRepoRoot(resolved);

  let dir = resolved;
  for (;;) {
    dirs.push(path.join(dir, ".agents", "skills"));
    if (gitRoot && dir === gitRoot) {
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return dirs;
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

/**
 * Discover all skills from the filesystem, matching pi's actual scan order.
 *
 * Pass `overrideDirs` to scan only those directories (for testing).
 * Pass `settings` as `{}` if no settings file exists.
 */
export function loadAllSkills(
  settings: Settings,
  overrideDirs?: string[]
): { skills: SkillInfo[]; byName: Map<string, SkillInfo> } {
  const disabledPaths = getDisabledPaths(settings);
  const rawSkills: RawSkill[] = [];
  const visitedRealPaths = new Set<string>();

  const scanDirs = overrideDirs ?? [
    path.join(process.cwd(), ".pi", "skills"),
    ...collectAncestorAgentsSkillDirs(process.cwd()),
    path.join(os.homedir(), ".pi", "agent", "skills"),
    path.join(os.homedir(), ".agents", "skills"),
  ];

  for (const dir of scanDirs) {
    scanSkillDir(dir, rawSkills, visitedRealPaths);
  }

  // Group by name — first occurrence wins
  const byName = new Map<string, SkillInfo>();
  const pathsByName = new Map<string, string[]>();

  for (const raw of rawSkills) {
    if (!pathsByName.has(raw.name)) {
      pathsByName.set(raw.name, []);
    }
    pathsByName.get(raw.name)?.push(raw.filePath);

    if (!byName.has(raw.name)) {
      byName.set(raw.name, {
        name: raw.name,
        description: raw.description,
        filePath: raw.filePath,
        allPaths: [],
        mode: DisableMode.Enabled,
        tokens: estimateSkillPromptTokens(raw),
        hasDuplicates: false,
      });
    }
  }

  // Fill in allPaths and compute mode
  for (const [name, skill] of byName) {
    const allPaths = pathsByName.get(name) ?? [skill.filePath];
    skill.allPaths = allPaths;
    skill.hasDuplicates = allPaths.length > 1;

    const allDisabled = allPaths.every((p) =>
      isSkillDisabled(p, disabledPaths)
    );
    if (allDisabled) {
      skill.mode = DisableMode.Disabled;
    } else if (rawSkills.find((r) => r.name === name)?.disableModelInvocation) {
      skill.mode = DisableMode.Hidden;
    }
  }

  const skills = [...byName.values()].toSorted((a, b) =>
    a.name.localeCompare(b.name)
  );
  return { skills, byName };
}
