# Design: Implementation Details

## 1. Logging Utility
Create a simple logger in `src/logger.ts` that appends to `~/.pi/agent/permissions/permissions.log`.
- **Format**: `[YYYY-MM-DD HH:mm:ss] [LEVEL] Message`
- **Levels**: `INFO`, `DEBUG`, `ERROR`

## 2. Config Update
Update `PermissionConfig` in `src/config.ts` to include an optional `debug` boolean flag.

## 3. `loadConfig` Enhancement
Update `loadRulesFromFile` in `src/config.ts` to:
- Log when it attempts to read a file.
- Log an `ERROR` when `JSON.parse` fails, including the error message.

## 4. `matchesRule` Enhancement
Refactor `matchesRule` in `src/rules.ts` to return a `MatchResult` instead of a `boolean`:
```typescript
type MatchResult = {
  matched: boolean;
  reason?: string;
}
```
Update the matching logic to provide specific reasons for failures:
- Tool name mismatch: `"tool mismatch: expected 'X', got 'Y'"`
- Param missing: `"param 'X' missing"`
- Param mismatch: `"param 'X' mismatch: value 'Y' does not match pattern 'Z'"`
- Path missing: `"path param 'X' missing"`
- Path mismatch: `"path 'Y' does not match pattern 'Z'"`

## 5. `evaluate` Enhancement
Update `evaluate` in `src/rules.ts` to:
- Accept the `debug` flag from config.
- If `debug` is enabled, log the tool name and input.
- Loop through sorted rules, calling the updated `matchesRule`.
- Log each result: `Rule [id] (priority [p]): MATCHED` or `Rule [id]: NO MATCH ([reason])`.
- Log the final decision.

## 6. `index.ts` Integration
- Update `pi.on("session_start")` to capture the `debug` flag from `loadConfig`.
- Pass the `debug` flag to `evaluate`.
- Update `emitDeny` and the block returns to use a more descriptive reason (e.g., incorporating the rule's message or priority).
