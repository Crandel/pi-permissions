## Context

See `proposal.md` for motivation and background.

Currently `SessionCache` uses a single `Map<string, "allow" | "deny">` keyed by the SHA-256 hash of `{ tool: toolName, input }`. UI selections in `askUser` are static (`PERMISSION_OPTIONS`: `"Allow" | "Allow always" | "Deny" | "Deny always"`).

## Goals / Non-Goals

**Goals:**
- Upgrade `SessionCache` in `src/ask.ts` to support dual-level session memory (`exactCache` and `toolCache`) plus an `allowAll` global session flag.
- Dynamically format prompt selection options per tool execution (`getPermissionOptions(toolName)`), including an `Allow everything (this session)` option.
- Update event payload types in `src/events.ts` to maintain safe observational event emitting.
- Guarantee exact-input, tool-wide, and global-allow session decisions operate per session without disk persistence.

**Non-Goals:**
- Persisting rule changes to global or project `permissions.json` files on disk.
- Changing priority rules or evaluation logic in `src/rules.ts`.

## Decisions

### Decision 1: Dual-Map SessionCache & Global Bypass Structure
Instead of a single hash map, `SessionCache` will manage:
- `allowAll: boolean` (global session bypass flag)
- `toolCache: Map<string, "allow" | "deny">` (keyed by `toolName`)
- `exactCache: Map<string, "allow" | "deny">` (keyed by SHA-256 hash of tool + input)

*Rationale:* Keeping `allowAll` alongside separate maps simplifies lookup performance (`O(1)`) and makes cache resets (`clear()`) straightforward.

*Alternatives Considered:* Single unified map with prefixed keys (e.g. `tool:bash` vs `exact:<hash>`). Separate maps and explicit boolean flag are cleaner and eliminate key collision risks.

### Decision 2: Cache Lookup Hierarchy
Cache lookup order in `SessionCache.get(toolName, input)` will be:
1. `if (allowAll) return "allow";`
2. `toolCache.get(toolName)`
3. `exactCache.get(hash)`

*Rationale:* If a user selects `Allow everything (this session)`, any subsequent tool call will be immediately allowed without prompting (acting as a session-scoped `dangerously-skip-permissions` analogue).

### Decision 3: Dynamic Option Generator
Instead of a static `PERMISSION_OPTIONS` array, `askUser` will call a helper `getPermissionOptions(toolName: string): PermissionSelection[]` to produce context-aware menu options:
```ts
[
  "Allow",
  "Session allow (exact input)",
  `Session allow (tool: ${toolName} *)`,
  "Allow everything (this session)",
  "Deny",
  "Session deny (exact input)",
  `Session deny (tool: ${toolName} *)`,
]
```

## Risks / Trade-offs

- **[Risk]** Breaking downstream listeners expecting exact string `"Allow always"` in `permissions:user_select` event.
  - **Mitigation:** Update `PermissionSelection` type definition to include new selection string formats.

- **[Risk]** User accidentally selecting `Allow everything (this session)` for all tools.
  - **Mitigation:** Option label explicitly states `(this session)` and clear separation from tool-level choices.
