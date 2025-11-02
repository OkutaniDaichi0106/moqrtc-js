import { assertEquals, assert } from "@std/assert";
import { EncodeErrorCode, DecodeErrorCode } from "./error.ts";

Deno.test("Error Constants", async (t) => {
    await t.step("EncodeErrorCode", async (t) => {
        await t.step("has correct value", () => {
            assertEquals(EncodeErrorCode, 101);
        });

        await t.step("is a number", () => {
            assertEquals(typeof EncodeErrorCode, "number");
        });

        await t.step("is a positive integer", () => {
            assert(EncodeErrorCode > 0);
            assert(Number.isInteger(EncodeErrorCode));
        });
    });

    await t.step("DecodeErrorCode", async (t) => {
        await t.step("has correct value", () => {
            assertEquals(DecodeErrorCode, 102);
        });

        await t.step("is a number", () => {
            assertEquals(typeof DecodeErrorCode, "number");
        });

        await t.step("is a positive integer", () => {
            assert(DecodeErrorCode > 0);
            assert(Number.isInteger(DecodeErrorCode));
        });
    });

    await t.step("Error Code Relationships", async (t) => {
        await t.step("DecodeErrorCode is greater than EncodeErrorCode", () => {
            assert(DecodeErrorCode > EncodeErrorCode);
        });

        await t.step("error codes are unique", () => {
            assert(EncodeErrorCode !== DecodeErrorCode);
        });

        await t.step("error codes are sequential", () => {
            assertEquals(DecodeErrorCode - EncodeErrorCode, 1);
        });
    });

    await t.step("Error Code Range", async (t) => {
        await t.step("error codes are in expected range", () => {
            assert(EncodeErrorCode >= 100);
            assert(EncodeErrorCode < 200);
            assert(DecodeErrorCode >= 100);
            assert(DecodeErrorCode < 200);
        });
    });

    await t.step("Boundary Value Tests", async (t) => {
        const cases = new Map([
            ["EncodeErrorCode is not zero", { code: EncodeErrorCode, expected: 0, shouldNotEqual: true }],
            ["DecodeErrorCode is not zero", { code: DecodeErrorCode, expected: 0, shouldNotEqual: true }],
        ]);

        for (const [name, c] of cases) {
            await t.step(name, () => {
                assert(c.code !== c.expected);
            });
        }

        await t.step("error codes are not negative", () => {
            assert(EncodeErrorCode >= 0);
            assert(DecodeErrorCode >= 0);
        });

        await t.step("error codes are finite numbers", () => {
            assert(Number.isFinite(EncodeErrorCode));
            assert(Number.isFinite(DecodeErrorCode));
        });

        await t.step("error codes are safe integers", () => {
            assert(Number.isSafeInteger(EncodeErrorCode));
            assert(Number.isSafeInteger(DecodeErrorCode));
        });
    });

    await t.step("Type Compatibility Tests", async (t) => {
        await t.step("EncodeErrorCode is compatible with SubscribeErrorCode type", () => {
            const errorCode: number = EncodeErrorCode;
            assertEquals(errorCode, 101);
        });

        await t.step("DecodeErrorCode is compatible with SubscribeErrorCode type", () => {
            const errorCode: number = DecodeErrorCode;
            assertEquals(errorCode, 102);
        });

        await t.step("error codes can be used in comparisons", () => {
            assertEquals(EncodeErrorCode < DecodeErrorCode, true);
            assertEquals(EncodeErrorCode <= DecodeErrorCode, true);
            assertEquals(DecodeErrorCode > EncodeErrorCode, true);
            assertEquals(DecodeErrorCode >= EncodeErrorCode, true);
        });

        await t.step("error codes can be used in arithmetic operations", () => {
            assertEquals(EncodeErrorCode + 1, DecodeErrorCode);
            assertEquals(DecodeErrorCode - 1, EncodeErrorCode);
            assertEquals(EncodeErrorCode * 2, 202);
            assertEquals(DecodeErrorCode / 2, 51);
        });

        await t.step("error codes can be used as object keys", () => {
            const errorMap = {
                [EncodeErrorCode]: "Encode Error",
                [DecodeErrorCode]: "Decode Error"
            };

            assertEquals(errorMap[101], "Encode Error");
            assertEquals(errorMap[102], "Decode Error");
            assertEquals(errorMap[EncodeErrorCode], "Encode Error");
            assertEquals(errorMap[DecodeErrorCode], "Decode Error");
        });

        await t.step("error codes can be used in switch statements", () => {
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

            assertEquals(getErrorType(EncodeErrorCode), "encode");
            assertEquals(getErrorType(DecodeErrorCode), "decode");
            assertEquals(getErrorType(999), "unknown");
        });
    });

    await t.step("Immutability Tests", async (t) => {
        await t.step("error codes maintain reference equality", () => {
            const encode1 = EncodeErrorCode;
            const encode2 = EncodeErrorCode;
            const decode1 = DecodeErrorCode;
            const decode2 = DecodeErrorCode;

            assertEquals(encode1, encode2);
            assertEquals(decode1, decode2);
            assert(Object.is(encode1, encode2));
            assert(Object.is(decode1, decode2));
        });
    });

    await t.step("String Conversion Tests", async (t) => {
        await t.step("error codes convert to strings correctly", () => {
            assertEquals(String(EncodeErrorCode), "101");
            assertEquals(String(DecodeErrorCode), "102");
            assertEquals(EncodeErrorCode.toString(), "101");
            assertEquals(DecodeErrorCode.toString(), "102");
        });

        await t.step("error codes work with template literals", () => {
            assertEquals(`Error code: ${EncodeErrorCode}`, "Error code: 101");
            assertEquals(`Error code: ${DecodeErrorCode}`, "Error code: 102");
        });

        await t.step("error codes work with JSON serialization", () => {
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

    await t.step("Array and Collection Tests", async (t) => {
        await t.step("error codes work in arrays", () => {
            const errorCodes = [EncodeErrorCode, DecodeErrorCode];
            
            assertEquals(errorCodes.length, 2);
            assertEquals(errorCodes[0], 101);
            assertEquals(errorCodes[1], 102);
            assert(errorCodes.includes(EncodeErrorCode));
            assert(errorCodes.includes(DecodeErrorCode));
        });

        await t.step("error codes work in Sets", () => {
            const errorSet = new Set([EncodeErrorCode, DecodeErrorCode]);
            
            assertEquals(errorSet.size, 2);
            assert(errorSet.has(EncodeErrorCode));
            assert(errorSet.has(DecodeErrorCode));
            assert(!errorSet.has(999));
        });

        await t.step("error codes work in Maps", () => {
            const errorMap = new Map([
                [EncodeErrorCode, "Encoding failed"],
                [DecodeErrorCode, "Decoding failed"]
            ]);

            assertEquals(errorMap.size, 2);
            assertEquals(errorMap.get(EncodeErrorCode), "Encoding failed");
            assertEquals(errorMap.get(DecodeErrorCode), "Decoding failed");
            assert(errorMap.has(EncodeErrorCode));
            assert(errorMap.has(DecodeErrorCode));
        });

        await t.step("error codes can be sorted", () => {
            const unsorted = [DecodeErrorCode, EncodeErrorCode];
            const sorted = unsorted.sort((a, b) => a - b);
            
            assertEquals(sorted[0], EncodeErrorCode);
            assertEquals(sorted[1], DecodeErrorCode);
        });
    });
});
