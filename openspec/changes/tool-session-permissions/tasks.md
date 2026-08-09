## 1. Events & Types Update

- [x] 1.1 Update `PermissionSelection` type definition and `PERMISSION_OPTIONS` generator in `src/events.ts`
- [x] 1.2 Update event schemas and exports in `src/events.ts` to support dynamic selection options including `Allow everything (this session)`

## 2. SessionCache & Dialog Logic

- [x] 2.1 Refactor `SessionCache` in `src/ask.ts` to include `toolCache`, `exactCache`, and `allowAll` global flag
- [x] 2.2 Implement `setTool`, `setExact`, `setAllowAll`, and lookup hierarchy in `SessionCache.get`
- [x] 2.3 Update `askUser` in `src/ask.ts` to generate dynamic prompt options and record choices into dual-level cache or global bypass
- [x] 2.4 Update `src/index.ts` to pass options and emit updated user selection events

## 3. Testing & Verification

- [x] 3.1 Update existing ask dialog unit tests in `src/index.test.ts` for updated options
- [x] 3.2 Add unit tests for tool-wide wildcard session caching (`Session allow (tool: bash *)`)
- [x] 3.3 Add unit tests for exact-input session caching (`Session allow (exact input)`)
- [x] 3.4 Add unit tests for global session allow bypass (`Allow everything (this session)`)
- [x] 3.5 Verify full test suite passes with `npm test` and build with `npm run build`
