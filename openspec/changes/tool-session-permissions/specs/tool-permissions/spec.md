## Purpose

Provides interactive permission selection prompts and dual-level session caching for tool execution.

## ADDED Requirements

### Requirement: Interactive Ask Permission Selection Options
When an interactive ask permission rule matches a tool call, the system SHALL display explicit choices for single-call decision, session-level exact input decision, session-level tool wildcard decision, and session-wide global allow bypass.

#### Scenario: Display interactive ask prompt options
- **WHEN** an ask permission rule matches a tool call for `bash` and the session context has UI
- **THEN** the interactive selection menu displays the following options:
  - `Allow`
  - `Session allow (exact input)`
  - `Session allow (tool: bash *)`
  - `Allow everything (this session)`
  - `Deny`
  - `Session deny (exact input)`
  - `Session deny (tool: bash *)`

### Requirement: Dual-Level Session Cache Evaluation
The system SHALL evaluate session-cached decisions by checking global session bypass and tool-level wildcard rules before checking exact-input hash rules.

#### Scenario: Global session allow bypass match
- **WHEN** a user selects `Allow everything (this session)` for any tool call
- **THEN** all subsequent tool calls for any tool in the same session return `allow` without displaying a user prompt

#### Scenario: Tool-wide session allow match
- **WHEN** a user selects `Session allow (tool: bash *)` for a tool call
- **THEN** subsequent tool calls to `bash` with any input parameters in the same session return `allow` without displaying a user prompt

#### Scenario: Exact-input session allow match
- **WHEN** a user selects `Session allow (exact input)` for a tool call `bash` with `{ command: "ls" }`
- **THEN** subsequent tool calls to `bash` with exact input `{ command: "ls" }` in the same session return `allow` without displaying a prompt
- **AND** subsequent tool calls to `bash` with input `{ command: "pwd" }` display the interactive permission prompt

#### Scenario: Precedence hierarchy
- **WHEN** multiple session decision levels exist
- **THEN** global session allow bypass takes highest precedence, followed by tool-wide decision, then exact-input decision
