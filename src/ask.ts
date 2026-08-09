import { createHash } from "node:crypto";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { buildTitle } from "./format";
import { getPermissionOptions, type PermissionSelection } from "./events";

export class SessionCache {
	private allowAll: boolean = false;
	private toolCache: Map<string, "allow" | "deny"> = new Map();
	private exactCache: Map<string, "allow" | "deny"> = new Map();

	private callKey(toolName: string, input: Record<string, unknown>): string {
		const raw = JSON.stringify({ tool: toolName, input });
		return createHash("sha256").update(raw).digest("hex");
	}

	get(
		toolName: string,
		input: Record<string, unknown>,
	): "allow" | "deny" | undefined {
		if (this.allowAll) return "allow";
		const toolDecision = this.toolCache.get(toolName);
		if (toolDecision !== undefined) return toolDecision;
		return this.exactCache.get(this.callKey(toolName, input));
	}

	setTool(toolName: string, decision: "allow" | "deny"): void {
		this.toolCache.set(toolName, decision);
	}

	setExact(
		toolName: string,
		input: Record<string, unknown>,
		decision: "allow" | "deny",
	): void {
		this.exactCache.set(this.callKey(toolName, input), decision);
	}

	setAllowAll(): void {
		this.allowAll = true;
	}

	clear(): void {
		this.allowAll = false;
		this.toolCache.clear();
		this.exactCache.clear();
	}
}

export type AskUserResult = {
	selection: PermissionSelection | null;
	decision: "allow" | "deny";
	cached: boolean;
};

export async function askUser(
	toolName: string,
	input: Record<string, unknown>,
	cache: SessionCache,
	ctx: ExtensionContext,
): Promise<AskUserResult> {
	const title = buildTitle(toolName, input);

	const options = getPermissionOptions(toolName);

	const result = (await ctx.ui.select(
		title,
		options,
	)) as PermissionSelection | null;

	if (result === "Allow") {
		return { selection: result, decision: "allow", cached: false };
	} else if (result === "Session allow (exact input)") {
		cache.setExact(toolName, input, "allow");
		return { selection: result, decision: "allow", cached: true };
	} else if (result === `Session allow (tool: ${toolName} *)`) {
		cache.setTool(toolName, "allow");
		return { selection: result, decision: "allow", cached: true };
	} else if (result === "Allow everything (this session)") {
		cache.setAllowAll();
		return { selection: result, decision: "allow", cached: true };
	} else if (result === "Deny") {
		return { selection: result, decision: "deny", cached: false };
	} else if (result === "Session deny (exact input)") {
		cache.setExact(toolName, input, "deny");
		return { selection: result, decision: "deny", cached: true };
	} else if (result === `Session deny (tool: ${toolName} *)`) {
		cache.setTool(toolName, "deny");
		return { selection: result, decision: "deny", cached: true };
	} else {
		// null (user closed)
		return { selection: null, decision: "deny", cached: false };
	}
}
