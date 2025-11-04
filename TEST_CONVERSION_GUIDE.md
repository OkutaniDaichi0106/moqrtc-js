# Test Conversion Guide

This guide documents the test conversion process from Vitest/Jest to Deno test format.

## Current Status

**Converted: 9/31 tests (29%)**
**Remaining: 22 tests (71%)**

## Completed Conversions

### Descriptor Tests (5/5 - 100%) ✅

All descriptor tests are fully converted and demonstrate clean schema validation patterns:

1. **profile_test.ts** - Basic schema validation
2. **captions_test.ts** - Dependencies and config validation  
3. **timeseries_test.ts** - Map-based configuration
4. **audio_test.ts** - Hex string conversion, Uint8Array handling
5. **video_test.ts** - Complex video config validation

**Pattern:** Simple schema validation with `safeParse` and error checking.

### Catalog Tests (1/4 - 25%)

6. **container_test.ts** - Enum validation with comprehensive edge cases

**Pattern:** Extensive enum testing with invalid inputs, type checking, and schema composition.

### Internal Tests (2/12 - 17%)

7. **browser_test.ts** - Simple boolean constants
8. **error_test.ts** - Error code constants with table-driven tests

**Pattern:** Simple constant validation, demonstrates table-driven approach.

### Root Tests (1/5 - 20%)

9. **profile_test.ts** - Complete example showing full conversion pattern

**Pattern:** Nested test hierarchy with clear organization.

## Conversion Patterns

### Pattern 1: Basic Test Conversion

```typescript
// Before
describe("MyFeature", () => {
  test("should work", () => {
    expect(result).toBe(expected);
  });
});

// After
Deno.test("MyFeature", async (t) => {
  await t.step("should work", () => {
    assertEquals(result, expected);
  });
});
```

### Pattern 2: Nested Structure

```typescript
Deno.test("ParentFeature", async (t) => {
  await t.step("SubFeature", async (t) => {
    await t.step("specific test case", () => {
      assertEquals(actual, expected);
    });
  });
});
```

### Pattern 3: Table-Driven Tests

```typescript
await t.step("handles multiple cases", () => {
  const cases = [
    { input: 'a', expected: true },
    { input: 'b', expected: false },
  ];

  cases.forEach(({ input, expected }) => {
    assertEquals(fn(input), expected);
  });
});
```

### Pattern 4: Error Validation

```typescript
// Before
expect(() => fn()).toThrow(ErrorType);

// After
assertThrows(() => fn(), ErrorType);
```

## Remaining Test Categories

### Category 1: Simple Schema Tests (3 files)

These are straightforward to convert:
- `src/catalog/init_test.ts` (301 lines) - Schema validation
- `src/catalog/track_test.ts` (459 lines) - Track descriptor validation
- `src/catalog/integers_test.ts` (792 lines) - Integer encoding validation

**Estimated effort:** Low - Follow descriptor test patterns

### Category 2: Complex Mocking Tests (10+ files)

These require careful mock conversion:
- Internal tests with `vi.mock()` and worklet code
- Media tests with device mocking
- Root tests with complex state management

**Challenges:**
- Replace `vi.mock()` with dependency injection
- Handle inline worklet code (audio_hijack_worklet, audio_offload_worklet)
- Convert `vi.fn()` mock functions to simple stubs
- Remove `beforeEach`/`afterEach` hooks

**Estimated effort:** High - Requires restructuring

### Category 3: Integration Tests (remaining)

Tests that involve multiple components:
- `src/broadcast_test.ts`
- `src/room_test.ts`
- `src/elements/room_test.ts`

**Challenges:**
- Complex state management
- Multiple component interactions
- May need architectural changes for testability

**Estimated effort:** Medium to High

## Conversion Checklist

For each test file:

- [ ] Rename imports: Remove vitest, add @std/assert
- [ ] Convert structure: `describe/test` → `Deno.test/t.step`
- [ ] Update assertions: `expect()` → `assertEquals()`, etc.
- [ ] Handle mocks: Replace with DI or simple stubs
- [ ] Remove lifecycle hooks: Convert `beforeEach`/`afterEach`
- [ ] Test locally: Run `deno test path/to/file_test.ts`
- [ ] Commit incrementally

## Testing Converted Files

```bash
# Test a single file
deno test src/catalog/container_test.ts

# Test a directory
deno test src/catalog/

# Test with coverage
deno test --coverage=cov src/catalog/
deno coverage cov
```

## Common Issues and Solutions

### Issue 1: Mock Functions

**Problem:** `vi.fn()` and `vi.mock()` not available

**Solution:** Use dependency injection or create simple stub functions:

```typescript
// Instead of vi.fn()
const mockFn = (() => {
  const calls: any[][] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return undefined;
  };
  fn.calls = calls;
  return fn;
})();
```

### Issue 2: beforeEach/afterEach

**Problem:** No direct equivalent in Deno

**Solution:** Use setup/cleanup in test steps or create helper functions:

```typescript
Deno.test("Feature", async (t) => {
  let cleanup: (() => void)[] = [];

  await t.step("test 1", () => {
    const resource = setup();
    cleanup.push(() => resource.close());
    // test code
  });

  // Cleanup after all steps
  cleanup.forEach(fn => fn());
});
```

### Issue 3: Inline Worklet Code

**Problem:** Tests contain large inline worklet code

**Solution:** Extract worklet code to separate test files or skip worklet-specific tests for now, focusing on the interface/API tests.

## Priority Order

1. **High Priority** - Simple schema tests (catalog/*.ts)
2. **Medium Priority** - Media tests (can use simple stubs)
3. **Low Priority** - Complex internal tests (require significant refactoring)

## Resources

- **Guidelines:** `.github/prompts/deno-test.prompt.md`
- **Examples:** All converted test files (9 files)
- **Deno Docs:** https://deno.land/manual/testing
- **@std/assert:** https://jsr.io/@std/assert

## Quick Reference

### Assertion Mappings

| Vitest | Deno |
|--------|------|
| `expect(x).toBe(y)` | `assertEquals(x, y)` |
| `expect(x).toEqual(y)` | `assertEquals(x, y)` |
| `expect(x).toBeTruthy()` | `assert(x)` |
| `expect(x).toBeFalsy()` | `assert(!x)` |
| `expect(x).toBeUndefined()` | `assertEquals(x, undefined)` |
| `expect(x).toBeDefined()` | `assertExists(x)` |
| `expect(x).toBeNull()` | `assertEquals(x, null)` |
| `expect(x).toThrow()` | `assertThrows(() => x())` |
| `expect(x).rejects.toThrow()` | `assertRejects(() => x())` |
| `expect(x).toBeInstanceOf(T)` | `assert(x instanceof T)` |
| `expect(x).toHaveLength(n)` | `assertEquals(x.length, n)` |
| `expect(x).toContain(y)` | `assert(x.includes(y))` |
| `expect(x).toBeGreaterThan(y)` | `assert(x > y)` |
| `expect(x).toBeLessThan(y)` | `assert(x < y)` |

### Import Mappings

```typescript
// Before
import { describe, test, it, expect, vi, beforeEach, afterEach } from 'vitest';

// After
import { assertEquals, assert, assertThrows, assertRejects, assertExists } from "@std/assert";
```
