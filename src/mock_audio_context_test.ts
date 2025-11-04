import { spy } from "@std/testing/mock";

// Mock audio worklet addModule
export const mockAudioWorkletAddModule = spy(() => Promise.resolve());

// Mock audio context close
export const mockAudioContextClose = spy(() => Promise.resolve());

// Mock audio context
export const mockAudioContext = {
	audioWorklet: {
		addModule: mockAudioWorkletAddModule,
	},
	get currentTime() {
		return this._currentTime || 0;
	},
	set currentTime(value: number) {
		this._currentTime = value;
	},
	_currentTime: 0,
	sampleRate: 44100,
	destination: {},
	close: mockAudioContextClose,
};