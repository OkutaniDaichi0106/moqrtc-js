import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { CatalogInit, CatalogInitSchema, DEFAULT_CATALOG_VERSION } from "./init.ts";

Deno.test("CatalogInit", async (t) => {
	await t.step("DEFAULT_CATALOG_VERSION constant", async (t2) => {
		await t2.step("should be defined with correct format", () => {
			assertEquals(DEFAULT_CATALOG_VERSION, "@gomoqt/v1");
		});

		await t2.step("should be a string", () => {
			assertEquals(typeof DEFAULT_CATALOG_VERSION, "string");
		});
	});

	await t.step("CatalogInitSchema", async (t2) => {
		await t2.step("version field", async (t3) => {
			await t3.step("should parse valid version string", () => {
				const input = { version: "test-version" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "test-version");
			});

			await t3.step("should parse @gomoqt/v1 version", () => {
				const input = { version: "@gomoqt/v1" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "@gomoqt/v1");
			});

			await t3.step("should parse empty string as version", () => {
				const input = { version: "" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "");
			});

			await t3.step("should throw error when version is missing", () => {
				const input = {};

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when version is not a string", () => {
				const input = { version: 123 };

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when version is null", () => {
				const input = { version: null };

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when version is undefined", () => {
				const input = { version: undefined };

				assertThrows(() => CatalogInitSchema.parse(input));
			});
		});

		await t2.step("$schema field", async (t3) => {
			await t3.step("should parse valid URL in $schema field", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema.json",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, "https://example.com/schema.json");
			});

			await t3.step("should parse http URL in $schema field", () => {
				const input = {
					version: "v1",
					$schema: "http://example.com/schema",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, "http://example.com/schema");
			});

			await t3.step("should allow $schema to be undefined", () => {
				const input = { version: "v1" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, undefined);
			});

			await t3.step("should allow $schema to be explicitly omitted", () => {
				const input = { version: "v1", $schema: undefined };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, undefined);
			});

			await t3.step("should throw error when $schema is not a valid URL", () => {
				const input = {
					version: "v1",
					$schema: "not-a-url",
				};

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when $schema is a number", () => {
				const input = {
					version: "v1",
					$schema: 123,
				};

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when $schema is an empty string", () => {
				const input = {
					version: "v1",
					$schema: "",
				};

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should throw error when $schema is null", () => {
				const input = {
					version: "v1",
					$schema: null,
				};

				assertThrows(() => CatalogInitSchema.parse(input));
			});
		});

		await t2.step("type inference", async (t3) => {
			await t3.step("should correctly infer CatalogInit type", () => {
				const input = {
					version: "@gomoqt/v1",
					$schema: "https://schema.example.com",
				};
				const result: CatalogInit = CatalogInitSchema.parse(input);

				assertExists(result["version"]);
				assertExists(result["$schema"]);
			});

			await t3.step("should have optional $schema in inferred type", () => {
				const input = { version: "v1" };
				const result: CatalogInit = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, undefined);
			});
		});

		await t2.step("edge cases", async (t3) => {
			await t3.step("should parse version with special characters", () => {
				const input = { version: "@scope/version-1.0.0-beta" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "@scope/version-1.0.0-beta");
			});

			await t3.step("should parse version with numbers and underscores", () => {
				const input = { version: "v_1_0_0" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "v_1_0_0");
			});

			await t3.step("should parse URL with query parameters", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema.json?version=1&format=json",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(
					result.$schema,
					"https://example.com/schema.json?version=1&format=json",
				);
			});

			await t3.step("should parse URL with fragment identifier", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema.json#definitions",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, "https://example.com/schema.json#definitions");
			});

			await t3.step("should reject additional properties beyond schema", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema.json",
					extraField: "should be ignored or rejected",
				};

				// Zod by default strips unknown properties unless strict mode is enabled
				const result = CatalogInitSchema.parse(input);
				assert(!("extraField" in result));
			});

			await t3.step("should handle version with long string", () => {
				const longVersion = "v" + "x".repeat(1000);
				const input = { version: longVersion };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, longVersion);
			});

			await t3.step("should handle version with whitespace", () => {
				const input = { version: "  v1  " };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "  v1  ");
			});

			await t3.step("should handle version with unicode characters", () => {
				const input = { version: "バージョン1.0" };
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "バージョン1.0");
			});

			await t3.step("should parse URL with unicode in query", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema?name=テスト",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.$schema, "https://example.com/schema?name=テスト");
			});
		});

		await t2.step("strict validation", async (t3) => {
			await t3.step("should parse with both fields present", () => {
				const input = {
					version: "@gomoqt/v1",
					$schema: "https://schema.example.com",
				};
				const result = CatalogInitSchema.parse(input);

				assertEquals(result.version, "@gomoqt/v1");
				assertEquals(result.$schema, "https://schema.example.com");
			});

			await t3.step("should be strict about type requirements", () => {
				const input = {
					version: "v1",
					$schema: true,
				};

				assertThrows(() => CatalogInitSchema.parse(input));
			});

			await t3.step("should be strict about required version field", () => {
				const input = { $schema: "https://example.com" };

				assertThrows(() => CatalogInitSchema.parse(input));
			});
		});

		await t2.step("safe parse (non-throwing validation)", async (t3) => {
			await t3.step("should safely parse valid input", () => {
				const input = {
					version: "v1",
					$schema: "https://example.com/schema.json",
				};
				const result = CatalogInitSchema.safeParse(input);

				assertEquals(result.success, true);
				if (result.success) {
					assertEquals(result.data.version, "v1");
					assertEquals(result.data.$schema, "https://example.com/schema.json");
				}
			});

			await t3.step("should safely fail on invalid input without throwing", () => {
				const input = { version: 123 };
				const result = CatalogInitSchema.safeParse(input);

				assertEquals(result.success, false);
				if (!result.success) {
					assertExists(result.error);
				}
			});

			await t3.step("should provide error information on invalid $schema", () => {
				const input = {
					version: "v1",
					$schema: "not-a-url",
				};
				const result = CatalogInitSchema.safeParse(input);

				assertEquals(result.success, false);
			});
		});
	});
});
