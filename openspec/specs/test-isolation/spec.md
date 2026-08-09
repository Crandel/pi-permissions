# test-isolation Specification

## Purpose
Ensure tests do not depend on real global configuration files and are fully isolated using temporary directories.
## Requirements
### Requirement: Tests use isolated home directory

All tests SHALL use a temporary directory as the home directory, not the real `os.homedir()`.

#### Scenario: Test ctx includes home

- **WHEN** the `index.test.ts` setup function creates the `ctx` object
- **THEN** it includes a `home` property pointing to a temp directory

#### Scenario: loadConfig receives isolated home

- **WHEN** `loadConfig` is called during tests
- **THEN** it receives the temp `home` directory, not `os.homedir()`

### Requirement: Tests do not load real global config

No test SHALL read from or be affected by `~/.pi/agent/permissions/permissions.json` or `~/.pi/agent/settings.json`.

#### Scenario: Real global config does not affect test results

- **WHEN** the real `~/.pi/agent/permissions/permissions.json` contains deny rules
- **THEN** tests still pass because the temp `home` directory is used

### Requirement: Test setup creates all necessary directories

The test setup SHALL create all directories needed for config loading before writing config files.

#### Scenario: Permissions directory created in temp home

- **WHEN** a test writes a `permissions.json` to the global permissions directory
- **THEN** the directory `~/.pi/agent/permissions/` (under temp home) is created first

### Requirement: All existing tests pass

All tests in the project SHALL pass after the fixes are applied.

#### Scenario: Full test suite passes

- **WHEN** `npm test` is run
- **THEN** all 20 tests pass with 0 failures

