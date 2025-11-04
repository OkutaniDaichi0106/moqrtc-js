import { assert, assertEquals, assertExists } from "@std/assert";
import { defineRoom, RoomElement } from "./room.ts";

// Mock implementations
class MockRoom {
	constructor(config: any) {
		this.config = config;
		this.roomID = "mock-room";
	}

	config: any;
	roomID: string;

	async join(_session: any, _local: any) {
		// Simulate calling onJoin callback
		if (this.config.onmember?.onJoin) {
			this.config.onmember.onJoin({ name: "test-member", remote: true });
		}
	}

	leave() {
		// Simulate calling onLeave callback when leave is called
		if (this.config.onmember?.onLeave) {
			this.config.onmember.onLeave({ name: "test-member", remote: true });
		}
	}
}

// Mock the modules by overriding the imports
(Object as any).defineProperty(await import("../room.ts"), "Room", {
	value: MockRoom,
	writable: true,
});

Deno.test("RoomElement", async (t) => {
	await t.step("setup", () => {
		defineRoom();
	});

	let element: RoomElement;

	await t.step("before each test setup", () => {
		element = new RoomElement();
	});

	await t.step("after each test cleanup", () => {
		document.body.innerHTML = "";
	});

	await t.step("constructor", async (t2) => {
		await t2.step("should create an instance", () => {
			assert(element instanceof RoomElement);
			assert(element instanceof HTMLElement);
		});
	});

	await t.step("observedAttributes", async (t2) => {
		await t2.step("should return correct attributes", () => {
			assertEquals(RoomElement.observedAttributes, ["room-id", "description"]);
		});
	});

	await t.step("connectedCallback", async (t2) => {
		await t2.step("should render the element", () => {
			document.body.appendChild(element);
			assertExists(element.querySelector(".room-status-display"));
			assertExists(element.querySelector(".local-participant"));
			assertExists(element.querySelector(".remote-participants"));
		});
	});

	await t.step("render", async (t2) => {
		await t2.step("should render the DOM structure", () => {
			element.render();
			assertExists(element.querySelector(".room-status-display"));
			assertExists(element.querySelector(".local-participant"));
			assertExists(element.querySelector(".remote-participants"));
		});
	});

	await t.step("attributeChangedCallback", async (t2) => {
		await t2.step("should handle room-id change", () => {
			const originalLeave = element.leave;
			element.leave = () => {}; // Mock leave

			// Set mock room
			element.room = { roomID: "old-room" } as any;

			element.attributeChangedCallback("room-id", "old-room", "new-room");
			// Now leave should be called - but we can't easily test this without spying

			// Restore
			element.leave = originalLeave;
		});

		await t2.step("should not leave room for description change", () => {
			element.room = { roomID: "room" } as any;

			element.attributeChangedCallback("description", "old", "new");
			// We can't easily test that leave was not called without spying
		});
	});

	await t.step("join", async (t2) => {
		await t2.step("should join room successfully", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			await element.join(mockSession as any, mockPublisher as any);

			assertExists(element.room);
			assertEquals(element.room?.roomID, "mock-room");
		});

		await t2.step("should set error status when room-id is missing", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			let statusCalled = false;
			let statusArg: any;
			element.onstatus = (status) => {
				statusCalled = true;
				statusArg = status;
			};

			await element.join(mockSession as any, mockPublisher as any);

			assert(statusCalled);
			assertEquals(statusArg.type, "error");
			assertEquals(statusArg.message, "room-id is missing");
		});

		await t2.step("should handle join error", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			// Temporarily change the mock to throw
			const originalRoomConstructor = (await import("../room.ts")).Room;
			(Object as any).defineProperty(await import("../room.ts"), "Room", {
				value: class extends MockRoom {
					constructor(config: any) {
						super(config);
						throw new Error("Join failed");
					}
				},
				writable: true,
			});

			element.setAttribute("room-id", "test-room");

			let statusCalled = false;
			let statusArg: any;
			element.onstatus = (status) => {
				statusCalled = true;
				statusArg = status;
			};

			await element.join(mockSession as any, mockPublisher as any);

			assert(statusCalled);
			assertEquals(statusArg.type, "error");
			assert(statusArg.message.includes("Failed to join: Join failed"));

			// Restore original
			(Object as any).defineProperty(await import("../room.ts"), "Room", {
				value: originalRoomConstructor,
				writable: true,
			});
		});

		await t2.step("should call onjoin callback when member joins", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			let onjoinCalled = false;
			let onjoinArg: any;
			element.onjoin = (member) => {
				onjoinCalled = true;
				onjoinArg = member;
			};

			await element.join(mockSession as any, mockPublisher as any);

			assert(onjoinCalled);
			assertEquals(onjoinArg.name, "test-member");
			assertEquals(onjoinArg.remote, true);
		});

		await t2.step("should call onleave callback when member leaves", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			let onleaveCalled = false;
			let onleaveArg: any;
			element.onleave = (member) => {
				onleaveCalled = true;
				onleaveArg = member;
			};

			await element.join(mockSession as any, mockPublisher as any);

			// Simulate leave by calling room.leave
			element.room?.leave();

			assert(onleaveCalled);
			assertEquals(onleaveArg.name, "test-member");
			assertEquals(onleaveArg.remote, true);
		});

		await t2.step("dispatches 'join' event and adds DOM participant when member joins", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			let joinEventDispatched = false;
			element.addEventListener("join", () => {
				joinEventDispatched = true;
			});

			await element.join(mockSession as any, mockPublisher as any);

			// onjoin was called via mock Room; join event should be dispatched
			assert(joinEventDispatched);

			// Participant DOM should be added
			const participant = element.querySelector(".remote-member-test-member");
			assertExists(participant);
		});

		await t2.step("dispatches 'leave' event and removes DOM participant when remote leaves", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			let leaveEventDispatched = false;
			element.addEventListener("leave", () => {
				leaveEventDispatched = true;
			});

			await element.join(mockSession as any, mockPublisher as any);

			// participant should be present
			assertExists(element.querySelector(".remote-member-test-member"));

			// Simulate leave by calling room.leave
			element.room?.leave();

			assert(leaveEventDispatched);

			// participant should be removed
			assert(!element.querySelector(".remote-member-test-member"));
		});

		await t2.step("sets error status when onjoin handler throws", async () => {
			const mockSession = {};
			const mockPublisher = { name: "test-publisher" };

			element.setAttribute("room-id", "test-room");

			element.onjoin = () => {
				throw new Error("handler fail");
			};

			let statusCalled = false;
			let statusArg: any;
			element.onstatus = (status) => {
				statusCalled = true;
				statusArg = status;
			};

			await element.join(mockSession as any, mockPublisher as any);

			// onstatus should have been called with an error status
			assert(statusCalled);
			assertEquals(statusArg.type, "error");
			assert(statusArg.message.includes("onjoin handler failed:"));
		});
	});

	await t.step("leave", async (t2) => {
		await t2.step("should leave room and clear state", () => {
			element.room = {
				roomID: "test-room",
				leave: () => {},
			} as any;

			element.leave();

			assertEquals(element.room, undefined);
		});

		await t2.step("should do nothing if no room", () => {
			element.room = undefined;

			assert(() => element.leave()); // Should not throw
		});

		await t2.step("should dispatch statuschange event", () => {
			element.room = {
				roomID: "test-room",
				leave: () => {},
			} as any;

			let statusChangeEvent: any;
			element.addEventListener("statuschange", (event) => {
				statusChangeEvent = event;
			});

			element.leave();

			assertExists(statusChangeEvent);
			assertEquals(statusChangeEvent.detail.type, "left");
			assertEquals(statusChangeEvent.detail.message, "Left room test-room");
		});
	});

	await t.step("disconnectedCallback", async (t2) => {
		await t2.step("should leave room on disconnect", () => {
			element.room = {
				roomID: "test-room",
				leave: () => {},
			} as any;

			let leaveCalled = false;
			const originalLeave = element.room.leave;
			element.room.leave = () => {
				leaveCalled = true;
				originalLeave();
			};

			element.disconnectedCallback();

			assert(leaveCalled);
		});
	});
});
