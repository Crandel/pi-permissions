import { log } from "./logger";
import { loadConfig, type PermissionConfig } from "./config";
import { sortRules, evaluate } from "./rules";
import { SessionCache, askUser } from "./ask";
import {
  PERMISSION_OPTIONS,
  PERMISSIONS_ASK_EVENT,
  PERMISSIONS_DENY_EVENT,
  PERMISSIONS_USER_SELECT_EVENT,
  emitPermissionEvent,
  serializeRule,
} from "./events";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { PermissionsDenySource } from "./events";

export default function (pi: ExtensionAPI) {
  let config: PermissionConfig = { rules: [], debug: false };
  let sortedRules: Rule[] = [];
  let debug = false;
  const cache = new SessionCache();

  pi.on("session_start", async (event, ctx) => {
    config = loadConfig(ctx.cwd, ctx.home);
    sortedRules = sortRules(config.rules);
    debug = config.debug ?? false;
    cache.clear();
    log("INFO", `Session started. Loaded ${sortedRules.length} rules. Debug mode: ${debug}`);
    log("INFO", `Rules: ${JSON.stringify(sortedRules, null, 2)}`);
  });

  pi.on("tool_call", async (event, ctx) => {
    if (debug) {
      log("DEBUG", `Tool call: ${event.toolName} (id: ${event.toolCallId})`);
    }

    const result = evaluate(event.toolName, event.input, sortedRules, debug);
    if (!result) {
      if (debug) log("DEBUG", "No matching rule found, allowing by default.");
      return undefined;
    }

    const { action, rule, matchTrace } = result;

    if (action === "allow") {
      if (debug) log("DEBUG", `Rule matched: allow (priority: ${rule.priority ?? 0})`);
      return undefined;
    }

    if (action === "deny") {
      const reason = rule.message ?? "Blocked by permissions";
      if (debug) {
        log("INFO", `DENY: ${reason}`);
        if (matchTrace) {
          matchTrace.forEach(msg => log("DEBUG", `  - ${msg}`));
        }
      }
      emitDeny(pi.events, event.toolCallId, event.toolName, reason, "rule", rule);
      return { block: true, reason };
    }

    // action === "ask"
    const cached = cache.get(event.toolName, event.input);
    if (cached === "allow") {
      if (debug) log("DEBUG", `Rule ${rule.priority ?? 0}: ASK (cached allow)`);
      return undefined;
    }
    if (cached === "deny") {
      const reason = rule.message ?? "Blocked by permissions";
      if (debug) log("ERROR", `DENY (cached): ${reason}`);
      emitDeny(pi.events, event.toolCallId, event.toolName, reason, "cache", rule);
      return { block: true, reason };
    }

    if (!ctx.hasUI) {
      const reason = "ask rule requires UI";
      if (debug) log("ERROR", `DENY: ${reason}`);
      emitDeny(pi.events, event.toolCallId, event.toolName, reason, "no_ui", rule);
      return { block: true, reason };
    }

    if (debug) {
      log("INFO", `ASKING for permission: ${rule.message ?? "No message"}`);
    }

    emitPermissionEvent(pi.events, PERMISSIONS_ASK_EVENT, {
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      rule: serializeRule(rule),
      options: PERMISSION_OPTIONS,
    });

    const userResult = await askUser(event.toolName, event.input, cache, ctx);
    if (debug) {
      log("INFO", `User selected: ${userResult.selection} for tool ${event.toolName}`);
    }

    emitPermissionEvent(pi.events, PERMISSIONS_USER_SELECT_EVENT, {
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      selection: userResult.selection,
      decision: userResult.decision,
      cached: userResult.cached,
      rule: serializeRule(rule),
    });

    if (userResult.decision === "allow") {
      return undefined;
    }

    const reason = rule.message ?? "Blocked by user";
    if (debug) log("DENY", `User denied: ${reason}`);
    emitDeny(pi.events, event.toolCallId, event.toolName, reason, "user", rule);
    return { block: true, reason };
  });

  function emitDeny(events: ExtensionAPI["events"], toolCallId: string, toolName: string, reason: string, source: PermissionsDenySource, rule: Rule) {
    if (debug) {
      log("DENY", `Tool "${toolName}" blocked: ${reason} (source: ${source})`);
    }
    emitPermissionEvent(events, PERMISSIONS_DENY_EVENT, {
      toolCallId,
      toolName,
      reason,
      source,
      rule: serializeRule(rule),
    });
  }
}
