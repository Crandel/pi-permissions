### bash

Execute bash commands in a given `cwd` (ls, grep, find, etc.).

- **Parameters:**
  - `command` (string, required): Bash command to execute. Do NOT prefix it with `cd <dir> &&` — use the `cwd` parameter instead.
  - `cwd` (string, optional): Working directory for the command. Defaults to the current project directory.
  - `timeout` (number, optional): Timeout in seconds (optional, no default timeout).

### edit

Edit a single file using exact text replacement.

- **Parameters:**
  - `path` (string, required): Path to the file to edit (relative or absolute).
  - `edits` (array of objects, required): One or more targeted replacements. Each edit must specify `oldText` (exact text for one targeted replacement) and `newText` (replacement text).

### lens_diagnostics

Query pi-lens's diagnostic state.

- **Parameters:**
  - `mode` (string, required): Mode of diagnostics (`delta`, `all`, or `full`).
  - `paths` (array of strings, optional): Restrict diagnostics to specific file/directory lists.
  - `refreshRunners` (string, optional): For `mode=full` only (`none`, `cached`, `cheap`, or `all`).
  - `severity` (string, optional): Filter by severity (`error`, `warning`, `information`, `hint`, or `all`).
  - `maxLspFiles` (number, optional): Cap the number of files routed through the language server (mode=full only).
  - `maxProjectFiles` (number, optional): Cap project files scanned by the cheap project runners (mode=full only).

### lsp_diagnostics

Get errors, warnings, and hints from language servers for a file or directory.

- **Parameters:**
  - `path` (string, optional): File or directory path to check.
  - `paths` (array of strings, optional): Explicit files to check as a bounded-concurrency batch.
  - `serverScope` (string, optional): Scope of checks (`primary` or `all`).
  - `severity` (string, optional): Filter by severity (`error`, `warning`, `information`, `hint`, or `all`).
  - `concurrency` (number, optional): Batch/directory concurrency (default 8, max 16).
  - `waitMs` (number, optional): Per-file wait budget for batch diagnostics.

### ast_grep_dump

Dump the tree-sitter AST for a source snippet to discover node kinds/field names.

Structured, navigable overview of a source module.

- **Parameters:**
  - `path` (string, required): Absolute or workspace-relative path to the source file.
  - `view` (string, optional): Payload tier (`summary`, `default`, or `compact`).
  - `blastRadius` (boolean, optional): Include the cross-file blast-radius section.
  - `blastRadiusDepth` (number, optional): Max hops for the blast-radius walk (default 3).
  - `callGraph` (boolean, optional): Include bounded derived callers/callees from the cached FunctionCallGraph.
  - `maxCallGraphEntries` (number, optional): Per-direction cap for call-graph relations (default 20).
  - `maxRefsPerSymbol` (number, optional): Cap on who-uses-this entries per symbol (default 10).

### pi_lens_activate_tools

Activate one or more situational pi-lens tools that stay registered but inactive by default.

- **Parameters:**
  - `tools` (array of strings, required): Names of situational tools to activate (e.g., `ast_grep_search`).

### pi-lens-lsp-navigation

Navigate code with IDE features and run proactive LSP diagnostics on files/folders/batches.

- **Parameters:** (No parameters defined, used for general code navigation actions)

### project_report

Project-level orientation from the review graph.

- **Parameters:**
  - `view` (string, optional): Payload tier (`default` or `compact`).
  - `focus` (string, optional): Optional task hint used only to re-rank sections toward relevant subsystems.
  - `limit` (number, optional): Scales every ranked section's cap (default 10).

### read

Read file contents.

- **Parameters:**
  - `path` (string, required): Path to the file to read (relative or absolute).
  - `offset` (number, optional): Line number to start reading from (1-indexed).
  - `limit` (number, optional): Maximum number of lines to read.

### read_enclosing

Return the verbatim source for the smallest useful symbol/callback enclosing a line in a file.

- **Parameters:**
  - `path` (string, required): Absolute or workspace-relative path to the source file.
  - `line` (number, required): 1-based line number inside the desired symbol/callback.
  - `maxLines` (number, optional): Optional maximum body size to return.
  - `aroundLine` (number, optional): Maximum lines for slice mode.
  - `kinds` (array of strings, optional): Optional kind filter (e.g., function, method, callback, class, object_property_callback).
  - `onOversize` (string, optional): Behavior when the enclosing body exceeds maxLines (`error`, `slice`, or `outline`).

### read_symbol

Return the verbatim source of a single named symbol or module_report callback handle in a file.

- **Parameters:**
  - `path` (string, required): Absolute or workspace-relative path to the source file.
  - `symbol` (string, required): Exact symbol name or callback handle (e.g., a function, class, type, or module_report callbacks[].name). Accepts a dotted `Class.method` name.
  - `kind` (string, optional): Optional kind filter (e.g., function, interface, class) to disambiguate.

### symbol_search

Ranked identifier search over the persisted word index.

- **Parameters:**
  - `query` (string, required): Identifier-ish query (e.g., 'authenticate user').
  - `lang` (string, optional): Restrict hits to one language (e.g., 'typescript', 'python', 'go').
  - `paths` (array of strings, optional): Glob array scoping hits to matching files.
  - `limit` (number, optional): Max files to return (default 20).

### web_fetch

Fetch and extract the text content of a URL.

- **Parameters:**
  - `url` (string, required): URL to fetch (must be http or https).

### ast_grep_dump

Dump the tree-sitter AST for a source snippet to discover node kinds/field names.

- **Parameters:** (No parameters defined)

### ast_grep_outline

Syntax-only file/dir structure (symbols/imports/exports/members) via ast-grep outline — no index/LSP.

- **Parameters:** (No parameters defined)

### ast_grep_replace

AST-aware structural code rewrite/refactor using ast-grep patterns.
- **Parameters:**
  - `path` (string, required): File or directory to search/rewrite.
  - `lang` (string, required): Language grammar to use for parsing.
  - `pattern` (string, required): ast-grep pattern to match.
  - `rewrite` (string, required): Replacement pattern, referencing the same $NAME / $$$NAME captures used in `pattern`.
  - `strictness` (string, optional): Matching strictness.

### ast_grep_search

Use when searching or replacing code patterns - use ast-grep instead of text search for semantic accuracy.

- **Parameters:**
  - `query` (string, required): Identifier-ish query, e.g. 'authenticate user'.
  - `lang` (string, optional): Restrict hits to one language.
  - `paths` (array of strings, optional): Glob array scoping hits to matching files.
  - `limit` (number, optional): Max files to return.

### Skills

**android-architecture**
Expert guidance on setting up and maintaining a modern Android application architecture using Clean Architecture and Hilt. Use this when asked about project structure, module setup, or dependency injection.

**android-data-layer**
Guidance on implementing the Data Layer using Repository pattern, Room (Local), and Retrofit (Remote) with offline-first synchronization.

**android-testing**
Comprehensive testing strategy involving Unit, Integration, Hilt, and Screenshot tests.

**android-viewmodel**
Best practices for implementing Android ViewModels, specifically focused on StateFlow for UI state and SharedFlow for one-off events.

**caveman**
Ultra-compressed communication mode. Cuts token usage ~75% by speaking like caveman while keeping full technical accuracy. Supports intensity levels: lite, full (default), ultra, wenyan-lite, wenyan-full, wenyan-ultra. Use when user says "caveman mode", "talk like caveman", "use caveman", "less tokens", "be brief", or invokes /caveman. Also auto-triggers when token efficiency is requested.

**compose-navigation**
Implement navigation in Jetpack Compose using Navigation Compose. Use when asked to set up navigation, pass arguments between screens, handle deep links, or structure multi-screen apps.

**compose-performance-audit**
Audit and improve Jetpack Compose runtime performance from code review and architecture. Use when asked to diagnose slow rendering, janky scrolling, excessive recompositions, or performance issues in Compose UI.

**compose-ui**
Best practices for building UI with Jetpack Compose, focusing on state hoisting, detailed performance optimizations, and theming. Use this when writing or refactoring Composable functions.

**deep-research**
Multi-round web research using web_search + web_fetch: classify the question into a domain (science, news, politics, tech, entertainment, ...), select the most authoritative sites for that domain, then run targeted site: searches and synthesize a cited report. Use when the user asks for deep research, a thorough investigation, or a well-sourced answer to an open question.

**gradle-build-performance**
Debug and optimize Android/Gradle build performance. Use when builds are slow, investigating CI/CD performance, analyzing build scans, or identifying compilation bottlenecks.

**kotlin-specialist**
Provides idiomatic Kotlin implementation patterns including coroutine concurrency, Flow stream handling, multiplatform architecture, Compose UI construction, Ktor server setup, and type-safe DSL design. Use when building Kotlin applications requiring coroutines, multiplatform development, or Android with Compose.

**pi-lens-write-ast-grep-rule**
Use when writing a new pi-lens ast-grep rule YAML file — covers schema, drop path, gotchas, and NAPI runner constraints.

**pi-lens-write-tree-sitter-rule**
Use when writing a new pi-lens tree-sitter query rule YAML file — covers schema, S-expression syntax, capture names, predicates, and gotchas.

**safe-search-help**
Reference for pi-safe-search: commands, config keys, and how to persistently edit safe-search.json.
