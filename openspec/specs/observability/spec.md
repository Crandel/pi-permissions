# observability Specification

## Purpose

Provide detailed logging and debugging capabilities for the pi-permissions extension, enabling transparent evaluation of tool call permissions, config validation, and actionable feedback when rules block tool calls.

## Requirements

### Requirement: Debug logs are written to a persistent log file

The extension SHALL write debug logs to `~/.pi/agent/permissions/permissions.log`.

#### Scenario: Log file is created on first log

- **WHEN** the `log()` function is called
- **THEN** it creates the permissions directory and log file if they do not exist

#### Scenario: Log entries include timestamp and level

- **WHEN** a log message is written
- **THEN** it is formatted as `[timestamp] [LEVEL] Message`

### Requirement: Config file loading is logged

The extension SHALL log when it attempts to read global and local configuration files, including the absolute paths used.

#### Scenario: File loading is logged when debug is enabled

- **WHEN** `loadRulesFromFile` is called with `debug=true`
- **THEN** it logs the file path being loaded

### Requirement: Parse errors are logged

The extension SHALL log an error message when a configuration file exists but cannot be parsed as JSON.

#### Scenario: JSON parse failure is logged

- **WHEN** `JSON.parse` fails on a config file
- **THEN** an ERROR is logged with the file path and error message

### Requirement: Evaluation traces are logged when debug is enabled

When `debug` is enabled in config, the extension SHALL log the tool name and input parameters for each evaluation, each rule's evaluation result (Match/No Match), and the final decision.

#### Scenario: Tool call evaluation is logged

- **WHEN** `evaluate` is called with `debug=true`
- **THEN** it logs the tool name, input, each rule's match result, and the final decision

#### Scenario: No-match reasons are logged

- **WHEN** a rule does not match a tool call
- **THEN** the reason is logged (e.g., "Tool mismatch", "Param mismatch", "Path mismatch")

### Requirement: Debug flag is configurable

The `PermissionConfig` SHALL include an optional `debug` boolean field. If `false` or missing, only critical errors (like parse errors) are logged.

#### Scenario: Debug flag controls verbosity

- **WHEN** `debug` is `false` or missing
- **THEN** only ERROR-level logs (like parse errors) are written

### Requirement: Block reasons are descriptive

The `reason` returned to the pi agent SHALL include the rule's message if available, otherwise a concise description of the block.

#### Scenario: Rule message is used as reason

- **WHEN** a rule with a `message` field blocks a tool call
- **THEN** the `reason` in the deny event includes that message

#### Scenario: Default reason when no message

- **WHEN** a rule without a `message` field blocks a tool call
- **THEN** the `reason` is a concise description like "Blocked by permissions"
