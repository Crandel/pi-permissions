# Tasks

- [ ] Create `src/logger.ts` for persistent file logging to `~/.pi/agent/permissions/permissions.log`.
- [ ] Update `PermissionConfig` in `src/config.ts` to add `debug` flag.
- [ ] Update `loadRulesFromFile` in `src/config.ts` to log file loading and parse errors.
- [ ] Update `matchesRule` in `src/rules.ts` to return detailed `MatchResult`.
- [ ] Update `evaluate` in `src/rules.ts` to log evaluation traces when `debug` is enabled.
- [ ] Update `index.ts` to pass `debug` flag and enhance block reason messages.
- [ ] Write tests for the new debug logging and detailed matching logic.
