import { spy } from "@std/testing/mock";

// Mock gain node methods
export const mockGainNodeConnect = spy(() => {});
export const mockGainNodeDisconnect = spy(() => {});

// Mock gain node class
export class MockGainNode {
	connect = mockGainNodeConnect;
	disconnect = mockGainNodeDisconnect;
	gain: {
		value: number;
		cancelScheduledValues: any;
		setValueAtTime: any;
		exponentialRampToValueAtTime: any;
	};
	context: any;

	constructor(audioContext?: any, options?: any) {
		this.gain = {
			value: options?.gain ?? 0.5,
			cancelScheduledValues: spy(() => {}),
			setValueAtTime: spy((value: number) => {
				// For testing, immediately set the gain value
				this.gain.value = value;
			}),
			exponentialRampToValueAtTime: spy((value: number) => {
				// For testing, immediately set the gain value
				this.gain.value = value;
			}),
		};
		this.context = audioContext || { currentTime: 0 };
	}
}

export const mockGainNode = new MockGainNode();