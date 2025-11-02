// Mock the external dependencies before importing the module under test
vi.mock("@okutanidaichi/moqt", () => ({}));

import { EncodeErrorCode, DecodeErrorCode } from "./error.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


describe("Error Constants", () => {
    describe("EncodeErrorCode", () => {
        test("has correct value", () => {
            assertEquals(EncodeErrorCode, 101);
        });

        test("is a number", () => {
            assertEquals(typeof EncodeErrorCode, "number");
        });

        test("is a positive integer", () => {
            assert(EncodeErrorCode > 0);
            expect(Number.isInteger(EncodeErrorCode)).toBe(true);
        });
    });

    describe("DecodeErrorCode", () => {
        test("has correct value", () => {
            assertEquals(DecodeErrorCode, 102);
        });

        test("is a number", () => {
            assertEquals(typeof DecodeErrorCode, "number");
        });

        test("is a positive integer", () => {
            assert(DecodeErrorCode > 0);
            expect(Number.isInteger(DecodeErrorCode)).toBe(true);
        });
    });

    describe("Error Code Relationships", () => {
        test("DecodeErrorCode is greater than EncodeErrorCode", () => {
            assert(DecodeErrorCode > EncodeErrorCode);
        });

        test("error codes are unique", () => {
            assert(EncodeErrorCode !== DecodeErrorCode);
        });

        test("error codes are sequential", () => {
            assertEquals(DecodeErrorCode - EncodeErrorCode, 1);
        });
    });

    describe("Error Code Range", () => {
        test("error codes are in expected range", () => {
            expect(EncodeErrorCode).toBeGreaterThanOrEqual(100);
            assert(EncodeErrorCode < 200);
            expect(DecodeErrorCode).toBeGreaterThanOrEqual(100);
            assert(DecodeErrorCode < 200);
        });
    });

    describe("Boundary Value Tests", () => {
        test("EncodeErrorCode is not zero", () => {
            assert(EncodeErrorCode !== 0);
        });

        test("DecodeErrorCode is not zero", () => {
            assert(DecodeErrorCode !== 0);
        });

        test("error codes are not negative", () => {
            expect(EncodeErrorCode).toBeGreaterThanOrEqual(0);
            expect(DecodeErrorCode).toBeGreaterThanOrEqual(0);
        });

        test("error codes are finite numbers", () => {
            expect(Number.isFinite(EncodeErrorCode)).toBe(true);
            expect(Number.isFinite(DecodeErrorCode)).toBe(true);
        });

        test("error codes are safe integers", () => {
            expect(Number.isSafeInteger(EncodeErrorCode)).toBe(true);
            expect(Number.isSafeInteger(DecodeErrorCode)).toBe(true);
        });
    });

    describe("Type Compatibility Tests", () => {
        test("EncodeErrorCode is compatible with SubscribeErrorCode type", () => {
            // TypeScript compilation will catch type issues, but we can test runtime behavior
            const errorCode: number = EncodeErrorCode;
            assertEquals(errorCode, 101);
        });

        test("DecodeErrorCode is compatible with SubscribeErrorCode type", () => {
            const errorCode: number = DecodeErrorCode;
            assertEquals(errorCode, 102);
        });

        test("error codes can be used in comparisons", () => {
            assertEquals(EncodeErrorCode < DecodeErrorCode, true);
            assertEquals(EncodeErrorCode <= DecodeErrorCode, true);
            assertEquals(DecodeErrorCode > EncodeErrorCode, true);
            assertEquals(DecodeErrorCode >= EncodeErrorCode, true);
        });

        test("error codes can be used in arithmetic operations", () => {
            assertEquals(EncodeErrorCode + 1, DecodeErrorCode);
            assertEquals(DecodeErrorCode - 1, EncodeErrorCode);
            assertEquals(EncodeErrorCode * 2, 202);
            assertEquals(DecodeErrorCode / 2, 51);
        });

        test("error codes can be used as object keys", () => {
            const errorMap = {
                [EncodeErrorCode]: "Encode Error",
                [DecodeErrorCode]: "Decode Error"
            };

            assertEquals(errorMap[101], "Encode Error");
            assertEquals(errorMap[102], "Decode Error");
            assertEquals(errorMap[EncodeErrorCode], "Encode Error");
            assertEquals(errorMap[DecodeErrorCode], "Decode Error");
        });

        test("error codes can be used in switch statements", () => {
            const getErrorType = (code: number): string => {
                switch (code) {
                    case EncodeErrorCode:
                        return "encode";
                    case DecodeErrorCode:
                        return "decode";
                    default:
                        return "unknown";
                }
            };

            expect(getErrorType(EncodeErrorCode)).toBe("encode");
            expect(getErrorType(DecodeErrorCode)).toBe("decode");
            expect(getErrorType(999)).toBe("unknown");
        });
    });

    describe("Immutability Tests", () => {
        test("EncodeErrorCode cannot be modified", () => {
            const originalValue = EncodeErrorCode;
            // Attempt to modify (should have no effect due to const)
            expect(() => {
                (global as any).EncodeErrorCode = 999;
            }).not.toThrow();
            
            // Original constant should remain unchanged
            assertEquals(EncodeErrorCode, originalValue);
        });

        test("DecodeErrorCode cannot be modified", () => {
            const originalValue = DecodeErrorCode;
            expect(() => {
                (global as any).DecodeErrorCode = 999;
            }).not.toThrow();
            
            assertEquals(DecodeErrorCode, originalValue);
        });

        test("error codes maintain reference equality", () => {
            const encode1 = EncodeErrorCode;
            const encode2 = EncodeErrorCode;
            const decode1 = DecodeErrorCode;
            const decode2 = DecodeErrorCode;

            assertEquals(encode1, encode2);
            assertEquals(decode1, decode2);
            expect(Object.is(encode1, encode2)).toBe(true);
            expect(Object.is(decode1, decode2)).toBe(true);
        });
    });

    describe("String Conversion Tests", () => {
        test("error codes convert to strings correctly", () => {
            expect(String(EncodeErrorCode)).toBe("101");
            expect(String(DecodeErrorCode)).toBe("102");
            expect(EncodeErrorCode.toString()).toBe("101");
            expect(DecodeErrorCode.toString()).toBe("102");
        });

        test("error codes work with template literals", () => {
            assertEquals(`Error code: ${EncodeErrorCode}`, "Error code: 101");
            assertEquals(`Error code: ${DecodeErrorCode}`, "Error code: 102");
        });

        test("error codes work with JSON serialization", () => {
            const errorData = {
                encodeError: EncodeErrorCode,
                decodeError: DecodeErrorCode
            };

            const jsonString = JSON.stringify(errorData);
            const parsed = JSON.parse(jsonString);

            assertEquals(parsed.encodeError, 101);
            assertEquals(parsed.decodeError, 102);
        });
    });

    describe("Array and Collection Tests", () => {
        test("error codes work in arrays", () => {
            const errorCodes = [EncodeErrorCode, DecodeErrorCode];
            
            assertEquals(errorCodes.length, 2);
            assertEquals(errorCodes[0], 101);
            assertEquals(errorCodes[1], 102);
            expect(errorCodes.includes(EncodeErrorCode)).toBe(true);
            expect(errorCodes.includes(DecodeErrorCode)).toBe(true);
        });

        test("error codes work in Sets", () => {
            const errorSet = new Set([EncodeErrorCode, DecodeErrorCode]);
            
            assertEquals(errorSet.size, 2);
            expect(errorSet.has(EncodeErrorCode)).toBe(true);
            expect(errorSet.has(DecodeErrorCode)).toBe(true);
            expect(errorSet.has(999)).toBe(false);
        });

        test("error codes work in Maps", () => {
            const errorMap = new Map([
                [EncodeErrorCode, "Encoding failed"],
                [DecodeErrorCode, "Decoding failed"]
            ]);

            assertEquals(errorMap.size, 2);
            expect(errorMap.get(EncodeErrorCode)).toBe("Encoding failed");
            expect(errorMap.get(DecodeErrorCode)).toBe("Decoding failed");
            expect(errorMap.has(EncodeErrorCode)).toBe(true);
            expect(errorMap.has(DecodeErrorCode)).toBe(true);
        });

        test("error codes can be sorted", () => {
            const unsorted = [DecodeErrorCode, EncodeErrorCode];
            const sorted = unsorted.sort((a, b) => a - b);
            
            assertEquals(sorted[0], EncodeErrorCode);
            assertEquals(sorted[1], DecodeErrorCode);
        });
    });
});
