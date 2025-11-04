# Deno Migration Notes

This document describes the migration from Node.js + pnpm to Deno runtime and lists items that require manual attention.

## Completed Migrations

### ✅ Configuration Files
- Created `deno.json` with compiler options, import maps, tasks, formatting, and linting rules
- Created `.vscode/settings.json` for Deno language server support
- Updated `.github/workflows/ci.yml` to use Deno's GitHub Actions
- Updated `.gitignore` to include Deno-specific directories

### ✅ Source Code
- Added `.ts` extensions to all relative imports
- Fixed directory imports to properly reference `index.ts` files
- Configured import maps for external dependencies:
  - `golikejs/context` → `jsr:@okudai/golikejs@^0.5.2/context`
  - `golikejs/slice` → `jsr:@okudai/golikejs@^0.5.2/slice`
  - `zod` → `https://esm.sh/zod@3.23.8`
  - `@okutanidaichi/moqt` → `./src/test-stubs/moqt.ts`

### ✅ Test Files (9/31 Complete - 29%)
- Renamed all test files from `*.test.ts` to `*_test.ts` (31 files)
- Replaced `vitest` imports with `@std/assert`
- Converted `expect()` assertions to Deno assertion functions
- **Fully converted test files:**
  - ✅ `src/profile_test.ts` - Example conversion
  - ✅ `src/internal/browser_test.ts` - Simple browser detection
  - ✅ `src/internal/error_test.ts` - Error constants with table-driven tests
  - ✅ `src/catalog/descriptors/profile_test.ts` - Schema validation
  - ✅ `src/catalog/descriptors/captions_test.ts` - Captions descriptor
  - ✅ `src/catalog/descriptors/timeseries_test.ts` - Timeseries with Map
  - ✅ `src/catalog/descriptors/audio_test.ts` - Audio schema validation
  - ✅ `src/catalog/descriptors/video_test.ts` - Video schema validation
  - ✅ `src/catalog/container_test.ts` - Container enum validation with comprehensive testing

### ✅ Documentation
- Updated README.md with Deno installation instructions
- Added Deno task documentation
- Updated development workflow to use Deno commands

### ✅ Cleanup
- Removed `package.json`, `pnpm-lock.yaml`, `package-lock.json`
- Removed `tsconfig.json`
- Removed `vitest.config.ts` and `vitest.setup.ts`
- Removed `eslint.config.js` and `.eslintrc.json`
- Removed `.prettierrc.json`
- Removed `.npmrc` and `.npmignore`

## Remaining Work (22/31 tests - 71%)

### 🟡 Test Structure Conversion In Progress

23 test files still need conversion from Vitest's `describe`/`test`/`it` to Deno's `Deno.test()` format.

**Conversion guidelines available in:** `.github/prompts/deno-test.prompt.md`

**Before (Vitest):**
```typescript
import { describe, it, expect } from "vitest";

describe("MyClass", () => {
  it("should do something", () => {
    expect(result).toBe(expected);
  });
});
```

**After (Deno):**
```typescript
import { assertEquals } from "@std/assert";

Deno.test("MyClass should do something", () => {
  assertEquals(result, expected);
});

// Or with steps for nested structure:
Deno.test("MyClass", async (t) => {
  await t.step("should do something", () => {
    assertEquals(result, expected);
  });
});
```

**Files remaining (22):**
- Internal: 10 files (complex with mocking and worklet code)
- Catalog: 3 files (integers - 792 lines, track - 459 lines, init - 301 lines)
- Media: 4 files (camera, device, microphone, screen)
- Elements: 1 file (room)
- Root: 4 files (broadcast, room, test-utils, volume)

**Examples:** See converted test files listed above for patterns:
- Simple tests: `src/internal/browser_test.ts`
- Table-driven: `src/internal/error_test.ts`
- Schema validation: `src/catalog/descriptors/*.ts`

### 🔴 Mock Functions

Test files contain Vitest mock functions (`vi.mock()`, `vi.fn()`, `vi.spyOn()`) that need conversion.

Deno doesn't have built-in mocking like Vitest. Options:
1. Use manual mocks (create stub implementations)
2. Use a mocking library like `https://deno.land/x/mock`
3. Restructure tests to avoid mocking where possible

**Example conversions needed:**
```typescript
// Before
vi.mock("@okutanidaichi/moqt", () => ({
  validateBroadcastPath: vi.fn((path: string) => path),
}));

const mockFn = vi.fn();

// After - Option 1: Manual mock
const mockValidateBroadcastPath = (path: string) => path;

const mockFn = (...args: any[]) => {
  mockFn.calls.push(args);
};
```

**Files with mocking:** Most test files contain `vi.mock()` or similar calls

### 🔴 Test Lifecycle Hooks

Tests use `beforeEach`, `afterEach`, `beforeAll`, `afterAll` which need conversion to Deno equivalents.

**Before (Vitest):**
```typescript
beforeEach(() => {
  setup();
});

afterEach(() => {
  cleanup();
});
```

**After (Deno):**
```typescript
Deno.test("test suite", async (t) => {
  // Setup before each step
  await t.step("test 1", () => {
    setup();
    // test code
    cleanup();
  });
  
  await t.step("test 2", () => {
    setup();
    // test code
    cleanup();
  });
});
```

### 🟡 Dependency Verification

Due to network connectivity issues during migration, the following couldn't be verified:
- Zod import configuration
- GolikeJS JSR package availability
- Other external dependencies

**Action required:** Run `deno check src/**/*.ts` to verify all imports resolve correctly.

### 🟡 Example Directory

The `example/` directory is a separate SolidJS application using Vite. It was not migrated as part of this change.

**Options:**
1. Keep it as a separate Node.js application
2. Migrate it to use Deno + Fresh or another Deno web framework
3. Update it to use Deno's npm compatibility to run Vite

## Testing the Migration

Once manual work is complete, run these commands to verify:

```bash
# Type check all files
deno check src/**/*.ts

# Format code
deno fmt

# Lint code
deno lint

# Run tests (after test conversion)
deno task test

# Generate coverage (after test conversion)
deno task coverage
```

## Next Steps

1. Convert test structure from describe/test/it to Deno.test format
2. Convert or remove all mock functions
3. Verify all dependencies are accessible
4. Run full test suite
5. Update CI to ensure all checks pass
6. Consider migrating the example directory
7. Run security checks with `deno task check`

## Benefits Realized

After completing the manual work, the project will benefit from:

- ✅ No `node_modules` directory (dependencies cached by Deno)
- ✅ Native TypeScript support (no compilation step needed for development)
- ✅ Built-in formatter, linter, and test runner
- ✅ Better security with Deno's permission model
- ✅ Faster development iteration
- ✅ Simpler configuration (single `deno.json` file)
- ✅ Better Web API compatibility
- ✅ First-class ESM support

## Resources

- [Deno Manual](https://deno.land/manual)
- [Deno Standard Library](https://deno.land/std)
- [Testing in Deno](https://deno.land/manual/testing)
- [JSR Registry](https://jsr.io/)
- [Migrating from Node.js](https://deno.land/manual/node)
