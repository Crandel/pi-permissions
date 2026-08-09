## Why

When an interactive "ask" permission rule matches a tool call, selecting "Allow always" currently computes a SHA-256 hash over both the tool name and input parameters. As a result, permission is only granted for that exact parameter combination, requiring the user to re-approve subsequent calls to the same tool with different arguments (e.g. `bash` with `pwd` after allowing `bash` with `ls`). Users need explicit options to grant or deny permissions for either the single call, the exact input parameters for the session, the entire tool for the session, or all tools for the session.

## What Changes

- Add dual-level session caching (`exactCache` and `toolCache`) and global session bypass to `SessionCache` in memory.
- Expand UI permission options in `askUser` to provide explicit granular choices:
  - `Allow` (single call pass-through)
  - `Session allow (exact input)` (cache exact parameter hash for current session)
  - `Session allow (tool: <toolName> *)` (cache tool-wide wildcard rule for current session)
  - `Allow everything (this session)` (bypass all tool permission prompts for current session)
  - `Deny` (single call block)
  - `Session deny (exact input)` (cache exact parameter hash block for current session)
  - `Session deny (tool: <toolName> *)` (cache tool-wide wildcard block for current session)
- Update `PermissionSelection` type definition and event payload schemas for `permissions:ask` and `permissions:user_select`.
- Update session cache evaluation order so global session allow and tool-level session permissions take priority over exact-input session permissions.

## Capabilities

### New Capabilities
- `tool-permissions`: Interactive tool permission prompt options and dual-level session caching rules.

### Modified Capabilities

## Impact

- `src/ask.ts`: `SessionCache` implementation and `askUser` dialog function.
- `src/events.ts`: `PermissionSelection` type definition and `PERMISSIONS_OPTIONS` array.
- `src/index.ts`: Tool execution handler and event emission logic.
- `src/index.test.ts`: Integration and unit tests for session permissions.
