import { spy } from "@std/testing/mock";

// Mock worklet methods
export const mockWorkletConnect = spy(() => {});
export const mockWorkletDisconnect = spy(() => {});

// Mock worklet port
export const mockWorkletPort = {
	postMessage: spy(() => {}),
};

// Mock audio worklet node
export const mockAudioWorkletNode = {
	connect: mockWorkletConnect,
	disconnect: mockWorkletDisconnect,
	port: mockWorkletPort,
};
