import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { matchesRule, sortRules } from "./rules.js";
import type { Rule } from "./config.js";

const baseRule = (overrides: Partial<Rule> = {}): Rule => ({
	match: { tool: "read" },
	action: "allow",
	...overrides,
});

test("plain directory prefix matches file inside that directory", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects"] },
	});
	const input = {
		path: "/data/work/projects/java/mpvEx/openspec/changes/refactor-native-paths/design.md",
	};
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("plain directory prefix matches file directly in that directory", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects"] },
	});
	const input = { path: "/data/work/projects/foo.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("plain directory prefix does NOT match sibling directory", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects"] },
	});
	const input = { path: "/data/work/projects-other/file.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, false);
});

test("directory prefix with trailing slash matches nested file", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects/"] },
	});
	const input = { path: "/data/work/projects/java/mpvEx/file.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("glob ** matches deeply nested file", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects/**"] },
	});
	const input = {
		path: "/data/work/projects/java/mpvEx/openspec/changes/refactor-native-paths/design.md",
	};
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("glob * matches single-level file", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects/*"] },
	});
	const input = { path: "/data/work/projects/foo.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("glob * does NOT match deeply nested file (single-level only)", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects/*"] },
	});
	const input = { path: "/data/work/projects/java/mpvEx/file.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, false);
});

test("tilde expansion works for path matching", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["~/projects/**"] },
	});
	const input = {
		path: path.join(process.env.HOME ?? "", "projects", "app", "file.txt"),
	};
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("pathParam uses custom input key", () => {
	const rule = baseRule({
		match: { tool: "read", paths: ["/data/work/projects"], pathParam: "file" },
	});
	const input = { file: "/data/work/projects/java/mpvEx/file.txt" };
	const result = matchesRule(rule, "read", input);
	assert.equal(result.matched, true);
});

test("sortRules orders by priority desc then deny > ask > allow", () => {
	const rules: Rule[] = [
		{ match: { tool: "bash" }, action: "allow", priority: 1 },
		{ match: { tool: "bash" }, action: "deny", priority: 1 },
		{ match: { tool: "bash" }, action: "deny", priority: 2 },
		{ match: { tool: "bash" }, action: "ask", priority: 2 },
		{ match: { tool: "bash" }, action: "allow", priority: 2 },
	];
	const sorted = sortRules(rules);
	// priority 2: deny > ask > allow
	assert.equal(sorted[0].action, "deny");
	assert.equal(sorted[1].action, "ask");
	assert.equal(sorted[2].action, "allow");
	// priority 1: deny > allow
	assert.equal(sorted[3].action, "deny");
	assert.equal(sorted[4].action, "allow");
});
