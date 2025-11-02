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

### ✅ Test Files
- Renamed all test files from `*.test.ts` to `*_test.ts` (31 files)
- Replaced `vitest` imports with `@std/assert`
- Converted most `expect()` assertions to Deno assertion functions:
  - `expect(x).toBe(y)` → `assertEquals(x, y)`
  - `expect(x).toEqual(y)` → `assertEquals(x, y)`
  - `expect(x).toBeTruthy()` → `assert(x)`
  - `expect(x).toBeDefined()` → `assertExists(x)`
  - `expect(x).toThrow()` → `assertThrows(() => x)`
  - And more...

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

## Manual Work Required

### 🔴 Test Structure Conversion

Test files still use Vitest's `describe`/`test`/`it` structure. These need to be converted to Deno's `Deno.test()` format.

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

**Files affected:** All 31 `*_test.ts` files (1 already converted: `src/profile_test.ts`)

**Example:** See `src/profile_test.ts` for a fully converted test file that demonstrates the pattern.

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
