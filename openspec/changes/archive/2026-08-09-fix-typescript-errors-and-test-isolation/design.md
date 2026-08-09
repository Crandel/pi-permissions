## Context

The project has 9 TypeScript errors caught by the LSP but invisible to the build (tsdown transpiles without type-checking). Additionally, `index.test.ts` fails because the test's `ctx` object omits `home`, causing `loadConfig` to fall back to `os.homedir()` and load the real global permissions config. There is no `tsconfig.json`, so TypeScript settings are implicit. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Eliminate all 9 TypeScript compilation errors
- Fix the failing test by isolating it from real global config
- Add `tsconfig.json` to align LSP and build type-checking
- Fix `testPattern` fallthrough bug where invalid regex silently falls back to substring matching

**Non-Goals:**

- Adding new features or capabilities
- Changing the extension's public API or event payloads
- Refactoring the logger to async I/O (deferred to a separate change)
- Adding schema validation for config rules (deferred to a separate change)

## Decisions

### Decision 1: Use `ctx.home` with `os.homedir()` fallback in `session_start` handler

**Rationale:** The `ExtensionContext` type from `@earendil-works/pi-coding-agent` does not include a `home` property. To avoid a type error while still allowing tests to inject an isolated `home` directory, the handler accesses `ctx.home` via a type assertion (`(ctx as { home?: string }).home`) and falls back to `os.homedir()` when `ctx.home` is not set. This keeps production behavior identical (using `os.homedir()`) while enabling test isolation.

**Alternatives considered:**

- *Use `os.homedir()` directly without `ctx.home`*: Rejected — would prevent tests from injecting an isolated home directory, requiring mocking of `os.homedir()` or `process.env.HOME`.
- *Add `home` to a custom context type*: Rejected — would require casting and doesn't match the real API.
- *Use `process.env.HOME`*: Rejected — less portable than `os.homedir()`.

### Decision 2: Replace `"DENY"` log level with `"ERROR"`

**Rationale:** The `log()` function in `logger.ts` accepts only `"INFO" | "DEBUG" | "ERROR"`. The `index.ts` file uses `"DENY"` in two places (lines 139 and 153), which is a type error. `"ERROR"` is the closest semantic match for denial events.

**Alternatives considered:**

- *Add `"DENY"` to the LogLevel type*: Rejected — adds a new level for a single use case; `"ERROR"` is sufficient and consistent with existing usage.

### Decision 3: Fix `testPattern` fallthrough by returning `false` on regex error

**Rationale:** When `new RegExp(pattern, "i")` throws, the catch block logs the error but doesn't return, falling through to `value.includes(pattern)`. This silently treats invalid regex as substring matching, which is surprising. The fix is to `return false` in the catch block.

**Alternatives considered:**

- *Keep the fallthrough as a feature*: Rejected — invalid regex patterns should fail to match, not silently change matching semantics.

### Decision 4: Add `tsconfig.json` with ES2022 lib and strict mode

**Rationale:** Without a `tsconfig.json`, TypeScript settings are determined by tsdown defaults, which don't include ES2022 lib. This causes `Object.hasOwn` to be unrecognized. Adding a proper `tsconfig.json` aligns the LSP and build, and enables strict type-checking.

**Alternatives considered:**

- *Add `"lib": ["ES2022"]` to tsdown config*: Rejected — tsdown doesn't support tsconfig-level lib configuration; a `tsconfig.json` is the standard approach.

### Decision 5: Pass temp `home` in test `ctx`

**Rationale:** The test's `ctx` object is a mock that doesn't include `home`. Since `loadConfig` uses `home` to resolve the global permissions directory, the test must provide a temp `home` to prevent loading real global config.

**Alternatives considered:**

- *Mock `loadConfig` in tests*: Rejected — would reduce test coverage of the real config loading path.
- *Mock `os.homedir()`*: Rejected — more invasive and could affect other code paths.

## Risks / Trade-offs

- **[Risk] tsconfig.json strict mode may surface new errors** → Mitigation: Start with `strict: true` but `noUnusedLocals: false` and `noUnusedParameters: false` initially, then tighten in a follow-up. Actually, the current errors include unused imports/params, so we should enable these to catch them.
- **[Risk] testPattern fix may break existing rules** → Mitigation: The fix only affects patterns that throw when compiled as regex. Valid regex patterns are unaffected. Existing tests don't test invalid regex patterns, so no test changes needed.
- **[Risk] tsconfig.json may conflict with tsdown** → Mitigation: tsdown respects tsconfig.json for compilation settings; verify build still succeeds after adding it.

## Migration Plan

1. Add `tsconfig.json` with ES2022 lib and strict mode
2. Fix `config.ts` — add `PiSettings` import
3. Fix `index.ts` — add `Rule` import, replace `ctx.home` with `os.homedir()`, replace `"DENY"` with `"ERROR"`, remove unused `event` param
4. Fix `logger.ts` — remove unused `os` import
5. Fix `rules.ts` — add `return false` in `testPattern` catch block
6. Fix `events.test.ts` — no code change needed (tsconfig fix resolves `Object.hasOwn`)
7. Fix `index.test.ts` — add `home` to test `ctx`
8. Run `npm run build` and `npm test` to verify

No rollback needed — all changes are additive fixes with no behavioral impact except the `testPattern` bug fix.
