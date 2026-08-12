import * as os from "node:os";
import * as path from "node:path";
import { minimatch } from "minimatch";
import type { Action, Rule } from "./config";
import { log } from "./logger";

export const ACTION_ORDER: Record<Action, number> = {
	deny: 2,
	ask: 1,
	allow: 0,
};

export function sortRules(rules: Rule[]): Rule[] {
	return [...rules].sort((a, b) => {
		const pa = a.priority ?? 0;
		const pb = b.priority ?? 0;
		if (pb !== pa) return pb - pa;
		return ACTION_ORDER[b.action] - ACTION_ORDER[a.action];
	});
}

export function matchesRule(
	rule: Rule,
	toolName: string,
	input: Record<string, unknown>,
	debug: boolean = false,
): { matched: boolean; reason?: string } {
	const match = rule.match;

	if (match.tool !== "*" && match.tool !== toolName) {
		return {
			matched: false,
			reason: `Tool mismatch: expected "${match.tool}", got "${toolName}"`,
		};
	}

	if (match.params) {
		for (const [key, pattern] of Object.entries(match.params)) {
			if (!(key in input)) {
				if (debug)
					log(
						"DEBUG",
						`Rule ${rule.priority}: Missing param "${key}. Input: ${input}"`,
					);
				return { matched: false, reason: `Missing param: ${key}` };
			}
			const value = String(input[key]);
			if (!testPattern(pattern, value, debug, rule.priority ?? 0)) {
				if (debug)
					log(
						"DEBUG",
						`Param mismatch key: ${key}, value: ${value}, pattern: ${pattern}`,
					);
				return {
					matched: false,
					reason: `Param mismatch: ${key}="${value}" does not match "${pattern}"`,
				};
			}
		}
	}

	if (match.paths && match.paths.length > 0) {
		const pathKey = match.pathParam ?? "path";
		if (!(pathKey in input)) {
			return { matched: false, reason: `Missing path param: ${pathKey}` };
		}
		const rawValue = String(input[pathKey]);
		const resolved = path.resolve(rawValue);
		const matched = pathsMatch(
			match.paths,
			resolved,
			debug,
			rule.priority ?? 0,
		);
		if (!matched) {
			return {
				matched: false,
				reason: `Path mismatch: ${rawValue} does not match any of [${match.paths.join(", ")}]`,
			};
		}
	}

	return { matched: true };
}

function testPattern(
	pattern: string,
	value: string,
	debug: boolean,
	priority: number,
): boolean {
	if (pattern.startsWith("/") && pattern.endsWith("/")) {
		const regex = pattern.slice(1, -1);
		try {
			const isMatch = new RegExp(regex, "i").test(value);
			if (debug)
				log(
					"DEBUG",
					`Rule ${priority}: Regex test "${regex}" on "${value}" -> ${isMatch}`,
				);
			return isMatch;
		} catch (e: any) {
			if (debug)
				log(
					"ERROR",
					`Rule ${priority}: Invalid regex "${regex}": ${e.message}`,
				);
			return false;
		}
	}

	if (pattern.includes("*")) {
		const isMatch = minimatch(value, pattern, { dot: true });
		if (debug)
			log(
				"DEBUG",
				`Rule ${priority}: Glob match "${pattern}" on "${value}" -> ${isMatch}`,
			);
		return isMatch;
	}

	try {
		const isMatch = new RegExp(pattern, "i").test(value);
		if (debug)
			log(
				"DEBUG",
				`Rule ${priority}: Regex test "${pattern}" on "${value}" -> ${isMatch}`,
			);
		return isMatch;
	} catch (e: any) {
		if (debug)
			log(
				"ERROR",
				`Rule ${priority}: Failed to create regex "${pattern}": ${e.message}`,
			);
		return false;
	}

	const isMatch = value.includes(pattern);
	if (debug)
		log(
			"DEBUG",
			`Rule ${priority}: String match "${pattern}" in "${value}" -> ${isMatch}`,
		);
	return isMatch;
}

function pathsMatch(
	paths: string[],
	resolved: string,
	debug: boolean,
	priority: number,
): boolean {
	return paths.some((p) => {
		const expanded = p.startsWith("~/")
			? path.join(os.homedir(), p.slice(2))
			: p;
		if (expanded.includes("*")) {
			const res = minimatch(resolved, expanded, { dot: true });
			if (debug)
				log(
					"DEBUG",
					`Rule ${priority}: Glob path match "${expanded}" against "${resolved}" -> ${res}`,
				);
			return res;
		}
		const dir = expanded.endsWith(path.sep) ? expanded : expanded + path.sep;
		const res = resolved === expanded || resolved.startsWith(dir);
		if (debug)
			log(
				"DEBUG",
				`Rule ${priority}: Path match "${expanded}" against "${resolved}" -> ${res}`,
			);
		return res;
	});
}

export function evaluate(
	toolName: string,
	input: Record<string, unknown>,
	sortedRules: Rule[],
	debug: boolean,
): { action: Action; rule: Rule; matchTrace?: string[] } | null {
	const matchTrace: string[] = [];
	log("DEBUG", `Tool: ${toolName}. Action:`);
	for (const rule of sortedRules) {
		const result = matchesRule(rule, toolName, input, debug);
		if (result.matched) {
			if (debug) {
				log(
					"DEBUG",
					`Rule matched: ${rule.action} (priority: ${rule.priority ?? 0}, message: "${rule.message ?? "N/A"}")`,
				);
			}
			return {
				action: rule.action,
				rule,
				matchTrace: matchTrace.length > 0 ? matchTrace : undefined,
			};
		}
		if (result.reason) {
			matchTrace.push(result.reason);
		}
	}
	if (debug) {
		log(
			"DEBUG",
			`No rules matched for tool "${toolName}". Input: ${JSON.stringify(input)}`,
		);
	}
	return null;
}
