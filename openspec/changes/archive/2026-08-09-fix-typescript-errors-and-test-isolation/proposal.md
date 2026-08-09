## Why

The pi-permissions extension has 9 TypeScript compilation errors that are invisible to the build (tsdown transpiles without type-checking) but caught by the LSP, plus a failing test caused by test isolation leakage. The test loads the real `~/.pi/agent/permissions/permissions.json` because `ctx.home` is `undefined` (the `ExtensionContext` type has no `home` property), causing `loadConfig` to fall back to `os.homedir()`. This makes the test suite unreliable and masks real type-safety issues that could cause runtime failures.

## What Changes

- **Fix missing type imports**: Add `PiSettings` import in `config.ts`, `Rule` import in `index.ts`
- **Fix `ctx.home` usage**: `ExtensionContext` has no `home` property; use `os.homedir()` directly in `index.ts`
- **Fix invalid log level**: Replace `"DENY"` log calls with `"ERROR"` in `index.ts`
- **Fix unused imports/params**: Remove unused `os` import in `logger.ts`, unused `event` param in `session_start` handler
- **Fix `Object.hasOwn` target**: Add `tsconfig.json` with ES2022+ lib to align LSP and build
- **Fix `testPattern` fallthrough**: Invalid regex patterns now return `false` instead of silently falling through to substring `includes` matching
- **Fix test isolation**: Pass temp `home` directory in test `ctx` so tests don't load real global config
- **Add `tsconfig.json`**: Proper TypeScript configuration with ES2022 lib, strict mode, and type-checking

## Capabilities

### New Capabilities

- `type-safety`: Type-safe extension lifecycle, config loading, and rule evaluation — ensures all TypeScript types are correct and the codebase compiles without errors under strict type-checking
- `test-isolation`: Tests must not depend on real global configuration files — each test uses isolated temp directories for both `cwd` and `home`

### Modified Capabilities

(none — no existing specs to modify)

## Impact

- **Code**: `src/index.ts`, `src/config.ts`, `src/logger.ts`, `src/rules.ts`, `src/events.test.ts`
- **Build**: New `tsconfig.json` added; `npm run build` gains type-checking
- **Tests**: `src/index.test.ts` fixed to pass isolated `home`; all 20 tests should pass
- **No API changes**: Extension behavior is unchanged except for the `testPattern` bug fix (invalid regex now correctly fails to match)
