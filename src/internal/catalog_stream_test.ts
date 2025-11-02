import type { MockedFunction } from "vitest";
import { CatalogDecoder, CatalogEncoder, TrackCatalog } from "./catalog_stream.ts";
import type {
	Frame,
	GroupReader,
	GroupWriter,
	TrackReader,
	TrackWriter,
} from "@okutanidaichi/moqt";
import type { TrackDescriptor } from "../catalog/track.ts";
import { EncodedJsonChunk, JsonLineDecoder, JsonLineEncoder } from "../internal/json.ts";
import { background, Context, ContextCancelledError, withCancel } from "golikejs/context";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

// Helper to create mock GroupWriter
function createMockGroupWriter(): GroupWriter {
	return {
		writeFrame: vi.fn(() => Promise.resolve(undefined)),
		close: () => Promise.resolve(undefined),
	} as unknown as GroupWriter;
}

// Helper to create mock GroupReader with frames
function createMockGroupReader(frames: any[], context: Context = background()): GroupReader {
	let frameIndex = 0;
	return {
		readFrame: () => {
			if (frameIndex < frames.length) {
				return Promise.resolve([frames[frameIndex++], undefined]);
			} else {
				return Promise.resolve([undefined, undefined]);
			}
		},
		cancel: () => Promise.resolve(undefined),
		context,
	} as unknown as GroupReader;
}

// Helper to create mock TrackReader with groups
function createMockTrackReader(groups: Frame[][], context: Context = background()): TrackReader {
	let groupIndex = 0;
	return {
		acceptGroup: () => {
			if (groupIndex < groups.length) {
				const groupReader = createMockGroupReader(groups[groupIndex++], context);
				return Promise.resolve([groupReader, undefined]);
			} else {
				return Promise.resolve([undefined, new Error("no more groups")]);
			}
		},
		closeWithError: undefined, /* TODO: Convert mock */
	} as unknown as TrackReader;
}

describe("CatalogEncoder", () => {
	let mockWriter: TrackWriter;
	let mockGroupWriter: GroupWriter;
	let writeFrameSpy: any;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		mockGroupWriter = createMockGroupWriter();
		writeFrameSpy = mockGroupWriter.writeFrame as any;

		mockWriter = {
			openGroup: vi.fn(async (id: bigint) => [mockGroupWriter, undefined]),
		} as unknown as TrackWriter;
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with version and description", () => {
			const encoder = new CatalogEncoder({ version: "1.0" });
			assertEquals(encoder.version, "1.0");
			// description is not part of the new API; ensure it's undefined
			expect((encoder as any).description).toBeUndefined();
		});

		it("should handle missing description", () => {
			const encoder = new CatalogEncoder({ version: "1.0" });
			assertEquals(encoder.version, "1.0");
			expect((encoder as any).description).toBeUndefined();
		});
	});

	describe("set", () => {
		it("should encode active tracks when tracks provided", async () => {
			const encoder = new CatalogEncoder({ version: "1.0" });

			const activeTrack = new TrackCatalog(background(), {
				name: "track1",
				schema: "vp8",
				config: {},
			});
			const endedTrack = new TrackCatalog(background(), {
				name: "track2",
				schema: "opus",
				config: {},
			});
			endedTrack.end(); // Mark as ended

			const err = await encoder.set([activeTrack, endedTrack]);

			assertEquals(err, undefined);
			// Since no channels are connected, set should complete without error
		});

		it("should do nothing if tracks is empty", async () => {
			const encoder = new CatalogEncoder({ version: "1.0" });

			const err = await encoder.set([]);

			assertEquals(err, undefined);
		});
	});

	describe("encodeTo", () => {
		it("should return error if openGroup fails", async () => {
			const ctx = background();
			const encoder = new CatalogEncoder({ version: "1.0" });

			const mockTrackWriter: TrackWriter = {
				openGroup: vi.fn(async () => [undefined, new Error("openGroup failed")]),
			} as unknown as TrackWriter;

			const err = await encoder.encodeTo(ctx.done(), mockTrackWriter);

			assertExists(err);
			expect((err as Error).message).toContain("openGroup failed");
		});

		it("should respect context cancellation", async () => {
			const baseCtx = background();
			const [cancelCtx, cancel] = withCancel(baseCtx);

			const mockGroupWriter = createMockGroupWriter();
			const mockTrackWriter: TrackWriter = {
				openGroup: vi.fn(async (id: bigint) => [mockGroupWriter, undefined]),
			} as unknown as TrackWriter;

			const encoder = new CatalogEncoder({ version: "1.0" });

			// Start encoding in background (not awaiting)
			const encodePromise = encoder.encodeTo(cancelCtx.done(), mockTrackWriter);

			// Cancel immediately
			cancel();

			// encodeTo should exit quickly when context is cancelled
			const result = await Promise.race([
				encodePromise,
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error("encodeTo did not respect cancellation")),
						1000,
					)
				),
			]);

			// Should complete without hanging
			assertExists(result);
		}, 5000);
	});
});

describe("CatalogDecoder", () => {
	let mockReader: TrackReader;
	let encoder: JsonLineEncoder;
	let decoder: JsonLineDecoder;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		mockReader = {
			acceptGroup: undefined, /* TODO: Convert mock */
			closeWithError: undefined, /* TODO: Convert mock */
		} as unknown as TrackReader;
		encoder = new JsonLineEncoder();
		decoder = new JsonLineDecoder();
		vi.clearAllMocks();
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("should initialize decoder", () => {
			const decoder = new CatalogDecoder({ version: "1.0", reader: mockReader });
			assertEquals(decoder.version, "1.0");
		});
	});

	describe("decodeFrom", () => {
		it("should process init frame and send to decodeTo destination", async () => {
			const ctx = background();
			const [cancelCtx, cancel] = withCancel(ctx);
			const initFrame = { bytes: encoder.encode([{ version: "1.0" }]).data } as Frame;
			mockReader = createMockTrackReader([[initFrame]], ctx);
			const decoder = new CatalogDecoder({ version: "1.0", reader: mockReader });

			// Set up decodeTo to capture tracks
			const receivedTracks: TrackCatalog[][] = [];
			const decodeToPromise = decoder.decodeTo(cancelCtx.done(), (tracks) => {
				receivedTracks.push(tracks);
			});

			// Start decoding
			const decodeFromPromise = decoder.decodeFrom(ctx.done(), mockReader);

			// Give it time to process
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Cancel to stop listening
			cancel();

			// Wait for both operations
			const decodeResult = await decodeFromPromise;
			await decodeToPromise;

			assertEquals(decodeResult, undefined);
			assertEquals(decoder.version, "1.0");
		}, 5000);

		it("should handle acceptGroup error", async () => {
			const failingReader = {
				acceptGroup: vi.fn(async () => [undefined, new Error("acceptGroup failed")]),
				closeWithError: undefined, /* TODO: Convert mock */
			} as unknown as TrackReader;
			const decoder = new CatalogDecoder({ version: "1.0", reader: failingReader });
			const err = await decoder.decodeFrom(Promise.resolve(), failingReader);
			assertExists(err);
			expect((err as Error).message).toBe("acceptGroup failed");
		});

		it("should handle readFrame error", async () => {
			const groupReader = {
				readFrame: vi.fn(async () => [undefined, new Error("readFrame failed")]),
				cancel: vi.fn(async () => undefined),
			};
			const failingReader = {
				acceptGroup: vi.fn(async () => [groupReader, undefined]),
				closeWithError: undefined, /* TODO: Convert mock */
			} as unknown as TrackReader;
			const decoder = new CatalogDecoder({ version: "1.0", reader: failingReader });
			const err = await decoder.decodeFrom(Promise.resolve(), failingReader);
			assertExists(err);
			expect((err as Error).message).toBe("readFrame failed");
		});

		it("should handle decode error", async () => {
			const ctx = background();
			const initFrame = { bytes: encoder.encode([{ version: "1.0" }]).data } as Frame;
			const invalidFrame = { bytes: new Uint8Array([0, 1, 2]) } as Frame; // Invalid JSON
			mockReader = createMockTrackReader([[initFrame, invalidFrame]], ctx);
			const decoder = new CatalogDecoder({ version: "1.0", reader: mockReader });
			const err = await decoder.decodeFrom(ctx.done(), mockReader);
			assert(err instanceof Error);
		}, 5000);

		it("should handle multiple decodeTo destinations", async () => {
			const ctx = background();
			const [cancelCtx, cancel] = withCancel(ctx);

			const trackDescriptor = { name: "video", schema: "vp8", config: {} };
			const initFrame = { bytes: encoder.encode([{ version: "1.0" }]).data } as Frame;
			const trackFrame = {
				bytes: encoder.encode([{ active: true, track: trackDescriptor }]).data,
			} as Frame;

			mockReader = createMockTrackReader([[initFrame, trackFrame]], ctx);
			const decoder = new CatalogDecoder({ version: "1.0", reader: mockReader });

			// Set up multiple destinations
			const received1: TrackCatalog[][] = [];
			const received2: TrackCatalog[][] = [];

			const dest1Promise = decoder.decodeTo(cancelCtx.done(), (tracks) => {
				received1.push(tracks);
			});
			const dest2Promise = decoder.decodeTo(cancelCtx.done(), (tracks) => {
				received2.push(tracks);
			});

			// Start decoding
			const decodeFromPromise = decoder.decodeFrom(ctx.done(), mockReader);

			// Wait a bit for tracks to be sent
			await new Promise((resolve) => setTimeout(resolve, 200));
			cancel();

			await decodeFromPromise;
			await Promise.all([dest1Promise, dest2Promise]);

			// Both destinations should receive the same tracks
			assert(received1.length > 0);
			assert(received2.length > 0);
			assertEquals(received1.length, received2.length);
		}, 5000);
	});

	describe("data validation and proper behavior", () => {
		it("should skip ended tracks when setting tracks", async () => {
			const ctx = background();
			const encoderObj = new CatalogEncoder({ version: "1.0" });

			const activeTrack = new TrackCatalog(ctx, {
				name: "active",
				schema: "vp8",
				config: {},
			});
			const endedTrack = new TrackCatalog(ctx, { name: "ended", schema: "opus", config: {} });
			endedTrack.end();

			// Set tracks - ended track should be skipped
			const err = await encoderObj.set([activeTrack, endedTrack]);

			// If set completes without error, behavior is correct
			assertEquals(err, undefined);
			// The active track should be usable for later encoding
			assertEquals(activeTrack.active, true);
			assertEquals(endedTrack.active, false);
		});

		it("should reject mismatched catalog versions", async () => {
			const ctx = background();
			const initFrame = { bytes: encoder.encode([{ version: "2.0" }]).data } as Frame;
			mockReader = createMockTrackReader([[initFrame]], ctx);

			// Decoder expects version 1.0 but receives 2.0
			const catalogDecoder = new CatalogDecoder({ version: "1.0", reader: mockReader });
			const err = await catalogDecoder.decodeFrom(Promise.resolve(), mockReader);

			assertExists(err);
			expect((err as Error).message).toContain("version mismatch");
		});

		it("should verify JSON encoding produces valid data", () => {
			const jsonEncoder = new JsonLineEncoder();
			const testData = [
				{ version: "1.0" },
				{ active: true, track: { name: "video", schema: "vp8", config: {} } },
			];

			const encoded = jsonEncoder.encode(testData);
			assert(encoded.data.length > 0);

			// Verify it can be decoded
			const jsonDecoder = new JsonLineDecoder();
			const decoded = jsonDecoder.decode(encoded);
			assertEquals(decoded.length, 2);
		});
	});
});

describe("TrackCatalog", () => {
	it("should initialize with descriptor and be active", () => {
		const ctx = background();
		const descriptor = { name: "video", schema: "vp8", config: {} };
		const catalog = new TrackCatalog(ctx, descriptor);
		assertEquals(catalog.descriptor, descriptor);
		assertEquals(catalog.active, true);
	});

	it("should mark as inactive when ended", async () => {
		const ctx = background();
		const descriptor = { name: "audio", schema: "opus", config: {} };
		const catalog = new TrackCatalog(ctx, descriptor);
		assertEquals(catalog.active, true);

		catalog.end();
		assertEquals(catalog.active, false);

		// done() should resolve after end()
		const donePromise = catalog.done();
		await expect(donePromise).resolves.toBeUndefined();
	});

	it("should return descriptor properties", () => {
		const ctx = background();
		const descriptor = { name: "screen", schema: "h264", config: { profile: "high" } };
		const catalog = new TrackCatalog(ctx, descriptor);
		assertEquals(catalog.descriptor.name, "screen");
		assertEquals(catalog.descriptor.schema, "h264");
	});
});

describe("CatalogEncoder - additional coverage", () => {
	let mockWriter: TrackWriter;
	let mockGroupWriter: GroupWriter;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		mockGroupWriter = createMockGroupWriter();
		mockWriter = {
			openGroup: vi.fn(async (id: bigint) => [mockGroupWriter, undefined]),
		} as unknown as TrackWriter;
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should handle multiple tracks in set", async () => {
		const ctx = background();
		const encoder = new CatalogEncoder({ version: "1.0" });

		const t1 = new TrackCatalog(ctx, { name: "video1", schema: "vp8", config: {} });
		const t2 = new TrackCatalog(ctx, { name: "video2", schema: "vp9", config: {} });
		const t3 = new TrackCatalog(ctx, { name: "audio", schema: "opus", config: {} });

		const err = await encoder.set([t1, t2, t3]);
		assertEquals(err, undefined);
	});

	it("should handle mixed active and ended tracks in set", async () => {
		const ctx = background();
		const encoder = new CatalogEncoder({ version: "2.0" });

		const activeTrack = new TrackCatalog(ctx, { name: "active", schema: "vp8", config: {} });
		const endedTrack = new TrackCatalog(ctx, { name: "ended", schema: "opus", config: {} });
		endedTrack.end();

		const err = await encoder.set([activeTrack, endedTrack]);
		assertEquals(err, undefined);
	});

	it("should initialize encoder with version and optional description", () => {
		const encoder1 = new CatalogEncoder({ version: "2.0" });
		assertEquals(encoder1.version, "2.0");
		assertEquals(encoder1.description, undefined);

		const encoder2 = new CatalogEncoder({ version: "1.0" });
		assertEquals(encoder2.version, "1.0");
		// description removed from constructor in the new design
		expect((encoder2 as any).description).toBeUndefined();
	});

	it("should handle multiple consecutive set calls", async () => {
		const ctx = background();
		const encoder = new CatalogEncoder({ version: "1.0" });

		const t1 = new TrackCatalog(ctx, { name: "t1", schema: "vp8", config: {} });
		const t2 = new TrackCatalog(ctx, { name: "t2", schema: "opus", config: {} });
		const t3 = new TrackCatalog(ctx, { name: "t3", schema: "h264", config: {} });

		let err = await encoder.set([t1]);
		assertEquals(err, undefined);

		err = await encoder.set([t1, t2]);
		assertEquals(err, undefined);

		err = await encoder.set([t1, t2, t3]);
		assertEquals(err, undefined);
	});

	it("should handle writeFrame error on init", async () => {
		const failingWriter = createMockGroupWriter();
		(failingWriter.writeFrame as any).mockResolvedValueOnce(new Error("write init failed"));

		const mockTrackWriter: TrackWriter = {
			openGroup: vi.fn(async () => [failingWriter, undefined]),
		} as unknown as TrackWriter;

		const ctx = background();
		const encoder = new CatalogEncoder({ version: "1.0" });
		const t1 = new TrackCatalog(ctx, { name: "t1", schema: "vp8", config: {} });
		await encoder.set([t1]);

		const err = await encoder.encodeTo(ctx.done(), mockTrackWriter);
		assertExists(err);
		expect((err as Error).message).toContain("Failed to write catalog init");
	});

	it("should handle writeFrame error on existing tracks", async () => {
		const failingWriter = createMockGroupWriter();
		(failingWriter.writeFrame as any)
			.mockResolvedValueOnce(undefined) // init write succeeds
			.mockResolvedValueOnce(new Error("write existing failed")); // existing tracks write fails

		const mockTrackWriter: TrackWriter = {
			openGroup: vi.fn(async () => [failingWriter, undefined]),
		} as unknown as TrackWriter;

		const ctx = background();
		const encoder = new CatalogEncoder({ version: "1.0" });
		const t1 = new TrackCatalog(ctx, { name: "t1", schema: "vp8", config: {} });
		await encoder.set([t1]);

		const err = await encoder.encodeTo(ctx.done(), mockTrackWriter);
		assertExists(err);
		expect((err as Error).message).toContain("Failed to write existing tracks");
	});
});
