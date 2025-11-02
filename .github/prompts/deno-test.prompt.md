# Deno Test & Mocking Rules (Subtest + Table-driven)

## Core Principles

### Coverage
- Normal, edge, boundary cases
- Invalid inputs, error paths, type validation
- Null/undefined, side effects, security

### Code Quality
- Descriptive test names
- Comment non-obvious logic
- Extract common setup inline or in beforeEach
- Clean up mocks/state
- No console.log in final tests

### Mocking
- DI: mock external dependencies
- Real: internal utils unless isolated test
- Spy/Stub: `@std/testing/mock` via imports map
- Always restore global/shared state

---

## Test Generation Process
1. Analyze code purpose, dependencies, side effects
2. Plan normal, edge, error test cases
3. Generate runnable `.test.ts` using `Deno.test` + `t.step`
4. Self-review: missing cases, cleanup, type safety
5. Output final runnable test

**Notes**:  
- Ask clarifying questions if context is insufficient  
- Explain test plan for complex scenarios  

---

## Table-driven / Multiple Scenario Rules
- Multiple test cases should be stored in an object (record) or array
- Each scenario must use `t.step` for a separate subtest
- Each case should have a clear, descriptive name
- This improves readability and manageability

#### Example
~~~ts
import { assertEquals } from "@std/assert";

const cases = {
  "normal case": { input: 2, expected: 4 },
  "edge case": { input: 0, expected: 0 },
  "negative input": { input: -5, expected: -10 },
};

Deno.test("functionName - multiple scenarios", async (t) => {
  for (const [name, c] of Object.entries(cases)) {
    await t.step(name, () => {
      assertEquals(functionUnderTest(c.input), c.expected);
    });
  }
});
~~~

---

## Mandatory Rules

### Must Have
- TypeScript + Deno imports (via `deno.json` imports map)
- `Deno.test` + `t.step` for hierarchical tests
- Setup/cleanup manually (no shared state between tests)
- Use `assertEquals`, `assertThrows` from `@std/assert`
- Cover success, error, edge, boundary cases
- Descriptive test names with context
- Mock only external dependencies (use DI)

### Must Not Have
- `deps.ts` or imports from `deps.ts`
- Full URLs like `https://deno.land/std@...` (use imports map)
- `console.log` or debugging code
- Commented-out or magic values
- Coupled/ambiguous tests
- Missing cleanup or teardown
- Over-mocking (avoid mocking internal utilities)

---

## Test Template

~~~ts
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("functionName - Normal Cases", () => {
  // Simple sync test
  assertEquals(functionUnderTest(2), 4);
  assertEquals(functionUnderTest(0), 0);
});

Deno.test("functionName - Error Cases", () => {
  // Test error handling
  assertThrows(() => functionUnderTest(-1), Error, "Invalid input");
  assertThrows(() => functionUnderTest(null), TypeError);
});

Deno.test("functionName - Async Cases", async () => {
  // Async test with setup
  const result = await asyncFunction(5);
  assertEquals(result, 10);
});

// Nested tests with t.step (for complex scenarios)
Deno.test("ModuleName - Complex Scenario", async (t) => {
  let resource: any = null;

  await t.step("Normal Cases", async (t) => {
    await t.step("should do X correctly", () => {
      assertEquals(complexFunctionUnderTest(2), 4);
    });
    await t.step("should handle edge case Y", () => {
      assertEquals(complexFunctionUnderTest(0), 0);
    });
  });

  await t.step("Error Cases", async (t) => {
    await t.step("should throw on invalid input", () => {
      assertThrows(() => complexFunctionUnderTest(-1), Error, "Invalid input");
    });
  });

  // Cleanup
  resource = null;
});
~~~

**Imports**: Always use `deno.json` imports map:
```ts
import { assertEquals, assertThrows } from "@std/assert";
import { spy, stub } from "@std/testing/mock";
```

---

## Mocking Best Practices

### 1. Dependency Injection
~~~ts
export interface UserService { getUser(id: number): Promise<string>; }

class MyApp {
  constructor(private userService: UserService) {}
  async greet(id: number) { return `Hello ${await this.userService.getUser(id)}`; }
}

class MockUserService implements UserService {
  async getUser(id: number) { return "mock_user"; }
}

const app = new MyApp(new MockUserService());
~~~

### 2. Minimal Unit Mocks
- Mock only what the unit needs

### 3. Use std Spy/Stub
~~~ts
import { spy, stub } from "@std/testing/mock";
import { assertEquals } from "@std/assert";

// Example: Spy on an object method
const obj = {
  method: (x: number) => x * 2,
};

const spied = spy(obj, "method");
obj.method(5);
obj.method(10);

assertEquals(spied.calls.length, 2);
assertEquals(spied.calls[0].args, [5]);
spied.restore();

// Example: Stub an object method
const stubbed = stub(obj, "method", () => 99);
assertEquals(obj.method(5), 99);
stubbed.restore();
~~~

### 4. Minimal Third-party Libraries
- Prefer `@std` modules + manual mocks
- Avoid unnecessary external dependencies
- Keep mocks simple and focused

### 5. Type-safe Mocks
- Ensure mock signatures match interfaces
- Use TypeScript `implements` keyword

### 6. Simple Mock Behavior
~~~ts
class MockDB implements Database {
  async fetch() {
    return [{ id: 1, name: "Alice" }];
  }
}

class MockUserService implements UserService {
  async getUser(id: number): Promise<string> {
    return `user_${id}`;
  }
}
~~~

---

## Complete Practical Example

~~~ts
import { assertEquals, assertThrows } from "@std/assert";
import { spy } from "@std/testing/mock";

// Interface for DI
interface UserRepository {
  getUserById(id: number): Promise<{ id: number; name: string }>;
  deleteUser(id: number): Promise<void>;
}

// Implementation under test
class UserService {
  constructor(private repo: UserRepository) {}

  async getFullName(id: number): Promise<string> {
    const user = await this.repo.getUserById(id);
    return user.name.toUpperCase();
  }

  async removeUser(id: number): Promise<void> {
    await this.repo.deleteUser(id);
  }
}

// Mock implementation
class MockUserRepository implements UserRepository {
  private users: Map<number, { id: number; name: string }> = new Map([
    [1, { id: 1, name: "alice" }],
    [2, { id: 2, name: "bob" }],
  ]);

  async getUserById(id: number) {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async deleteUser(id: number) {
    this.users.delete(id);
  }
}

// Test suite
Deno.test("UserService - Normal Cases", async (t) => {
  const repo = new MockUserRepository();
  const service = new UserService(repo);

  await t.step("getFullName should return uppercase name", async () => {
    const result = await service.getFullName(1);
    assertEquals(result, "ALICE");
  });

  await t.step("getFullName should handle second user", async () => {
    const result = await service.getFullName(2);
    assertEquals(result, "BOB");
  });
});

Deno.test("UserService - Error Cases", async (t) => {
  const repo = new MockUserRepository();
  const service = new UserService(repo);

  await t.step("getFullName should throw on non-existent user", async () => {
    await assertThrows(
      () => service.getFullName(999),
      Error,
      "User not found"
    );
  });
});

Deno.test("UserService - Verification with Spy", async (t) => {
  const repo = new MockUserRepository();
  const service = new UserService(repo);

  await t.step("removeUser should call repo.deleteUser", async () => {
    const spied = spy(repo, "deleteUser");
    await service.removeUser(1);
    assertEquals(spied.calls.length, 1);
    assertEquals(spied.calls[0].args[0], 1);
    spied.restore();
  });
});
~~~

---

## Summary
- **Prefer simple tests**: Use `Deno.test` with descriptive names over nested `t.step` when possible
- **Use `t.step` for grouping**: Only use nested tests when logically grouping related scenarios
- **DI first**: Inject dependencies for easy mocking  
- **Unit-level mocks**: Mock only external dependencies  
- **Use `@std/assert` and `@std/testing`**: Via `deno.json` imports map
- **Spy on object methods**: `spy(obj, "methodName")` to track calls
- **Stub to replace behavior**: `stub(obj, "methodName", () => newBehavior)`
- **Minimal third-party packages**: Prefer `@std` modules
- **Type-safe mocks**: Implement interfaces with TypeScript
- **Always cleanup/restore**: Call `.restore()` on spies/stubs
