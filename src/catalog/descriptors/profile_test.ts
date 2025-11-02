import { assertEquals } from "@std/assert";
import { ProfileTrackSchema } from './profile.ts';

const createValidDescriptor = () => ({
	name: 'profile-user',
	priority: 3,
	schema: 'profile' as const,
	config: {
		id: 'user-profile',
	},
});

Deno.test("ProfileTrackSchema", async (t) => {
	await t.step("accepts valid profile descriptor", () => {
		const parsed = ProfileTrackSchema.parse(createValidDescriptor());

		assertEquals(parsed.config.id, 'user-profile');
	});

	await t.step("requires config.id to be present", () => {
		const result = ProfileTrackSchema.safeParse({
			...createValidDescriptor(),
			config: {},
		});

		assertEquals(result.success, false);
	});

	await t.step("rejects descriptors with incorrect schema literal", () => {
		const result = ProfileTrackSchema.safeParse({
			...createValidDescriptor(),
			schema: 'profile-custom',
		});

		assertEquals(result.success, false);
	});
});
