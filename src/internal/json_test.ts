import { z } from 'zod';
import {
    JsonEncoder,
    JsonDecoder,
    JsonLineEncoder,
    JsonLineDecoder,
    EncodedJsonChunk,
    replaceBigInt,
    reviveBigInt,
    replaceDate,
    reviveDate,
    JSON_RULES,
    JsonValueSchema
} from "./json.ts";
import type {
    JsonEncoderConfig,
    JsonDecoderConfig,
    EncodedJsonChunkInit,
    JsonRuleName
} from "./json.ts";
import type { JsonValue } from "./json.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


describe("JsonValueSchema", () => {
    describe("valid values", () => {
        test("accepts string values", () => {
            const result = JsonValueSchema.safeParse("hello");
            assertEquals(result.success, true);
        });

        test("accepts number values", () => {
            const result = JsonValueSchema.safeParse(42);
            assertEquals(result.success, true);
        });

        test("accepts boolean values", () => {
            expect(JsonValueSchema.safeParse(true).success).toBe(true);
            expect(JsonValueSchema.safeParse(false).success).toBe(true);
        });

        test("accepts null values", () => {
            const result = JsonValueSchema.safeParse(null);
            assertEquals(result.success, true);
        });

        test("accepts object values", () => {
            const obj = { name: "test", value: 123 };
            const result = JsonValueSchema.safeParse(obj);
            assertEquals(result.success, true);
        });

        test("accepts array values", () => {
            const arr = [1, "hello", true, null];
            const result = JsonValueSchema.safeParse(arr);
            assertEquals(result.success, true);
        });

        test("accepts nested objects", () => {
            const nested = {
                user: {
                    name: "John",
                    settings: {
                        theme: "dark",
                        notifications: true
                    }
                }
            };
            const result = JsonValueSchema.safeParse(nested);
            assertEquals(result.success, true);
        });

        test("accepts nested arrays", () => {
            const nested = [[1, 2], ["a", "b"], [true, false]];
            const result = JsonValueSchema.safeParse(nested);
            assertEquals(result.success, true);
        });
    });

    describe("invalid values", () => {
        test("rejects undefined", () => {
            const result = JsonValueSchema.safeParse(undefined);
            assertEquals(result.success, false);
        });

        test("rejects functions", () => {
            const result = JsonValueSchema.safeParse(() => {});
            assertEquals(result.success, false);
        });

        test("rejects symbols", () => {
            const result = JsonValueSchema.safeParse(Symbol("test"));
            assertEquals(result.success, false);
        });
    });
});

describe("Type Definitions", () => {
    test("JsonValue type accepts all JSON-compatible values", () => {
        // These should compile without TypeScript errors
        const stringValue: JsonValue = "hello";
        const numberValue: JsonValue = 42;
        const booleanValue: JsonValue = true;
        const nullValue: JsonValue = null;
        const objectValue: JsonValue = { key: "value" };
        const arrayValue: JsonValue = [1, 2, 3];

        assertEquals(typeof stringValue, "string");
        assertEquals(typeof numberValue, "number");
        assertEquals(typeof booleanValue, "boolean");
        assertEquals(nullValue, null);
        assertEquals(typeof objectValue, "object");
        expect(Array.isArray(arrayValue)).toBe(true);
    });
});

describe("Boundary Value Tests", () => {
    test("handles deeply nested objects", () => {
        const createNestedObject = (depth: number): any => {
            if (depth === 0) return "value";
            return { nested: createNestedObject(depth - 1) };
        };

        const deepObject = createNestedObject(100);
        const result = JsonValueSchema.safeParse(deepObject);
        assertEquals(result.success, true);
    });

    test("handles large arrays", () => {
        const largeArray = new Array(1000).fill(0).map((_, i) => i);
        const result = JsonValueSchema.safeParse(largeArray);
        assertEquals(result.success, true);
    });

    test("handles special characters in values", () => {
        const specialChars = {
            unicode: "🎉🚀⭐",
            newlines: "line1\nline2\r\nline3",
            tabs: "col1\tcol2\tcol3",
            quotes: 'He said "Hello" to me',
            backslashes: "C:\\Users\\test\\file.txt"
        };
        const result = JsonValueSchema.safeParse(specialChars);
        assertEquals(result.success, true);
    });

    test("handles valid numeric edge cases", () => {
        const numbers = {
            zero: 0,
            negative: -123,
            decimal: 123.456,
            scientific: 1.23e-10,
            maxSafe: Number.MAX_SAFE_INTEGER,
            minSafe: Number.MIN_SAFE_INTEGER
        };
        const result = JsonValueSchema.safeParse(numbers);
        assertEquals(result.success, true);
    });

    test("rejects invalid numeric values (infinity, NaN)", () => {
        // JSON doesn't support Infinity or NaN
        const invalidNumbers = [
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            NaN
        ];
        
        invalidNumbers.forEach(num => {
            const result = JsonValueSchema.safeParse(num);
            assertEquals(result.success, false);
        });
    });
});

describe("JsonEncoder", () => {
    describe("constructor", () => {
        test("creates encoder", () => {
            const encoder = new JsonEncoder();
            assertExists(encoder);
        });
    });

    describe("configure", () => {
        test("configures encoder with space setting", () => {
            const encoder = new JsonEncoder();
            const config: JsonEncoderConfig = {
                space: 2
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });

        test("configures encoder with replacer rules", () => {
            const encoder = new JsonEncoder();
            const config: JsonEncoderConfig = {
                replacer: ["bigint", "date"]
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });

        test("configures encoder with both space and replacer", () => {
            const encoder = new JsonEncoder();
            const config: JsonEncoderConfig = {
                space: 4,
                replacer: ["bigint"]
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });
    });

    describe("encode", () => {
        test("encodes simple JSON value", () => {
            const encoder = new JsonEncoder();

            const value: JsonValue = { test: "value" };
            const chunk = encoder.encode([value]);

            assert(chunk instanceof EncodedJsonChunk);
            assertEquals(chunk.data.constructor.name, 'Uint8Array');
        });

        test("encodes with bigint replacer", () => {
            const encoder = new JsonEncoder();
            encoder.configure({ replacer: ["bigint"] });

            const value = { bigNumber: BigInt(123456789) };
            const chunk = encoder.encode([value]);

            assert(chunk instanceof EncodedJsonChunk);
            
            // Decode the chunk to verify bigint was converted to string
            const decoded = new TextDecoder().decode(chunk.data);
            const parsed = JSON.parse(decoded);
            assertEquals(parsed[0].bigNumber, "123456789");
        });

        test("encodes with space formatting", () => {
            const encoder = new JsonEncoder();
            encoder.configure({ space: 2 });

            const values = [{ name: "test", nested: { value: 123 } }];
            const chunk = encoder.encode(values);

            const decoded = new TextDecoder().decode(chunk.data);
            const parsed = JSON.parse(decoded);

            // Verify the structure is correct
            assertEquals(parsed[0].name, "test");
            assertEquals(parsed[0].nested.value, 123);

            // Verify formatting was applied (contains newlines and spaces)
            assert(decoded.includes('\n'));
            assert(decoded.includes('  ')); // 2-space indentation
        });

        test("encodes with tab formatting", () => {
            const encoder = new JsonEncoder();
            encoder.configure({ space: '\t' });

            const values = [{ level1: { level2: "deep" } }];
            const chunk = encoder.encode(values);

            const decoded = new TextDecoder().decode(chunk.data);
            const parsed = JSON.parse(decoded);

            assertEquals(parsed[0].level1.level2, "deep");
            assert(decoded.includes('\n\t')); // tab indentation
        });

describe("JsonDecoder", () => {
    describe("constructor", () => {
        test("creates decoder", () => {
            const decoder = new JsonDecoder();
            assertExists(decoder);
        });
    });

    describe("configure", () => {
        test("configures decoder with reviver rules", () => {
            const decoder = new JsonDecoder();
            const config: JsonDecoderConfig = {
                reviverRules: ["bigint", "date"]
            };

            expect(() => decoder.configure(config)).not.toThrow();
        });

        test("configures decoder with empty reviver rules", () => {
            const decoder = new JsonDecoder();
            const config: JsonDecoderConfig = {
                reviverRules: []
            };

            expect(() => decoder.configure(config)).not.toThrow();
        });
    });

    describe("decode", () => {
        test("decodes simple JSON chunk", () => {
            const decoder = new JsonDecoder();

            const jsonString = JSON.stringify([{ test: "value" }]);
            const data = new TextEncoder().encode(jsonString);
            const chunk = new EncodedJsonChunk({ data, type: "json" });

            const result = decoder.decode(chunk);

            assertEquals(result, [{ test: "value" }]);
        });

        test("decodes JSON patch array", () => {
            const decoder = new JsonDecoder();

            const patch = [[{ op: "add", path: "/test", value: "value" }]];
            const jsonString = JSON.stringify(patch);
            const data = new TextEncoder().encode(jsonString);
            const chunk = new EncodedJsonChunk({ data, type: "json" });

            const result = decoder.decode(chunk);

            assertEquals(result, patch);
        });

        test("decodes with bigint reviver", () => {
            const decoder = new JsonDecoder();
            decoder.configure({ reviverRules: ["bigint"] });

            const jsonString = JSON.stringify([{ bigNumber: "123456789" }]);
            const data = new TextEncoder().encode(jsonString);
            const chunk = new EncodedJsonChunk({ data, type: "json" });

            const result = decoder.decode(chunk);

            assertEquals(result, [{ bigNumber: 123456789n }]);
        });
        //         timestamp: Date.now()
        //     });

        //     decoder.decode(chunk);

        //     expect(outputSpy).toHaveBeenCalledTimes(1);
        //     const [result] = outputSpy.mock.calls[0];
        //     assertEquals(result.bigNumber, 123456789n);
        // });

        test("decodes with date reviver", () => {
            const decoder = new JsonDecoder();
            decoder.configure({ reviverRules: ["date"] });

            const jsonString = JSON.stringify([{ createdAt: "2023-01-01T00:00:00.000Z" }]);
            const data = new TextEncoder().encode(jsonString);
            const chunk = new EncodedJsonChunk({ type: "json", data });

            const result = decoder.decode(chunk);

            assert(result !== null);
            if (result && Array.isArray(result) && result[0] && typeof result[0] === "object" && "createdAt" in result[0]) {
                assert(result[0].createdAt instanceof Date);
            } else {
                throw new Error("Decoded result does not have a createdAt property");
            }
            expect(result && result[0] && (result[0].createdAt as Date).toISOString()).toBe("2023-01-01T00:00:00.000Z");
        });

        test("handles invalid JSON gracefully", () => {
            const decoder = new JsonDecoder();

            const invalidJson = "{ invalid json";
            const data = new TextEncoder().encode(invalidJson);
            const chunk = new EncodedJsonChunk({ type: "json", data });

            expect(() => decoder.decode(chunk)).toThrow();
        });

        test("handles non-Error exceptions", () => {
            // Mock JSON.parse to throw a string instead of Error
            const originalParse = JSON.parse;
            JSON.parse = undefined /* TODO: Convert mock */.mockImplementation(() => {
                throw "String error";
            });

            const decoder = new JsonDecoder();

            const data = new TextEncoder().encode("{}");
            const chunk = new EncodedJsonChunk({ type: "json", data });

            expect(() => decoder.decode(chunk)).toThrow();

            // Restore original JSON.parse
            JSON.parse = originalParse;
        });

    });
});

describe("EncodedJsonChunk", () => {
    describe("constructor", () => {
        test("creates chunk with json type", () => {
            const data = new Uint8Array([1, 2, 3]);
            const chunk = new EncodedJsonChunk({ type: "json", data });

            assertEquals(chunk.type, "json");
            assertEquals(chunk.data, new Uint8Array([1, 2, 3]));
        });

        test("creates chunk with jsonl type", () => {
            const data = new Uint8Array([4, 5, 6]);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            assertEquals(chunk.type, "jsonl");
            assertEquals(chunk.data, new Uint8Array([4, 5, 6]));
        });

        test("creates chunk with empty data", () => {
            const data = new Uint8Array(0);
            const chunk = new EncodedJsonChunk({ type: "json", data });

            assertEquals(chunk.type, "json");
            assertEquals(chunk.data, new Uint8Array(0));
        });
    });

    describe("byteLength", () => {
        test("returns correct byte length", () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const chunk = new EncodedJsonChunk({ type: "json", data });

            assertEquals(chunk.byteLength, 5);
        });

        test("returns zero for empty data", () => {
            const chunk = new EncodedJsonChunk({
                type: "json",
                data: new Uint8Array(0)
            });

            assertEquals(chunk.byteLength, 0);
        });
    });

    describe("copyTo", () => {
        test("copies data to target array", () => {
            const sourceData = new Uint8Array([1, 2, 3]);
            const chunk = new EncodedJsonChunk({ type: "json", data: sourceData });

            const target = new Uint8Array(5);
            chunk.copyTo(target);

            expect(target.subarray(0, 3)).toEqual(sourceData);
        });

        test("copies data to exact size target", () => {
            const sourceData = new Uint8Array([1, 2, 3]);
            const chunk = new EncodedJsonChunk({ type: "json", data: sourceData });

            const target = new Uint8Array(3);
            chunk.copyTo(target);

            assertEquals(target, sourceData);
        });
    });
});

describe("JSON Rule Functions", () => {
    describe("replaceBigInt", () => {
        test("converts bigint to string", () => {
            const result = replaceBigInt("key", BigInt(123456789));
            assertEquals(result, "123456789");
        });

        test("leaves non-bigint values unchanged", () => {
            expect(replaceBigInt("key", 123)).toBe(123);
            expect(replaceBigInt("key", "string")).toBe("string");
            expect(replaceBigInt("key", null)).toBe(null);
            expect(replaceBigInt("key", undefined)).toBe(undefined);
        });

        test("handles zero bigint", () => {
            const result = replaceBigInt("key", BigInt(0));
            assertEquals(result, "0");
        });

        test("handles negative bigint", () => {
            const result = replaceBigInt("key", BigInt(-123));
            assertEquals(result, "-123");
        });
    });

    describe("reviveBigInt", () => {
        test("converts numeric string to bigint", () => {
            const result = reviveBigInt("key", "123456789");
            assertEquals(result, BigInt(123456789));
        });

        test("leaves non-numeric strings unchanged", () => {
            expect(reviveBigInt("key", "abc")).toBe("abc");
            expect(reviveBigInt("key", "123abc")).toBe("123abc");
            expect(reviveBigInt("key", "")).toBe("");
        });

        test("leaves non-string values unchanged", () => {
            expect(reviveBigInt("key", 123)).toBe(123);
            expect(reviveBigInt("key", null)).toBe(null);
            expect(reviveBigInt("key", undefined)).toBe(undefined);
        });

        test("handles zero string", () => {
            const result = reviveBigInt("key", "0");
            assertEquals(result, BigInt(0));
        });

        test("handles invalid bigint gracefully", () => {
            // Mock BigInt to throw an error
            const originalBigInt = global.BigInt;
            (global as any).BigInt = undefined /* TODO: Convert mock */.mockImplementation(() => {
                throw new Error("Invalid BigInt");
            });

            const result = reviveBigInt("key", "123");
            assertEquals(result, "123");

            // Restore original BigInt
            global.BigInt = originalBigInt;
        });
    });

    describe("replaceDate", () => {
        test("converts date to ISO string", () => {
            const date = new Date("2023-01-01T00:00:00.000Z");
            const result = replaceDate("key", date);
            assertEquals(result, "2023-01-01T00:00:00.000Z");
        });

        test("leaves non-date values unchanged", () => {
            expect(replaceDate("key", "string")).toBe("string");
            expect(replaceDate("key", 123)).toBe(123);
            expect(replaceDate("key", null)).toBe(null);
        });
    });

    describe("reviveDate", () => {
        test("converts ISO string to date", () => {
            const result = reviveDate("key", "2023-01-01T00:00:00.000Z");
            assert(result instanceof Date);
            expect(result.toISOString()).toBe("2023-01-01T00:00:00.000Z");
        });

        test("leaves invalid date strings unchanged", () => {
            expect(reviveDate("key", "invalid")).toBe("invalid");
            expect(reviveDate("key", "2023-01-01")).toBe("2023-01-01");
        });

        test("leaves non-string values unchanged", () => {
            expect(reviveDate("key", 123)).toBe(123);
            expect(reviveDate("key", null)).toBe(null);
        });

        test("handles invalid date construction gracefully", () => {
            // Mock Date constructor to throw
            const originalDate = global.Date;
            global.Date = undefined /* TODO: Convert mock */.mockImplementation(() => {
                throw new Error("Invalid Date");
            }) as any;

            const result = reviveDate("key", "2023-01-01T00:00:00.000Z");
            assertEquals(result, "2023-01-01T00:00:00.000Z");

            // Restore original Date
            global.Date = originalDate;
        });
    });
});

describe("JSON_RULES", () => {
    test("contains bigint rule", () => {
        assertExists(JSON_RULES.bigint);
        assertEquals(JSON_RULES.bigint.replacer, replaceBigInt);
        assertEquals(JSON_RULES.bigint.reviver, reviveBigInt);
    });

    test("contains date rule", () => {
        assertExists(JSON_RULES.date);
        assertEquals(JSON_RULES.date.replacer, replaceDate);
        assertEquals(JSON_RULES.date.reviver, reviveDate);
    });

    test("has correct rule names", () => {
        const ruleNames: JsonRuleName[] = ["bigint", "date"];
        ruleNames.forEach(name => {
            assertExists(JSON_RULES[name]);
        });
    });
});

describe("Buffer Management Tests", () => {
    test("encoder efficiently reuses buffer for small data", () => {
        const encoder = new JsonEncoder();

        // Encode multiple small objects
        const result1 = encoder.encode([{ test: 1 }]);
        const result2 = encoder.encode([{ test: 2 }]);
        const result3 = encoder.encode([{ test: 3 }]);

        assertExists(result1.data);
        assertExists(result2.data);
        assertExists(result3.data);
    });

    test("encoder expands buffer for large data", () => {
        const encoder = new JsonEncoder();

        // Create a large object that would exceed initial buffer
        const largeObject = {
            data: "x".repeat(2000),
            array: Array(100).fill("large string content")
        };

        const result = encoder.encode([largeObject]);

        assertExists(result.data);
        assert(result.data.byteLength > 1024);
    });
});

describe("Edge Case Tests", () => {
    test("encoder handles empty object", () => {
        const encoder = new JsonEncoder();

        const result = encoder.encode([{}]);

        assertExists(result.data);
        
        const decoded = new TextDecoder().decode(result.data);
        expect(JSON.parse(decoded)).toEqual([{}]);
    });

    test("encoder handles null and primitive values", () => {
        const encoder = new JsonEncoder();

        const result1 = encoder.encode([null]);
        const result2 = encoder.encode(["string"]);
        const result3 = encoder.encode([42]);
        const result4 = encoder.encode([true]);

        assertExists(result1.data);
        assertExists(result2.data);
        assertExists(result3.data);
        assertExists(result4.data);
    });
});

    test("encoder handles nested objects with mixed types", () => {
        const encoder = new JsonEncoder();
        encoder.configure({ replacer: ["bigint", "date"] });

        const complexObject = {
            id: BigInt(123),
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            nested: {
                array: [1, 2, { deep: BigInt(456) }],
                nullValue: null,
                boolValue: true
            }
        };

        const result = encoder.encode([complexObject]);
        
        const decoded = new TextDecoder().decode(result.data);
        const parsed = JSON.parse(decoded);
        assertEquals(parsed[0].id, "123");
        assertEquals(parsed[0].createdAt, "2023-01-01T00:00:00.000Z");
        assertEquals(parsed[0].nested.array[2].deep, "456");
    });

describe("Error Handling Edge Cases", () => {
    test("decoder handles corrupted UTF-8 data", () => {
        const decoder = new JsonDecoder();

        // Create invalid UTF-8 sequence
        const invalidData = new Uint8Array([0xFF, 0xFE, 0xFD]);
        const chunk = new EncodedJsonChunk({ type: "json", data: invalidData });

        expect(() => decoder.decode(chunk)).toThrow();
    });

    test("encoder handles circular references gracefully", () => {
        const encoder = new JsonEncoder();

        const circular: any = { name: "test" };
        circular.self = circular;

        // JSON.stringify should throw for circular references
        // The error will propagate up to the caller
        expect(() => encoder.encode(circular)).toThrow(/Converting circular structure to JSON/);
    });

    test("reviver functions handle edge cases", () => {
        // Test bigint reviver with edge cases
        expect(reviveBigInt("key", "999999999999999999999")).toBe(BigInt("999999999999999999999"));
        expect(reviveBigInt("key", "0")).toBe(BigInt(0));
        expect(reviveBigInt("key", "123.45")).toBe("123.45"); // Not pure digits
        
        // Test date reviver with edge cases  
        expect(reviveDate("key", "2023-12-31T23:59:59.999Z")).toBeInstanceOf(Date);
        expect(reviveDate("key", "2023-01-01T00:00:00.000")).toBe("2023-01-01T00:00:00.000"); // Missing Z
    });
});

describe("Performance and Reliability Tests", () => {
    test("encoder handles many rapid encodes", () => {
        const encoder = new JsonEncoder();

        // Rapidly encode 1000 objects
        const results: any[] = [];
        for (let i = 0; i < 1000; i++) {
            const result = encoder.encode([{ index: i, data: `test-${i}` }]);
            results.push(result);
        }

        assertEquals(results.length, 1000);
        results.forEach(result => {
            assertExists(result.data);
        });
    });

    test("decoder handles many rapid decodes", () => {
        const decoder = new JsonDecoder();

        // Create 100 chunks to decode rapidly
        const results: any[] = [];
        for (let i = 0; i < 100; i++) {
            const jsonString = JSON.stringify([{ index: i }]);
            const data = new TextEncoder().encode(jsonString);
            const chunk = new EncodedJsonChunk({ type: "json", data });
            const result = decoder.decode(chunk);
            results.push(result);
        }

        assertEquals(results.length, 100);
        results.forEach((result, i) => {
            assertEquals(result[0].index, i);
        });
    });

    test("encoder configuration is persistent", () => {
        const encoder = new JsonEncoder();

        encoder.configure({ space: 2, replacer: ["bigint"] });

        // Single encode to test configuration persistence
        const result = encoder.encode([{ value1: BigInt(123), value2: "test" }]);

        const decoded = new TextDecoder().decode(result.data);
        
        // Should have indentation (space=2)
        assert(decoded.includes('\n'));
        assert(decoded.includes('  ')); // Should have 2-space indentation
        
        // Verify the actual structure - bigint should be converted to string
        const parsed = JSON.parse(decoded);
        assertEquals(parsed[0].value1, "123");
        assertEquals(parsed[0].value2, "test");
        assertEquals(typeof parsed[0].value1, "string");
        
        // Test that configuration persists for subsequent encodes
        const result2 = encoder.encode([{ number: BigInt(789) }]);
        const decoded2 = new TextDecoder().decode(result2.data);
        const parsed2 = JSON.parse(decoded2);
        
        assertEquals(parsed2[0].number, "789");
        assertEquals(typeof parsed2[0].number, "string");
        assert(decoded2.includes('\n')); // Still formatted
    });
});

describe("Configuration Combination Tests", () => {
    test("encoder handles multiple replacer rules", () => {
        const encoder = new JsonEncoder();
        encoder.configure({ replacer: ["bigint", "date"] });

        const testData = [
            {
                id: BigInt(123456789),
                createdAt: new Date("2023-01-01T00:00:00.000Z"),
                name: "test",
                count: 42
            }
        ];

        const chunk = encoder.encode(testData);
        const decoded = new TextDecoder().decode(chunk.data);
        const parsed = JSON.parse(decoded);

        assertEquals(parsed[0].id, "123456789");
        assertEquals(parsed[0].createdAt, "2023-01-01T00:00:00.000Z");
        assertEquals(parsed[0].name, "test");
        assertEquals(parsed[0].count, 42);
    });

    test("decoder handles multiple reviver rules", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        encoder.configure({ replacer: ["bigint", "date"] });
        decoder.configure({ reviverRules: ["bigint", "date"] });

        const originalData = [
            {
                id: BigInt(987654321),
                timestamp: new Date("2023-12-31T23:59:59.999Z"),
                active: true
            }
        ];

        const chunk = encoder.encode(originalData);
        const result = decoder.decode(chunk);

        assertEquals(result[0].id, BigInt(987654321));
        assert(result[0].timestamp instanceof Date);
        expect((result[0].timestamp as Date).toISOString()).toBe("2023-12-31T23:59:59.999Z");
        assertEquals(result[0].active, true);
    });

    test("line encoder handles multiple replacer rules", () => {
        const encoder = new JsonLineEncoder();
        encoder.configure({ replacer: ["bigint", "date"], space: 2 });

        const testData = [
            { id: BigInt(111), time: new Date("2023-06-15T12:00:00.000Z") },
            { id: BigInt(222), time: new Date("2023-06-16T13:00:00.000Z") }
        ];

        const chunk = encoder.encode(testData);
        const decoded = new TextDecoder().decode(chunk.data);
        const lines = decoded.trim().split('\n');

        assertEquals(lines.length, 2);
        const first = JSON.parse(lines[0]);
        const second = JSON.parse(lines[1]);

        assertEquals(first.id, "111");
        assertEquals(first.time, "2023-06-15T12:00:00.000Z");
        assertEquals(second.id, "222");
        assertEquals(second.time, "2023-06-16T13:00:00.000Z");
    });

    test("line decoder handles multiple reviver rules", () => {
        const encoder = new JsonLineEncoder();
        const decoder = new JsonLineDecoder();

        encoder.configure({ replacer: ["bigint", "date"] });
        decoder.configure({ reviverRules: ["bigint", "date"] });

        const originalData = [
            { big: BigInt(333), date: new Date("2023-07-01T00:00:00.000Z"), flag: false },
            { big: BigInt(444), date: new Date("2023-07-02T00:00:00.000Z"), flag: true }
        ];

        const chunk = encoder.encode(originalData);
        const result = decoder.decode(chunk);

        assertEquals(result.length, 2);
        const firstResult = result[0] as any;
        const secondResult = result[1] as any;
        assertEquals(firstResult.big, BigInt(333));
        assert(firstResult.date instanceof Date);
        expect(firstResult.date.toISOString()).toBe("2023-07-01T00:00:00.000Z");
        assertEquals(firstResult.flag, false);
        assertEquals(secondResult.big, BigInt(444));
        assert(secondResult.date instanceof Date);
        expect(secondResult.date.toISOString()).toBe("2023-07-02T00:00:00.000Z");
        assertEquals(secondResult.flag, true);
    });
});

describe("Integration Tests", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const testData = { message: "hello", number: 42 };
        const chunk = encoder.encode([testData]);
        const result = decoder.decode(chunk);

        assertEquals(result, [testData]);
    });

    test("encoder and decoder work with bigint rules", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        encoder.configure({ replacer: ["bigint"] });
        decoder.configure({ reviverRules: ["bigint"] });

        const testData = { id: BigInt(123456789), name: "test" };
        const chunk = encoder.encode([testData]);
        const result = decoder.decode(chunk);

        assertEquals(result[0].id, BigInt(123456789));
        assertEquals(result[0].name, "test");
    });

    test("encoder and decoder work with date rules", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        encoder.configure({ replacer: ["date"] });
        decoder.configure({ reviverRules: ["date"] });

        const testDate = new Date("2023-01-01T00:00:00.000Z");
        const testData = { createdAt: testDate, title: "test" };
        const chunk = encoder.encode([testData]);
        const result = decoder.decode(chunk);

        assert(result[0].createdAt instanceof Date);
        expect((result[0].createdAt as Date).toISOString()).toBe("2023-01-01T00:00:00.000Z");
        assertEquals(result[0].title, "test");
    });

    describe("Error handling", () => {
        test("throws error when encoding circular reference", () => {
            const encoder = new JsonEncoder();

            const circular: any = { self: null };
            circular.self = circular;

            expect(() => encoder.encode([circular])).toThrow(TypeError);
        });

        test("throws error when encoding BigInt without replacer", () => {
            const encoder = new JsonEncoder();

            const value = { big: BigInt(123) };

            expect(() => encoder.encode([value])).toThrow(TypeError);
        });
    });
});

describe("Schema Validation Error Tests", () => {
    test("decoder rejects invalid JSON structure", () => {
        const decoder = new JsonDecoder();

        // Create JSON that parses but doesn't match JsonArray schema
        const invalidJson = JSON.stringify("not an array");
        const data = new TextEncoder().encode(invalidJson);
        const chunk = new EncodedJsonChunk({ type: "json", data });

        expect(() => decoder.decode(chunk)).toThrow("Decoded JSON is not a valid JsonArray");
    });

    test("line decoder rejects invalid JSON line", () => {
        const decoder = new JsonLineDecoder();

        const jsonLines = [
            JSON.stringify({ valid: "object" }),
            '{"invalid": json}',  // Invalid JSON
            JSON.stringify({ another: "object" })
        ].join('\n');
        const data = new TextEncoder().encode(jsonLines);
        const chunk = new EncodedJsonChunk({ data, type: "jsonl" });

        expect(() => decoder.decode(chunk)).toThrow("Decoded JSON line is not a valid JsonValue");
    });

    test("line decoder handles mixed valid/invalid lines", () => {
        const decoder = new JsonLineDecoder();

        const jsonLines = [
            JSON.stringify({ first: "valid" }),
            '{"incomplete": ',  // Invalid JSON
            JSON.stringify({ third: "valid" })
        ].join('\n');
        const data = new TextEncoder().encode(jsonLines);
        const chunk = new EncodedJsonChunk({ data, type: "jsonl" });

        expect(() => decoder.decode(chunk)).toThrow("Decoded JSON line is not a valid JsonValue");
    });
});

describe("Dynamic Configuration Tests", () => {
    test("encoder configuration can be changed multiple times", () => {
        const encoder = new JsonEncoder();

        // First configuration
        encoder.configure({ replacer: ["bigint"] });
        const result1 = encoder.encode([{ value: BigInt(123) }]);
        const decoded1 = new TextDecoder().decode(result1.data);
        expect(JSON.parse(decoded1)[0].value).toBe("123");

        // Change configuration
        encoder.configure({ replacer: [] }); // No replacers
        const result2 = encoder.encode([{ value: BigInt(456) }]);
        const decoded2 = new TextDecoder().decode(result2.data);
        expect(() => JSON.parse(decoded2)).toThrow(); // BigInt should cause error

        // Change to different replacer
        encoder.configure({ replacer: ["date"] });
        const result3 = encoder.encode([{ time: new Date("2023-01-01T00:00:00.000Z") }]);
        const decoded3 = new TextDecoder().decode(result3.data);
        expect(JSON.parse(decoded3)[0].time).toBe("2023-01-01T00:00:00.000Z");
    });

    test("decoder configuration can be changed multiple times", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        // Encode with both rules
        encoder.configure({ replacer: ["bigint", "date"] });
        const original = [{ id: BigInt(789), time: new Date("2023-01-01T00:00:00.000Z") }];
        const chunk = encoder.encode(original);

        // First decode with both revivers
        decoder.configure({ reviverRules: ["bigint", "date"] });
        const result1 = decoder.decode(chunk);
        assertEquals(result1[0].id, BigInt(789));
        assert(result1[0].time instanceof Date);

        // Change to only bigint reviver
        decoder.configure({ reviverRules: ["bigint"] });
        const result2 = decoder.decode(chunk);
        assertEquals(result2[0].id, BigInt(789));
        assertEquals(result2[0].time, "2023-01-01T00:00:00.000Z"); // String, not Date

        // Change to only date reviver
        decoder.configure({ reviverRules: ["date"] });
        const result3 = decoder.decode(chunk);
        assertEquals(typeof result3[0].id, "string"); // "789", not BigInt
        assert(result3[0].time instanceof Date);
    });
});

describe("Complex Data Structure Tests", () => {
    test("handles deeply nested structures", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const nestedData = [{
            level1: {
                level2: {
                    level3: {
                        value: "deep",
                        number: 42,
                        array: [1, 2, { nested: true }]
                    }
                },
                list: [
                    { id: 1, data: [1, 2, 3] },
                    { id: 2, data: [4, 5, 6] }
                ]
            }
        }];

        const chunk = encoder.encode(nestedData);
        const result = decoder.decode(chunk);

        assertEquals(result[0].level1.level2.level3.value, "deep");
        assertEquals(result[0].level1.level2.level3.number, 42);
        assertEquals(result[0].level1.level2.level3.array, [1, 2, { nested: true }]);
        assertEquals(result[0].level1.list.length, 2);
        assertEquals(result[0].level1.list[0].data, [1, 2, 3]);
    });

    test("handles arrays with mixed types", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const mixedArray = [{
            mixed: [
                "string",
                42,
                true,
                null,
                { object: "in array" },
                [1, 2, 3]
            ]
        }];

        const chunk = encoder.encode(mixedArray);
        const result = decoder.decode(chunk);

        assertEquals(result[0].mixed.length, 6);
        assertEquals(result[0].mixed[0], "string");
        assertEquals(result[0].mixed[1], 42);
        assertEquals(result[0].mixed[2], true);
        assertEquals(result[0].mixed[3], null);
        assertEquals(result[0].mixed[4], { object: "in array" });
        assertEquals(result[0].mixed[5], [1, 2, 3]);
    });

    test("handles empty arrays and objects", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const emptyStructures = [{
            emptyArray: [],
            emptyObject: {},
            nestedEmpty: {
                arr: [],
                obj: {}
            }
        }];

        const chunk = encoder.encode(emptyStructures);
        const result = decoder.decode(chunk);

        assertEquals(result[0].emptyArray, []);
        assertEquals(result[0].emptyObject, {});
        assertEquals(result[0].nestedEmpty.arr, []);
        assertEquals(result[0].nestedEmpty.obj, {});
    });
});

describe("Unicode and Special Character Tests", () => {
    test("handles unicode characters", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const unicodeData = [{
            emoji: "🚀⭐🎉",
            japanese: "こんにちは世界",
            arabic: "مرحبا بالعالم",
            mixed: "Hello 世界 🌍"
        }];

        const chunk = encoder.encode(unicodeData);
        const result = decoder.decode(chunk);

        assertEquals(result[0].emoji, "🚀⭐🎉");
        assertEquals(result[0].japanese, "こんにちは世界");
        assertEquals(result[0].arabic, "مرحبا بالعالم");
        assertEquals(result[0].mixed, "Hello 世界 🌍");
    });

    test("handles special characters and escape sequences", () => {
        const encoder = new JsonEncoder();
        const decoder = new JsonDecoder();

        const specialData = [{
            quotes: 'She said "Hello" to me',
            backslash: "Path: C:\\Users\\file.txt",
            newline: "Line 1\nLine 2",
            tab: "Col1\tCol2\tCol3",
            unicodeEscape: "Unicode: \u0041\u0042\u0043"
        }];

        const chunk = encoder.encode(specialData);
        const result = decoder.decode(chunk);

        assertEquals(result[0].quotes, 'She said "Hello" to me');
        assertEquals(result[0].backslash, "Path: C:\\Users\\file.txt");
        assertEquals(result[0].newline, "Line 1\nLine 2");
        assertEquals(result[0].tab, "Col1\tCol2\tCol3");
        assertEquals(result[0].unicodeEscape, "Unicode: ABC");
    });
});
  test('replaceBigInt converts bigint to string', () => {
    expect(replaceBigInt('k', 123n)).toBe('123');
    expect(replaceBigInt('k', 1)).toBe(1);
  });

  test('reviveBigInt converts numeric strings to BigInt', () => {
    expect(reviveBigInt('k', '456')).toBe(456n);
    // non-numeric strings remain as-is
    expect(reviveBigInt('k', '12a')).toBe('12a');
  });

  test('replaceDate converts Date to ISO string', () => {
    const d = new Date('2020-01-02T03:04:05.678Z');
    expect(replaceDate('k', d)).toBe('2020-01-02T03:04:05.678Z');
    expect(replaceDate('k', 'str')).toBe('str');
  });

  test('reviveDate converts ISO string to Date', () => {
    const iso = '2020-01-02T03:04:05.678Z';
    const res = reviveDate('k', iso);
    assert(res instanceof Date);
    expect((res as Date).toISOString()).toBe(iso);

    expect(reviveDate('k', 'not-a-date')).toBe('not-a-date');
  });
});

describe("JsonLineEncoder", () => {
    describe("constructor", () => {
        test("creates encoder", () => {
            const encoder = new JsonLineEncoder();
            assertExists(encoder);
        });
    });

    describe("configure", () => {
        test("configures encoder with space setting", () => {
            const encoder = new JsonLineEncoder();
            const config: JsonEncoderConfig = {
                space: 2
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });

        test("configures encoder with replacer rules", () => {
            const encoder = new JsonLineEncoder();
            const config: JsonEncoderConfig = {
                replacer: ["bigint", "date"]
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });

        test("configures encoder with both space and replacer", () => {
            const encoder = new JsonLineEncoder();
            const config: JsonEncoderConfig = {
                space: 4,
                replacer: ["bigint"]
            };

            expect(() => encoder.configure(config)).not.toThrow();
        });
    });

    describe("encode", () => {
        test("encodes multiple JSON values as lines", () => {
            const encoder = new JsonLineEncoder();

            const values: JsonValue[] = [
                { test: "value1" },
                { test: "value2" },
                { number: 42 }
            ];
            const chunk = encoder.encode(values);

            assert(chunk instanceof EncodedJsonChunk);
            assertEquals(chunk.data.constructor.name, 'Uint8Array');
            
            // Decode and verify it's line-separated JSON
            const decoded = new TextDecoder().decode(chunk.data);
            const lines = decoded.trim().split('\n');
            assertEquals(lines.length, 3);
            expect(JSON.parse(lines[0])).toEqual({ test: "value1" });
            expect(JSON.parse(lines[1])).toEqual({ test: "value2" });
            expect(JSON.parse(lines[2])).toEqual({ number: 42 });
        });

        test("encodes with bigint replacer", () => {
            const encoder = new JsonLineEncoder();
            encoder.configure({ replacer: ["bigint"] });

            const values = [
                { bigNumber: BigInt(123456789) },
                { another: BigInt(987654321) }
            ];
            const chunk = encoder.encode(values);

            assert(chunk instanceof EncodedJsonChunk);
            
            // Decode the chunk to verify bigint was converted to string
            const decoded = new TextDecoder().decode(chunk.data);
            const lines = decoded.trim().split('\n');
            assertEquals(lines.length, 2);
            expect(JSON.parse(lines[0]).bigNumber).toBe("123456789");
            expect(JSON.parse(lines[1]).another).toBe("987654321");
        });

        test("encodes with date replacer", () => {
            const encoder = new JsonLineEncoder();
            encoder.configure({ replacer: ["date"] });

            const testDate = new Date("2023-01-01T00:00:00.000Z");
            const values = [
                { createdAt: testDate },
                { updatedAt: testDate }
            ];
            const chunk = encoder.encode(values);

            assert(chunk instanceof EncodedJsonChunk);
            
            // Decode the chunk to verify date was converted to ISO string
            const decoded = new TextDecoder().decode(chunk.data);
            const lines = decoded.trim().split('\n');
            assertEquals(lines.length, 2);
            expect(JSON.parse(lines[0]).createdAt).toBe("2023-01-01T00:00:00.000Z");
            expect(JSON.parse(lines[1]).updatedAt).toBe("2023-01-01T00:00:00.000Z");
        });

        test("encodes with space formatting", () => {
            const encoder = new JsonLineEncoder();
            encoder.configure({ space: 2 });

            const values = [
                { name: "test", nested: { value: 123 } }
            ];

            const chunk = encoder.encode(values);
            const decoded = new TextDecoder().decode(chunk.data);
            const lines = decoded.trim().split('\n');

            assertEquals(lines.length, 1);
            // Should contain indentation
            assert(lines[0].includes('\n  '));
            assert(lines[0].includes('    ')); // nested indentation
        });

        test("encodes with tab formatting", () => {
            const encoder = new JsonLineEncoder();
            encoder.configure({ space: '\t' });

            const values = [
                { level1: { level2: "deep" } }
            ];

            const chunk = encoder.encode(values);
            const decoded = new TextDecoder().decode(chunk.data);
            const lines = decoded.trim().split('\n');

            assertEquals(lines.length, 1);
            assert(lines[0].includes('\n\t'));
            assert(lines[0].includes('\t\t')); // nested tabs
        });
    });
});
describe("JsonLineDecoder", () => {
    describe("constructor", () => {
        test("creates decoder", () => {
            const decoder = new JsonLineDecoder();
            assertExists(decoder);
        });
    });

    describe("configure", () => {
        test("configures decoder with reviver rules", () => {
            const decoder = new JsonLineDecoder();
            const config: JsonDecoderConfig = {
                reviverRules: ["bigint", "date"]
            };

            expect(() => decoder.configure(config)).not.toThrow();
        });

        test("configures decoder with empty reviver rules", () => {
            const decoder = new JsonLineDecoder();
            const config: JsonDecoderConfig = {
                reviverRules: []
            };

            expect(() => decoder.configure(config)).not.toThrow();
        });
    });

    describe("decode", () => {
        test("decodes line-separated JSON values", () => {
            const decoder = new JsonLineDecoder();

            const jsonLines = [
                JSON.stringify({ test: "value1" }),
                JSON.stringify({ test: "value2" }),
                JSON.stringify({ number: 42 })
            ].join('\n');
            const data = new TextEncoder().encode(jsonLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 3);
            assertEquals(result[0], { test: "value1" });
            assertEquals(result[1], { test: "value2" });
            assertEquals(result[2], { number: 42 });
        });

        test("decodes with bigint reviver", () => {
            const decoder = new JsonLineDecoder();
            decoder.configure({ reviverRules: ["bigint"] });

            const jsonLines = [
                JSON.stringify({ bigNumber: "123456789" }),
                JSON.stringify({ another: "987654321" })
            ].join('\n');
            const data = new TextEncoder().encode(jsonLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 2);
            assertEquals(result[0], { bigNumber: 123456789n });
            assertEquals(result[1], { another: 987654321n });
        });

        test("decodes with date reviver", () => {
            const decoder = new JsonLineDecoder();
            decoder.configure({ reviverRules: ["date"] });

            const jsonLines = [
                JSON.stringify({ createdAt: "2023-01-01T00:00:00.000Z" }),
                JSON.stringify({ updatedAt: "2023-12-31T23:59:59.999Z" })
            ].join('\n');
            const data = new TextEncoder().encode(jsonLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 2);
            const firstResult = result[0] as any;
            const secondResult = result[1] as any;
            assert(firstResult.createdAt instanceof Date);
            expect(firstResult.createdAt.toISOString()).toBe("2023-01-01T00:00:00.000Z");
            assert(secondResult.updatedAt instanceof Date);
            expect(secondResult.updatedAt.toISOString()).toBe("2023-12-31T23:59:59.999Z");
        });

        test("handles empty input", () => {
            const decoder = new JsonLineDecoder();

            const data = new TextEncoder().encode("");
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            expect(() => decoder.decode(chunk)).toThrow("No JSON lines found");
        });

        test("handles whitespace-only lines", () => {
            const decoder = new JsonLineDecoder();

            const jsonLines = [
                JSON.stringify({ test: "value1" }),
                "   \t   ",
                JSON.stringify({ test: "value2" })
            ].join('\n');
            const data = new TextEncoder().encode(jsonLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 2);
            assertEquals(result[0], { test: "value1" });
            assertEquals(result[1], { test: "value2" });
        });

        test("throws error for invalid JSON line", () => {
            const decoder = new JsonLineDecoder();

            const jsonLines = [
                JSON.stringify({ test: "value1" }),
                "{ invalid json",
                JSON.stringify({ test: "value2" })
            ].join('\n');
            const data = new TextEncoder().encode(jsonLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            expect(() => decoder.decode(chunk)).toThrow("Decoded JSON line is not a valid JsonValue");
        });

        test("handles formatted JSON lines", () => {
            const decoder = new JsonLineDecoder();

            const formattedJson = `{
  "name": "formatted",
  "nested": {
    "value": 42,
    "array": [1, 2, 3]
  }
}`;
            const data = new TextEncoder().encode(formattedJson);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 1);
            expect((result[0] as any).name).toBe("formatted");
            expect((result[0] as any).nested.value).toBe(42);
            expect((result[0] as any).nested.array).toEqual([1, 2, 3]);
        });

        test("handles multiple formatted lines", () => {
            const decoder = new JsonLineDecoder();

            const formattedLines = `{
                "first": "object",
                "count": 1
                }
                {
                "second": "object",
                "count": 2
                }`;
            const data = new TextEncoder().encode(formattedLines);
            const chunk = new EncodedJsonChunk({ type: "jsonl", data });

            const result = decoder.decode(chunk);

            assertEquals(result.length, 2);
            expect((result[0] as any).first).toBe("object");
            expect((result[0] as any).count).toBe(1);
            expect((result[1] as any).second).toBe("object");
            expect((result[1] as any).count).toBe(2);
        });
    });
});
