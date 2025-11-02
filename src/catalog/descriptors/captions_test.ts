import { CaptionsTrackSchema } from './captions.ts';
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


const validDescriptor = {
	name: 'captions-en',
	description: 'English closed captions',
	priority: 1,
	schema: 'captions' as const,
	config: {
		language: 'en-US',
	},
	dependencies: ['video-main'],
};

describe('CaptionsTrackSchema', () => {
	test('accepts a valid captions descriptor', () => {
		const parsed = CaptionsTrackSchema.parse(validDescriptor);

		expect(parsed).toMatchObject(validDescriptor);
	});

	test('rejects descriptors without dependencies', () => {
		const result = CaptionsTrackSchema.safeParse({
			...validDescriptor,
			dependencies: [],
		});

		assertEquals(result.success, false);
		if (!result.success) {
			assert(result.error.issues[0].path.includes('dependencies'));
		}
	});

	test('rejects descriptors with wrong schema literal', () => {
		const result = CaptionsTrackSchema.safeParse({
			...validDescriptor,
			schema: 'text',
		});

		assertEquals(result.success, false);
	});
});
