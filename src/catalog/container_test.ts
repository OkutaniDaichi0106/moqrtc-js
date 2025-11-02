import { ContainerSchema } from "./container.ts";
import { z } from "zod";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

describe("Container", () => {
	describe("ContainerSchema", () => {
		test("accepts valid container types", () => {
			const validContainers = ["loc", "cmaf"];

			validContainers.forEach((container) => {
				const result = ContainerSchema.safeParse(container);
				assertEquals(result.success, true);
				if (result.success) {
					assertEquals(result.data, container);
				}
			});
		});

		test("rejects invalid container types", () => {
			const invalidContainers = [
				"mp4",
				"webm",
				"hls",
				"dash",
				"invalid",
				"LOC", // Case sensitive
				"CMAF", // Case sensitive
				"loc ", // Trailing space
				" loc", // Leading space
				"loc-cmaf",
				"cmaf-loc",
			];

			invalidContainers.forEach((container) => {
				const result = ContainerSchema.safeParse(container);
				assertEquals(result.success, false);
				if (!result.success) {
					assert(result.error instanceof z.ZodError);
					assertEquals(result.error.issues.length, 1);
					assertEquals(result.error.issues[0].code, "invalid_value");
				}
			});
		});

		test("rejects non-string values", () => {
			const nonStringValues = [
				123,
				true,
				false,
				null,
				undefined,
				{},
				[],
				Symbol("loc"),
				new Date(),
				/regex/,
			];

			nonStringValues.forEach((value) => {
				const result = ContainerSchema.safeParse(value);
				assertEquals(result.success, false);
				if (!result.success) {
					assert(result.error instanceof z.ZodError);
					assertEquals(result.error.issues.length, 1);
					assertEquals(result.error.issues[0].code, "invalid_value");
				}
			});
		});

		test("provides correct error messages for invalid enum values", () => {
			const result = ContainerSchema.safeParse("invalid");
			assertEquals(result.success, false);

			if (!result.success) {
				const issue = result.error.issues[0];
				assertEquals(issue.code, "invalid_value");
				assert(issue.message.includes("Invalid option"));
				assert(issue.message.includes('"loc"'));
				assert(issue.message.includes('"cmaf"'));
			}
		});

		test("provides correct error messages for wrong types", () => {
			const result = ContainerSchema.safeParse(123);
			assertEquals(result.success, false);

			if (!result.success) {
				const issue = result.error.issues[0];
				assertEquals(issue.code, "invalid_value");
				assert(issue.message.includes("Invalid option"));
				assert(issue.message.includes('"loc"'));
				assert(issue.message.includes('"cmaf"'));
			}
		});

		test("works with parse method for valid values", () => {
			expect(() => ContainerSchema.parse("loc")).not.toThrow();
			expect(() => ContainerSchema.parse("cmaf")).not.toThrow();

			expect(ContainerSchema.parse("loc")).toBe("loc");
			expect(ContainerSchema.parse("cmaf")).toBe("cmaf");
		});

		test("throws with parse method for invalid values", () => {
			expect(() => ContainerSchema.parse("invalid")).toThrow(z.ZodError);
			expect(() => ContainerSchema.parse(123)).toThrow(z.ZodError);
			expect(() => ContainerSchema.parse("")).toThrow(z.ZodError);
		});

		test("schema has correct type definition", () => {
			// Type-level test - this should compile without errors
			const validValue: z.infer<typeof ContainerSchema> = "loc";
			assertEquals(validValue, "loc");

			// Should be assignable to string union type
			const containerType: "loc" | "cmaf" = ContainerSchema.parse("cmaf");
			assertEquals(containerType, "cmaf");
		});

		test("schema properties and metadata", () => {
			assert(ContainerSchema instanceof z.ZodEnum);
			// Test enum options indirectly through parsing
			assert(ContainerSchema.options.includes("loc"));
			assert(ContainerSchema.options.includes("cmaf"));
			assertEquals(ContainerSchema.options.length, 2);
		});

		test("handles edge cases", () => {
			// Empty string
			const emptyResult = ContainerSchema.safeParse("");
			assertEquals(emptyResult.success, false);

			// Only whitespace
			const whitespaceResult = ContainerSchema.safeParse("   ");
			assertEquals(whitespaceResult.success, false);

			// Unicode characters
			const unicodeResult = ContainerSchema.safeParse("löc");
			assertEquals(unicodeResult.success, false);
		});

		test("integration with complex objects", () => {
			const testObject = {
				container: "loc" as const,
				otherField: "value",
			};

			const containerValue = ContainerSchema.safeParse(testObject.container);
			assertEquals(containerValue.success, true);
			if (containerValue.success) {
				assertEquals(containerValue.data, "loc");
			}
		});

		test("array of containers validation", () => {
			const containers = ["loc", "cmaf"];
			const arraySchema = z.array(ContainerSchema);

			const result = arraySchema.safeParse(containers);
			assertEquals(result.success, true);
			if (result.success) {
				assertEquals(result.data, ["loc", "cmaf"]);
			}

			// Invalid array
			const invalidResult = arraySchema.safeParse(["loc", "invalid"]);
			assertEquals(invalidResult.success, false);
		});

		test("optional container schema", () => {
			const optionalSchema = ContainerSchema.optional();

			expect(optionalSchema.safeParse("loc").success).toBe(true);
			expect(optionalSchema.safeParse("cmaf").success).toBe(true);
			expect(optionalSchema.safeParse(undefined).success).toBe(true);
			expect(optionalSchema.safeParse("invalid").success).toBe(false);
		});

		test("nullable container schema", () => {
			const nullableSchema = ContainerSchema.nullable();

			expect(nullableSchema.safeParse("loc").success).toBe(true);
			expect(nullableSchema.safeParse("cmaf").success).toBe(true);
			expect(nullableSchema.safeParse(null).success).toBe(true);
			expect(nullableSchema.safeParse("invalid").success).toBe(false);
		});

		test("default value with container schema", () => {
			const schemaWithDefault = ContainerSchema.default("loc");

			expect(schemaWithDefault.parse("cmaf")).toBe("cmaf");
			expect(schemaWithDefault.parse(undefined)).toBe("loc");
		});
	});
});
