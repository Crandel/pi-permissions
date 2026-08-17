A permission system extension for [pi coding agent](https://github.com/earendil-works/pi). Intercepts tool calls and enforces allow / deny / ask rules defined in a JSON config file.

Fork of [pi-lab/permissions](https://github.com/anthod0/pi-lab/blob/main/packages/permissions) project.

## Install

```bash
git clone https://github.com/Crandel/pi-permissions.git
pi install ./pi-permissions
```

## Configuration

Rules are configured in pi settings and merged into a single list:

- `~/.pi/agent/settings.json` — global
- `.pi/settings.json` — project

Example `settings.json`:

```json
{
  "permissions": {
    "rules": [
      {
        "message": "Block rm -rf",
        "priority": 10,
        "match": { "tool": "bash", "params": { "command": "rm\\s+-rf" } },
        "action": "deny"
      },
      {
        "match": { "tool": "bash", "params": { "command": "sudo" } },
        "action": "ask"
      },
      {
        "message": "Only allow reading files inside the project",
        "priority": 10,
        "match": { "tool": "read", "paths": ["~/projects/my-app/**"] },
        "action": "allow"
      },
      {
        "message": "read is restricted to allowed paths only",
        "match": { "tool": "read" },
        "action": "deny"
      }
    ]
  }
}
```

### Rule fields

| Field             | Type     | Required | Description                                                                                                                                                                                             |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `match.tool`      | string   | ✓        | Tool name, or `"*"` to match all tools                                                                                                                                                                  |
| `match.params`    | object   | —        | Param name → regex pattern. All conditions must match.                                                                                                                                                  |
| `match.paths`     | string[] | —        | Path patterns the tool's path argument must fall within. Supports glob (`**`, `*`) and plain directory prefixes. Supports `~` expansion. Pairs with a higher-priority `allow` rule to form a whitelist. |
| `match.pathParam` | string   | —        | Which input key holds the path. Defaults to `"path"`.                                                                                                                                                   |
| `action`          | string   | ✓        | `allow`, `deny`, or `ask`                                                                                                                                                                               |
| `priority`        | number   | —        | Defaults to `0`. Higher values are evaluated first.                                                                                                                                                     |
| `message`         | string   | —        | Reason returned to the LLM when a call is blocked.                                                                                                                                                      |

### Matching order

1. Rules sorted by `priority` descending
2. Same priority: `deny` > `ask` > `allow`

No match defaults to `allow`.

### ask mode

A dialog prompts the user with seven options:

- **Allow** — allow this call once (not cached)
- **Session allow (exact input)** — allow identical calls (same tool + input) for the rest of the session
- **Session allow (tool: `<toolName>` \*)** — allow all calls to this tool for the rest of the session
- **Allow everything (this session)** — bypass all permission prompts for all tools for the rest of the session
- **Deny** — deny this call once (not cached)
- **Session deny (exact input)** — deny identical calls (same tool + input) for the rest of the session
- **Session deny (tool: `<toolName>` \*)** — deny all calls to this tool for the rest of the session

### Session cache

Session decisions are stored in an in-memory `SessionCache` with three levels:

- `allowAll` — global session bypass flag (set by "Allow everything (this session)")
- `toolCache` — `Map<string, "allow" | "deny">` keyed by tool name (set by tool-wide options)
- `exactCache` — `Map<string, "allow" | "deny">` keyed by SHA-256 hash of `{ tool, input }` (set by exact-input options)

Cache lookup order in `SessionCache.get(toolName, input)`:

1. If `allowAll` is set → return `"allow"`
2. Check `toolCache` for `toolName`
3. Check `exactCache` for the SHA-256 hash of `{ tool: toolName, input }`

The cache is cleared on every `session_start`, so decisions do not survive across sessions. No decisions are persisted to disk.

## Events

The extension broadcasts observational events on `pi.events`. Listeners cannot change permission decisions, cache behavior, or blocked responses.

### Event names

- `permissions:deny` — emitted whenever a tool call is blocked
- `permissions:ask` — emitted immediately before a real user prompt is shown
- `permissions:user_select` — emitted after the prompt resolves

### Payloads

All payloads include the matched rule serialized with configured patterns only. Raw tool input is never broadcast.

The `permissions:ask` event includes an `options` array of `PermissionSelection` values, dynamically generated per tool via `getPermissionOptions(toolName)`.

```ts
type PermissionSelection =
 | "Allow"
 | "Session allow (exact input)"
 | `Session allow (tool: ${string} *)`
 | "Allow everything (this session)"
 | "Deny"
 | "Session deny (exact input)"
 | `Session deny (tool: ${string} *)`;

type SerializedPermissionRule = {
  action: "allow" | "deny" | "ask";
  message?: string;
  priority?: number;
  match: {
    tool: string;
    params?: Record<string, string>;
    paths?: string[];
    pathParam?: string;
  };
};

type PermissionsDenyEvent = {
  toolCallId: string;
  toolName: string;
  reason: string;
  source: "rule" | "cache" | "user" | "no_ui";
  rule: SerializedPermissionRule;
};

type PermissionsAskEvent = {
  toolCallId: string;
  toolName: string;
  rule: SerializedPermissionRule;
  options: PermissionSelection[];
};

type PermissionsUserSelectEvent = {
  toolCallId: string;
  toolName: string;
  selection: PermissionSelection | null;
  decision: "allow" | "deny";
  cached: boolean;
  rule: SerializedPermissionRule;
};
```

### Privacy guarantee

Event payloads never include `event.input` or derived raw argument values such as shell commands, file paths, or file contents. The `params` and `paths` fields contain only the configured rule patterns.

### Example listener

```ts
pi.events.on("permissions:deny", (event) => {
  console.log(event);
});
```

## CLI flag

The extension registers a `--yolo` boolean flag. When passed, all permission checks are bypassed and every tool call is allowed without prompting:

```bash
pi --yolo
```

This is useful for quick prototyping or when you want to temporarily disable the extension without uninstalling it.
