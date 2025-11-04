// Common test utilities and mocks for hang-web tests

import { mockAudioContextClose, mockAudioWorkletAddModule } from "./mock_audio_context_test.ts";
import {
	mockAudioWorkletNode,
	mockWorkletConnect,
	mockWorkletDisconnect,
	mockWorkletPort,
} from "./mock_audio_worklet_node_test.ts";
import { mockCanvas, mockCanvasContext } from "./mock_canvas_test.ts";
import {
	MockGainNode,
	mockGainNodeConnect,
	mockGainNodeDisconnect,
} from "./mock_gain_node_test.ts";
import { mockVideo } from "./mock_video_test.ts";

// Re-export mocks for convenience
export {
	mockAudioContext,
	mockAudioContextClose,
	mockAudioWorkletAddModule,
} from "./mock_audio_context_test.ts";
export {
	mockAudioWorkletNode,
	mockWorkletConnect,
	mockWorkletDisconnect,
	mockWorkletPort,
} from "./mock_audio_worklet_node_test.ts";
export { mockCanvas, mockCanvasContext } from "./mock_canvas_test.ts";
export {
	MockGainNode,
	mockGainNode,
	mockGainNodeConnect,
	mockGainNodeDisconnect,
} from "./mock_gain_node_test.ts";
export { mockVideo } from "./mock_video_test.ts";

// Global constructor mocks
export function setupGlobalMocks() {
	(globalThis as any).AudioContext = class MockAudioContext {
		audioWorklet = {
			addModule: mockAudioWorkletAddModule,
		};
		get currentTime() {
			return this._currentTime || 0;
		}
		set currentTime(value: number) {
			this._currentTime = value;
		}
		_currentTime = 0;
		sampleRate = 44100;
		destination = {};
		close = mockAudioContextClose;
	};
	(globalThis as any).GainNode = MockGainNode;
	(globalThis as any).AudioWorkletNode = () => mockAudioWorkletNode;
	(globalThis as any).HTMLCanvasElement = () => mockCanvas;
	(globalThis as any).HTMLVideoElement = () => mockVideo;

	// Mock console.warn for testing
	(globalThis as any).originalConsoleWarn = console.warn;
	(globalThis as any).warnCalls = [];
	console.warn = (...args: any[]) => {
		(globalThis as any).warnCalls.push(args);
	};
}

export function resetGlobalMocks() {
	// Reset spies
	mockCanvasContext.clearRect.calls.length = 0;
	mockCanvasContext.drawImage.calls.length = 0;
	mockCanvasContext.fillText.calls.length = 0;
	mockVideo.play.calls.length = 0;
	mockVideo.pause.calls.length = 0;
	mockVideo.addEventListener.calls.length = 0;
	mockVideo.removeEventListener.calls.length = 0;
	mockAudioWorkletAddModule.calls.length = 0;
	mockAudioContextClose.calls.length = 0;
	mockGainNodeConnect.calls.length = 0;
	mockGainNodeDisconnect.calls.length = 0;
	mockWorkletConnect.calls.length = 0;
	mockWorkletDisconnect.calls.length = 0;
	mockWorkletPort.postMessage.calls.length = 0;

	// Reset console.warn calls
	(globalThis as any).warnCalls = [];

	// Re-setup global mocks
	setupGlobalMocks();
}
