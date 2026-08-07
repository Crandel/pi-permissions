# Available Tools

This document lists all tools available to the coding agent, along with their parameters and descriptions.

---

## read

Read the contents of a file. Supports text files and images (jpg, png, gif, webp, bmp). Images are sent as attachments. For text files, output is truncated to 2000 lines or 50KB (whichever is hit first). Use offset/limit for large files.

|Parameter|Type  |Required|Description                                    |
|---------|------|--------|-----------------------------------------------|
|`path`   |string|Yes     |Path to the file to read (relative or absolute)|
|`offset` |number|No      |Line number to start reading from (1-indexed)  |
|`limit`  |number|No      |Maximum number of lines to read                |

---

## bash

Execute a bash command in the current working directory. Returns stdout and stderr. Output is truncated to last 2000 lines or 50KB (whichever is hit first). If truncated, full output is saved to a temp file.

|Parameter|Type  |Required|Description                                      |
|---------|------|--------|-------------------------------------------------|
|`command`|string|Yes     |Bash command to execute                          |
|`timeout`|number|No      |Timeout in seconds (optional, no default timeout)|

---

## edit

Edit a single file using exact text replacement. Every `edits[].oldText` must match a unique, non-overlapping region of the original file. If two changes affect the same block or nearby lines, merge them into one edit instead of emitting overlapping edits. Do not include large unchanged regions just to connect distant changes.

|Parameter        |Type  |Required|Description                                                                                                                                         |
|-----------------|------|--------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`           |string|Yes     |Path to the file to edit (relative or absolute)                                                                                                     |
|`edits`          |array |Yes     |Array of edit objects, each containing:                                                                                                             |
|`edits[].oldText`|string|Yes     |Exact text for one targeted replacement. Must be unique in the original file and must not overlap with any other `edits[].oldText` in the same call.|
|`edits[].newText`|string|Yes     |Replacement text for this targeted edit                                                                                                             |

---

## write

Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.

|Parameter|Type  |Required|Description                                     |
|---------|------|--------|------------------------------------------------|
|`path`   |string|Yes     |Path to the file to write (relative or absolute)|
|`content`|string|Yes     |Content to write to the file                    |

---

## ast_edit

Structural code search-and-rewrite using ast-grep. Matches code by AST pattern (not text), so it survives formatting/whitespace differences and understands language syntax. Always previews a diff and asks for confirmation before writing, unless `autoApply` is set to true.

|Parameter   |Type   |Required|Description                                                                                                                                                                                                                                        |
|------------|-------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`      |string |Yes     |File or directory to search/rewrite. Directories are scanned recursively, respecting `.gitignore`.                                                                                                                                                 |
|`lang`      |string |Yes     |Language grammar to use for parsing. One of: `go`, `kotlin`, `typescript`, `tsx`, `javascript`, `python`, `rust`, `java`, `c`, `cpp`                                                                                                               |
|`pattern`   |string |Yes     |ast-grep pattern to match, e.g. `fmt.Sprintf($$$ARGS)` (Go) or `println($MSG)` (Kotlin). Use `$NAME` for a single-node capture, `$$$NAME` for a multi-node capture.                                                                                |
|`rewrite`   |string |Yes     |Replacement pattern, referencing the same `$NAME` / `$$$NAME` captures used in `pattern`.                                                                                                                                                          |
|`strictness`|string |No      |Matching strictness. `smart` (default-ish) ignores some trivial formatting differences; `ast` requires exact node-kind match; `relaxed` ignores comments too. Omit to use ast-grep's default. One of: `cst`, `smart`, `ast`, `relaxed`, `signature`|
|`autoApply` |boolean|No      |If true, skip the confirmation prompt and apply immediately. Defaults to false — a diff preview and confirm dialog is shown first. Only set true if the user has already approved this exact change.                                               |

---

## lens_diagnostics

Query pi-lens's diagnostic state. `mode=delta/all` are cache-only and instant; `mode=full` is an expensive active project-wide check.

|Parameter        |Type             |Required|Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|-----------------|-----------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`mode`           |string           |No      |`delta` (default): all warnings for the current agent turn — fixable warnings (actionable-warnings cache) AND code quality/style/complexity issues (code-quality-warnings cache). `all`: blocking errors and warnings for every file the agent has EDITED this session. `full`: EXPENSIVE active scan. Runs project-wide LSP diagnostics for all supported files, then merges/deduplicates that with `mode=all` cached runner state.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|`refreshRunners` |boolean or string|No      |`mode=full` only: `false`/`none` = LSP + widget state only. `cached`/`cheap`/`all` all now trigger a FRESH run of the heavyweight project analyzers (knip, jscpd, madge, gitleaks, govulncheck, trivy, dead-code) in parallel — bounded by the slowest analyzer (trivy's own ~180s ceiling) — instead of reading a possibly-stale session_start cache. `cheap`/`all` additionally refresh the in-process runners (tree-sitter + fact-rules + ast-grep) first.                                                                                                                                                                                                                                                                                                                                                                                                                        |
|`maxProjectFiles`|number           |No      |`mode=full` `refreshRunners=cheap/all` only: cap project files scanned by the cheap project runners (tree-sitter + fact-rules + ast-grep). Does NOT bound the LSP sweep — use `maxLspFiles` for that.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|`maxLspFiles`    |number           |No      |`mode=full` only: cap the number of files routed through the language server for the project-wide LSP sweep. On large projects the uncapped sweep can take many minutes; set this to bound it. Default is generous (env `PI_LENS_LSP_WORKSPACE_MAX_FILES`, else 5000).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|`severity`       |string           |No      |Filter by severity. One of: `error`, `warning`, `all` (default).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|`paths`          |array            |No      |Restrict any mode to an explicit file/directory list (max 200 entries). Entries may be relative (resolved against cwd) or absolute, and a directory entry matches all files under it. `mode=delta/all` are a pure post-filter of cached/session state — they can only show findings for files pi-lens has already dispatched, so an unseen file shows nothing (use `mode=full` for an active scan). `mode=full` actively scans exactly these paths (LSP sweep + cheap in-process runners); cached heavyweight analyzers (jscpd/madge/gitleaks/knip) and the project snapshot are still post-filtered cache reads, never relaunched. Explicitly-listed files are NOT filtered through the project ignore matcher — naming a file is assumed to mean it regardless of `.gitignore`/`.pi-lens.json`; a directory entry's expansion still honors ignore. Nonexistent entries are skipped.|

---

## lsp_diagnostics

Get errors, warnings, and hints from language servers for a file or directory. Use BEFORE running builds to proactively check for issues. Works on directories by auto-detecting file extensions and scanning all matching files.

|Parameter    |Type  |Required|Description                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|-------------|------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`       |string|No      |File or directory path to check. For directories, all matching source files are scanned.                                                                                                                                                                                                                                                                                                                                                                         |
|`paths`      |array |No      |Explicit files to check as a bounded-concurrency batch (min 1, max 100). When provided, `path` is ignored.                                                                                                                                                                                                                                                                                                                                                       |
|`severity`   |string|No      |Filter by severity level. One of: `error`, `warning`, `information`, `hint`, `all` (default).                                                                                                                                                                                                                                                                                                                                                                    |
|`concurrency`|number|No      |Batch/directory concurrency, in distinct LSP server groups run in parallel (default 8, max 16) — not individual files. Files sharing one server are always processed one at a time against that server regardless of this value; this caps how many DIFFERENT servers run concurrently.                                                                                                                                                                          |
|`waitMs`     |number|No      |Optional per-file LSP wait budget for batch diagnostics. Uses server defaults when omitted.                                                                                                                                                                                                                                                                                                                                                                      |
|`serverScope`|string|No      |`primary` (fast, low-noise): only the file's actual language server (e.g. typescript) — for "does this have real type errors". `all` (default): also touches cross-cutting auxiliary scanners (ast-grep, opengrep, zizmor, typos, marksman) attached to this file, including findings for files not yet dispatched this session. Primary confirmation is always reported separately from auxiliary findings regardless of this setting. One of: `primary`, `all`.|

---

## symbol_search

Ranked identifier search over the persisted word index (BM25 + priors demoting tests/vendor/docs) — answers "which files are most relevant to `<query>`" by identifier. First step of the discovery funnel: `symbol_search` finds candidates, `module_report` explains the file, `read_symbol` reads the body. Complements grep (raw substrings) and `lsp_navigation` (exact references).

|Parameter|Type  |Required|Description                                                                                                                                                                                                                    |
|---------|------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`query`  |string|Yes     |Identifier-ish query, e.g. `authenticate user`                                                                                                                                                                                 |
|`limit`  |number|No      |Max files to return (default 20).                                                                                                                                                                                              |
|`paths`  |array |No      |Glob array scoping hits to matching files — same shape/semantics as `ast_grep_search`'s `paths` (a bare directory/file entry scopes its whole subtree). Filters before ranking, so scores within the scoped set are unaffected.|
|`lang`   |string|No      |Restrict hits to one language, using the same identifiers as `ast_grep_search`'s `lang` param (e.g. `typescript`, `python`, `go`).                                                                                             |

---

## project_report

Project-level orientation from the review graph — "orient me in this project" before drilling into any one file. First step of a wider discovery funnel: `project_report` orients, `module_report` explains a file, `read_symbol` reads a body.

|Parameter|Type  |Required|Description                                                                                                                                            |
|---------|------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
|`limit`  |number|No      |Scales every ranked section's cap (default 10) — a single knob for all sections.                                                                       |
|`focus`  |string|No      |Optional task hint used only to re-rank sections toward relevant subsystems (does not expand scope or trigger scans).                                  |
|`view`   |string|No      |Payload tier. `compact` returns a line-oriented text rendering instead of JSON (cheapest option); `default` returns JSON. One of: `default`, `compact`.|

---

## module_report

Structured, navigable overview of a source module — a token-efficient substitute for reading the whole file. Returns each symbol's name/kind/signature/line-range (plus a first-line `doc` summary when a doc comment is attached), important inline callbacks/closures/lambdas with stable handles, plus who-uses-this, risk flags, and ranked recommendedReads.

|Parameter            |Type   |Required|Description                                                                                                                                                                                                                                                                                                                                              |
|---------------------|-------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`               |string |Yes     |Absolute or workspace-relative path to the source file.                                                                                                                                                                                                                                                                                                  |
|`maxRefsPerSymbol`   |number |No      |Cap on who-uses-this entries per symbol (default 10).                                                                                                                                                                                                                                                                                                    |
|`focus`              |string |No      |Optional task hint used only to rank recommendedReads (does not expand scope or trigger scans).                                                                                                                                                                                                                                                          |
|`view`               |string |No      |Payload tier. `summary` returns top-level entries/recommendedReads and section provenance with heavy callback/usedBy/blast-radius payloads omitted. `compact` returns a line-oriented text rendering of the full report instead of JSON (one line per symbol/callback, cheapest option). `default` returns JSON. One of: `summary`, `default`, `compact`.|
|`blastRadius`        |boolean|No      |Include the cross-file blast-radius section: transitive dependents aggregated to ranked file reads ("if you change this, verify these files"). Read-only over the cached graph (omitted when cold).                                                                                                                                                      |
|`blastRadiusDepth`   |number |No      |Max hops for the blast-radius walk (default 3). Only used with `blastRadius`.                                                                                                                                                                                                                                                                            |
|`callGraph`          |boolean|No      |Include bounded derived callers/callees from the cached FunctionCallGraph; cold or stale cache state is explicit.                                                                                                                                                                                                                                        |
|`maxCallGraphEntries`|number |No      |Per-direction cap for call-graph relations (default 20).                                                                                                                                                                                                                                                                                                 |

---

## read_symbol

Return the verbatim source of a single named symbol or `module_report` callback handle in a file — a targeted, cheap alternative to reading the whole file. Pair with `module_report`: `module_report` finds the symbol/callback handle, `read_symbol` shows its body.

|Parameter|Type  |Required|Description                                                                                                                                                                                                                                                      |
|---------|------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`   |string|Yes     |Absolute or workspace-relative path to the source file.                                                                                                                                                                                                          |
|`symbol` |string|Yes     |Exact symbol name or callback handle to read (e.g. a function, class, type, or `module_report` callbacks[].name). Accepts a dotted `Class.method` name to resolve a member directly, falling back to a plain top-level lookup when the qualifier doesn't resolve.|
|`kind`   |string|No      |Optional kind filter (e.g. `function`, `interface`, `class`) to disambiguate when multiple same-file symbols share the requested name. Omitting it returns the first match, same as today.                                                                       |

---

## read_enclosing

Return the verbatim source for the smallest useful symbol/callback enclosing a line in a file. Use after `ast_grep_search`, diagnostics, or LSP locations when you need exact body text without reading the whole file.

|Parameter   |Type  |Required|Description                                                                                                                                                                                                                                         |
|------------|------|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`path`      |string|Yes     |Absolute or workspace-relative path to the source file.                                                                                                                                                                                             |
|`line`      |number|Yes     |1-based line number inside the desired symbol/callback.                                                                                                                                                                                             |
|`kinds`     |array |No      |Optional kind filter, e.g. `function`, `method`, `callback`, `class`, `object_property_callback`.                                                                                                                                                   |
|`maxLines`  |number|No      |Optional maximum body size to return. Oversized matches obey `onOversize`.                                                                                                                                                                          |
|`onOversize`|string|No      |Behavior when the enclosing body exceeds `maxLines`. `error` (default) returns metadata only; `slice` returns a bounded partial read around line; `outline` returns nested symbols/callbacks with read handles. One of: `error`, `slice`, `outline`.|
|`aroundLine`|number|No      |Maximum lines for `onOversize=slice`; defaults to `maxLines`, then 80.                                                                                                                                                                              |

---

## pi_lens_activate_tools

Activate one or more situational pi-lens tools that stay registered but inactive by default, so the default tool list stays lean. Call this ONCE with the tools you need before using them — they become callable starting the NEXT turn.

|Parameter|Type |Required|Description                                                                                                                                                                                 |
|---------|-----|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`tools`  |array|Yes     |Names of situational tools to activate. Available tools: `ast_grep_search`, `ast_grep_replace`, `ast_grep_outline`, `ast_grep_dump`, `lsp_navigation`, `lens_diagnostic_mark`. (minItems: 1)|

---

## web_search

Search the web via DuckDuckGo. Returns titles, URLs, and snippets. All content is sanitized against prompt injection before being returned.

|Parameter    |Type  |Required|Description                                     |
|-------------|------|--------|------------------------------------------------|
|`query`      |string|Yes     |Search query                                    |
|`max_results`|number|No      |Number of results to return (default 5, max 10).|

---

## web_fetch

Fetch and extract the text content of a URL. Blocks private/internal network addresses (SSRF protection). All content is sanitized against prompt injection before being returned.

|Parameter|Type  |Required|Description                         |
|---------|------|--------|------------------------------------|
|`url`    |string|Yes     |URL to fetch (must be http or https)|

---

## Summary Table

|Tool                    |Primary Purpose                            |
|------------------------|-------------------------------------------|
|`read`                  |Read file contents                         |
|`bash`                  |Execute shell commands                     |
|`edit`                  |Precise text-based file edits              |
|`write`                 |Create or overwrite files                  |
|`ast_edit`              |Structural AST-based code search & rewrite |
|`lens_diagnostics`      |Query pi-lens diagnostic state             |
|`lsp_diagnostics`       |Get LSP errors/warnings/hints              |
|`symbol_search`         |Ranked identifier search across codebase   |
|`project_report`        |Project-level orientation from review graph|
|`module_report`         |Navigable file/module overview             |
|`read_symbol`           |Read a single symbol's body                |
|`read_enclosing`        |Read enclosing symbol/callback body        |
|`pi_lens_activate_tools`|Activate situational pi-lens tools         |
|`web_search`            |Search the web via DuckDuckGo              |
|`web_fetch`             |Fetch and extract text from a URL          |
