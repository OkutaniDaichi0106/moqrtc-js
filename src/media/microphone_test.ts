// filepath: src/media/microphone_test.ts
import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { Microphone } from "./microphone.ts";
import { MockDevice } from "./mock_device_test.ts";
import { MockMediaStreamTrack } from "./mock_media_stream_track_test.ts";

Deno.test("Microphone", async (t) => {
	await t.step("Constructor", async (t) => {
		await t.step("creates microphone with default props", () => {
			const microphone = new Microphone();

			assertEquals(microphone.enabled, false);
			assertEquals(microphone.constraints, undefined);
			assertExists(microphone.device);
		});

		await t.step("creates microphone with enabled=true", () => {
			const microphone = new Microphone({ enabled: true });

			assertEquals(microphone.enabled, true);
			assertEquals(microphone.constraints, undefined);
		});

		await t.step("creates microphone with device props", () => {
			const microphone = new Microphone();

			assertEquals(microphone.enabled, false);
		});

		await t.step("creates microphone with constraints", () => {
			const constraints = {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: false,
			};
			const microphone = new Microphone({ constraints });

			assertEquals(microphone.constraints, constraints);
		});

		await t.step("creates microphone with all props", () => {
			const deviceProps = { preferred: "microphone-device-id" };
			const constraints = { sampleRate: 48000, channelCount: 2 };
			const microphone = new Microphone({
				...deviceProps,
				enabled: true,
				constraints,
			});

			assertEquals(microphone.enabled, true);
			assertEquals(microphone.constraints, constraints);
		});
	});

	await t.step("getAudioTrack", async (t) => {
		await t.step("gets audio track when enabled", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			const track = await microphone.getAudioTrack();

			assertEquals(track, mockTrack);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);
		});

		await t.step("gets audio track with constraints", async () => {
			const constraints = { echoCancellation: true, noiseSuppression: false };
			const microphone = new Microphone({ enabled: true, constraints });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			const track = await microphone.getAudioTrack();

			assertEquals(track, mockTrack);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], constraints);
		});

		await t.step("returns cached stream on subsequent calls", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// First call
			const track1 = await microphone.getAudioTrack();
			assertEquals(track1, mockTrack);
			assertEquals(mockDevice.getTrackCallCount, 1);

			// Second call should return cached stream
			const track2 = await microphone.getAudioTrack();
			assertEquals(track2, mockTrack);
			assertEquals(track2, track1);
			assertEquals(mockDevice.getTrackCallCount, 1); // Not called again
		});

		await t.step("throws error when microphone is not enabled", async () => {
			const microphone = new Microphone({ enabled: false });

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
		});

		await t.step("throws error when microphone is disabled by default", async () => {
			const microphone = new Microphone(); // enabled defaults to false

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
		});

		await t.step("throws error when device fails to get track", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			mockDevice.getTrackResult = undefined;
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Failed to obtain microphone track"
			);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);
		});

		await t.step("throws error when device.getTrack rejects", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const deviceError = new Error("Microphone access denied");
			mockDevice.getTrackResult = deviceError;
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone access denied"
			);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);
		});

		await t.step("returns cached stream on subsequent calls", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// First call
			const track1 = await microphone.getAudioTrack();
			assertEquals(track1, mockTrack);
			assertEquals(mockDevice.getTrackCallCount, 1);

			// Second call should return cached stream
			const track2 = await microphone.getAudioTrack();
			assertEquals(track2, mockTrack);
			assertEquals(track2, track1);
			assertEquals(mockDevice.getTrackCallCount, 1); // Not called again
		});

		await t.step("throws error when microphone is not enabled", async () => {
			const microphone = new Microphone({ enabled: false });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
			assertEquals(mockDevice.getTrackCallCount, 0);
		});

		await t.step("throws error when microphone is disabled by default", async () => {
			const microphone = new Microphone(); // enabled defaults to false
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
			assertEquals(mockDevice.getTrackCallCount, 0);
		});

		await t.step("throws error when device fails to get track", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			mockDevice.getTrackResult = undefined;
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Failed to obtain microphone track"
			);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);
		});

		await t.step("throws error when device.getTrack rejects", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			mockDevice.getTrackError = new Error("Microphone access denied");
			(microphone as any).device = mockDevice;

			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone access denied"
			);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);
		});
	});

	await t.step("getSettings", async (t) => {
		await t.step("gets track settings when microphone is enabled", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			const mockSettings = {
				sampleRate: 48000,
				channelCount: 2,
				echoCancellation: true,
				noiseSuppression: false,
			};
			mockTrack.getSettingsResult = mockSettings;
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			const settings = await microphone.getSettings();

			assertEquals(settings, mockSettings);
			assertEquals(mockDevice.getTrackCallCount, 1);
		});

		await t.step("throws error when microphone is not enabled", async () => {
			const microphone = new Microphone({ enabled: false });

			await assertRejects(
				() => microphone.getSettings(),
				Error,
				"Microphone is not enabled"
			);
		});

		await t.step("uses cached track for settings", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			const mockSettings = {
				sampleRate: 44100,
				channelCount: 1,
				echoCancellation: false,
				noiseSuppression: true,
			};
			mockTrack.getSettingsResult = mockSettings;
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// First call to getSettings
			const settings1 = await microphone.getSettings();
			assertEquals(settings1, mockSettings);
			assertEquals(mockDevice.getTrackCallCount, 1);

			// Second call should use cached track
			const settings2 = await microphone.getSettings();
			assertEquals(settings2, mockSettings);
			assertEquals(settings2, settings1);
			assertEquals(mockDevice.getTrackCallCount, 1); // Not called again
		});
	});

	await t.step("close", async (t) => {
		await t.step("closes microphone and stops track", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			await microphone.getAudioTrack(); // Initialize track

			microphone.close();

			assertEquals(mockTrack.stopCallCount, 1);
			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("closes microphone without track", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			microphone.close();

			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("multiple close calls are safe", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			await microphone.getAudioTrack(); // Initialize track

			microphone.close();
			microphone.close(); // Second close should be safe

			assertEquals(mockTrack.stopCallCount, 1); // Track stopped only once
		});
	});

	await t.step("getSettings", async (t) => {
		await t.step("handles getSettings error gracefully", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockTrack.getSettings = () => {
				throw new Error("Settings unavailable");
			};
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			await microphone.getAudioTrack(); // Initialize track

			await assertRejects(
				() => microphone.getSettings(),
				Error,
				"Settings unavailable"
			);
		});
	});

	await t.step("close", async (t) => {
		await t.step("stops track and closes device when stream exists", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// Get a track first
			await microphone.getAudioTrack();
			assertEquals(mockTrack.stopCallCount, 0);

			// Close the microphone
			microphone.close();

			assertEquals(mockTrack.stopCallCount, 1);
			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("closes device when no stream exists", () => {
			const microphone = new Microphone();
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			microphone.close();

			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("clears stream reference after closing", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// Get a track first
			const track1 = await microphone.getAudioTrack();
			assertEquals(track1, mockTrack);

			// Close the microphone
			microphone.close();

			// Verify stream is cleared - next call should get new track
			const mockTrack2 = new MockMediaStreamTrack("audio-track-2", "audio");
			mockDevice.getTrackResult = mockTrack2;

			const track2 = await microphone.getAudioTrack();
			assertEquals(track2, mockTrack2);
			assert(track2 !== track1);
			assertEquals(mockDevice.getTrackCallCount, 2);
		});

		await t.step("handles track.stop() throwing error gracefully", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockTrack.stop = () => {
				mockTrack.stopCallCount++;
				throw new Error("Stop failed");
			};
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// Get a track first
			await microphone.getAudioTrack();

			// Close should not throw even if stop() fails
			microphone.close();
			assertEquals(mockTrack.stopCallCount, 1);
			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("handles device.close() throwing error gracefully", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			mockDevice.close = () => {
				mockDevice.closeCallCount++;
				throw new Error("Device close failed");
			};
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			// Get a track first
			await microphone.getAudioTrack();

			// Close should not throw even if device.close() fails
			microphone.close();
			assertEquals(mockTrack.stopCallCount, 1);
			assertEquals(mockDevice.closeCallCount, 1);
		});
	});

	await t.step("Integration and Real-world Scenarios", async (t) => {
		await t.step("handles complete microphone lifecycle", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			const mockSettings = {
				deviceId: "microphone-device-id",
				sampleRate: 48000,
				channelCount: 1,
				echoCancellation: true,
			};
			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockTrack.getSettingsResult = mockSettings;
			mockDevice.getTrackResult = mockTrack;
			(microphone as any).device = mockDevice;

			const constraints = { echoCancellation: true, noiseSuppression: true };
			microphone.constraints = constraints;

			// Verify initial state
			assertEquals(microphone.enabled, true);
			assertEquals(microphone.constraints, constraints);

			// Get audio track
			const track = await microphone.getAudioTrack();
			assertEquals(track, mockTrack);
			assertEquals(mockDevice.getTrackCallCount, 1);
			assertEquals(mockDevice.getTrackArgs[0], constraints);

			// Get settings
			const settings = await microphone.getSettings();
			assertEquals(settings, mockSettings);

			// Verify cached behavior
			const track2 = await microphone.getAudioTrack();
			assertEquals(track2, track);
			assertEquals(mockDevice.getTrackCallCount, 1);

			// Close and cleanup
			microphone.close();
			assertEquals(mockTrack.stopCallCount, 1);
			assertEquals(mockDevice.closeCallCount, 1);
		});

		await t.step("handles microphone enable/disable workflow", async () => {
			const microphone = new Microphone({ enabled: false });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			// Should throw when disabled
			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
			await assertRejects(
				() => microphone.getSettings(),
				Error,
				"Microphone is not enabled"
			);

			// Enable microphone
			microphone.enabled = true;

			const mockTrack = new MockMediaStreamTrack("audio-track-1", "audio");
			mockTrack.getSettingsResult = { sampleRate: 44100 };
			mockDevice.getTrackResult = mockTrack;

			// Should work when enabled
			const track = await microphone.getAudioTrack();
			assertEquals(track, mockTrack);

			const settings = await microphone.getSettings();
			assertEquals(settings, { sampleRate: 44100 });

			// Disable again
			microphone.enabled = false;

			// Should throw again when disabled
			await assertRejects(
				() => microphone.getAudioTrack(),
				Error,
				"Microphone is not enabled"
			);
			await assertRejects(
				() => microphone.getSettings(),
				Error,
				"Microphone is not enabled"
			);

			microphone.close();
		});

		await t.step("handles audio constraints updates", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			const mockTrack1 = new MockMediaStreamTrack("audio-track-1", "audio");
			mockTrack1.getSettingsResult = { echoCancellation: false };

			// First call with no constraints
			mockDevice.getTrackResult = mockTrack1;
			const track1 = await microphone.getAudioTrack();
			assertEquals(track1, mockTrack1);
			assertEquals(mockDevice.getTrackArgs[0], undefined);

			// Close current stream
			microphone.close();

			// Update constraints
			microphone.constraints = { echoCancellation: true, noiseSuppression: true };

			const mockTrack2 = new MockMediaStreamTrack("audio-track-2", "audio");
			mockTrack2.getSettingsResult = {
				echoCancellation: true,
				noiseSuppression: true,
			};

			// Second call with new constraints
			mockDevice.getTrackResult = mockTrack2;
			const track2 = await microphone.getAudioTrack();
			assertEquals(track2, mockTrack2);
			assertEquals(mockDevice.getTrackArgs[1], {
				echoCancellation: true,
				noiseSuppression: true,
			});

			// Verify settings reflect new constraints
			const settings = await microphone.getSettings();
			assertEquals(settings.echoCancellation, true);
			assertEquals(settings.noiseSuppression, true);

			microphone.close();
		});

		await t.step("handles settings retrieval from different audio configurations", async () => {
			const microphone = new Microphone({ enabled: true });
			const mockDevice = new MockDevice();
			mockDevice.kind = "audio";
			(microphone as any).device = mockDevice;

			// Mock different audio configurations
			const configurations = [
				{ sampleRate: 8000, channelCount: 1, echoCancellation: false },
				{
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
				},
				{ sampleRate: 48000, channelCount: 2, autoGainControl: true },
			];

			for (let i = 0; i < configurations.length; i++) {
				const config = configurations[i];
				const mockTrack = new MockMediaStreamTrack(`audio-track-${i + 1}`, "audio");
				mockTrack.getSettingsResult = config;
				mockDevice.getTrackResult = mockTrack;

				// Get settings for each configuration
				const settings = await microphone.getSettings();
				assertEquals(settings, config);

				// Close and prepare for next iteration
				microphone.close();
			}
		});
	});
});
