# Spec: Observability

## Requirements

1. **Log to file**: Write debug logs to `~/.pi/agent/permissions/permissions.log`.
2. **Capture Config Events**: Log the loading of global and local configuration files, including the absolute paths used.
3. **Capture Parse Errors**: Log an error message when a configuration file exists but cannot be parsed as JSON.
4. **Trace Evaluation**: When `debug` is enabled in config:
   - Log the tool name and input parameters for each evaluation.
   - Log each rule's evaluation result (Match/No Match).
   - For No Matches, specify the reason (e.g., "Tool name mismatch", "Parameter 'X' mismatch", "Path mismatch").
   - Log the final decision and the rule that triggered it.
5. **Configurable Debugging**: Add a `debug` field to `PermissionConfig`. If `false` or missing, only critical errors (like parse errors) are logged.
6. **Detailed Reasons**: The `reason` returned to the pi agent should include the rule's message if available, otherwise a concise description of the block (e.g., "Blocked by Rule (priority 10)").
