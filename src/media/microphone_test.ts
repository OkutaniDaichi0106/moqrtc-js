import { Microphone, MicrophoneProps } from "./microphone.ts";
import { Device } from "./device.ts";
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


// Mock the Device class
vi.mock("./device", () => ({
    Device: undefined /* TODO: Convert mock */.mockImplementation(() => ({
        getTrack: undefined /* TODO: Convert mock */,
        close: undefined /* TODO: Convert mock */,
    })),
}));

describe("Microphone", () => {
    let mockDevice: any;

    /* TODO: Convert beforeEach */ beforeEach(() => {
        vi.clearAllMocks();

        mockDevice = {
            getTrack: undefined /* TODO: Convert mock */,
            close: undefined /* TODO: Convert mock */,
        } as any;

        vi.mocked(Device).mockReturnValue(mockDevice);
    });

    describe("Constructor", () => {
        test("creates microphone with default props", () => {
            const microphone = new Microphone();

            assertEquals(microphone.enabled, false);
            assertEquals(microphone.constraints, undefined);
            assertEquals(microphone.device, mockDevice);
            expect(Device).toHaveBeenCalledWith("audio", undefined);
        });

        test("creates microphone with enabled=true", () => {
            const microphone = new Microphone({ enabled: true });

            assertEquals(microphone.enabled, true);
            assertEquals(microphone.constraints, undefined);
            expect(Device).toHaveBeenCalledWith("audio", undefined);
        });

        test("creates microphone with device props", () => {
            const deviceProps = { preferred: "microphone-device-id" };
            const microphone = new Microphone({ device: deviceProps });

            assertEquals(microphone.enabled, false);
            expect(Device).toHaveBeenCalledWith("audio", deviceProps);
        });

        test("creates microphone with constraints", () => {
            const constraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: false };
            const microphone = new Microphone({ constraints });

            assertEquals(microphone.constraints, constraints);
            expect(Device).toHaveBeenCalledWith("audio", undefined);
        });

        test("creates microphone with all props", () => {
            const deviceProps = { preferred: "microphone-device-id" };
            const constraints = { sampleRate: 48000, channelCount: 2 };
            const props: MicrophoneProps = {
                device: deviceProps,
                enabled: true,
                constraints
            };

            const microphone = new Microphone(props);

            assertEquals(microphone.enabled, true);
            assertEquals(microphone.constraints, constraints);
            expect(Device).toHaveBeenCalledWith("audio", deviceProps);
        });
    });

    describe("getAudioTrack", () => {
        test("gets audio track when enabled", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            const track = await microphone.getAudioTrack();

            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });

        test("gets audio track with constraints", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            const constraints = { echoCancellation: true, noiseSuppression: false };
            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true, constraints });
            const track = await microphone.getAudioTrack();

            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(constraints);
        });

        test("returns cached stream on subsequent calls", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            
            // First call
            const track1 = await microphone.getAudioTrack();
            assertEquals(track1, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1);

            // Second call should return cached stream
            const track2 = await microphone.getAudioTrack();
            assertEquals(track2, mockTrack);
            assertEquals(track2, track1);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1); // Not called again
        });

        test("throws error when microphone is not enabled", async () => {
            const microphone = new Microphone({ enabled: false });

            await expect(microphone.getAudioTrack()).rejects.toThrow("Microphone is not enabled");
            expect(mockDevice.getTrack).not.toHaveBeenCalled();
        });

        test("throws error when microphone is disabled by default", async () => {
            const microphone = new Microphone(); // enabled defaults to false

            await expect(microphone.getAudioTrack()).rejects.toThrow("Microphone is not enabled");
            expect(mockDevice.getTrack).not.toHaveBeenCalled();
        });

        test("throws error when device fails to get track", async () => {
            mockDevice.getTrack.mockResolvedValue(undefined);

            const microphone = new Microphone({ enabled: true });

            await expect(microphone.getAudioTrack()).rejects.toThrow("Failed to obtain microphone track");
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });

        test("throws error when device.getTrack rejects", async () => {
            const deviceError = new Error("Microphone access denied");
            mockDevice.getTrack.mockRejectedValue(deviceError);

            const microphone = new Microphone({ enabled: true });

            await expect(microphone.getAudioTrack()).rejects.toThrow("Microphone access denied");
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);
        });
    });

    describe("getSettings", () => {
        test("gets track settings when microphone is enabled", async () => {
            const mockSettings = {
                deviceId: "microphone-device-id",
                sampleRate: 48000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false
            };

            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue(mockSettings)
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            const settings = await microphone.getSettings();

            assertEquals(settings, mockSettings);
            expect(mockTrack.getSettings).toHaveBeenCalledTimes(1);
        });

        test("throws error when microphone is not enabled", async () => {
            const microphone = new Microphone({ enabled: false });

            await expect(microphone.getSettings()).rejects.toThrow("Microphone is not enabled");
            expect(mockDevice.getTrack).not.toHaveBeenCalled();
        });

        test("uses cached track for settings", async () => {
            const mockSettings = {
                deviceId: "microphone-device-id",
                sampleRate: 44100,
                channelCount: 2
            };

            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue(mockSettings)
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            
            // First get audio track
            await microphone.getAudioTrack();
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1);

            // Then get settings - should use cached track
            const settings = await microphone.getSettings();
            assertEquals(settings, mockSettings);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1); // Not called again
            expect(mockTrack.getSettings).toHaveBeenCalledTimes(1);
        });

        test("handles getSettings error gracefully", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockImplementation(() => {
                    throw new Error("Settings unavailable");
                })
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });

            await expect(microphone.getSettings()).rejects.toThrow("Settings unavailable");
        });
    });

    describe("close", () => {
        test("stops track and closes device when stream exists", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            
            // Get a track first
            await microphone.getAudioTrack();
            expect(mockTrack.stop).not.toHaveBeenCalled();

            // Close the microphone
            microphone.close();

            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("closes device when no stream exists", () => {
            const microphone = new Microphone();

            microphone.close();

            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("clears stream reference after closing", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            
            // Get a track first
            const track1 = await microphone.getAudioTrack();
            assertEquals(track1, mockTrack);

            // Close the microphone
            microphone.close();

            // Verify stream is cleared - next call should get new track
            const mockTrack2 = {
                kind: "audio",
                id: "audio-track-2",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;
            mockDevice.getTrack.mockResolvedValue(mockTrack2);

            const track2 = await microphone.getAudioTrack();
            assertEquals(track2, mockTrack2);
            assert(track2 !== track1);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(2);
        });

        test("handles track.stop() throwing error gracefully", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */.mockImplementation(() => {
                    throw new Error("Stop failed");
                }),
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const microphone = new Microphone({ enabled: true });
            
            // Get a track first
            await microphone.getAudioTrack();

            // Close should not throw even if stop() fails
            expect(() => microphone.close()).not.toThrow();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("handles device.close() throwing error gracefully", async () => {
            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);
            mockDevice.close.mockImplementation(() => {
                throw new Error("Device close failed");
            });

            const microphone = new Microphone({ enabled: true });
            
            // Get a track first
            await microphone.getAudioTrack();

            // Close should not throw even if device.close() fails
            expect(() => microphone.close()).not.toThrow();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("Integration and Real-world Scenarios", () => {
        test("handles complete microphone lifecycle", async () => {
            const mockSettings = {
                deviceId: "microphone-device-id",
                sampleRate: 48000,
                channelCount: 1,
                echoCancellation: true
            };

            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue(mockSettings)
            } as any;

            mockDevice.getTrack.mockResolvedValue(mockTrack);

            const constraints = { echoCancellation: true, noiseSuppression: true };
            const microphone = new Microphone({ 
                enabled: true, 
                constraints,
                device: { preferred: "built-in-microphone" }
            });

            // Verify initial state
            assertEquals(microphone.enabled, true);
            assertEquals(microphone.constraints, constraints);

            // Get audio track
            const track = await microphone.getAudioTrack();
            assertEquals(track, mockTrack);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(constraints);

            // Get settings
            const settings = await microphone.getSettings();
            assertEquals(settings, mockSettings);
            expect(mockTrack.getSettings).toHaveBeenCalledTimes(1);

            // Verify cached behavior
            const track2 = await microphone.getAudioTrack();
            assertEquals(track2, track);
            expect(mockDevice.getTrack).toHaveBeenCalledTimes(1);

            // Close and cleanup
            microphone.close();
            expect(mockTrack.stop).toHaveBeenCalledTimes(1);
            expect(mockDevice.close).toHaveBeenCalledTimes(1);
        });

        test("handles microphone enable/disable workflow", async () => {
            const microphone = new Microphone({ enabled: false });

            // Should throw when disabled
            await expect(microphone.getAudioTrack()).rejects.toThrow("Microphone is not enabled");
            await expect(microphone.getSettings()).rejects.toThrow("Microphone is not enabled");

            // Enable microphone
            microphone.enabled = true;

            const mockTrack = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue({ sampleRate: 44100 })
            } as any;
            mockDevice.getTrack.mockResolvedValue(mockTrack);

            // Should work when enabled
            const track = await microphone.getAudioTrack();
            assertEquals(track, mockTrack);

            const settings = await microphone.getSettings();
            assertEquals(settings, { sampleRate: 44100 });

            // Disable again
            microphone.enabled = false;

            // Should throw again when disabled
            await expect(microphone.getAudioTrack()).rejects.toThrow("Microphone is not enabled");
            await expect(microphone.getSettings()).rejects.toThrow("Microphone is not enabled");

            microphone.close();
        });

        test("handles audio constraints updates", async () => {
            const microphone = new Microphone({ enabled: true });

            const mockTrack1 = {
                kind: "audio",
                id: "audio-track-1",
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue({ echoCancellation: false })
            } as any;

            // First call with no constraints
            mockDevice.getTrack.mockResolvedValueOnce(mockTrack1);
            const track1 = await microphone.getAudioTrack();
            assertEquals(track1, mockTrack1);
            expect(mockDevice.getTrack).toHaveBeenCalledWith(undefined);

            // Close current stream
            microphone.close();

            // Update constraints
            microphone.constraints = { echoCancellation: true, noiseSuppression: true };

            const mockTrack2 = {
                kind: "audio",
                id: "audio-track-2", 
                stop: undefined /* TODO: Convert mock */,
                getSettings: undefined /* TODO: Convert mock */.mockReturnValue({ echoCancellation: true, noiseSuppression: true })
            } as any;

            // Second call with new constraints
            mockDevice.getTrack.mockResolvedValueOnce(mockTrack2);
            const track2 = await microphone.getAudioTrack();
            assertEquals(track2, mockTrack2);
            expect(mockDevice.getTrack).toHaveBeenLastCalledWith({ echoCancellation: true, noiseSuppression: true });

            // Verify settings reflect new constraints
            const settings = await microphone.getSettings();
            assertEquals(settings.echoCancellation, true);
            assertEquals(settings.noiseSuppression, true);

            microphone.close();
        });

        test("handles settings retrieval from different audio configurations", async () => {
            const microphone = new Microphone({ enabled: true });

            // Mock different audio configurations
            const configurations = [
                { sampleRate: 8000, channelCount: 1, echoCancellation: false },
                { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
                { sampleRate: 48000, channelCount: 2, autoGainControl: true }
            ];

            for (let i = 0; i < configurations.length; i++) {
                const config = configurations[i];
                const mockTrack = {
                    kind: "audio",
                    id: `audio-track-${i + 1}`,
                    stop: undefined /* TODO: Convert mock */,
                    getSettings: undefined /* TODO: Convert mock */.mockReturnValue(config)
                } as any;

                mockDevice.getTrack.mockResolvedValueOnce(mockTrack);

                // Get settings for each configuration
                const settings = await microphone.getSettings();
                assertEquals(settings, config);

                // Close and prepare for next iteration
                microphone.close();
            }
        });
    });
});
