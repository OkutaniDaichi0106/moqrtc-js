import { assert, assertEquals, assertRejects } from "@std/assert";
import { Screen, ScreenProps } from "./screen.ts";

// Mock navigator.mediaDevices.getDisplayMedia
let mockGetDisplayMedia: any;
const mockGetDisplayMediaCalls: any[][] = [];

Object.defineProperty(globalThis, "navigator", {
	writable: true,
	configurable: true,
	value: {
		mediaDevices: {
			getDisplayMedia: (...args: any[]) => {
				mockGetDisplayMediaCalls.push(args);
				return mockGetDisplayMedia(...args);
			},
		},
	},
});

// Create a mock function with tracking
mockGetDisplayMedia = Object.assign(
	() => Promise.resolve(createMockStream([], [])),
	{
		mock: {
			calls: mockGetDisplayMediaCalls,
		},
	}
);

// Helper to create properly typed mock MediaStream
function createMockStream(
	videoTracks: MediaStreamTrack[],
	audioTracks: MediaStreamTrack[] = [],
): MediaStream {
	const allTracks = [...videoTracks, ...audioTracks];
	return {
		getVideoTracks: () => videoTracks,
		getAudioTracks: () => audioTracks,
		getTracks: () => allTracks,
	} as unknown as MediaStream;
}

// Helper to reset mock calls
function resetMockCalls() {
	mockGetDisplayMediaCalls.length = 0;
}

Deno.test("Screen", async (t) => {
	await t.step("Constructor", async (t) => {
		await t.step("creates screen with default props", () => {
			resetMockCalls();
			const screen = new Screen();

			assertEquals(screen.enabled, false);
			assertEquals(screen.constraints, undefined);
		});

		await t.step("creates screen with enabled=true", () => {
			resetMockCalls();
			const screen = new Screen({ enabled: true });

			assertEquals(screen.enabled, true);
			assertEquals(screen.constraints, undefined);
		});

		await t.step("creates screen with constraints", () => {
			resetMockCalls();
			const constraints = { video: true, audio: true };
			const screen = new Screen({ constraints });

			assertEquals(screen.enabled, false);
			assertEquals(screen.constraints, constraints);
		});		await t.step("creates screen with all props", () => {
			resetMockCalls();
			const constraints = {
				video: { frameRate: 30 },
				audio: { echoCancellation: false },
			};
			const props: ScreenProps = {
				enabled: true,
				constraints,
			};

			const screen = new Screen(props);

			assertEquals(screen.enabled, true);
			assertEquals(screen.constraints, constraints);
		});
	});

	await t.step("getVideoTrack", async (t) => {
		await t.step("gets video track when enabled", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });
			const track = await screen.getVideoTrack();

			assertEquals(track, mockVideoTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [undefined]);
		});

		await t.step("gets video track with constraints", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			const constraints = { video: { width: 1280, height: 720 }, audio: false };
			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true, constraints });
			const track = await screen.getVideoTrack();

			assertEquals(track, mockVideoTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [constraints]);
		});

		await t.step("returns cached video track on subsequent calls", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// First call
			const track1 = await screen.getVideoTrack();
			assertEquals(track1, mockVideoTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Second call should return cached track
			const track2 = await screen.getVideoTrack();
			assertEquals(track2, mockVideoTrack);
			assertEquals(track2, track1);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // Not called again
		});

		await t.step("throws error when screen is not enabled", async () => {
			resetMockCalls();
			const screen = new Screen({ enabled: false });

			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Screen capture is not enabled"
			);
			assertEquals(mockGetDisplayMediaCalls.length, 0);
		});

		await t.step("throws error when screen is disabled by default", async () => {
			resetMockCalls();
			const screen = new Screen(); // enabled defaults to false

			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Screen capture is not enabled"
			);
			assertEquals(mockGetDisplayMediaCalls.length, 0);
		});

		await t.step("throws error when getDisplayMedia rejects", async () => {
			resetMockCalls();
			const displayError = new Error("Screen capture permission denied");
			mockGetDisplayMedia = () => Promise.reject(displayError);

			const screen = new Screen({ enabled: true });

			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Screen capture permission denied"
			);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [undefined]);
		});

		await t.step("throws error when getDisplayMedia returns stream without video track", async () => {
			resetMockCalls();
			const mockStream = createMockStream([]); // No video tracks

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Failed to obtain display video track"
			);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [undefined]);
		});

		await t.step("stops extra tracks from stream", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			let extraTrackStopped = false;
			const mockExtraTrack = {
				kind: "unknown",
				id: "extra-track",
				label: "Extra Track",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { extraTrackStopped = true; },
			} as MediaStreamTrack;

			const mockStream = {
				getVideoTracks: () => [mockVideoTrack],
				getAudioTracks: () => [mockAudioTrack],
				getTracks: () => [mockVideoTrack, mockAudioTrack, mockExtraTrack],
			} as MediaStream;

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });
			await screen.getVideoTrack();

			// Extra track should be stopped
			assertEquals(extraTrackStopped, true);
		});
	});

	await t.step("getAudioTrack", async (t) => {
		await t.step("gets audio track when available", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });
			const track = await screen.getAudioTrack();

			assertEquals(track, mockAudioTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [undefined]);
		});

		await t.step("returns undefined when no audio track available", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });
			const track = await screen.getAudioTrack();

			assertEquals(track, undefined);
			assertEquals(mockGetDisplayMediaCalls.length, 1);
			assertEquals(mockGetDisplayMediaCalls[0], [undefined]);
		});

		await t.step("returns cached audio track on subsequent calls", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// First call
			const track1 = await screen.getAudioTrack();
			assertEquals(track1, mockAudioTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Second call should return cached track
			const track2 = await screen.getAudioTrack();
			assertEquals(track2, mockAudioTrack);
			assertEquals(track2, track1);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // Not called again
		});

		await t.step("returns cached undefined on subsequent calls when no audio", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// First call
			const track1 = await screen.getAudioTrack();
			assertEquals(track1, undefined);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Second call should return cached undefined
			const track2 = await screen.getAudioTrack();
			assertEquals(track2, undefined);
			assertEquals(track2, track1);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // Not called again
		});

		await t.step("throws error when screen is not enabled", async () => {
			resetMockCalls();
			const screen = new Screen({ enabled: false });

			await assertRejects(
				async () => await screen.getAudioTrack(),
				Error,
				"Screen capture is not enabled"
			);
			assertEquals(mockGetDisplayMediaCalls.length, 0);
		});

		await t.step("uses same stream as video track when both called", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get video track first
			const videoTrack = await screen.getVideoTrack();
			assertEquals(videoTrack, mockVideoTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Get audio track - should use same stream
			const audioTrack = await screen.getAudioTrack();
			assertEquals(audioTrack, mockAudioTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // Not called again
		});
	});

	await t.step("close", async (t) => {
		await t.step("stops all tracks when stream exists", async () => {
			resetMockCalls();
			let videoTrackStopped = false;
			let audioTrackStopped = false;

			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { videoTrackStopped = true; },
			} as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { audioTrackStopped = true; },
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get tracks first
			await screen.getVideoTrack();
			assertEquals(videoTrackStopped, false);
			assertEquals(audioTrackStopped, false);

			// Close the screen
			await screen.close();

			assertEquals(videoTrackStopped, true);
			assertEquals(audioTrackStopped, true);
		});

		await t.step("stops only video track when no audio", async () => {
			resetMockCalls();
			let videoTrackStopped = false;

			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { videoTrackStopped = true; },
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get video track first
			await screen.getVideoTrack();

			// Close the screen
			await screen.close();

			assertEquals(videoTrackStopped, true);
		});

		await t.step("does nothing when no stream exists", async () => {
			const screen = new Screen();

			// Should not throw
			await screen.close();
		});

		await t.step("clears stream reference after closing", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get track first
			const track1 = await screen.getVideoTrack();
			assertEquals(track1, mockVideoTrack);

			// Close the screen
			await screen.close();

			// Verify stream is cleared - next call should get new track
			const mockVideoTrack2 = {
				kind: "video",
				id: "screen-video-track-2",
				label: "Screen Share 2",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream2 = createMockStream([mockVideoTrack2]);
			mockGetDisplayMedia = () => Promise.resolve(mockStream2);

			const track2 = await screen.getVideoTrack();
			assertEquals(track2, mockVideoTrack2);
			assert(track2 !== track1);
			assertEquals(mockGetDisplayMediaCalls.length, 2);
		});

		await t.step("handles video track.stop() throwing error gracefully", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { throw new Error("Video stop failed"); },
			} as unknown as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get tracks first
			await screen.getVideoTrack();

			// Close should not throw even if video stop() fails
			await screen.close();
		});

		await t.step("handles audio track.stop() throwing error gracefully", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => { throw new Error("Audio stop failed"); },
			} as unknown as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const screen = new Screen({ enabled: true });

			// Get tracks first
			await screen.getAudioTrack();

			// Close should not throw even if audio stop() fails
			await screen.close();
		});
	});

	await t.step("Integration and Real-world Scenarios", async (t) => {
		await t.step("handles complete screen capture lifecycle", async () => {
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockAudioTrack = {
				kind: "audio",
				id: "screen-audio-track-1",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], [mockAudioTrack]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			const constraints = { video: { width: 1920, height: 1080 }, audio: true };
			const screen = new Screen({ enabled: true, constraints });

			// Verify initial state
			assertEquals(screen.enabled, true);
			assertEquals(screen.constraints, constraints);

			// Get video track
			const videoTrack = await screen.getVideoTrack();
			assertEquals(videoTrack, mockVideoTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Get audio track (should reuse same stream)
			const audioTrack = await screen.getAudioTrack();
			assertEquals(audioTrack, mockAudioTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // Should not call again

			// Verify cached behavior
			const videoTrack2 = await screen.getVideoTrack();
			const audioTrack2 = await screen.getAudioTrack();
			assertEquals(videoTrack2, videoTrack);
			assertEquals(audioTrack2, audioTrack);
			assertEquals(mockGetDisplayMediaCalls.length, 1); // No additional calls

			// Close and cleanup
			await screen.close();
		});

		await t.step("handles screen enable/disable workflow", async () => {
			const screen = new Screen({ enabled: false });

			// Should throw when disabled
			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Screen capture is not enabled"
			);
			await assertRejects(
				async () => await screen.getAudioTrack(),
				Error,
				"Screen capture is not enabled"
			);

			// Enable and test
			resetMockCalls();
			const mockVideoTrack = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockStream = createMockStream([mockVideoTrack], []);

			mockGetDisplayMedia = () => Promise.resolve(mockStream);

			screen.enabled = true;
			const videoTrack = await screen.getVideoTrack();
			assertEquals(videoTrack, mockVideoTrack);

			// Disable and verify throws again
			screen.enabled = false;
			await assertRejects(
				async () => await screen.getVideoTrack(),
				Error,
				"Screen capture is not enabled"
			);
			await assertRejects(
				async () => await screen.getAudioTrack(),
				Error,
				"Screen capture is not enabled"
			);
		});

		await t.step("handles constraints updates", async () => {
			resetMockCalls();
			const screen = new Screen({ enabled: true });

			const mockVideoTrack1 = {
				kind: "video",
				id: "screen-video-track-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockStream1 = createMockStream([mockVideoTrack1], []);

			mockGetDisplayMedia = () => Promise.resolve(mockStream1);

			// First call with no constraints
			const track1 = await screen.getVideoTrack();
			assertEquals(track1, mockVideoTrack1);
			assertEquals(mockGetDisplayMediaCalls.length, 1);

			// Close current stream
			await screen.close();

			// Update constraints
			screen.constraints = { video: { width: 1280, height: 720 }, audio: true };

			const mockVideoTrack2 = {
				kind: "video",
				id: "screen-video-track-2",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockAudioTrack2 = {
				kind: "audio",
				id: "screen-audio-track-2",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockStream2 = createMockStream([mockVideoTrack2], [mockAudioTrack2]);

			mockGetDisplayMedia = () => Promise.resolve(mockStream2);

			// Second call with new constraints
			const track2 = await screen.getVideoTrack();
			assertEquals(track2, mockVideoTrack2);
			assertEquals(mockGetDisplayMediaCalls.length, 2);

			// Verify audio is now available
			const audioTrack = await screen.getAudioTrack();
			assertEquals(audioTrack, mockAudioTrack2);

			await screen.close();
		});

		await t.step("handles different screen capture scenarios", async () => {
			resetMockCalls();
			const screen = new Screen({ enabled: true });

			// Scenario 1: Video only
			const mockVideoOnlyTrack = {
				kind: "video",
				id: "video-1",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockVideoOnlyStream = createMockStream([mockVideoOnlyTrack], []);

			mockGetDisplayMedia = () => Promise.resolve(mockVideoOnlyStream);

			const videoTrack = await screen.getVideoTrack();
			assertEquals(videoTrack.kind, "video");

			const audioTrack = await screen.getAudioTrack();
			assertEquals(audioTrack, undefined);

			await screen.close();

			// Scenario 2: Video + Audio
			const mockVideoTrack2 = {
				kind: "video",
				id: "video-2",
				label: "Screen Share",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockAudioTrack2 = {
				kind: "audio",
				id: "audio-2",
				label: "Screen Audio",
				enabled: true,
				muted: false,
				readyState: "live" as const,
				contentHint: "",
				stop: () => {},
			} as unknown as MediaStreamTrack;

			const mockFullStream = createMockStream([mockVideoTrack2], [mockAudioTrack2]);

			mockGetDisplayMedia = () => Promise.resolve(mockFullStream);

			const videoTrack2 = await screen.getVideoTrack();
			assertEquals(videoTrack2.kind, "video");

			const audioTrack2 = await screen.getAudioTrack();
			assertEquals(audioTrack2?.kind, "audio");

			await screen.close();
		});
	});
});
