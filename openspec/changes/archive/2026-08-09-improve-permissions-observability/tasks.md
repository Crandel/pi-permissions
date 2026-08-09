# Tasks

- [x] Create `src/logger.ts` for persistent file logging to `~/.pi/agent/permissions/permissions.log`.
- [x] Update `PermissionConfig` in `src/config.ts` to add `debug` flag.
- [x] Update `loadRulesFromFile` in `src/config.ts` to log file loading and parse errors.
- [x] Update `matchesRule` in `src/rules.ts` to return detailed `MatchResult`.
- [x] Update `evaluate` in `src/rules.ts` to log evaluation traces when `debug` is enabled.
- [x] Update `index.ts` to pass `debug` flag and enhance block reason messages.
- [x] Write tests for the new debug logging and detailed matching logic.
