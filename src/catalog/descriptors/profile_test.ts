import { ProfileTrackSchema } from "./profile.ts";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

const createValidDescriptor = () => ({
	name: "profile-user",
	priority: 3,
	schema: "profile" as const,
	config: {
		id: "user-profile",
	},
});

describe("ProfileTrackSchema", () => {
	test("accepts valid profile descriptor", () => {
		const parsed = ProfileTrackSchema.parse(createValidDescriptor());

		assertEquals(parsed.config.id, "user-profile");
	});

	test("requires config.id to be present", () => {
		const result = ProfileTrackSchema.safeParse({
			...createValidDescriptor(),
			config: {},
		});

		assertEquals(result.success, false);
	});

	test("rejects descriptors with incorrect schema literal", () => {
		const result = ProfileTrackSchema.safeParse({
			...createValidDescriptor(),
			schema: "profile-custom",
		});

		assertEquals(result.success, false);
	});
});
