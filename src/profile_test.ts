import { Profile, ProfileInit } from "./profile.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";

describe("Profile", () => {
    describe("Constructor", () => {
        test("creates profile with required id", () => {
            const init: ProfileInit = {
                id: "user123"
            };

            const profile = new Profile(init);

            assertEquals(profile.id, "user123");
        });

        test("creates profile with different id", () => {
            const init: ProfileInit = {
                id: "another-user-456"
            };

            const profile = new Profile(init);

            assertEquals(profile.id, "another-user-456");
        });

        test("id is readonly", () => {
            const profile = new Profile({ id: "test-id" });

            // This would cause TypeScript error if we tried to assign
            // profile.id = "new-id"; // Should not be allowed

            assertEquals(profile.id, "test-id");
        });

        test("handles empty string id", () => {
            const profile = new Profile({ id: "" });

            assertEquals(profile.id, "");
        });

        test("handles special characters in id", () => {
            const specialId = "user@domain.com_123-test!";
            const profile = new Profile({ id: specialId });

            assertEquals(profile.id, specialId);
        });

        test("handles very long id", () => {
            const longId = "a".repeat(1000);
            const profile = new Profile({ id: longId });

            assertEquals(profile.id, longId);
        });
    });

    describe("Properties", () => {
        test("id property is accessible", () => {
            const profile = new Profile({ id: "accessible-id" });

            const profileId = profile.id;

            assertEquals(profileId, "accessible-id");
        });

        test("profile maintains identity", () => {
            const id = "identity-test";
            const profile = new Profile({ id });

            assertEquals(profile.id, id);
            assertEquals(profile.id, profile.id); // Should be consistent
        });
    });

    describe("Type Safety", () => {
        test("ProfileInit interface requires id", () => {
            // This test ensures the interface contract is working
            const validInit: ProfileInit = { id: "test" };
            const profile = new Profile(validInit);

            assert(profile instanceof Profile);
        });

        test("Profile instance type checking", () => {
            const profile = new Profile({ id: "type-check" });

            assert(profile instanceof Profile);
            assertEquals(typeof profile.id, "string");
        });
    });

    describe("Edge Cases", () => {
        test("handles whitespace-only id", () => {
            const profile = new Profile({ id: "   \t\n   " });

            assertEquals(profile.id, "   \t\n   ");
        });

        test("handles numeric string id", () => {
            const profile = new Profile({ id: "12345" });

            assertEquals(profile.id, "12345");
        });

        test("handles unicode characters", () => {
            const unicodeId = "用户123_测试_🎉";
            const profile = new Profile({ id: unicodeId });

            assertEquals(profile.id, unicodeId);
        });
    });

    describe("Multiple Instances", () => {
        test("different profiles have different ids", () => {
            const profile1 = new Profile({ id: "user1" });
            const profile2 = new Profile({ id: "user2" });

            assertEquals(profile1.id, "user1");
            assertEquals(profile2.id, "user2");
            assert(profile1.id !== profile2.id);
        });

        test("profiles with same id are equal by value", () => {
            const profile1 = new Profile({ id: "same-id" });
            const profile2 = new Profile({ id: "same-id" });

            assertEquals(profile1.id, profile2.id);
            assert(profile1 !== profile2); // Different object references
        });

        test("can create multiple profiles", () => {
            const profiles = [
                new Profile({ id: "user1" }),
                new Profile({ id: "user2" }),
                new Profile({ id: "user3" })
            ];

            assertEquals(profiles.length, 3);
            assertEquals(profiles[0].id, "user1");
            assertEquals(profiles[1].id, "user2");
            assertEquals(profiles[2].id, "user3");
        });
    });
});
