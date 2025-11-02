import { AudioConfigSchema, AudioTrackSchema } from "./audio.ts";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

const baseConfig = {
	codec: "opus",
	sampleRate: 48_000,
	numberOfChannels: 2,
	container: "loc" as const,
};

describe("Audio descriptors", () => {
	describe("AudioConfigSchema", () => {
		test("parses valid config with hex string description", () => {
			const result = AudioConfigSchema.parse({
				...baseConfig,
				description: "48656c6c6f", // "Hello" in hex
				bitrate: 96_000,
			});

			assertEquals(result.codec, "opus");
			assert(result.description instanceof Uint8Array);
			expect(Array.from(result.description!)).toEqual([72, 101, 108, 108, 111]);
			assertEquals(result.bitrate, 96_000);
		});

		test("parses config with Uint8Array description", () => {
			const description = new Uint8Array([1, 2, 3]);
			const result = AudioConfigSchema.parse({
				...baseConfig,
				description,
			});

			assertEquals(result.description, description);
		});

		test("rejects invalid hex string description", () => {
			expect(() =>
				AudioConfigSchema.parse({
					...baseConfig,
					description: "invalid-hex",
				})
			).toThrow("Invalid hex string");
		});

		test("rejects invalid container values", () => {
			const result = AudioConfigSchema.safeParse({
				...baseConfig,
				container: "mp4",
			});

			assertEquals(result.success, false);
			if (!result.success) {
				assert(result.error.issues[0]?.message.includes("Invalid option"));
				assertEquals(result.error.issues[0]?.path, ["container"]);
			}
		});
	});

	describe("AudioTrackSchema", () => {
		test("parses complete audio track descriptor", () => {
			const descriptor = AudioTrackSchema.parse({
				name: "audio-main",
				priority: 1,
				schema: "audio",
				config: {
					...baseConfig,
					description: "001122",
				},
				dependencies: ["catalog"],
			});

			assertEquals(descriptor.schema, "audio");
			assert(descriptor.config.description instanceof Uint8Array);
			expect(Array.from(descriptor.config.description!)).toEqual([0, 17, 34]);
			assertEquals(descriptor.dependencies, ["catalog"]);
		});

		test("enforces audio schema literal", () => {
			const result = AudioTrackSchema.safeParse({
				name: "audio-secondary",
				priority: 2,
				schema: "video",
				config: {
					...baseConfig,
				},
			});

			assertEquals(result.success, false);
			if (!result.success) {
				assertEquals(result.error.issues[0]?.path, ["schema"]);
			}
		});
	});
});
