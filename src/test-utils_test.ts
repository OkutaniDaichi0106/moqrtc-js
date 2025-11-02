// Common test utilities and mocks for hang-web tests

// Mock canvas context
export const mockCanvasContext = {
	clearRect: undefined, /* TODO: Convert mock */
	drawImage: undefined, /* TODO: Convert mock */
	fillText: undefined, /* TODO: Convert mock */
	fillStyle: "",
	font: "",
	textAlign: "left" as CanvasTextAlign,
	textBaseline: "top" as CanvasTextBaseline,
};

// Mock canvas element
export const mockCanvas = {
	getContext: vi.fn((contextType: string) => {
		if (contextType === "2d") {
			return mockCanvasContext;
		}
		return null;
	}),
	width: 320,
	height: 240,
};

// Mock video element
export const mockVideo = {
	readyState: 0,
	videoWidth: 640,
	videoHeight: 480,
	currentTime: 0,
	duration: 0,
	paused: true,
	play: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
	pause: undefined, /* TODO: Convert mock */
	addEventListener: undefined, /* TODO: Convert mock */
	removeEventListener: undefined, /* TODO: Convert mock */
};

// Mock audio context
export const mockAudioWorkletAddModule = undefined /* TODO: Convert mock */.mockResolvedValue(
	undefined,
);
export const mockAudioContextClose = undefined /* TODO: Convert mock */.mockResolvedValue(
	undefined,
);

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

// Mock gain node - simplified to only provide GainNode interface
export const mockGainNodeConnect = undefined /* TODO: Convert mock */;
export const mockGainNodeDisconnect = undefined /* TODO: Convert mock */;

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
			cancelScheduledValues: undefined, /* TODO: Convert mock */
			setValueAtTime: vi.fn((value: number) => {
				// For testing, immediately set the gain value
				this.gain.value = value;
			}),
			exponentialRampToValueAtTime: vi.fn((value: number) => {
				// For testing, immediately set the gain value
				this.gain.value = value;
			}),
		};
		this.context = audioContext || { currentTime: 0 };
	}
}

export const mockGainNode = new MockGainNode();

// Mock audio worklet node
export const mockWorkletConnect = undefined /* TODO: Convert mock */;
export const mockWorkletDisconnect = undefined /* TODO: Convert mock */;
export const mockWorkletPort = {
	postMessage: undefined, /* TODO: Convert mock */
};

export const mockAudioWorkletNode = {
	connect: mockWorkletConnect,
	disconnect: mockWorkletDisconnect,
	port: mockWorkletPort,
};

// Global constructor mocks
export function setupGlobalMocks() {
	global.AudioContext = vi.fn(() => mockAudioContext) as any;
	global.GainNode = MockGainNode as any;
	global.AudioWorkletNode = vi.fn(() => mockAudioWorkletNode) as any;
	global.HTMLCanvasElement = vi.fn(() => mockCanvas) as any;
	global.HTMLVideoElement = vi.fn(() => mockVideo) as any;
}

export function resetGlobalMocks() {
	vi.clearAllMocks();
	(global.AudioContext as any).mockImplementation(() => mockAudioContext);
	global.GainNode = MockGainNode as any;
	(global.AudioWorkletNode as any).mockImplementation(() => mockAudioWorkletNode);
	(global.HTMLCanvasElement as any).mockImplementation(() => mockCanvas);
	(global.HTMLVideoElement as any).mockImplementation(() => mockVideo);
}
