import { RoomElement, defineRoom } from "./room.ts";
import { Room } from "../room.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";

vi.mock("../room", () => ({
    Room: undefined /* TODO: Convert mock */.mockImplementation((config) => ({
        join: undefined /* TODO: Convert mock */.mockImplementation(async (session, local) => {
            // Simulate calling onJoin callback
            if (config.onmember?.onJoin) {
                config.onmember.onJoin({ name: "test-member", remote: true });
            }
        }),
        leave: undefined /* TODO: Convert mock */.mockImplementation(() => {
            // Simulate calling onLeave callback when leave is called
            if (config.onmember?.onLeave) {
                config.onmember.onLeave({ name: "test-member", remote: true });
            }
        }),
        roomID: "mock-room",
    })),
}));

vi.mock("../internal/audio_hijack_worklet", () => ({
    importWorkletUrl: vi.fn(() => "mock-url"),
}));

vi.mock("../internal/audio_offload_worklet", () => ({
    importUrl: vi.fn(() => "mock-url"),
}));

describe("RoomElement", () => {
    beforeAll(() => {
        defineRoom();
    });

    let element: RoomElement;

    /* TODO: Convert beforeEach */ beforeEach(() => {
        element = new RoomElement();
    });

    /* TODO: Convert afterEach */ afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should create an instance", () => {
            assert(element instanceof RoomElement);
            assert(element instanceof HTMLElement);
        });
    });

    describe("observedAttributes", () => {
        it("should return correct attributes", () => {
            assertEquals(RoomElement.observedAttributes, ["room-id", "description"]);
        });
    });

    describe("connectedCallback", () => {
        it("should render the element", () => {
            document.body.appendChild(element);
            expect(element.querySelector('.room-status-display')).toBeTruthy();
            expect(element.querySelector('.local-participant')).toBeTruthy();
            expect(element.querySelector('.remote-participants')).toBeTruthy();
        });
    });

    describe("render", () => {
        it("should render the DOM structure", () => {
            element.render();
            expect(element.querySelector('.room-status-display')).toBeTruthy();
            expect(element.querySelector('.local-participant')).toBeTruthy();
            expect(element.querySelector('.remote-participants')).toBeTruthy();
        });
    });

    describe("attributeChangedCallback", () => {
        it("should handle room-id change", () => {
            const originalLeave = element.leave;
            element.leave = undefined /* TODO: Convert mock */;

            // Set mock room
            element.room = { roomID: "old-room" } as any;

            element.attributeChangedCallback('room-id', 'old-room', 'new-room');
            // Now leave should be called
            expect(element.leave).toHaveBeenCalled();

            // Restore
            element.leave = originalLeave;
        });

        it("should not leave room for description change", () => {
            const leaveSpy = /* TODO: Convert spy */ undefined(element, "leave");

            element.room = { roomID: "room" } as any;

            element.attributeChangedCallback('description', 'old', 'new');
            expect(leaveSpy).not.toHaveBeenCalled();
        });
    });

    describe("join", () => {
        it("should join room successfully", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            element.setAttribute('room-id', 'test-room');

            await element.join(mockSession as any, mockPublisher as any);

            assertExists(element.room);
            assertEquals(element.room?.roomID, "mock-room");
        });

        it("should set error status when room-id is missing", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            const statusSpy = undefined /* TODO: Convert mock */;
            element.onstatus = statusSpy;

            await element.join(mockSession as any, mockPublisher as any);

            expect(statusSpy).toHaveBeenCalledWith({ type: 'error', message: 'room-id is missing' });
        });

        it("should handle join error", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            // Temporarily change the mock to throw
            const RoomMock = vi.mocked(Room);
            RoomMock.mockImplementationOnce(() => {
                throw new Error("Join failed");
            });

            element.setAttribute('room-id', 'test-room');

            const statusSpy = undefined /* TODO: Convert mock */;
            element.onstatus = statusSpy;

            await element.join(mockSession as any, mockPublisher as any);

            expect(statusSpy).toHaveBeenCalledWith({ type: 'error', message: 'Failed to join: Join failed' });
        });

        it("should call onjoin callback when member joins", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            element.setAttribute('room-id', 'test-room');

            const onjoinSpy = undefined /* TODO: Convert mock */;
            element.onjoin = onjoinSpy;

            await element.join(mockSession as any, mockPublisher as any);

            expect(onjoinSpy).toHaveBeenCalledWith({ name: "test-member", remote: true });
        });

        it("should call onleave callback when member leaves", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            element.setAttribute('room-id', 'test-room');

            const onleaveSpy = undefined /* TODO: Convert mock */;
            element.onleave = onleaveSpy;

            await element.join(mockSession as any, mockPublisher as any);

            // Simulate leave by calling room.leave
            element.room?.leave();

            expect(onleaveSpy).toHaveBeenCalledWith({ name: "test-member", remote: true });
        });

        it("dispatches 'join' event and adds DOM participant when member joins", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            element.setAttribute('room-id', 'test-room');

            const joinListener = vi.fn((ev: Event) => {
                // noop
            });
            element.addEventListener('join', joinListener as any);

            await element.join(mockSession as any, mockPublisher as any);

            // onjoin was called via mock Room; join event should be dispatched
            expect(joinListener).toHaveBeenCalled();

            // Participant DOM should be added
            const participant = element.querySelector('.remote-member-test-member');
            assert(participant);
        });

        it("dispatches 'leave' event and removes DOM participant when remote leaves", async () => {
            const mockSession = {};
            const mockPublisher = { name: "test-publisher" };

            element.setAttribute('room-id', 'test-room');

            const leaveListener = undefined /* TODO: Convert mock */;
            element.addEventListener('leave', leaveListener as any);

            await element.join(mockSession as any, mockPublisher as any);

            // participant should be present
            expect(element.querySelector('.remote-member-test-member')).toBeTruthy();

            // Simulate leave by calling room.leave
            element.room?.leave();

            expect(leaveListener).toHaveBeenCalled();

            // participant should be removed
            expect(element.querySelector('.remote-member-test-member')).toBeFalsy();
        });

        it('sets error status when onjoin handler throws', async () => {
            const mockSession = {};
            const mockPublisher = { name: 'test-publisher' };

            element.setAttribute('room-id', 'test-room');

            element.onjoin = () => { throw new Error('handler fail'); };

            const statusSpy = undefined /* TODO: Convert mock */;
            element.onstatus = statusSpy;

            await element.join(mockSession as any, mockPublisher as any);

            // onstatus should have been called with an error status
            expect(statusSpy).toHaveBeenCalled();
            const last = statusSpy.mock.calls[statusSpy.mock.calls.length - 1][0];
            assertEquals(last.type, 'error');
            expect(last.message).toMatch(/onjoin handler failed:/);
        });
    });

    describe("leave", () => {
        it("should leave room and clear state", () => {
            element.room = { roomID: "test-room", leave: undefined /* TODO: Convert mock */ } as any;

            element.leave();

            assertEquals(element.room, undefined);
        });

        it("should do nothing if no room", () => {
            element.room = undefined;

            expect(() => element.leave()).not.toThrow();
        });

        it("should dispatch statuschange event", () => {
            element.room = { roomID: "test-room", leave: undefined /* TODO: Convert mock */ } as any;

            const eventSpy = undefined /* TODO: Convert mock */;
            element.addEventListener('statuschange', eventSpy);

            element.leave();

            expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
                detail: { type: 'left', message: 'Left room test-room' }
            }));
        });
    });

    describe("disconnectedCallback", () => {
        it("should leave room on disconnect", () => {
            element.room = { roomID: "test-room", leave: undefined /* TODO: Convert mock */ } as any;
            const leaveSpy = /* TODO: Convert spy */ undefined(element.room as any, "leave");

            element.disconnectedCallback();

            expect(leaveSpy).toHaveBeenCalled();
        });
    });
});
