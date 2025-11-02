import type { Mocked } from 'vitest';
import { Camera, CameraProps } from "./camera.ts";
import { Device } from "./device.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


// Mock the Device class to isolate Camera behavior from actual device access
vi.mock("./device", () => ({
    Device: undefined /* TODO: Convert mock */.mockImplementation(() => ({
        getTrack: undefined /* TODO: Convert mock */,
        close: undefined /* TODO: Convert mock */,
    })),
}));

describe("Camera", () => {
    let mockDevice: Mocked<Device>;

    /* TODO: Convert beforeEach */ beforeEach(() => {
        vi.clearAllMocks();
        
        mockDevice = {
            getTrack: undefined /* TODO: Convert mock */,
            close: undefined /* TODO: Convert mock */,
        } as any;

        (Device as MockedClass<typeof Device>).mockReturnValue(mockDevice);
    });

    describe("Constructor", () => {
        test("creates camera with default props", () => {
            const camera = new Camera();

            assertEquals(camera.enabled, false);
            assertEquals(camera.constraints, undefined);
            assertEquals(camera.device, mockDevice);
            expect(Device).toHaveBeenCalledWith("video", undefined);
        });

        test("creates camera with enabled=true", () => {
            const camera = new Camera({ enabled: true });

            assertEquals(camera.enabled, true);
            assertEquals(camera.constraints, undefined);
            expect(Device).toHaveBeenCalledWith("video", undefined);
        });

        test("creates camera with device props", () => {
            const deviceProps = { preferred: "camera-device-id" };
            const camera = new Camera({ device: deviceProps });

            assertEquals(camera.enabled, false);
            expect(Device).toHaveBeenCalledWith("video", deviceProps);
        });

        test("creates camera with constraints", () => {
            const constraints = { width: 1920, height: 1080, frameRate: 30 };
            const camera = new Camera({ constraints });

            assertEquals(camera.constraints, constraints);
            expect(Device).toHaveBeenCalledWith("video", undefined);
        });

        test("creates camera with all props", () => {
            const deviceProps = { preferred: "camera-device-id" };
            const constraints = { width: 640, height: 480 };
            const props: CameraProps = {
                device: deviceProps,
                enabled: true,
                constraints
            };

            const camera = new Camera(props);

            assertEquals(camera.enabled, true);
            assertEquals(camera.constraints, constraints);
            expect(Device).toHaveBeenCalledWith("video", deviceProps);
        });
    });

    describe("getVideoTrack", () => {
        test("gets video track when enabled", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true });
            const track = await camera.getVideoTrack();

            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });

        test("gets video track with constraints", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            const constraints = { width: 1920, height: 1080 };
            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true, constraints });
            const track = await camera.getVideoTrack();

            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(constraints);
        });

        test("returns cached stream on subsequent calls", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true });
            
            // First call
            const track1 = await camera.getVideoTrack();
            assertEquals(track1, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1);

            // Second call should return cached stream
            const track2 = await camera.getVideoTrack();
            assertEquals(track2, mockTrack);
            assertEquals(track2, track1);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1); // Not called again
        });

        test("throws error when camera is not enabled", async () => {
            const camera = new Camera({ enabled: false });

            await expect(camera.getVideoTrack()).rejects.toThrow("Camera is not enabled");
            expect(mockDevice.getTrack).not.toHaveBeenCalled();
        });

        test("throws error when camera is disabled by default", async () => {
            const camera = new Camera(); // enabled defaults to false

            await expect(camera.getVideoTrack()).rejects.toThrow("Camera is not enabled");
            expect(mockDevice.getTrack).not.toHaveBeenCalled();
        });

        test("throws error when device fails to get track", async () => {
            mockDevice.getTrack.mockResolvedValue(undefined);

            const camera = new Camera({ enabled: true });

            await expect(camera.getVideoTrack()).rejects.toThrow("Failed to obtain camera track");
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });

        test("throws error when device.getTrack rejects", async () => {
            const deviceError = new Error("Device access denied");
            mockDevice.getTrack.mockRejectedValue(deviceError);

            const camera = new Camera({ enabled: true });

            await expect(camera.getVideoTrack()).rejects.toThrow("Device access denied");
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });
    });

    describe("close", () => {
        test("stops track and closes device when stream exists", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true });
            
            // Get a track first
            await camera.getVideoTrack();
            expect(mockTrack.stop).not.toHaveBeenCalled();

            // Close the camera
            camera.close();

            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("closes device when no stream exists", () => {
            const camera = new Camera();

            camera.close();

            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("clears stream reference after closing", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true });
            
            // Get a track first
            const track1 = await camera.getVideoTrack();
            assertEquals(track1, mockTrack);

            // Close the camera
            camera.close();

            // Verify stream is cleared - next call should get new track
            const mockTrack2 = {
                kind: "video",
                id: "video-track-2",
                stop: undefined /* TODO: Convert mock */
            } as any;
            mockDevice.getTrack.mockResolvedValue(mockTrack2);

            const track2 = await camera.getVideoTrack();
            assertEquals(track2, mockTrack2);
            assert(track2 !== track1);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(2);
        });

        test("handles track.stop() throwing error gracefully", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */.mockImplementation(() => {
                    throw new Error("Stop failed");
                })
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const camera = new Camera({ enabled: true });
            
            // Get a track first
            await camera.getVideoTrack();

            // Close should not throw even if stop() fails
            expect(() => camera.close()).not.toThrow();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("handles device.close() throwing error gracefully", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);
            mockDevice.close.mockImplementation(() => {
                throw new Error("Device close failed");
            });

            const camera = new Camera({ enabled: true });
            
            // Get a track first
            await camera.getVideoTrack();

            // Close should not throw even if device.close() fails
            expect(() => camera.close()).not.toThrow();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("Integration and Real-world Scenarios", () => {
        test("handles complete camera lifecycle", async () => {
            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const constraints = { width: 1280, height: 720, frameRate: 30 };
            const camera = new Camera({ 
                enabled: true, 
                constraints,
                device: { preferred: "front-camera" }
            });

            // Verify initial state
            assertEquals(camera.enabled, true);
            assertEquals(camera.constraints, constraints);

            // Get video track
            const track = await camera.getVideoTrack();
            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(constraints);

            // Verify cached behavior
            const track2 = await camera.getVideoTrack();
            assertEquals(track2, track);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1);

            // Close and cleanup
            camera.close();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("handles camera enable/disable workflow", async () => {
            const camera = new Camera({ enabled: false });

            // Should throw when disabled
            await expect(camera.getVideoTrack()).rejects.toThrow("Camera is not enabled");

            // Enable camera
            camera.enabled = true;

            const mockTrack = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;
            mockDevice.getTrack.mockResolvedValue(mockTrack);

            // Should work when enabled
            const track = await camera.getVideoTrack();
            assertEquals(track, mockTrack);

            // Disable again
            camera.enabled = false;

            // Should throw again when disabled
            await expect(camera.getVideoTrack()).rejects.toThrow("Camera is not enabled");

            camera.close();
        });

        test("handles device constraints updates", async () => {
            const camera = new Camera({ enabled: true });

            const mockTrack1 = {
                kind: "video",
                id: "video-track-1",
                stop: undefined /* TODO: Convert mock */
            } as any;

            // First call with no constraints
            mockDevice.getTrack.mockResolvedValueOnce(mockTrack1);
            const track1 = await camera.getVideoTrack();
            assertEquals(track1, mockTrack1);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);

            // Close current stream
            camera.close();

            // Update constraints
            camera.constraints = { width: 1920, height: 1080 };

            const mockTrack2 = {
                kind: "video",
                id: "video-track-2", 
                stop: undefined /* TODO: Convert mock */
            } as any;

            // Second call with new constraints
            mockDevice.getTrack.mockResolvedValueOnce(mockTrack2);
            const track2 = await camera.getVideoTrack();
            assertEquals(track2, mockTrack2);
            expect(mockDevice.getTrack).toHaveBeenLastCalledWith({ width: 1920, height: 1080 });

            camera.close();
        });
    });
});
