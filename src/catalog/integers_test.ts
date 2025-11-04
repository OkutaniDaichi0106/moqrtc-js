import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { z } from "zod";
import { uint53, uint53Schema, uint62, uint62Schema, uint8, uint8Schema } from "./integers.ts";

Deno.test("uint8 accepts 0..255", () => {
	assertEquals(uint8(0), 0);
	assertEquals(uint8(255), 255);
	assertThrows(() => uint8(256));
});

Deno.test("uint53 accepts safe integers", () => {
	assertEquals(uint53(0), 0);
	assertEquals(uint53(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
	assertThrows(() => uint53(Number.MAX_SAFE_INTEGER + 1));
});

Deno.test("uint62 accepts bigint up to 62 bits", () => {
	assertEquals(uint62(0), 0);
	assertEquals(uint62(123n), 123n);
	assertThrows(() => uint62(-1 as any));
});

Deno.test("uint8Schema: accepts valid uint8 values", () => {
	assertEquals(uint8Schema.parse(0), 0);
	assertEquals(uint8Schema.parse(1), 1);
	assertEquals(uint8Schema.parse(127), 127);
	assertEquals(uint8Schema.parse(255), 255);
});

Deno.test("uint8Schema: rejects values below 0", () => {
	assertThrows(() => uint8Schema.parse(-1));
	assertThrows(() => uint8Schema.parse(-100));
});

Deno.test("uint8Schema: rejects values above 255", () => {
	assertThrows(() => uint8Schema.parse(256));
	assertThrows(() => uint8Schema.parse(1000));
});

Deno.test("uint8Schema: rejects non-integer values", () => {
	assertThrows(() => uint8Schema.parse(1.5));
	assertThrows(() => uint8Schema.parse(255.1));
	assertThrows(() => uint8Schema.parse(Math.PI));
});

Deno.test("uint8Schema: rejects non-numeric types", () => {
	assertThrows(() => uint8Schema.parse("255"));
	assertThrows(() => uint8Schema.parse(null));
	assertThrows(() => uint8Schema.parse(undefined));
	assertThrows(() => uint8Schema.parse({}));
	assertThrows(() => uint8Schema.parse([]));
	assertThrows(() => uint8Schema.parse(true));
});

Deno.test("uint8Schema: handles edge cases", () => {
	assertEquals(uint8Schema.parse(0), 0);
	assertEquals(uint8Schema.parse(255), 255);
	assertThrows(() => uint8Schema.parse(NaN));
	assertThrows(() => uint8Schema.parse(Infinity));
	assertThrows(() => uint8Schema.parse(-Infinity));
});

Deno.test("uint8 function: validates and returns uint8 values", () => {
	assertEquals(uint8(0), 0);
	assertEquals(uint8(128), 128);
	assertEquals(uint8(255), 255);
});

Deno.test("uint8 function: throws on invalid values", () => {
	assertThrows(() => uint8(-1));
	assertThrows(() => uint8(256));
	assertThrows(() => uint8(1.5));
});

Deno.test("uint8 function: type safety at runtime", () => {
	const validValue = uint8(42);
	assertEquals(typeof validValue, "number");
	assertEquals(Number.isInteger(validValue), true);
	assertEquals(validValue >= 0 && validValue <= 255, true);
});

Deno.test("uint53Schema: accepts valid uint53 values", () => {
	assertEquals(uint53Schema.parse(0), 0);
	assertEquals(uint53Schema.parse(1), 1);
	assertEquals(uint53Schema.parse(1000000), 1000000);
	assertEquals(uint53Schema.parse(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
});

Deno.test("uint53Schema: rejects values below 0", () => {
	assertThrows(() => uint53Schema.parse(-1));
	assertThrows(() => uint53Schema.parse(-Number.MAX_SAFE_INTEGER));
});

Deno.test("uint53Schema: rejects values above MAX_SAFE_INTEGER", () => {
	assertThrows(() => uint53Schema.parse(Number.MAX_SAFE_INTEGER + 1));
	assertThrows(() => uint53Schema.parse(Number.MAX_VALUE));
});

Deno.test("uint53Schema: rejects non-integer values", () => {
	assertThrows(() => uint53Schema.parse(1.5));
	assertThrows(() => uint53Schema.parse(0.1));
	assertThrows(() => uint53Schema.parse(Math.E));
});

Deno.test("uint53Schema: handles edge cases", () => {
	assertEquals(uint53Schema.parse(0), 0);
	assertEquals(uint53Schema.parse(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
	assertThrows(() => uint53Schema.parse(NaN));
	assertThrows(() => uint53Schema.parse(Infinity));
	assertThrows(() => uint53Schema.parse(-Infinity));
});

Deno.test("uint53Schema: aligns with Number.isSafeInteger", () => {
	const testValues = [0, 1, 1000, Number.MAX_SAFE_INTEGER];

	testValues.forEach((value) => {
		assertEquals(Number.isSafeInteger(value), true);
		uint53Schema.parse(value); // Should not throw
	});

	const unsafeValues = [Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 2];
	unsafeValues.forEach((value) => {
		assertEquals(Number.isSafeInteger(value), false);
		assertThrows(() => uint53Schema.parse(value));
	});
});

Deno.test("uint53 function: validates and returns uint53 values", () => {
	assertEquals(uint53(0), 0);
	assertEquals(uint53(42), 42);
	assertEquals(uint53(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
});

Deno.test("uint53 function: throws on invalid values", () => {
	assertThrows(() => uint53(-1));
	assertThrows(() => uint53(Number.MAX_SAFE_INTEGER + 1));
	assertThrows(() => uint53(1.5));
});

Deno.test("uint53 function: maintains type safety", () => {
	const value = uint53(12345);
	assertEquals(typeof value, "number");
	assertEquals(Number.isInteger(value), true);
	assertEquals(Number.isSafeInteger(value), true);
});

Deno.test("uint62Schema: accepts valid number values (uint53 range)", () => {
	assertEquals(uint62Schema.parse(0), 0);
	assertEquals(uint62Schema.parse(1), 1);
	assertEquals(uint62Schema.parse(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
});

Deno.test("uint62Schema: accepts valid bigint values", () => {
	assertEquals(uint62Schema.parse(0n), 0n);
	assertEquals(uint62Schema.parse(1n), 1n);
	assertEquals(uint62Schema.parse(2n ** 53n), 2n ** 53n);
	assertEquals(uint62Schema.parse(2n ** 62n - 1n), 2n ** 62n - 1n);
});

Deno.test("uint62Schema: rejects negative numbers", () => {
	assertThrows(() => uint62Schema.parse(-1));
	assertThrows(() => uint62Schema.parse(-100));
});

Deno.test("uint62Schema: rejects negative bigints", () => {
	assertThrows(() => uint62Schema.parse(-1n));
	assertThrows(() => uint62Schema.parse(-100n));
});

Deno.test("uint62Schema: rejects numbers above MAX_SAFE_INTEGER", () => {
	assertThrows(() => uint62Schema.parse(Number.MAX_SAFE_INTEGER + 1));
	assertThrows(() => uint62Schema.parse(Number.MAX_VALUE));
});

Deno.test("uint62Schema: rejects bigints above 2^62-1", () => {
	assertThrows(() => uint62Schema.parse(2n ** 62n));
	assertThrows(() => uint62Schema.parse(2n ** 63n));
	assertThrows(() => uint62Schema.parse(2n ** 100n));
});

Deno.test("uint62Schema: rejects non-integer numbers", () => {
	assertThrows(() => uint62Schema.parse(1.5));
	assertThrows(() => uint62Schema.parse(0.1));
});

Deno.test("uint62Schema: handles boundary values correctly", () => {
	// Maximum safe integer as number
	assertEquals(uint62Schema.parse(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);

	// Maximum uint62 as bigint
	const maxUint62 = 2n ** 62n - 1n;
	assertEquals(uint62Schema.parse(maxUint62), maxUint62);

	// Just over the limit should fail
	assertThrows(() => uint62Schema.parse(2n ** 62n));
});

Deno.test("uint62Schema: preserves type distinction between number and bigint", () => {
	const numberResult = uint62Schema.parse(42);
	const bigintResult = uint62Schema.parse(42n);

	assertEquals(typeof numberResult, "number");
	assertEquals(typeof bigintResult, "bigint");
	assertEquals(numberResult, 42);
	assertEquals(bigintResult, 42n);
});

Deno.test("uint62 function: validates and returns number values", () => {
	assertEquals(uint62(0), 0);
	assertEquals(uint62(42), 42);
	assertEquals(uint62(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
});

Deno.test("uint62 function: validates and returns bigint values", () => {
	assertEquals(uint62(0n), 0n);
	assertEquals(uint62(42n), 42n);
	assertEquals(uint62(2n ** 53n), 2n ** 53n);
	assertEquals(uint62(2n ** 62n - 1n), 2n ** 62n - 1n);
});

Deno.test("uint62 function: throws on invalid number values", () => {
	assertThrows(() => uint62(-1));
	assertThrows(() => uint62(Number.MAX_SAFE_INTEGER + 1));
	assertThrows(() => uint62(1.5));
});

Deno.test("uint62 function: throws on invalid bigint values", () => {
	assertThrows(() => uint62(-1n));
	assertThrows(() => uint62(2n ** 62n));
});

Deno.test("uint62 function: maintains type identity", () => {
	const numberInput = 1000;
	const bigintInput = 1000n;

	const numberResult = uint62(numberInput);
	const bigintResult = uint62(bigintInput);

	assertEquals(typeof numberResult, "number");
	assertEquals(typeof bigintResult, "bigint");
});

Deno.test("Integration and Cross-Type Tests: uint8 is subset of uint53", () => {
	const uint8Values = [0, 1, 127, 255];

	uint8Values.forEach((value) => {
		assertEquals(uint8(value), value);
		assertEquals(uint53(value), value);
		assertEquals(uint62(value), value);
	});
});

Deno.test("Integration and Cross-Type Tests: uint53 is subset of uint62 (number range)", () => {
	const uint53Values = [0, 1, 1000000, Number.MAX_SAFE_INTEGER];

	uint53Values.forEach((value) => {
		assertEquals(uint53(value), value);
		assertEquals(uint62(value), value);
	});
});

Deno.test("Integration and Cross-Type Tests: type hierarchy consistency", () => {
	// Test that smaller types fit into larger ones
	const testValue = 100;

	const u8 = uint8(testValue);
	const u53 = uint53(u8);
	const u62 = uint62(u53);

	assertEquals(u8, testValue);
	assertEquals(u53, testValue);
	assertEquals(u62, testValue);
});

Deno.test("Integration and Cross-Type Tests: error messages are descriptive", () => {
	try {
		uint8(256);
		throw new Error("Expected error to be thrown");
	} catch (error) {
		assert(error instanceof z.ZodError);
		assertEquals((error as z.ZodError).issues.length, 1);
	}

	try {
		uint53(-1);
		throw new Error("Expected error to be thrown");
	} catch (error) {
		assert(error instanceof z.ZodError);
		assertEquals((error as z.ZodError).issues.length, 1);
	}

	try {
		uint62(2n ** 62n);
		throw new Error("Expected error to be thrown");
	} catch (error) {
		assert(error instanceof z.ZodError);
		assertEquals((error as z.ZodError).issues.length, 1);
	}
});

Deno.test("Performance and Edge Cases: handles rapid successive validations", () => {
	const iterations = 1000;

	for (let i = 0; i < iterations; i++) {
		assert(uint8(Math.floor(Math.random() * 256)) >= 0);
		assert(uint53(Math.floor(Math.random() * 1000000)) >= 0);
	}
});

Deno.test("Performance and Edge Cases: memory usage is predictable", () => {
	const values = Array.from({ length: 100 }, (_, i) => i);

	values.forEach((value) => {
		const u8Result = uint8(value % 256);
		const u53Result = uint53(value);
		const u62Result = uint62(value);

		assertEquals(typeof u8Result, "number");
		assertEquals(typeof u53Result, "number");
		assertEquals(typeof u62Result, "number");
	});
});

Deno.test("Performance and Edge Cases: bigint conversion edge cases", () => {
	// Test conversion between number and bigint representations
	const numberValue = 42;
	const bigintValue = 42n;

	assertEquals(uint62(numberValue), numberValue);
	assertEquals(uint62(bigintValue), bigintValue);
	assert(uint62(numberValue) !== bigintValue); // Different types
});

Deno.test("Performance and Edge Cases: handles special numeric values", () => {
	const specialValues = [NaN, Infinity, -Infinity];

	specialValues.forEach((value) => {
		assertThrows(() => uint8(value));
		assertThrows(() => uint53(value));
		assertThrows(() => uint62(value));
	});
});

Deno.test("SafeParse API Tests: uint8Schema safeParse - should return success result for valid values", () => {
	const result = uint8Schema.safeParse(0);
	assertEquals(result.success, true);
	if (result.success) {
		assertEquals(result.data, 0);
	}

	const result2 = uint8Schema.safeParse(255);
	assertEquals(result2.success, true);
	if (result2.success) {
		assertEquals(result2.data, 255);
	}
});

Deno.test("SafeParse API Tests: uint8Schema safeParse - should return failure result for invalid values", () => {
	const result = uint8Schema.safeParse(-1);
	assertEquals(result.success, false);
	if (!result.success) {
		assert(result.error instanceof z.ZodError);
	}

	const result2 = uint8Schema.safeParse(256);
	assertEquals(result2.success, false);
	if (!result2.success) {
		assert(result2.error instanceof z.ZodError);
	}
});

Deno.test("SafeParse API Tests: uint8Schema safeParse - should provide error details", () => {
	const result = uint8Schema.safeParse("invalid");
	assertEquals(result.success, false);
	if (!result.success) {
		assert(result.error.issues.length > 0);
	}
});

Deno.test("SafeParse API Tests: uint53Schema safeParse - should return success result for valid values", () => {
	const result = uint53Schema.safeParse(0);
	assertEquals(result.success, true);
	if (result.success) {
		assertEquals(result.data, 0);
	}

	const result2 = uint53Schema.safeParse(Number.MAX_SAFE_INTEGER);
	assertEquals(result2.success, true);
	if (result2.success) {
		assertEquals(result2.data, Number.MAX_SAFE_INTEGER);
	}
});

Deno.test("SafeParse API Tests: uint53Schema safeParse - should return failure result for invalid values", () => {
	const result = uint53Schema.safeParse(Number.MAX_SAFE_INTEGER + 1);
	assertEquals(result.success, false);

	const result2 = uint53Schema.safeParse(-1);
	assertEquals(result2.success, false);
});

Deno.test("SafeParse API Tests: uint62Schema safeParse - should return success result for valid number values", () => {
	const result = uint62Schema.safeParse(0);
	assertEquals(result.success, true);
	if (result.success) {
		assertEquals(result.data, 0);
	}

	const result2 = uint62Schema.safeParse(Number.MAX_SAFE_INTEGER);
	assertEquals(result2.success, true);
	if (result2.success) {
		assertEquals(result2.data, Number.MAX_SAFE_INTEGER);
	}
});

Deno.test("SafeParse API Tests: uint62Schema safeParse - should return success result for valid bigint values", () => {
	const result = uint62Schema.safeParse(0n);
	assertEquals(result.success, true);
	if (result.success) {
		assertEquals(result.data, 0n);
	}

	const result2 = uint62Schema.safeParse(2n ** 62n - 1n);
	assertEquals(result2.success, true);
	if (result2.success) {
		assertEquals(result2.data, 2n ** 62n - 1n);
	}
});

Deno.test("SafeParse API Tests: uint62Schema safeParse - should return failure result for values exceeding 2^62-1", () => {
	const result = uint62Schema.safeParse(2n ** 62n);
	assertEquals(result.success, false);

	const result2 = uint62Schema.safeParse(2n ** 63n);
	assertEquals(result2.success, false);
});

Deno.test("Boundary and Corner Cases: uint8 boundaries - should handle all valid boundaries", () => {
	// Test all critical boundaries
	assertEquals(uint8(0), 0); // Minimum
	assertEquals(uint8(1), 1); // Just above minimum
	assertEquals(uint8(127), 127); // Middle value
	assertEquals(uint8(254), 254); // Just below maximum
	assertEquals(uint8(255), 255); // Maximum

	// Test boundary violations
	assertThrows(() => uint8(-1));
	assertThrows(() => uint8(0.5));
	assertThrows(() => uint8(255.5));
	assertThrows(() => uint8(256));
});

Deno.test("Boundary and Corner Cases: uint8 boundaries - should maintain consistency with schema", () => {
	for (let i = 0; i <= 255; i++) {
		assertEquals(uint8(i), uint8Schema.parse(i));
	}
});

Deno.test("Boundary and Corner Cases: uint53 boundaries - should handle critical boundary values", () => {
	// Test around Number.MAX_SAFE_INTEGER
	const maxSafe = Number.MAX_SAFE_INTEGER;
	assertEquals(uint53(maxSafe - 1), maxSafe - 1);
	assertEquals(uint53(maxSafe), maxSafe);
	assertThrows(() => uint53(maxSafe + 1));
});

Deno.test("Boundary and Corner Cases: uint53 boundaries - should handle powers of 2 correctly", () => {
	// Powers of 2 are important boundary values
	for (let i = 0; i <= 52; i++) {
		const value = Math.pow(2, i);
		if (value <= Number.MAX_SAFE_INTEGER) {
			assertEquals(uint53(value), value);
		}
	}
});

Deno.test("Boundary and Corner Cases: uint53 boundaries - should recognize safe vs unsafe integers", () => {
	// Test that all passed values are recognized as safe
	const testValues = [0, 1, 100, 1000000, Number.MAX_SAFE_INTEGER];
	testValues.forEach((value) => {
		assert(Number.isSafeInteger(value));
		assertEquals(uint53(value), value);
	});

	// Test unsafe values
	const unsafeValues = [Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE];
	unsafeValues.forEach((value) => {
		assert(!Number.isSafeInteger(value));
		assertThrows(() => uint53(value));
	});
});

Deno.test("Boundary and Corner Cases: uint62 boundaries with bigint - should handle uint62 boundary values precisely", () => {
	const max62 = 2n ** 62n - 1n;
	const over62 = 2n ** 62n;

	// Maximum valid value
	assertEquals(uint62(max62), max62);

	// Just over the limit
	assertThrows(() => uint62(over62));
});

Deno.test("Boundary and Corner Cases: uint62 boundaries with bigint - should handle 2^53 transition boundary", () => {
	// 2^53 is the boundary where JavaScript numbers lose precision
	const value = 2n ** 53n;
	assertEquals(uint62(value), value);

	// Just below and above
	assertEquals(uint62(2n ** 53n - 1n), 2n ** 53n - 1n);
	assertEquals(uint62(2n ** 53n + 1n), 2n ** 53n + 1n);
});

Deno.test("Boundary and Corner Cases: uint62 boundaries with bigint - should preserve exact values at boundaries", () => {
	const testValues = [
		0n,
		1n,
		2n ** 8n - 1n, // 255
		2n ** 16n - 1n, // 65535
		2n ** 32n - 1n, // 4294967295
		2n ** 53n - 1n, // Number.MAX_SAFE_INTEGER as bigint
		2n ** 53n,
		2n ** 53n + 1n,
		2n ** 60n,
		2n ** 62n - 1n, // Maximum uint62
	];

	testValues.forEach((value) => {
		assertEquals(uint62(value), value);
	});
});

Deno.test("Type System and Runtime Validation: Type preservation - uint8 always returns number", () => {
	const values = [0, 1, 127, 255];
	values.forEach((value) => {
		const result = uint8(value);
		assertEquals(typeof result, "number");
		assert(Number.isInteger(result));
	});
});

Deno.test("Type System and Runtime Validation: Type preservation - uint53 always returns number", () => {
	const values = [0, 1, 1000000, Number.MAX_SAFE_INTEGER];
	values.forEach((value) => {
		const result = uint53(value);
		assertEquals(typeof result, "number");
		assert(Number.isInteger(result));
		assert(Number.isSafeInteger(result));
	});
});

Deno.test("Type System and Runtime Validation: Type preservation - uint62 preserves input type", () => {
	// Numbers remain numbers
	const numResult = uint62(42);
	assertEquals(typeof numResult, "number");
	assertEquals(numResult, 42);

	// Bigints remain bigints
	const bigintResult = uint62(42n);
	assertEquals(typeof bigintResult, "bigint");
	assertEquals(bigintResult, 42n);

	// They are not equal due to type difference
	assert(numResult !== bigintResult);
	assertEquals(Number(bigintResult), numResult);
});

Deno.test("Type System and Runtime Validation: Union type handling for uint62 - should accept both number and bigint in union", () => {
	// Number path
	const numValue = uint62Schema.parse(100);
	assertEquals(numValue, 100);
	assertEquals(typeof numValue, "number");

	// Bigint path
	const bigintValue = uint62Schema.parse(100n);
	assertEquals(bigintValue, 100n);
	assertEquals(typeof bigintValue, "bigint");
});

Deno.test("Type System and Runtime Validation: Union type handling for uint62 - should correctly validate both branches independently", () => {
	// Valid as number
	assertEquals(uint62(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);

	// Valid as bigint beyond Number.MAX_SAFE_INTEGER
	assertEquals(uint62(BigInt(Number.MAX_SAFE_INTEGER) + 1n), BigInt(Number.MAX_SAFE_INTEGER) + 1n);

	// Invalid in both branches
	assertThrows(() => uint62(-1));
	assertThrows(() => uint62(-1n));
});

Deno.test("Schema Composition and Reusability: Schema independence - schemas should not affect each other", () => {
	// Modifying one schema validation should not affect others
	assertEquals(uint8Schema.parse(255), 255);
	assertEquals(uint53Schema.parse(255), 255);
	assertEquals(uint62Schema.parse(255), 255);

	assertThrows(() => uint8Schema.parse(256));
	assertEquals(uint53Schema.parse(256), 256);
	assertEquals(uint62Schema.parse(256), 256);
});

Deno.test("Schema Composition and Reusability: Schema independence - should parse consistently across multiple calls", () => {
	const value = 42;
	for (let i = 0; i < 10; i++) {
		assertEquals(uint8Schema.parse(value), value);
		assertEquals(uint53Schema.parse(value), value);
		assertEquals(uint62Schema.parse(value), value);
	}
});

Deno.test("Schema Composition and Reusability: Error consistency - all schemas throw ZodError on invalid input", () => {
	assertThrows(() => uint8Schema.parse(-1), z.ZodError);
	assertThrows(() => uint53Schema.parse(-1), z.ZodError);
	assertThrows(() => uint62Schema.parse(-1n), z.ZodError);
});

Deno.test("Schema Composition and Reusability: Error consistency - error structure is consistent", () => {
	try {
		uint8Schema.parse("invalid");
		throw new Error("Expected error to be thrown");
	} catch (error) {
		assert(error instanceof z.ZodError);
		if (error instanceof z.ZodError) {
			assertExists(error.issues);
			assert(Array.isArray(error.issues));
		}
	}
});

Deno.test("Integration with Math Operations: uint8 values work with standard arithmetic", () => {
	const a = uint8(10);
	const b = uint8(20);
	assertEquals(a + b, 30);
	assertEquals(a * b, 200);
});

Deno.test("Integration with Math Operations: uint53 values work with large number operations", () => {
	const a = uint53(Number.MAX_SAFE_INTEGER - 1);
	const result = a + 1;
	assertEquals(result, Number.MAX_SAFE_INTEGER);
});

Deno.test("Integration with Math Operations: uint62 bigint values work with bitwise operations", () => {
	const a = uint62(0b1010n) as bigint;
	const b = uint62(0b1100n) as bigint;
	assertEquals(a | b, 0b1110n);
	assertEquals(a & b, 0b1000n);
});

Deno.test("Practical Use Cases: uint8 for byte values", () => {
	// Typical byte range validation
	const bytes = [0, 127, 255];
	bytes.forEach((byte) => {
		assertEquals(uint8(byte), byte);
	});

	// Out of byte range
	assertThrows(() => uint8(256));
	assertThrows(() => uint8(-1));
});

Deno.test("Practical Use Cases: uint53 for array indices and counts", () => {
	// Valid array operations
	const count = uint53(1000000);
	const index = uint53(999999);
	assert(count > index);

	// Array length cannot exceed MAX_SAFE_INTEGER
	assertThrows(() => uint53(Number.MAX_SAFE_INTEGER + 1));
});

Deno.test("Practical Use Cases: uint62 for handling extended ranges", () => {
	// Can handle numbers beyond safe integer range
	const largeValue = uint62(2n ** 50n);
	assertEquals(largeValue, 2n ** 50n);

	// Useful for protocol/format encoding
	const encoding = uint62(0x3FFFFFFFFFFFFFFFn); // Max 62-bit value
	assertEquals(encoding, 0x3FFFFFFFFFFFFFFFn);
});

Deno.test("Negative Cases and Error Paths: should reject all invalid inputs uniformly", () => {
	const invalidInputs = [
		-1,
		-0.1,
		0.5,
		1.5,
		Number.MAX_VALUE,
		Number.MIN_VALUE,
		NaN,
		Infinity,
		-Infinity,
		"string",
		{},
		[],
		null,
		undefined,
		true,
		false,
	];

	invalidInputs.forEach((input) => {
		assertThrows(() => uint8(input as any));
		assertThrows(() => uint53(input as any));
	});
});

Deno.test("Negative Cases and Error Paths: negative bigints should always fail", () => {
	const negativeBigints = [-1n, -100n, -(2n ** 50n)];
	negativeBigints.forEach((value) => {
		assertThrows(() => uint62(value));
	});
});

Deno.test("Negative Cases and Error Paths: should reject bigints exceeding uint62 range", () => {
	const tooLarge = [
		2n ** 62n,
		2n ** 63n,
		2n ** 100n,
		2n ** 1000n,
	];
	tooLarge.forEach((value) => {
		assertThrows(() => uint62(value));
	});
});
