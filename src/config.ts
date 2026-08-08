import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { log } from "./logger";
import { getPermissionGlobalDir, getPermissionLocalDir } from "./paths";
import { readPiUserSettings, readPiProjectSettings } from "./settings";

export type Action = "allow" | "deny" | "ask";

export interface MatchCriteria {
  tool: string;
  params?: Record<string, string>;
  paths?: string[];
  pathParam?: string;
}

export interface Rule {
  message?: string;
  priority?: number;
  match: MatchCriteria;
  action: Action;
}

export interface PermissionConfig {
  rules: Rule[];
  debug?: boolean;
}

function loadRulesFromFile(filePath: string, debug: boolean = false): Rule[] {
  if (debug) {
    log("DEBUG", `Loading config from: ${filePath}`);
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as PermissionConfig;
    if (Array.isArray(parsed.rules)) {
      if (debug) {
        log("DEBUG", `Loaded ${parsed.rules.length} rules from ${filePath}`);
      }
      return parsed.rules;
    }
  } catch (e: any) {
    if (debug) {
      log("ERROR", `Failed to load config from ${filePath}: ${e.message}`);
    }
  }
  return [];
}

function loadRulesFromSettings(readSettings: () => PiSettings | null, debug: boolean, filePath: string): Rule[] {
  try {
    const settings = readSettings();
    if (settings && settings.permissions && Array.isArray(settings.permissions.rules)) {
      if (debug) {
        log("DEBUG", `Loaded ${settings.permissions.rules.length} rules from settings in ${filePath}`);
      }
      return settings.permissions.rules;
    }
  } catch (e: any) {
    if (debug) {
      log("ERROR", `Failed to load settings from ${filePath}: ${e.message}`);
    }
  }
  return [];
}

export function loadConfig(cwd: string, home = os.homedir()): PermissionConfig {
  const globalConfigPath = path.join(getPermissionGlobalDir(home), "permissions.json");
  const localConfigPath = path.join(getPermissionsLocalDir(cwd), "permissions.json");

  const globalRules = loadRulesFromFile(globalConfigPath, true);
  const localRules = loadRulesFromFile(localConfigPath, true);

  let debug = globalRules.length > 0 || localRules.length > 0;

  if (globalRules.length === 0) {
    const settingsRules = loadRulesFromSettings(() => readPiUserSettings(home), debug, globalConfigPath);
    globalRules.push(...settingsRules);
    if (settingsRules.length > 0) debug = true;
  }

  if (localRules.length === 0) {
    const settingsRules = loadRulesFromSettings(() => readPiProjectSettings(cwd), debug, localConfigPath);
    localRules.push(...settingsRules);
    if (settingsRules.length > 0) debug = true;
  }

  if (debug) {
    log("INFO", `Loaded ${globalRules.length + localRules.length} rules total`);
  }

  return {
    rules: [...globalRules, ...localRules],
    debug,
  };
}
