import * as room from "./room.ts";
import { withCancelCause } from "golikejs/context";
import { BroadcastPublisher, BroadcastSubscriber } from "./broadcast.ts";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

// Mock external dependencies
vi.mock("./room", () => ({
	participantName: vi.fn((roomID: string, path: string) => "participant"),
}));

const catalogEncoderInstances: Array<
	{
		sync: ReturnType<typeof vi.fn>;
		setTrack: ReturnType<typeof vi.fn>;
		removeTrack: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
	}
> = [];
const catalogDecoderInstances: Array<
	{
		decodeFrom: ReturnType<typeof vi.fn>;
		nextTrack: ReturnType<typeof vi.fn>;
		root: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
	}
> = [];

vi.mock("./internal/catalog_track", () => {
	const CatalogTrackEncoder = undefined /* TODO: Convert mock */.mockImplementation(() => {
		const instance = {
			sync: undefined, /* TODO: Convert mock */
			setTrack: undefined, /* TODO: Convert mock */
			removeTrack: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		};
		catalogEncoderInstances.push(instance);
		return instance;
	});

	const CatalogTrackDecoder = undefined /* TODO: Convert mock */.mockImplementation(() => {
		const instance = {
			decodeFrom: vi.fn(async () => undefined),
			nextTrack: vi.fn(async () => [{ name: "catalog" }, undefined] as any),
			root: vi.fn(async () => ({ version: "1", tracks: [] })),
			close: undefined, /* TODO: Convert mock */
		};
		catalogDecoderInstances.push(instance);
		return instance;
	});

	return {
		CatalogTrackEncoder,
		CatalogTrackDecoder,
	};
});

vi.mock("./internal", () => ({
	JsonEncoder: undefined, /* TODO: Convert mock */
	GroupCache: undefined, /* TODO: Convert mock */
}));

vi.mock("./catalog", () => ({
	CATALOG_TRACK_NAME: "catalog",
	RootSchema: {},
	DEFAULT_CATALOG_VERSION: "@gomoqt/v1",
}));

vi.mock("golikejs/context", () => {
	return {
		withCancelCause: vi.fn(() => {
			const ctx = {
				done: vi.fn(() => Promise.resolve()),
			};
			const cancel = undefined /* TODO: Convert mock */;
			return [ctx, cancel] as const;
		}),
		background: vi.fn(() => ({})),
	};
});

/* TODO: Convert beforeEach */ beforeEach(() => {
	catalogEncoderInstances.length = 0;
	catalogDecoderInstances.length = 0;
	vi.clearAllMocks();
});

describe("BroadcastPublisher", () => {
	let publisher: BroadcastPublisher;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		publisher = new BroadcastPublisher("test-publisher");
	});

	describe("constructor", () => {
		it("should create an instance with name", () => {
			assertEquals(publisher.name, "test-publisher");
		});

		it("should have catalog track", () => {
			expect(publisher.hasTrack("catalog")).toBe(true);
		});
	});

	describe("hasTrack", () => {
		it("should return true for existing track", () => {
			expect(publisher.hasTrack("catalog")).toBe(true);
		});

		it("should return false for non-existing track", () => {
			expect(publisher.hasTrack("non-existing")).toBe(false);
		});
	});

	describe("getTrack", () => {
		it("should return track encoder for existing track", () => {
			const track = publisher.getTrack("catalog");
			assertExists(track);
		});

		it("should return undefined for non-existing track", () => {
			const track = publisher.getTrack("non-existing");
			assertEquals(track, undefined);
		});
	});

	describe("syncCatalog", () => {
		it("should sync catalog", () => {
			expect(() => publisher.syncCatalog()).not.toThrow();
		});
	});

	test("setTrack calls catalog encoder setTrack", () => {
		const mockCatalog = {
			sync: undefined, /* TODO: Convert mock */
			setTrack: undefined, /* TODO: Convert mock */
			removeTrack: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		};
		const publisher = new BroadcastPublisher("room", "path", mockCatalog as any);
		const track = { name: "video" } as any;
		const encoder = {} as any;
		publisher.setTrack(track, encoder);
		expect(mockCatalog.setTrack).toHaveBeenCalledWith(track);
	});

	test("removeTrack calls catalog encoder removeTrack", () => {
		const mockCatalog = {
			sync: undefined, /* TODO: Convert mock */
			setTrack: undefined, /* TODO: Convert mock */
			removeTrack: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		};
		const publisher = new BroadcastPublisher("room", "path", mockCatalog as any);
		publisher.removeTrack("video");
		expect(mockCatalog.removeTrack).toHaveBeenCalledWith("video");
	});

	test("serveTrack calls encoder encodeTo", async () => {
		const mockCatalog = {
			sync: undefined, /* TODO: Convert mock */
			setTrack: undefined, /* TODO: Convert mock */
			removeTrack: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		};
		const publisher = new BroadcastPublisher("room", "path", mockCatalog as any);
		const ctx = Promise.resolve();
		const track = {
			trackName: "video",
			closeWithError: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		} as any;
		const encoder = {
			encodeTo: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
			close: undefined, /* TODO: Convert mock */
			encoding: "mock",
		} as any;
		publisher.setTrack({ name: "video", priority: 0, schema: "", config: {} }, encoder);
		await publisher.serveTrack(ctx, track);
		expect(encoder.encodeTo).toHaveBeenCalledWith(ctx, track);
	});

	test("close calls catalog encoder close", async () => {
		const mockCatalog = {
			sync: undefined, /* TODO: Convert mock */
			setTrack: undefined, /* TODO: Convert mock */
			removeTrack: undefined, /* TODO: Convert mock */
			close: undefined, /* TODO: Convert mock */
		};
		const publisher = new BroadcastPublisher("room", "path", mockCatalog as any);
		await publisher.close();
		expect(mockCatalog.close).toHaveBeenCalled();
	});
});

describe("BroadcastSubscriber", () => {
	const flushPromises = () => Promise.resolve();
	let mockSession: {
		subscribe: ReturnType<typeof vi.fn>;
	};
	let mockTrack: {
		trackName: string;
		closeWithError: ReturnType<typeof vi.fn>;
	};

	/* TODO: Convert beforeEach */ beforeEach(() => {
		mockTrack = {
			trackName: "catalog",
			closeWithError: vi.fn(async () => undefined),
		};

		mockSession = {
			subscribe: vi.fn(async () => [mockTrack, undefined]),
		};
	});

	it("computes participant name and subscribes to catalog track", async () => {
		const mockCatalog = {
			decodeFrom: vi.fn(async () => undefined),
			nextTrack: vi.fn(async () => [{ name: "catalog" }, undefined] as any),
			root: vi.fn(async () => ({ version: "1", tracks: [] })),
			close: undefined, /* TODO: Convert mock */
		};
		const subscriber = new BroadcastSubscriber(
			"/path/to/broadcast",
			"room-1",
			mockSession as any,
			mockCatalog as any,
		);

		await flushPromises();

		expect(mockSession.subscribe).toHaveBeenCalledWith("/path/to/broadcast", "catalog");
		assertEquals(subscriber.name, "participant");

		// participant name should be set on the subscriber (do not assert internal helper calls)
		assertEquals(subscriber.name, "participant");

		expect(mockCatalog.decodeFrom).toHaveBeenCalled();
	});

	it("returns error when subscribeTrack fails", async () => {
		const subscriptionError = new Error("subscribe failed");

		const mockCatalog = {
			decodeFrom: vi.fn(async () => undefined),
			nextTrack: vi.fn(async () => [{ name: "catalog" }, undefined] as any),
			root: vi.fn(async () => ({ version: "1", tracks: [] })),
			close: undefined, /* TODO: Convert mock */
		};
		const subscriber = new BroadcastSubscriber(
			"/path",
			"room",
			mockSession as any,
			mockCatalog as any,
		);
		await flushPromises();

		mockSession.subscribe.mockImplementationOnce(async () => [undefined, subscriptionError]);

		const decoder = { decodeFrom: undefined /* TODO: Convert mock */ };
		const result = await subscriber.subscribeTrack("video", decoder as any);

		assertEquals(result, subscriptionError);
		expect(decoder.decodeFrom).not.toHaveBeenCalled();
	});

	it("cancels context on close", async () => {
		const mockCatalog = {
			decodeFrom: vi.fn(async () => undefined),
			nextTrack: vi.fn(async () => [{ name: "catalog" }, undefined] as any),
			root: vi.fn(async () => ({ version: "1", tracks: [] })),
			close: undefined, /* TODO: Convert mock */
		};
		const subscriber = new BroadcastSubscriber(
			"/path",
			"room",
			mockSession as any,
			mockCatalog as any,
		);
		await flushPromises();

		// withCancelCause のモックを取得
		const callResult = vi.mocked(withCancelCause).mock.results[0]?.value as [
			unknown,
			ReturnType<typeof vi.fn>,
		];
		const cancel = callResult ? callResult[1] : undefined;

		subscriber.close();

		assertExists(cancel);
		if (cancel) {
			expect(cancel).toHaveBeenCalled();
		}
	});
});
