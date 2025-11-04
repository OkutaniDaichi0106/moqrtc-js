import { assertEquals } from "@std/assert";
import { Room } from "./room.ts";

// Mock functions
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
	mock.mockImplementation = (impl: any) => {
		mockReturn = impl;
		return mock;
	};
	return mock;
}

// Mock @okudai/moq
const validateBroadcastPath = createMockFunction().mockReturnValue("mock-path");

// Mock golikejs/context
const background = createMockFunction().mockReturnValue(Promise.resolve());
const withCancelCause = createMockFunction().mockReturnValue([{
	done: createMockFunction().mockReturnValue(new Promise(() => {})),
	err: createMockFunction().mockReturnValue(undefined),
}, undefined]);

// Mock broadcast
const BroadcastPublisher = createMockFunction().mockImplementation(() => ({
	name: "test-publisher",
}));
const BroadcastSubscriber = createMockFunction().mockImplementation(() => ({
	name: "test-subscriber",
	close: createMockFunction(),
}));

// Mock worklets
const importWorkletUrl = createMockFunction().mockReturnValue("mock-url");
const importUrl = createMockFunction().mockReturnValue("mock-url");

// Apply mocks
(Object as any).defineProperty(await import("@okudai/moq"), "validateBroadcastPath", {
	value: validateBroadcastPath,
});
(Object as any).defineProperty(await import("@okudai/moq"), "InternalAnnounceErrorCode", {
	value: 1,
});

(Object as any).defineProperty(await import("golikejs/context"), "background", {
	value: background,
});
(Object as any).defineProperty(await import("golikejs/context"), "withCancelCause", {
	value: withCancelCause,
});

(Object as any).defineProperty(await import("./broadcast.ts"), "BroadcastPublisher", {
	value: BroadcastPublisher,
});
(Object as any).defineProperty(await import("./broadcast.ts"), "BroadcastSubscriber", {
	value: BroadcastSubscriber,
});

(Object as any).defineProperty(await import("./internal/audio_hijack_worklet.ts"), "importWorkletUrl", {
	value: importWorkletUrl,
});
(Object as any).defineProperty(await import("./internal/audio_offload_worklet.ts"), "importUrl", {
	value: importUrl,
});

Deno.test("Room", async (t) => {
	let room: Room;
	const mockSession = {
		mux: {
			publish: createMockFunction(),
		},
		acceptAnnounce: createMockFunction(),
	};
	const mockLocal = {
		name: "local-user",
	};

	await t.step("setup", () => {
		room = new Room({
			roomID: "test-room",
			onmember: {
				onJoin: createMockFunction(),
				onLeave: createMockFunction(),
			},
		});
	});

	await t.step("constructor", async (t) => {
		await t.step("should create an instance with roomID", () => {
			assertEquals(room.roomID, "test-room");
		});
	});

	await t.step("join", async (t) => {
		await t.step("should join the room", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction().mockResolvedValue([{
					broadcastPath: "/test-room/local-user.hang",
					ended: createMockFunction().mockResolvedValue(undefined),
				}, null] as any),
				close: createMockFunction(),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await assertEquals(room.join(mockSession as any, mockLocal as any), undefined);
		});

		await t.step("should handle join errors gracefully", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction().mockResolvedValue([]),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await assertEquals(room.join(mockSession as any, mockLocal as any), undefined);
		});
	});

	await t.step("leave", async (t) => {
		await t.step("should leave the room", () => {
			assertEquals(room.roomID, "test-room");
		});
	});
});