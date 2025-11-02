import { assertEquals, assert, assertThrows } from "@std/assert";
import { z } from 'zod';
import { ContainerSchema } from './container.ts';

Deno.test('Container', async (t) => {
    await t.step('ContainerSchema', async (t) => {
        await t.step('accepts valid container types', () => {
            const validContainers = ['loc', 'cmaf'];

            validContainers.forEach(container => {
                const result = ContainerSchema.safeParse(container);
                assertEquals(result.success, true);
                if (result.success) {
                    assertEquals(result.data, container);
                }
            });
        });

        await t.step('rejects invalid container types', () => {
            const invalidContainers = [
                'mp4',
                'webm',
                'hls',
                'dash',
                'invalid',
                'LOC', // Case sensitive
                'CMAF', // Case sensitive
                'loc ', // Trailing space
                ' loc', // Leading space
                'loc-cmaf',
                'cmaf-loc'
            ];

            invalidContainers.forEach(container => {
                const result = ContainerSchema.safeParse(container);
                assertEquals(result.success, false);
                if (!result.success) {
                    assert(result.error instanceof z.ZodError);
                    assertEquals(result.error.issues.length, 1);
                    assertEquals(result.error.issues[0].code, 'invalid_value');
                }
            });
        });

        await t.step('rejects non-string values', () => {
            const nonStringValues = [
                123,
                true,
                false,
                null,
                undefined,
                {},
                [],
                Symbol('loc'),
                new Date(),
                /regex/
            ];

            nonStringValues.forEach(value => {
                const result = ContainerSchema.safeParse(value);
                assertEquals(result.success, false);
                if (!result.success) {
                    assert(result.error instanceof z.ZodError);
                    assertEquals(result.error.issues.length, 1);
                    assertEquals(result.error.issues[0].code, 'invalid_value');
                }
            });
        });

        await t.step('provides correct error messages for invalid enum values', () => {
            const result = ContainerSchema.safeParse('invalid');
            assertEquals(result.success, false);
            
            if (!result.success) {
                const issue = result.error.issues[0];
                assertEquals(issue.code, 'invalid_value');
                assert(issue.message.includes('Invalid option'));
                assert(issue.message.includes('"loc"'));
                assert(issue.message.includes('"cmaf"'));
            }
        });

        await t.step('provides correct error messages for wrong types', () => {
            const result = ContainerSchema.safeParse(123);
            assertEquals(result.success, false);
            
            if (!result.success) {
                const issue = result.error.issues[0];
                assertEquals(issue.code, 'invalid_value');
                assert(issue.message.includes('Invalid option'));
                assert(issue.message.includes('"loc"'));
                assert(issue.message.includes('"cmaf"'));
            }
        });

        await t.step('works with parse method for valid values', () => {
            // Should not throw
            ContainerSchema.parse('loc');
            ContainerSchema.parse('cmaf');
            
            assertEquals(ContainerSchema.parse('loc'), 'loc');
            assertEquals(ContainerSchema.parse('cmaf'), 'cmaf');
        });

        await t.step('throws with parse method for invalid values', () => {
            assertThrows(() => ContainerSchema.parse('invalid'), z.ZodError);
            assertThrows(() => ContainerSchema.parse(123), z.ZodError);
            assertThrows(() => ContainerSchema.parse(''), z.ZodError);
        });

        await t.step('schema has correct type definition', () => {
            // Type-level test - this should compile without errors
            const validValue: z.infer<typeof ContainerSchema> = 'loc';
            assertEquals(validValue, 'loc');

            // Should be assignable to string union type
            const containerType: 'loc' | 'cmaf' = ContainerSchema.parse('cmaf');
            assertEquals(containerType, 'cmaf');
        });

        await t.step('schema properties and metadata', () => {
            assert(ContainerSchema instanceof z.ZodEnum);
            // Test enum options indirectly through parsing
            assert(ContainerSchema.options.includes('loc'));
            assert(ContainerSchema.options.includes('cmaf'));
            assertEquals(ContainerSchema.options.length, 2);
        });

        await t.step('handles edge cases', () => {
            // Empty string
            const emptyResult = ContainerSchema.safeParse('');
            assertEquals(emptyResult.success, false);

            // Only whitespace
            const whitespaceResult = ContainerSchema.safeParse('   ');
            assertEquals(whitespaceResult.success, false);

            // Unicode characters
            const unicodeResult = ContainerSchema.safeParse('löc');
            assertEquals(unicodeResult.success, false);
        });

        await t.step('integration with complex objects', () => {
            const testObject = {
                container: 'loc' as const,
                otherField: 'value'
            };

            const containerValue = ContainerSchema.safeParse(testObject.container);
            assertEquals(containerValue.success, true);
            if (containerValue.success) {
                assertEquals(containerValue.data, 'loc');
            }
        });

        await t.step('array of containers validation', () => {
            const containers = ['loc', 'cmaf'];
            const arraySchema = z.array(ContainerSchema);
            
            const result = arraySchema.safeParse(containers);
            assertEquals(result.success, true);
            if (result.success) {
                assertEquals(result.data, ['loc', 'cmaf']);
            }

            // Invalid array
            const invalidResult = arraySchema.safeParse(['loc', 'invalid']);
            assertEquals(invalidResult.success, false);
        });

        await t.step('optional container schema', () => {
            const optionalSchema = ContainerSchema.optional();
            
            assert(optionalSchema.safeParse('loc').success);
            assert(optionalSchema.safeParse('cmaf').success);
            assert(optionalSchema.safeParse(undefined).success);
            assert(!optionalSchema.safeParse('invalid').success);
        });

        await t.step('nullable container schema', () => {
            const nullableSchema = ContainerSchema.nullable();
            
            assert(nullableSchema.safeParse('loc').success);
            assert(nullableSchema.safeParse('cmaf').success);
            assert(nullableSchema.safeParse(null).success);
            assert(!nullableSchema.safeParse('invalid').success);
        });

        await t.step('default value with container schema', () => {
            const schemaWithDefault = ContainerSchema.default('loc');
            
            assertEquals(schemaWithDefault.parse('cmaf'), 'cmaf');
            assertEquals(schemaWithDefault.parse(undefined), 'loc');
        });
    });
});
