import { broadcastPath, participantName, Room } from "./room.ts";

vi.mock("@okutanidaichi/moqt", () => ({
	validateBroadcastPath: vi.fn((path: string) => path),
	InternalAnnounceErrorCode: 1,
}));

vi.mock("golikejs/context", () => ({
	background: vi.fn(() => Promise.resolve()),
	withCancelCause: vi.fn(() => [{
		done: vi.fn(() => new Promise(() => {})),
		err: vi.fn(() => undefined),
	}, undefined /* TODO: Convert mock */]),
	withPromise: undefined, /* TODO: Convert mock */
}));

vi.mock("./broadcast", () => ({
	BroadcastPublisher: undefined /* TODO: Convert mock */.mockImplementation(() => ({
		name: "test-publisher",
	})),
	BroadcastSubscriber: undefined /* TODO: Convert mock */.mockImplementation(() => ({
		name: "test-subscriber",
		close: undefined, /* TODO: Convert mock */
	})),
}));

vi.mock("./internal/audio_hijack_worklet", () => ({
	importWorkletUrl: vi.fn(() => "mock-url"),
}));

vi.mock("./internal/audio_offload_worklet", () => ({
	importUrl: vi.fn(() => "mock-url"),
}));

describe("Room", () => {
	let room: Room;
	const mockSession = {
		mux: {
			publish: undefined, /* TODO: Convert mock */
		},
		acceptAnnounce: undefined, /* TODO: Convert mock */
	};
	const mockLocal = {
		name: "local-user",
	};

	/* TODO: Convert beforeEach */ beforeEach(() => {
		room = new Room({
			roomID: "test-room",
			onmember: {
				onJoin: undefined, /* TODO: Convert mock */
				onLeave: undefined, /* TODO: Convert mock */
			},
		});
	});

	describe("constructor", () => {
		it("should create an instance with roomID", () => {
			assertEquals(room.roomID, "test-room");
		});
	});

	describe("join", () => {
		it("should join the room", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */.mockResolvedValue([{
					broadcastPath: "/test-room/local-user.hang",
					ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
				}, null] as any),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await expect(room.join(mockSession as any, mockLocal as any)).resolves.not.toThrow();
		});

		it("should handle join errors gracefully", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */.mockResolvedValue([
					null,
					new Error("Network error"),
				]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			// Should not throw even if announcement reader fails
			await expect(room.join(mockSession as any, mockLocal as any)).resolves.not.toThrow();
		});
	});

	describe("leave", () => {
		it("should leave the room", async () => {
			await expect(room.leave()).resolves.not.toThrow();
		});

		it("should handle leave when not joined", async () => {
			// Leave without joining first
			await expect(room.leave()).resolves.not.toThrow();
		});
	});
});

vi.mock("@okutanidaichi/moqt", () => ({
	validateBroadcastPath: vi.fn((p: string) => p),
}));

import * as moqt from "@okutanidaichi/moqt";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

describe("room utils", () => {
	it("broadcastPath calls validateBroadcastPath with constructed path", () => {
		const res = broadcastPath("myroom", "alice");
		assertEquals(res, "/myroom/alice.hang");

		const mocked = vi.mocked(moqt);
		expect(mocked.validateBroadcastPath).toHaveBeenCalledWith("/myroom/alice.hang");
	});

	it("participantName extracts name from broadcast path", () => {
		expect(participantName("myroom", "/myroom/alice.hang")).toBe("alice");
		expect(participantName("r", "/r/bob.hang")).toBe("bob");
		// when name contains dots or dashes
		expect(participantName("room-x", "/room-x/john.doe.hang")).toBe("john.doe");
	});
});

describe("Room - Advanced Tests", () => {
	let room: Room;
	const mockSession = {
		mux: {
			publish: undefined, /* TODO: Convert mock */
		},
		acceptAnnounce: undefined, /* TODO: Convert mock */
	};
	const mockLocal = {
		name: "local-user",
	};
	let onJoinSpy: any;
	let onLeaveSpy: any;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		onJoinSpy = undefined /* TODO: Convert mock */;
		onLeaveSpy = undefined /* TODO: Convert mock */;
		room = new Room({
			roomID: "test-room",
			onmember: {
				onJoin: onJoinSpy,
				onLeave: onLeaveSpy,
			},
		});
	});

	describe("join with announcement processing", () => {
		it("should handle local announcement acknowledgment", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			expect(onJoinSpy).toHaveBeenCalledWith({
				remote: false,
				name: "local-user",
			});
		});

		it("should handle remote announcement and add subscriber", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			expect(onJoinSpy).toHaveBeenCalled();
		});

		it("should handle acceptAnnounce failure", async () => {
			const error = new Error("Failed to accept announce");
			mockSession.acceptAnnounce.mockResolvedValue([null, error] as any);

			await expect(room.join(mockSession as any, mockLocal as any)).rejects.toThrow(error);
		});

		it("should handle multiple remote announcements", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-1.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-2.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			// Should have called onJoin for both remotes
			expect(onJoinSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("leave functionality", () => {
		it("should clean up all resources on leave", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);
			await room.leave();

			// Verify that leave completes without errors
			expect(onLeaveSpy).toHaveBeenCalled();
		});

		it("should handle leave before join", async () => {
			await expect(room.leave()).resolves.not.toThrow();
		});

		it("should handle multiple leave calls", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);
			await room.leave();
			await room.leave(); // Second leave should not throw

			assertEquals(true, true);
		});
	});

	describe("member management", () => {
		it("should call onJoin for local member", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			expect(onJoinSpy).toHaveBeenCalledWith({
				remote: false,
				name: "local-user",
			});
		});

		it("should call onLeave for local member on leave", async () => {
			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);
			await room.leave();

			expect(onLeaveSpy).toHaveBeenCalledWith({
				remote: false,
				name: "local-user",
			});
		});

		it("should handle announcement errors gracefully", async () => {
			const consoleWarnSpy = /* TODO: Convert spy */ undefined(console, "warn")
				.mockImplementation(() => {});

			const mockAnnouncementReader = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			// Should complete without throwing
			assertEquals(true, true);

			consoleWarnSpy.mockRestore();
		});
	});

	describe("rejoin functionality", () => {
		it("should leave before joining again", async () => {
			const mockAnnouncementReader1 = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			const mockAnnouncementReader2 = {
				receive: undefined /* TODO: Convert mock */
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: undefined, /* TODO: Convert mock */
			};
			mockSession.acceptAnnounce
				.mockResolvedValueOnce([mockAnnouncementReader1, null] as any)
				.mockResolvedValueOnce([mockAnnouncementReader2, null] as any);

			// First join
			await room.join(mockSession as any, mockLocal as any);

			// Second join (should leave first)
			await room.join(mockSession as any, mockLocal as any);

			// onJoin should be called twice (once for each join)
			expect(onJoinSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("edge cases", () => {
		it("should handle empty room ID", async () => {
			const emptyRoom = new Room({
				roomID: "",
				onmember: {
					onJoin: undefined, /* TODO: Convert mock */
					onLeave: undefined, /* TODO: Convert mock */
				},
			});

			assertEquals(emptyRoom.roomID, "");
		});

		it("should handle special characters in room ID", async () => {
			const specialRoom = new Room({
				roomID: "room-with-special_chars.123",
				onmember: {
					onJoin: undefined, /* TODO: Convert mock */
					onLeave: undefined, /* TODO: Convert mock */
				},
			});

			assertEquals(specialRoom.roomID, "room-with-special_chars.123");
		});

		it("should handle participant name with special characters", () => {
			const name = participantName("test-room", "/test-room/user-name_123.hang");
			assertEquals(name, "user-name_123");
		});

		it("should construct correct broadcast path for various names", () => {
			expect(broadcastPath("room", "user")).toBe("/room/user.hang");
			expect(broadcastPath("room-1", "user-2")).toBe("/room-1/user-2.hang");
			expect(broadcastPath("r", "u")).toBe("/r/u.hang");
		});
	});
});
