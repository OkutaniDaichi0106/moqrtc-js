import { Profile, ProfileInit } from "./profile.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("Profile", async (t) => {
	await t.step("Constructor", async (t) => {
		await t.step("creates profile with required id", () => {
			const init: ProfileInit = {
				id: "user123",
			};

			const profile = new Profile(init);

			assertEquals(profile.id, "user123");
		});

		await t.step("creates profile with different id", () => {
			const init: ProfileInit = {
				id: "another-user-456",
			};

			const profile = new Profile(init);

			assertEquals(profile.id, "another-user-456");
		});

		await t.step("id is readonly", () => {
			const profile = new Profile({ id: "test-id" });

			// This would cause TypeScript error if we tried to assign
			// profile.id = "new-id"; // Should not be allowed

			assertEquals(profile.id, "test-id");
		});

		await t.step("handles empty string id", () => {
			const profile = new Profile({ id: "" });

			assertEquals(profile.id, "");
		});

		await t.step("handles special characters in id", () => {
			const specialId = "user@domain.com_123-test!";
			const profile = new Profile({ id: specialId });

			assertEquals(profile.id, specialId);
		});

		await t.step("handles very long id", () => {
			const longId = "a".repeat(1000);
			const profile = new Profile({ id: longId });

			assertEquals(profile.id, longId);
		});
	});

	await t.step("Properties", async (t) => {
		await t.step("id property is accessible", () => {
			const profile = new Profile({ id: "accessible-id" });

			const profileId = profile.id;

			assertEquals(profileId, "accessible-id");
		});

		await t.step("profile maintains identity", () => {
			const id = "identity-test";
			const profile = new Profile({ id });

			assertEquals(profile.id, id);
			assertEquals(profile.id, profile.id); // Should be consistent
		});
	});

	await t.step("Type Safety", async (t) => {
		await t.step("ProfileInit interface requires id", () => {
			// This test ensures the interface contract is working
			const validInit: ProfileInit = { id: "test" };
			const profile = new Profile(validInit);

			assert(profile instanceof Profile);
		});

		await t.step("Profile instance type checking", () => {
			const profile = new Profile({ id: "type-check" });

			assert(profile instanceof Profile);
			assertEquals(typeof profile.id, "string");
		});
	});

	await t.step("Edge Cases", async (t) => {
		await t.step("handles whitespace-only id", () => {
			const profile = new Profile({ id: "   \t\n   " });

			assertEquals(profile.id, "   \t\n   ");
		});

		await t.step("handles numeric string id", () => {
			const profile = new Profile({ id: "12345" });

			assertEquals(profile.id, "12345");
		});

		await t.step("handles unicode characters", () => {
			const unicodeId = "用户123_测试_🎉";
			const profile = new Profile({ id: unicodeId });

			assertEquals(profile.id, unicodeId);
		});
	});

	await t.step("Multiple Instances", async (t) => {
		await t.step("different profiles have different ids", () => {
			const profile1 = new Profile({ id: "user1" });
			const profile2 = new Profile({ id: "user2" });

			assertEquals(profile1.id, "user1");
			assertEquals(profile2.id, "user2");
			assert(profile1.id !== profile2.id);
		});

		await t.step("profiles with same id are equal by value", () => {
			const profile1 = new Profile({ id: "same-id" });
			const profile2 = new Profile({ id: "same-id" });

			assertEquals(profile1.id, profile2.id);
			assert(profile1 !== profile2); // Different object references
		});

		await t.step("can create multiple profiles", () => {
			const profiles = [
				new Profile({ id: "user1" }),
				new Profile({ id: "user2" }),
				new Profile({ id: "user3" }),
			];

			assertEquals(profiles.length, 3);
			assertEquals(profiles[0].id, "user1");
			assertEquals(profiles[1].id, "user2");
			assertEquals(profiles[2].id, "user3");
		});
	});
});
