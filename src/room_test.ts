import { assert, assertEquals, assertRejects } from "@std/assert";
import { broadcastPath, participantName, Room } from "./room.ts";

// Mock functions
function createMockFunction() {
	const calls: any[] = [];
	const returnValues: any[] = [];
	let mockReturn: any = undefined;
	const mock = (...args: any[]) => {
		calls.push(args);
		mock.callCount++;
		if (returnValues.length > 0) {
			return returnValues.shift();
		}
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
	mock.mockResolvedValueOnce = (value: any) => {
		returnValues.push(Promise.resolve(value));
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

(Object as any).defineProperty(await import("./internal/audio/audio_hijack_worklet.ts"), "importWorkletUrl", {
	value: importWorkletUrl,
});
(Object as any).defineProperty(await import("./internal/audio/audio_offload_worklet.ts"), "importUrl", {
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

			await assert(room.join(mockSession as any, mockLocal as any));
		});

		await t.step("should handle join errors gracefully", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction().mockResolvedValue([
					null,
					new Error("Network error"),
				]),
				close: createMockFunction(),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			// Should not throw even if announcement reader fails
			await assert(room.join(mockSession as any, mockLocal as any));
		});
	});

	await t.step("leave", async (t) => {
		await t.step("should leave the room", async () => {
			await assert(room.leave());
		});

		await t.step("should handle leave when not joined", async () => {
			// Leave without joining first
			await assert(room.leave());
		});
	});
});

Deno.test("room utils", async (t) => {
	await t.step("broadcastPath calls validateBroadcastPath with constructed path", () => {
		const res = broadcastPath("myroom", "alice");
		assertEquals(res, "/myroom/alice.hang");

		// Note: validateBroadcastPath is mocked, check call count
		assertEquals(validateBroadcastPath.callCount, 1);
	});

	await t.step("participantName extracts name from broadcast path", () => {
		assertEquals(participantName("myroom", "/myroom/alice.hang"), "alice");
		assertEquals(participantName("r", "/r/bob.hang"), "bob");
		// when name contains dots or dashes
		assertEquals(participantName("room-x", "/room-x/john.doe.hang"), "john.doe");
	});
});

Deno.test("Room - Advanced Tests", async (t) => {
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
	let onJoinSpy: any;
	let onLeaveSpy: any;

	await t.step("setup", () => {
		onJoinSpy = createMockFunction();
		onLeaveSpy = createMockFunction();
		room = new Room({
			roomID: "test-room",
			onmember: {
				onJoin: onJoinSpy,
				onLeave: onLeaveSpy,
			},
		});
	});

	await t.step("join with announcement processing", async (t) => {
		await t.step("should handle local announcement acknowledgment", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction()
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/local-user.hang",
						ended: createMockFunction().mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: createMockFunction(),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			assertEquals(onJoinSpy.callCount, 1);
		});

		await t.step("should handle remote announcement and add subscriber", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction()
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-user.hang",
						ended: createMockFunction().mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: createMockFunction(),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			assertEquals(onJoinSpy.callCount, 1);
		});

		await t.step("should handle acceptAnnounce failure", async () => {
			const error = new Error("Failed to accept announce");
			mockSession.acceptAnnounce.mockResolvedValue([null, error] as any);

			await assertRejects(async () => {
				await room.join(mockSession as any, mockLocal as any);
			});
		});

		await t.step("should handle multiple remote announcements", async () => {
			const mockAnnouncementReader = {
				receive: createMockFunction()
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-1.hang",
						ended: createMockFunction().mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValueOnce([{
						broadcastPath: "/test-room/remote-2.hang",
						ended: createMockFunction().mockResolvedValue(undefined),
					}, null] as any)
					.mockResolvedValue([null, new Error("Reader closed")]),
				close: createMockFunction(),
			};
			mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

			await room.join(mockSession as any, mockLocal as any);

			// Should have called onJoin for both remotes
			assertEquals(onJoinSpy.callCount, 2);
		});
	});

		await t.step("leave functionality", async (t) => {
			await t.step("should clean up all resources on leave", async () => {
				const mockAnnouncementReader = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

				await room.join(mockSession as any, mockLocal as any);
				await room.leave();

				// Verify that leave completes without errors
				assertEquals(onLeaveSpy.callCount, 1);
			});

			await t.step("should handle leave before join", async () => {
				await room.leave();
				// Should not throw
				assertEquals(true, true);
			});

			await t.step("should handle multiple leave calls", async () => {
				const mockAnnouncementReader = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

				await room.join(mockSession as any, mockLocal as any);
				await room.leave();
				await room.leave(); // Second leave should not throw

				assertEquals(true, true);
			});
		});

		await t.step("member management", async (t) => {
			await t.step("should call onJoin for local member", async () => {
				const mockAnnouncementReader = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

				await room.join(mockSession as any, mockLocal as any);

				assertEquals(onJoinSpy.callCount, 1);
				assertEquals(onJoinSpy.calls[0][0], {
					remote: false,
					name: "local-user",
				});
			});

			await t.step("should call onLeave for local member on leave", async () => {
				const mockAnnouncementReader = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

				await room.join(mockSession as any, mockLocal as any);
				await room.leave();

				assertEquals(onLeaveSpy.callCount, 1);
				assertEquals(onLeaveSpy.calls[0][0], {
					remote: false,
					name: "local-user",
				});
			});

			await t.step("should handle announcement errors gracefully", async () => {
				const mockAnnouncementReader = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/remote-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce.mockResolvedValue([mockAnnouncementReader, null] as any);

				await room.join(mockSession as any, mockLocal as any);

				// Should complete without throwing
				assertEquals(true, true);
			});
		});

		await t.step("rejoin functionality", async (t) => {
			await t.step("should leave before joining again", async () => {
				const mockAnnouncementReader1 = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				const mockAnnouncementReader2 = {
					receive: createMockFunction()
						.mockResolvedValueOnce([{
							broadcastPath: "/test-room/local-user.hang",
							ended: createMockFunction().mockResolvedValue(undefined),
						}, null] as any)
						.mockResolvedValue([null, new Error("Reader closed")]),
					close: createMockFunction(),
				};
				mockSession.acceptAnnounce
					.mockResolvedValueOnce([mockAnnouncementReader1, null] as any)
					.mockResolvedValueOnce([mockAnnouncementReader2, null] as any);

				// First join
				await room.join(mockSession as any, mockLocal as any);

				// Second join (should leave first)
				await room.join(mockSession as any, mockLocal as any);

				// onJoin should be called twice (once for each join)
				assertEquals(onJoinSpy.callCount, 2);
			});
		});

		await t.step("edge cases", async (t) => {
			await t.step("should handle empty room ID", async () => {
				const emptyRoom = new Room({
					roomID: "",
					onmember: {
						onJoin: createMockFunction(),
						onLeave: createMockFunction(),
					},
				});

				assertEquals(emptyRoom.roomID, "");
			});

			await t.step("should handle special characters in room ID", async () => {
				const specialRoom = new Room({
					roomID: "room-with-special_chars.123",
					onmember: {
						onJoin: createMockFunction(),
						onLeave: createMockFunction(),
					},
				});

				assertEquals(specialRoom.roomID, "room-with-special_chars.123");
			});

			await t.step("should handle participant name with special characters", () => {
				const name = participantName("test-room", "/test-room/user-name_123.hang");
				assertEquals(name, "user-name_123");
			});

			await t.step("should construct correct broadcast path for various names", () => {
				assertEquals(broadcastPath("room", "user"), "/room/user.hang");
				assertEquals(broadcastPath("room-1", "user-2"), "/room-1/user-2.hang");
				assertEquals(broadcastPath("r", "u"), "/r/u.hang");
			});
		});
	});
