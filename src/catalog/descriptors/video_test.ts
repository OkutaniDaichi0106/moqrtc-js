import { assertEquals, assert, assertThrows } from "@std/assert";
import { VideoConfigSchema, VideoTrackSchema } from "./video.ts";

const baseConfig = {
    codec: "avc1.640028",
    container: "cmaf" as const,
};

Deno.test("Video descriptors", async (t) => {
    await t.step("VideoConfigSchema", async (t) => {
        await t.step("parses valid config with hex string description and defaults", () => {
            const config = VideoConfigSchema.parse({
                ...baseConfig,
                description: "00010203",
                codedWidth: 1920,
                codedHeight: 1080,
                framerate: 60,
                bitrate: 4_000_000,
            });

            assert(config.description instanceof Uint8Array);
            assertEquals(Array.from(config.description!), [0, 1, 2, 3]);
            assertEquals(config.optimizeForLatency, true); // default applied
            assertEquals(config.rotation, 0); // default applied
            assertEquals(config.flip, false); // default applied
        });

        await t.step("keeps Uint8Array description untouched", () => {
            const description = new Uint8Array([255, 0, 127]);
            const config = VideoConfigSchema.parse({
                ...baseConfig,
                description,
            });

            assertEquals(config.description, description);
        });

        await t.step("rejects invalid hex string in description", () => {
            assertThrows(() =>
                VideoConfigSchema.parse({
                    ...baseConfig,
                    description: "not-hex",
                }),
                Error,
                "Invalid hex string"
            );
        });

        await t.step("rejects invalid container values", () => {
            const result = VideoConfigSchema.safeParse({
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

    await t.step("VideoTrackSchema", async (t) => {
        await t.step("parses complete video track descriptor", () => {
            const descriptor = VideoTrackSchema.parse({
                name: "video-main",
                priority: 0,
                schema: "video",
                config: {
                    ...baseConfig,
                    description: "cafebabe",
                    codedWidth: 1280,
                    codedHeight: 720,
                    displayAspectWidth: 16,
                    displayAspectHeight: 9,
                    framerate: 30,
                    optimizeForLatency: false,
                    rotation: 90,
                    flip: true,
                },
            });

            assertEquals(descriptor.schema, "video");
            assertEquals(Array.from(descriptor.config.description!), [202, 254, 186, 190]);
            assertEquals(descriptor.config.optimizeForLatency, false);
            assertEquals(descriptor.config.rotation, 90);
            assertEquals(descriptor.config.flip, true);
        });

        await t.step("enforces video schema literal", () => {
            const result = VideoTrackSchema.safeParse({
                name: "video-secondary",
                priority: 5,
                schema: "audio",
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
