import { assertEquals, assert } from "@std/assert";
import { CaptionsTrackSchema } from './captions.ts';

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

Deno.test("CaptionsTrackSchema", async (t) => {
	await t.step("accepts a valid captions descriptor", () => {
		const parsed = CaptionsTrackSchema.parse(validDescriptor);

		assertEquals(parsed.name, validDescriptor.name);
		assertEquals(parsed.config.language, validDescriptor.config.language);
		assertEquals(parsed.dependencies, validDescriptor.dependencies);
	});

	await t.step("rejects descriptors without dependencies", () => {
		const result = CaptionsTrackSchema.safeParse({
			...validDescriptor,
			dependencies: [],
		});

		assertEquals(result.success, false);
		if (!result.success) {
			assert(result.error.issues[0].path.includes('dependencies'));
		}
	});

	await t.step("rejects descriptors with wrong schema literal", () => {
		const result = CaptionsTrackSchema.safeParse({
			...validDescriptor,
			schema: 'text',
		});

		assertEquals(result.success, false);
	});
});
