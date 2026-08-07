# AGENTS.md — pi-permissions

## Project Overview

A [pi coding agent](https://github.com/earendil-works/pi) extension that intercepts tool calls and enforces allow / deny / ask rules defined in JSON config. Forked from `pi-lab/permissions`.

## Tech Stack

- **Language:** TypeScript (ESM)
- **Runtime:** Node.js
- **Build:** [tsdown](https://github.com/SDRMafia/tsdown) → `dist/index.mjs`
- **Test runner:** Node.js built-in `node:test` via `tsx`
- **Dependencies:** `minimatch` (path glob matching), `@earendil-works/pi-coding-agent` (peer), `@sinclair/typebox` (peer)
- **Workflow:** OpenSpec spec-driven (see `openspec/`)

## File Structure

```
pi-permissions/
├── src/
│   ├── index.ts          # Extension entry — registers session_start & tool_call handlers
│   ├── config.ts         # Config loading: pi-lab paths + settings.json fallback
│   ├── rules.ts          # Rule sorting, matching (tool/params/paths), evaluation
│   ├── ask.ts            # SessionCache (SHA-256 keyed) + askUser dialog logic
│   ├── events.ts         # Event emission + serializeRule (privacy-safe serialization)
│   ├── format.ts         # buildTitle — formats tool calls for the ask dialog UI
│   ├── settings.ts       # Reads & deep-merges pi user/project settings.json
│   ├── paths.ts          # pi-lab global/local directory resolution
│   └── *.test.ts         # Unit tests (index, config, events)
├── dist/                 # Build output (gitignored)
├── openspec/             # OpenSpec workflow config & artifacts
│   ├── config.yaml       # OpenSpec project config (schema: spec-driven)
│   ├── specs/            # Capability specs
│   └── changes/          # Active/completed changes
├── .pi/                  # pi agent config (prompts, skills)
├── package.json
├── tsdown.config.ts
└── README.md
```

## Architecture

### Extension Lifecycle

```
pi agent startup
    │
    ▼
session_start event
    │
    ├── loadConfig(cwd)
    │     ├── global: ~/.pi/agent/pi-lab/permissions.json  (or ~/.pi/agent/settings.json)
    │     └── local:  .pi/pi-lab/permissions.json          (or .pi/settings.json)
    │
    ├── sortRules(rules)       # priority desc, then deny > ask > allow
    └── cache.clear()          # session-scoped cache reset
    │
    ▼
tool_call event (per call)
    │
    ├── evaluate(toolName, input, sortedRules)
    │     └── matchesRule(rule, toolName, input)
    │           ├── match.tool: exact name or "*"
    │           ├── match.params: regex per param key (case-insensitive)
    │           └── match.paths: glob (**) or directory prefix, via pathParam
    │
    ├── action === "allow"  → return undefined (pass through)
    ├── action === "deny"   → emit permissions:deny, return { block: true, reason }
    └── action === "ask"    → check cache → check ctx.hasUI → askUser → emit events
```

### Rule Matching Priority

1. Sort by `priority` descending (default 0)
2. Same priority: `deny` > `ask` > `allow`
3. First matching rule wins
4. No match → defaults to `allow`

### Config Loading Strategy

Per-scope (global + local), pi-lab `permissions.json` takes priority over `settings.json` `permissions.rules`. The two scopes are concatenated (global first, then local), not deep-merged.

```
loadConfig(cwd)
├── globalRules = loadRulesWithLegacyPriority(
│     global pi-lab permissions.json,  ← preferred
│     () => readPiUserSettings(home)   ← fallback
│   )
├── localRules = loadRulesWithLegacyPriority(
│     local pi-lab permissions.json,   ← preferred
│     () => readPiProjectSettings(cwd) ← fallback
│   )
└── return { rules: [...globalRules, ...localRules] }
```

### Session Cache

- Key: SHA-256 of `{ tool, input }` JSON
- Values: `"allow"` | `"deny"`
- Scope: per-session (cleared on `session_start`)
- Populated by "Allow always" / "Deny always" selections
- "Allow" / "Deny" (once) do not cache

### Privacy Guarantee

Event payloads (`permissions:deny`, `permissions:ask`, `permissions:user_select`) include only **configured rule patterns** via `serializeRule()`. Raw tool input, file paths, shell commands, and file contents are never broadcast.

## Build & Test

```bash
# Build
npm run build

# Test
npm test
# or: npx tsx --test src/**/*.test.ts
```

## Conventions

- **ESM only** — `"type": "module"` in package.json
- **Tabs for indentation** in `src/` (index.ts, ask.ts, events.ts use tabs; rules.ts, config.ts, format.ts use spaces — match surrounding file)
- **Best-effort config loading** — `loadConfig` never throws; missing/unparseable files are silently skipped
- **Observational events** — event listeners cannot alter permission decisions; `emitPermissionEvent` swallows listener errors
- **No default deny** — unmatched tool calls are allowed by design
- **OpenSpec workflow** — use `openspec` CLI for change management; see `openspec/config.yaml`
