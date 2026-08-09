## 1. Add TypeScript Configuration

- [x] 1.1 Create `tsconfig.json` at project root with ES2022 lib, strict mode, and `noUnusedLocals`/`noUnusedParameters` enabled
- [x] 1.2 Verify `npm run build` still succeeds with the new tsconfig

## 2. Fix config.ts Type Errors

- [x] 2.1 Add `PiSettings` import from `./settings` in `config.ts`

## 3. Fix index.ts Type Errors

- [x] 3.1 Add `Rule` type import from `./config` in `index.ts`
- [x] 3.2 Use `ctx.home` with `os.homedir()` fallback in the `session_start` handler
- [x] 3.3 Replace `"DENY"` log level with `"ERROR"` in `emitDeny` function (2 occurrences)
- [x] 3.4 Remove unused `event` parameter from `session_start` handler

## 4. Fix logger.ts Type Errors

- [x] 4.1 Remove unused `os` import from `logger.ts`

## 5. Fix rules.ts Pattern Matching Bug

- [x] 5.1 Add `return false` in the `testPattern` catch block to prevent fallthrough to substring matching

## 6. Fix Test Isolation

- [x] 6.1 Add `home` property (temp directory) to the `ctx` object in `index.test.ts` setup function
- [x] 6.2 Create the `.pi/agent/permissions` directory in the temp home if needed for test isolation

## 7. Verify

- [x] 7.1 Run `npx tsc --noEmit` and confirm zero errors
- [x] 7.2 Run `npm test` and confirm all 20 tests pass
