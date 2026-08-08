# Proposal: Improve Permissions Observability

## What
Add detailed logging and debugging capabilities to the `pi-permissions` extension.

## Why
Users currently experience "silent failures" when rules block tool calls, and there's no way to verify which rules are active or why a rule didn't match. This makes configuring permissions frustrating and error-prone.

## Goals
1. **Transparent Evaluation**: Log every tool call evaluation, including which rules were checked and why they matched or failed to match.
2. **Config Validation**: Log when configuration files are loaded and report syntax errors instead of silently skipping them.
3. **User-Controllable Verbosity**: Provide a `debug` flag in the configuration to enable/disable detailed logging.
4. **Actionable Feedback**: Return more descriptive reasons to the pi agent when a tool is blocked.
