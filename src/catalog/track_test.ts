import { z } from 'zod';
import { TrackDescriptorSchema, TrackDescriptor } from './track.ts';
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


describe('Track', () => {
    describe('TrackSchema', () => {
        test('accepts valid track objects', () => {
            const validTracks = [
                {
                    name: 'video',
                    priority: 0,
                    schema: 'video-schema',
                    config: {}
                },
                {
                    name: 'audio',
                    description: 'Main audio track',
                    priority: 255,
                    schema: 'https://example.com/audio-schema.json',
                    config: { codec: 'aac', bitrate: 128 }
                },
                {
                    name: 'subtitle',
                    description: 'Japanese subtitles',
                    priority: 100,
                    schema: '/path/to/subtitle-schema',
                    config: { language: 'ja', format: 'vtt' },
                    dependencies: ['video']
                },
                {
                    name: 'complex-track',
                    description: 'A track with complex dependencies',
                    priority: 50,
                    schema: 'complex-schema',
                    config: {
                        nested: { deep: { value: 42 } },
                        array: [1, 2, 3],
                        boolean: true,
                        null_value: null
                    },
                    dependencies: ['video', 'audio', 'metadata']
                }
            ];

            validTracks.forEach(track => {
                const result = TrackDescriptorSchema.safeParse(track);
                assertEquals(result.success, true);
                if (result.success) {
                    assertEquals(result.data, track);
                }
            });
        });

        test('validates required fields', () => {
            const requiredFields = ['name', 'priority', 'schema', 'config'];
            
            requiredFields.forEach(field => {
                const baseTrack = {
                    name: 'test',
                    priority: 0,
                    schema: 'test-schema',
                    config: {}
                };
                
                const invalidTrack = { ...baseTrack };
                delete invalidTrack[field as keyof typeof invalidTrack];
                
                const result = TrackDescriptorSchema.safeParse(invalidTrack);
                assertEquals(result.success, false);
                
                if (!result.success) {
                    expect(result.error.issues.some(issue => 
                        issue.path.includes(field)
                    )).toBe(true);
                }
            });
        });

        test('validates name field', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Empty string should fail
            const emptyNameResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                name: ''
            });
            assertEquals(emptyNameResult.success, false);

            // Non-string should fail
            const nonStringNameResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                name: 123
            });
            assertEquals(nonStringNameResult.success, false);

            // Valid strings should pass
            const validNames = ['a', 'track-name', 'track_name', 'Track Name', '日本語'];
            validNames.forEach(name => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    name
                });
                assertEquals(result.success, true);
            });
        });

        test('validates description field', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Description is optional
            const noDescriptionResult = TrackDescriptorSchema.safeParse(baseTrack);
            assertEquals(noDescriptionResult.success, true);

            // Valid descriptions
            const validDescriptions = [
                '',
                'Short description',
                'A'.repeat(500), // Exactly 500 characters
                'Unicode 描述 🎵'
            ];

            validDescriptions.forEach(description => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    description
                });
                assertEquals(result.success, true);
            });

            // Too long description should fail
            const tooLongDescriptionResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                description: 'A'.repeat(501) // 501 characters
            });
            assertEquals(tooLongDescriptionResult.success, false);

            // Non-string description should fail
            const nonStringDescriptionResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                description: 123
            });
            assertEquals(nonStringDescriptionResult.success, false);
        });

        test('validates priority field using uint8Schema', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Valid uint8 values (0-255)
            const validPriorities = [0, 1, 127, 128, 255];
            validPriorities.forEach(priority => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    priority
                });
                assertEquals(result.success, true);
            });

            // Invalid values
            const invalidPriorities = [-1, 256, 1000, 3.14, '100', null, undefined];
            invalidPriorities.forEach(priority => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    priority
                });
                assertEquals(result.success, false);
            });
        });

        test('validates schema field', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Empty string should fail
            const emptySchemaResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                schema: ''
            });
            assertEquals(emptySchemaResult.success, false);

            // Non-string should fail
            const nonStringSchemaResult = TrackDescriptorSchema.safeParse({
                ...baseTrack,
                schema: 123
            });
            assertEquals(nonStringSchemaResult.success, false);

            // Valid schemas
            const validSchemas = [
                'schema-name',
                'https://example.com/schema.json',
                '/path/to/schema',
                'urn:schema:example',
                'schema_with_underscores',
                '日本語スキーマ'
            ];

            validSchemas.forEach(schema => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    schema
                });
                assertEquals(result.success, true);
            });
        });

        test('validates config field', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Config is required
            const noConfigResult = TrackDescriptorSchema.safeParse({
                name: 'test',
                priority: 0,
                schema: 'test-schema'
            });
            assertEquals(noConfigResult.success, false);

            // Non-object config should fail
            const nonObjectConfigs = [null, 'string', 123, [], true];
            nonObjectConfigs.forEach(config => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    config
                });
                assertEquals(result.success, false);
            });

            // Various valid configs (catchall allows any properties)
            const validConfigs = [
                {},
                { codec: 'h264' },
                { a: 1, b: 'string', c: true, d: null },
                { nested: { object: { deep: 'value' } } },
                { array: [1, 2, 3], mixed: { types: true } },
                { unicode: '日本語', emoji: '🎵' }
            ];

            validConfigs.forEach(config => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    config
                });
                assertEquals(result.success, true);
            });
        });

        test('validates dependencies field', () => {
            const baseTrack = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {}
            };

            // Dependencies is optional
            const noDependenciesResult = TrackDescriptorSchema.safeParse(baseTrack);
            assertEquals(noDependenciesResult.success, true);

            // Valid dependencies arrays
            const validDependencies = [
                [],
                ['video'],
                ['video', 'audio'],
                ['track1', 'track2', 'track3'],
                ['track_with_underscores', 'track-with-dashes'],
                ['日本語トラック']
            ];

            validDependencies.forEach(dependencies => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    dependencies
                });
                assertEquals(result.success, true);
            });

            // Invalid dependencies
            const invalidDependencies = [
                'string', // Should be array
                123, // Should be array
                [''], // Empty strings not allowed
                [123], // Numbers not allowed
                [null], // Null not allowed
                ['valid', ''], // Mixed valid/invalid
                ['valid', 123] // Mixed valid/invalid
            ];

            invalidDependencies.forEach(dependencies => {
                const result = TrackDescriptorSchema.safeParse({
                    ...baseTrack,
                    dependencies
                });
                assertEquals(result.success, false);
            });
        });

        test('works with parse method for valid values', () => {
            const validTrack = {
                name: 'test-track',
                description: 'Test track description',
                priority: 100,
                schema: 'test-schema',
                config: { key: 'value' },
                dependencies: ['parent-track']
            };

            expect(() => TrackDescriptorSchema.parse(validTrack)).not.toThrow();
            const parsed = TrackDescriptorSchema.parse(validTrack);
            assertEquals(parsed, validTrack);
        });

        test('throws with parse method for invalid values', () => {
            const invalidTracks = [
                {}, // Missing required fields
                { name: '', priority: 0, schema: 'test', config: {} }, // Empty name
                { name: 'test', priority: -1, schema: 'test', config: {} }, // Invalid priority
                { name: 'test', priority: 0, schema: '', config: {} }, // Empty schema
                { name: 'test', priority: 0, schema: 'test' } // Missing config
            ];

            invalidTracks.forEach(track => {
                expect(() => TrackDescriptorSchema.parse(track)).toThrow(z.ZodError);
            });
        });

        test('schema has correct type definition', () => {
            // Type checking - this should compile without errors
            const track: TrackDescriptor = {
                name: 'test',
                // priority: 0,
                schema: 'test-schema',
                config: {}
            };

            assertEquals(typeof track.name, 'string');
            // assertEquals(typeof track.priority, 'number');
            assertEquals(typeof track.schema, 'string');
            assertEquals(typeof track.config, 'object');
        });

        test('integration with complex nested structures', () => {
            const complexTrack = {
                name: 'multimedia-track',
                description: 'Complex multimedia track with all features',
                priority: 200,
                schema: 'https://schemas.example.com/multimedia/v2.json',
                config: {
                    video: {
                        codec: 'h264',
                        bitrate: 5000,
                        resolution: { width: 1920, height: 1080 },
                        framerate: 30
                    },
                    audio: {
                        codec: 'aac',
                        bitrate: 320,
                        channels: 2,
                        sampleRate: 48000
                    },
                    metadata: {
                        title: 'Sample Video',
                        description: 'A sample video for testing',
                        tags: ['test', 'sample', 'video'],
                        timestamps: [0, 30, 60, 90]
                    }
                },
                dependencies: ['base-video', 'base-audio', 'subtitle-track']
            };

            const result = TrackDescriptorSchema.safeParse(complexTrack);
            assertEquals(result.success, true);
            
            if (result.success) {
                assertEquals(result.data, complexTrack);
                assertEquals(result.data.config.video.codec, 'h264');
                assertEquals(result.data.dependencies.length, 3);
            }
        });

        test('handles edge cases and boundary values', () => {
            // Minimum valid track
            const minTrack = {
                name: 'a', // Minimum length 1
                priority: 0, // Minimum uint8
                schema: 'x', // Minimum length 1
                config: {}
            };

            const minResult = TrackDescriptorSchema.safeParse(minTrack);
            assertEquals(minResult.success, true);

            // Maximum valid track
            const maxTrack = {
                name: 'track-with-maximum-length-name-that-is-still-valid',
                description: 'A'.repeat(500), // Maximum length 500
                priority: 255, // Maximum uint8
                schema: 'schema-with-very-long-name-that-should-still-be-valid',
                config: {
                    // Large config object
                    ...Array.from({ length: 100 }, (_, i) => ({ [`key${i}`]: `value${i}` }))
                        .reduce((acc, obj) => ({ ...acc, ...obj }), {})
                },
                dependencies: Array.from({ length: 50 }, (_, i) => `dependency-${i}`)
            };

            const maxResult = TrackDescriptorSchema.safeParse(maxTrack);
            assertEquals(maxResult.success, true);
        });

        test('handles additional unknown properties', () => {
            const trackWithExtra = {
                name: 'test',
                priority: 0,
                schema: 'test-schema',
                config: {},
                unknownField: 'should be stripped by schema'
            };

            // Zod object schema strips unknown properties by default
            const result = TrackDescriptorSchema.safeParse(trackWithExtra);
            assertEquals(result.success, true);
            
            if (result.success) {
                // Unknown field should be stripped
                expect(result.data).not.toHaveProperty('unknownField');
                assertEquals(result.data, {
                    name: 'test',
                    priority: 0,
                    schema: 'test-schema',
                    config: {}
                });
            }
        });
    });
});
