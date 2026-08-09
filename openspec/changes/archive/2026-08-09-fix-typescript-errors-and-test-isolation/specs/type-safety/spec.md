## Purpose

Ensure the pi-permissions extension compiles without TypeScript errors under strict type-checking and that all type references are correct.

## ADDED Requirements

### Requirement: All source files compile without TypeScript errors

The extension source code SHALL compile without errors when type-checked with strict mode and ES2022+ lib.

#### Scenario: Type-check passes

- **WHEN** `tsc --noEmit` is run with the project's tsconfig.json
- **THEN** no errors are reported for any file in `src/`

### Requirement: Missing type imports are resolved

All types referenced in source files SHALL be properly imported.

#### Scenario: PiSettings type is available in config.ts

- **WHEN** `config.ts` references `PiSettings`
- **THEN** it is imported from `./settings`

#### Scenario: Rule type is available in index.ts

- **WHEN** `index.ts` references `Rule`
- **THEN** it is imported from `./config`

### Requirement: ExtensionContext properties are used correctly

The extension SHALL only access properties that exist on the `ExtensionContext` type.

#### Scenario: Home directory resolved with ctx.home fallback

- **WHEN** the `session_start` handler needs the user's home directory
- **THEN** it uses `ctx.home` (via type assertion) if available, falling back to `os.homedir()`

### Requirement: Log levels are valid

All calls to the `log()` function SHALL use only the levels defined in its type signature.

#### Scenario: DENY level replaced with ERROR

- **WHEN** the extension logs a denial event
- **THEN** it uses `"ERROR"` as the log level, not `"DENY"`

### Requirement: No unused imports or parameters

Source files SHALL not contain unused imports or unused function parameters.

#### Scenario: Unused os import removed from logger.ts

- **WHEN** `logger.ts` is type-checked
- **THEN** no unused import warnings are reported for `os`

#### Scenario: Unused event parameter removed from session_start

- **WHEN** the `session_start` handler is type-checked
- **THEN** no unused parameter warnings are reported

### Requirement: tsconfig.json exists with proper configuration

A `tsconfig.json` SHALL exist at the project root with ES2022+ lib and strict mode enabled.

#### Scenario: tsconfig.json enables Object.hasOwn

- **WHEN** `events.test.ts` uses `Object.hasOwn`
- **THEN** the tsconfig lib includes ES2022 or later so the type is recognized

### Requirement: Pattern matching fails gracefully on invalid regex

When a regex pattern cannot be compiled, the matcher SHALL return `false` (no match) rather than falling through to substring matching.

#### Scenario: Invalid regex pattern returns false

- **WHEN** `testPattern` receives a pattern that throws when passed to `new RegExp()`
- **THEN** it returns `false` without attempting substring matching
