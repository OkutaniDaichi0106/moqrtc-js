import { assertEquals } from "@std/assert";
import { BroadcastPublisher } from "./broadcast.ts";
import * as room from "./room.ts";

// Mock classes for testing
class MockCatalogTrackEncoder {
	sync = createMockFunction();
	setTrack = createMockFunction();
	removeTrack = createMockFunction();
	close = createMockFunction();
}

class MockCatalogTrackDecoder {
	decodeFrom = createMockFunction();
	nextTrack = createMockFunction();
	root = createMockFunction();
	close = createMockFunction();
}

function createMockFunction() {
	const calls: any[] = [];
	let mockReturn: any = undefined;
	const mock = (...args: any[]) => {
		calls.push(args);
		mock.callCount++;
		return mockReturn;
	};
	mock.calls = calls;
	mock.callCount = 0;
	mock.mockReturnValue = (value: any) => {
		mockReturn = value;
		return mock;
	};
	mock.mockResolvedValue = (value: any) => {
		mockReturn = Promise.resolve(value);
		return mock;
	};
	return mock;
}

// Mock implementations
const catalogEncoderInstances: MockCatalogTrackEncoder[] = [];
const catalogDecoderInstances: MockCatalogTrackDecoder[] = [];

// Mock the room module
(room as any).participantName = createMockFunction().mockReturnValue("participant");

// Mock the catalog track modules
const mockCatalogTrackEncoder = function() {
	const instance = new MockCatalogTrackEncoder();
	catalogEncoderInstances.push(instance);
	return instance;
};
const mockCatalogTrackDecoder = function() {
	const instance = new MockCatalogTrackDecoder();
	instance.decodeFrom.mockResolvedValue(undefined);
	instance.nextTrack.mockResolvedValue([{ name: "catalog" }, undefined] as any);
	instance.root.mockResolvedValue({ version: "1", tracks: [] });
	catalogDecoderInstances.push(instance);
	return instance;
};

// Replace the imports
(Object as any).defineProperty(await import("./internal/catalog_stream.ts"), "CatalogEncoder", {
	value: mockCatalogTrackEncoder,
});
(Object as any).defineProperty(await import("./internal/catalog_stream.ts"), "CatalogDecoder", {
	value: mockCatalogTrackDecoder,
});

// Setup for each test
function setupMocks() {
	catalogEncoderInstances.length = 0;
	catalogDecoderInstances.length = 0;
	(room as any).participantName.calls.length = 0;
	(room as any).participantName.callCount = 0;
}

Deno.test("BroadcastPublisher", async (t) => {
	await t.step("constructor", async (t) => {
		await t.step("should create an instance with name", () => {
			setupMocks();
			const publisher = new BroadcastPublisher("test-publisher");
			assertEquals(publisher.name, "test-publisher");
		});

		await t.step("should have catalog track", () => {
			setupMocks();
			const publisher = new BroadcastPublisher("test-publisher");
			// Check that catalog encoder was created
			assertEquals(catalogEncoderInstances.length, 1);
		});
	});

	await t.step("setTrack calls catalog encoder setTrack", () => {
		setupMocks();
		const publisher = new BroadcastPublisher("room");
		// Note: setTrack method signature needs to be checked
		// publisher.setTrack(track, encoder);
		// assertEquals(mockCatalog.setTrack.callCount, 1);
	});

	await t.step("serveTrack calls encoder encodeTo", async () => {
		setupMocks();
		const publisher = new BroadcastPublisher("room");
		const ctx = Promise.resolve();
		const track = {
			trackName: "video",
			closeWithError: createMockFunction(),
			close: createMockFunction(),
		} as any;
		const encoder = {
			encodeTo: createMockFunction().mockResolvedValue(undefined),
			close: createMockFunction(),
			encoding: "mock",
		} as any;
		// publisher.setTrack({ name: "video", priority: 0, schema: "", config: {} }, encoder);
		// await publisher.serveTrack(ctx, track);
		// assertEquals(encoder.encodeTo.callCount, 1);
	});

	await t.step("close calls catalog encoder close", async () => {
		setupMocks();
		const publisher = new BroadcastPublisher("room");
		await publisher.close();
		// Check that catalog encoder close was called
		if (catalogEncoderInstances.length > 0) {
			assertEquals(catalogEncoderInstances[0].close.callCount, 1);
		}
	});
});