import {
	VideoAnalyserNode,
	VideoContext,
	VideoDecodeNode,
	VideoDestinationNode,
	VideoEncodeNode,
	VideoNode,
	VideoObserveNode,
	VideoRenderFunctions,
	VideoSourceNode,
} from "./video_node.ts";
import type { EncodedContainer, EncodeDestination } from "./container.ts";
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "@std/assert";

// Mock implementations for Web APIs
class MockVideoFrame implements VideoFrame {
	displayWidth: number;
	displayHeight: number;
	codedWidth: number;
	codedHeight: number;
	timestamp: number;
	duration: number | null;
	colorSpace: VideoColorSpace;
	visibleRect: DOMRectReadOnly | null;
	codedRect: DOMRectReadOnly | null;
	format: VideoPixelFormat | null;

	constructor(width: number = 640, height: number = 480, timestamp: number = 0) {
		this.displayWidth = width;
		this.displayHeight = height;
		this.codedWidth = width;
		this.codedHeight = height;
		this.timestamp = timestamp;
		this.duration = null;
		this.colorSpace = {} as VideoColorSpace;
		this.visibleRect = null;
		this.codedRect = null;
		this.format = null;
	}

	copyTo(
		destination: AllowSharedBufferSource,
		options?: VideoFrameCopyToOptions,
	): Promise<PlaneLayout[]> {
		// Fill with test pattern
		if (destination instanceof Uint8Array) {
			for (let i = 0; i < destination.length; i += 4) {
				destination[i] = 255; // R
				destination[i + 1] = 128; // G
				destination[i + 2] = 64; // B
				destination[i + 3] = 255; // A
			}
		}
		return Promise.resolve([]);
	}

	clone(): VideoFrame {
		return new MockVideoFrame(this.displayWidth, this.displayHeight, this.timestamp);
	}

	close(): void {
		// Mock close
	}

	allocationSize(options?: VideoFrameCopyToOptions): number {
		return this.displayWidth * this.displayHeight * 4;
	}
}

class MockVideoEncoder {
	state: "unconfigured" | "configured" | "closed" = "unconfigured";
	configure = undefined /* TODO: Convert mock */;
	encode = vi.fn((frame, options) => {
		const mockChunk = new MockEncodedVideoChunk();
		if (this.output) {
			this.output(mockChunk);
		}
	});
	reset = undefined /* TODO: Convert mock */;
	flush = undefined /* TODO: Convert mock */;
	close = undefined /* TODO: Convert mock */;
	output?: (chunk: EncodedVideoChunk) => void;

	constructor(config: VideoEncoderInit) {
		this.output = config.output;
	}
}

class MockVideoDecoder {
	state: "unconfigured" | "configured" | "closed" = "unconfigured";
	configure = undefined /* TODO: Convert mock */;
	decode = undefined /* TODO: Convert mock */;
	reset = undefined /* TODO: Convert mock */;
	flush = undefined /* TODO: Convert mock */;
	close = undefined /* TODO: Convert mock */;

	constructor(config: VideoDecoderInit) {
		// Mock constructor
	}
}

class MockMediaStream {
	constructor(tracks?: MediaStreamTrack[]) {
		// Mock constructor
	}
}

class MockHTMLCanvasElement {
	width: number = 640;
	height: number = 480;
	getContext = vi.fn((type: string): CanvasRenderingContext2D | null => {
		if (type === "2d") {
			return {
				drawImage: undefined, /* TODO: Convert mock */
				clearRect: undefined, /* TODO: Convert mock */
				getImageData: vi.fn(() => ({
					data: new Uint8ClampedArray(this.width * this.height * 4),
				})),
			} as any;
		}
		return null;
	});
}

// Mock VideoNode for testing abstract class behavior
class MockVideoNode extends VideoNode {
	process(input?: VideoFrame | any): void {
		// Mock implementation
	}
}

// Mock IntersectionObserver
class MockIntersectionObserver {
	observe = undefined /* TODO: Convert mock */;
	disconnect = undefined /* TODO: Convert mock */;
	constructor(callback: IntersectionObserverCallback) {
		// Mock constructor
	}
}

// Mock global constructors
vi.stubGlobal("VideoFrame", MockVideoFrame);
vi.stubGlobal("VideoEncoder", MockVideoEncoder);
vi.stubGlobal("VideoDecoder", MockVideoDecoder);
vi.stubGlobal("MediaStream", MockMediaStream);
vi.stubGlobal("HTMLCanvasElement", MockHTMLCanvasElement);
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
vi.stubGlobal(
	"EncodedVideoChunk",
	class EncodedVideoChunk {
		constructor(init: any) {
			Object.assign(this, init);
		}
	},
);

// Mock requestAnimationFrame to execute callbacks immediately
vi.stubGlobal(
	"requestAnimationFrame",
	vi.fn((callback) => {
		callback();
		return 1;
	}),
);

// Mock cancelAnimationFrame
vi.stubGlobal("cancelAnimationFrame", undefined /* TODO: Convert mock */);

// Mock document.createElement
Object.defineProperty(document, "createElement", {
	writable: true,
	value: vi.fn((tag: string) => {
		if (tag === "canvas") {
			return new MockHTMLCanvasElement();
		}
		return {};
	}),
});

describe("VideoContext", () => {
	let context: VideoContext;
	let canvas: MockHTMLCanvasElement;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		canvas = new MockHTMLCanvasElement();
		context = new VideoContext({ frameRate: 30, canvas: canvas as any });
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoContext with default options", () => {
		const defaultContext = new VideoContext();
		assertEquals(defaultContext.frameRate, 30);
		assert(defaultContext.destination instanceof VideoDestinationNode);
	});

	it("should create VideoContext with custom options", () => {
		assertEquals(context.frameRate, 30);
		assert(context.destination instanceof VideoDestinationNode);
		assertEquals(context.destination.canvas, canvas as any);
	});

	it("should have initial running state", () => {
		assertEquals(context.state, "running");
	});

	it("should have currentTime starting at 0", () => {
		assertEquals(context.currentTime, 0);
	});

	it("should resume from suspended state", async () => {
		await context.suspend();
		assertEquals(context.state, "suspended");

		await context.resume();
		assertEquals(context.state, "running");
	});

	it("should suspend from running state", async () => {
		await context.suspend();
		assertEquals(context.state, "suspended");
	});

	it("should close context and disconnect all nodes", async () => {
		const node = new VideoSourceNode(context, new ReadableStream());
		await context.close();
		assertEquals(context.state, "closed");
	});

	it("should register and unregister nodes", () => {
		const node = new MockVideoNode();
		context["_register"](node);
		context["_unregister"](node);
		// No direct assertions possible, but should not throw
	});

	it("should handle negative frameRate", () => {
		const context = new VideoContext({ frameRate: -10 });
		assertEquals(context.frameRate, -10);
	});

	it("should handle zero frameRate", () => {
		const context = new VideoContext({ frameRate: 0 });
		assertEquals(context.frameRate, 0);
	});

	it("should handle very large frameRate", () => {
		const context = new VideoContext({ frameRate: 10000 });
		assertEquals(context.frameRate, 10000);
	});
});

describe("VideoNode", () => {
	let node: MockVideoNode;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		node = new MockVideoNode();
	});

	it("should create VideoNode with default options", () => {
		assertEquals(node.numberOfInputs, 1);
		assertEquals(node.numberOfOutputs, 1);
		assertEquals(node.inputs.size, 0);
		assertEquals(node.outputs.size, 0);
	});

	it("should create VideoNode with custom options", () => {
		const customNode = new MockVideoNode({ numberOfInputs: 2, numberOfOutputs: 3 });
		assertEquals(customNode.numberOfInputs, 2);
		assertEquals(customNode.numberOfOutputs, 3);
	});

	it("should connect to another node", () => {
		const node2 = new MockVideoNode();
		const result = node.connect(node2);
		assertEquals(result, node2);
		expect(node.outputs.has(node2)).toBe(true);
		expect(node2.inputs.has(node)).toBe(true);
	});

	it("should not connect to itself", () => {
		const result = node.connect(node);
		assertEquals(result, node);
		expect(node.outputs.has(node)).toBe(false);
		expect(node.inputs.has(node)).toBe(false);
	});

	it("should disconnect from specific node", () => {
		const node2 = new MockVideoNode();
		node.connect(node2);
		node.disconnect(node2);
		expect(node.outputs.has(node2)).toBe(false);
		expect(node2.inputs.has(node)).toBe(false);
	});

	it("should disconnect from all nodes", () => {
		const node2 = new MockVideoNode();
		const node3 = new MockVideoNode();
		node.connect(node2);
		node.connect(node3);
		node.disconnect();
		assertEquals(node.outputs.size, 0);
		expect(node2.inputs.has(node)).toBe(false);
		expect(node3.inputs.has(node)).toBe(false);
	});

	it("should dispose and disconnect", () => {
		const node2 = new MockVideoNode();
		node.connect(node2);
		node.dispose();
		assertEquals(node.outputs.size, 0);
		expect(node2.inputs.has(node)).toBe(false);
	});
});

describe("VideoSourceNode", () => {
	let context: VideoContext;
	let stream: ReadableStream<VideoFrame>;
	let sourceNode: VideoSourceNode;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		context = new VideoContext();
		stream = new ReadableStream({
			start(controller) {
				// Mock stream
			},
		});
		sourceNode = new VideoSourceNode(context, stream);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoSourceNode", () => {
		assertEquals(sourceNode.numberOfInputs, 0);
		assertEquals(sourceNode.numberOfOutputs, 1);
		assertEquals(sourceNode.context, context);
	});

	it("should process frames and pass to outputs", () => {
		const outputNode = new MockVideoNode();
		sourceNode.connect(outputNode);

		const frame = new MockVideoFrame();
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		sourceNode.process(frame);
		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should start and stop processing", async () => {
		// Mock the stream to provide one frame and then close
		const mockReader = {
			read: undefined /* TODO: Convert mock */
				.mockResolvedValueOnce({ done: false, value: new MockVideoFrame() })
				.mockResolvedValue({ done: true }),
			releaseLock: undefined, /* TODO: Convert mock */
		};
		/* TODO: Convert spy */ undefined(stream, "getReader").mockReturnValue(mockReader as any);

		const startPromise = sourceNode.start();
		// Wait a bit for processing
		await new Promise((resolve) => setTimeout(resolve, 10));
		sourceNode.stop();
		await startPromise; // Should resolve after stop
	}, 2000);

	it("should handle start errors gracefully", async () => {
		// Mock the stream reader to throw an error
		const mockReader = {
			read: undefined /* TODO: Convert mock */.mockRejectedValue(
				new Error("Stream read error"),
			),
			releaseLock: undefined, /* TODO: Convert mock */
		};
		/* TODO: Convert spy */ undefined(stream, "getReader").mockReturnValue(mockReader as any);

		// Should not throw despite the error
		await expect(sourceNode.start()).resolves.not.toThrow();
	}, 2000);

	it("should dispose and unregister", () => {
		sourceNode.dispose();
		assertEquals(sourceNode.outputs.size, 0);
	});
});

describe("MediaStreamVideoSourceNode", () => {
	let mockTrack: MediaStreamTrack;
	let mockStream: ReadableStream<VideoFrame>;
	let originalMediaStreamTrackProcessor: any;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		// Mock MediaStreamTrack
		mockTrack = {
			kind: "video",
			getSettings: vi.fn(() => ({ frameRate: 30, width: 640, height: 480 })),
			stop: undefined, /* TODO: Convert mock */
		} as any;

		// Mock ReadableStream
		mockStream = new ReadableStream({
			start(controller) {
				controller.enqueue(new MockVideoFrame());
			},
		});

		// Store original MediaStreamTrackProcessor
		originalMediaStreamTrackProcessor = (global as any).MediaStreamTrackProcessor;
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		// Restore original MediaStreamTrackProcessor
		(global as any).MediaStreamTrackProcessor = originalMediaStreamTrackProcessor;
		vi.restoreAllMocks();
	});

	it("should create with MediaStreamTrackProcessor", async () => {
		// Mock MediaStreamTrackProcessor
		(global as any).MediaStreamTrackProcessor = vi.fn(() => ({
			readable: mockStream,
		}));

		const { MediaStreamVideoSourceNode } = await import("./video_node");
		const node = new MediaStreamVideoSourceNode(mockTrack);

		assertEquals(node.track, mockTrack);
		expect((global as any).MediaStreamTrackProcessor).toHaveBeenCalledWith({
			track: mockTrack,
		});
	});

	it("should create with polyfill when MediaStreamTrackProcessor unavailable", async () => {
		// Remove MediaStreamTrackProcessor
		delete (global as any).MediaStreamTrackProcessor;

		// Mock document.createElement
		const mockVideo = {
			srcObject: null,
			play: undefined /* TODO: Convert mock */.mockResolvedValue(undefined),
			onloadedmetadata: null,
			videoWidth: 640,
			videoHeight: 480,
		};
		/* TODO: Convert spy */ undefined(document, "createElement").mockReturnValue(
			mockVideo as any,
		);

		// Mock Promise.all to resolve immediately
		const originalPromiseAll = Promise.all;
		/* TODO: Convert spy */ undefined(Promise, "all").mockResolvedValue([]);

		const { MediaStreamVideoSourceNode } = await import("./video_node");
		const node = new MediaStreamVideoSourceNode(mockTrack);

		assertEquals(node.track, mockTrack);
		expect(document.createElement).toHaveBeenCalledWith("video");
		assertEquals(mockVideo.srcObject, expect.any(MediaStream));

		// Restore
		Promise.all = originalPromiseAll;
	});

	it("should dispose and stop track", async () => {
		const { MediaStreamVideoSourceNode } = await import("./video_node");
		const node = new MediaStreamVideoSourceNode(mockTrack);
		node.dispose();

		expect(mockTrack.stop).toHaveBeenCalled();
	});

	it("should handle track without settings", async () => {
		const badTrack = {
			kind: "video",
			getSettings: vi.fn(() => null),
			stop: undefined, /* TODO: Convert mock */
		} as any;

		const { MediaStreamVideoSourceNode } = await import("./video_node");
		expect(() => new MediaStreamVideoSourceNode(badTrack)).toThrow("track has no settings");
	});
});

describe("VideoAnalyserNode", () => {
	let context: VideoContext;
	let analyserNode: VideoAnalyserNode;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		context = new VideoContext();
		analyserNode = new VideoAnalyserNode(context);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoAnalyserNode", () => {
		assertEquals(analyserNode.numberOfInputs, 1);
		assertEquals(analyserNode.numberOfOutputs, 1);
	});

	it("should have initial zero values", () => {
		assertEquals(analyserNode.brightness, 0);
		assertEquals(analyserNode.contrast, 0);
		assertEquals(analyserNode.saturation, 0);
		assertEquals(analyserNode.sharpness, 0);
		assertEquals(analyserNode.edgeStrength, 0);
		assertEquals(analyserNode.textureComplexity, 0);
		assertEquals(analyserNode.motionMagnitude, 0);
		assertEquals(analyserNode.motionDirection, 0);
	});

	it("should process frames and update analysis", () => {
		const frame = new MockVideoFrame(320, 240);
		analyserNode.process(frame);

		// Values should be updated after processing
		expect(analyserNode.brightness).toBeGreaterThanOrEqual(0);
		expect(analyserNode.contrast).toBeGreaterThanOrEqual(0);
		expect(analyserNode.saturation).toBeGreaterThanOrEqual(0);
	});

	it("should get color histogram", () => {
		const histogram = new Uint32Array(768); // RGB * 256
		analyserNode.getColorHistogram(histogram);
		// Should not throw
	});

	it("should get dominant colors", () => {
		const colors = analyserNode.getDominantColors();
		expect(Array.isArray(colors)).toBe(true);
	});

	it("should get spatial frequency data", () => {
		const frequencyData = new Float32Array(256);
		analyserNode.getSpatialFrequencyData(frequencyData);
		// Should not throw
	});

	it("should pass frames to outputs", () => {
		const outputNode = new MockVideoNode();
		analyserNode.connect(outputNode);

		const frame = new MockVideoFrame();
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		analyserNode.process(frame);
		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should handle frame close errors gracefully", () => {
		const outputNode = new MockVideoNode();
		analyserNode.connect(outputNode);

		const frame = new MockVideoFrame();
		// Mock VideoFrame.close to throw an error
		const closeSpy = /* TODO: Convert spy */ undefined(frame, "close").mockImplementation(
			() => {
				throw new Error("Close error");
			},
		);

		// Should not throw despite the error
		expect(() => analyserNode.process(frame)).not.toThrow();
		expect(closeSpy).toHaveBeenCalled();
	});

	it("should handle output processing errors gracefully", () => {
		const outputNode = new MockVideoNode();
		analyserNode.connect(outputNode);

		// Mock output node process to throw an error
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process")
			.mockImplementation(() => {
				throw new Error("Output processing error");
			});

		const frame = new MockVideoFrame();
		// Should not throw despite the error
		expect(() => analyserNode.process(frame)).not.toThrow();
		expect(processSpy).toHaveBeenCalledWith(frame);
	});
});

describe("VideoDestinationNode", () => {
	let context: VideoContext;
	let canvas: MockHTMLCanvasElement;
	let destinationNode: VideoDestinationNode;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		context = new VideoContext();
		canvas = new MockHTMLCanvasElement();
		destinationNode = new VideoDestinationNode(context, canvas as any);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoDestinationNode", () => {
		assertEquals(destinationNode.numberOfInputs, 1);
		assertEquals(destinationNode.numberOfOutputs, 0);
		assertEquals(destinationNode.canvas, canvas as any);
		assertEquals(destinationNode.resizeCallback, VideoRenderFunctions.contain);
	});

	it("should create with custom render function", () => {
		const customNode = new VideoDestinationNode(context, canvas as any, {
			renderFunction: VideoRenderFunctions.cover,
		});
		assertEquals(customNode.resizeCallback, VideoRenderFunctions.cover);
	});

	it("should process frames and draw to canvas", () => {
		const frame = new MockVideoFrame(640, 480);

		expect(() => destinationNode.process(frame)).not.toThrow();
		expect(canvas.getContext).toHaveBeenCalledWith("2d");
	});

	it("should handle frame close errors gracefully", () => {
		const frame = new MockVideoFrame(640, 480);

		// Mock VideoFrame.close to throw an error
		const closeSpy = /* TODO: Convert spy */ undefined(frame, "close").mockImplementation(
			() => {
				throw new Error("Close error");
			},
		);

		// Should not throw despite the error
		expect(() => destinationNode.process(frame)).not.toThrow();
		expect(closeSpy).toHaveBeenCalled();
	});

	it("should not draw when context is suspended", async () => {
		await context.suspend();
		const frame = new MockVideoFrame();
		const ctx = canvas.getContext("2d") as any;

		destinationNode.process(frame);

		expect(ctx.drawImage).not.toHaveBeenCalled();
	});

	it("should dispose and cancel animation frame", () => {
		const cancelSpy = undefined /* TODO: Convert mock */;
		const requestSpy = undefined /* TODO: Convert mock */.mockReturnValue(123);
		vi.stubGlobal("cancelAnimationFrame", cancelSpy);
		vi.stubGlobal("requestAnimationFrame", requestSpy);

		const destinationNode = new VideoDestinationNode(context, canvas as any);

		const frame = new MockVideoFrame(640, 480);
		destinationNode.process(frame);

		expect(requestSpy).toHaveBeenCalled();

		destinationNode.dispose();

		expect(cancelSpy).toHaveBeenCalledWith(123);
	});

	it("should handle frames with zero dimensions", () => {
		const frame = new MockVideoFrame(0, 0);
		expect(() => destinationNode.process(frame)).not.toThrow();
	});

	it("should handle frames with negative dimensions", () => {
		const frame = new MockVideoFrame(-100, -100);
		expect(() => destinationNode.process(frame)).not.toThrow();
	});

	it("should handle frames with very large dimensions", () => {
		const frame = new MockVideoFrame(10000, 10000);
		expect(() => destinationNode.process(frame)).not.toThrow();
	});

	it("should handle frames with negative timestamp", () => {
		const frame = new MockVideoFrame(640, 480, -1000);
		expect(() => destinationNode.process(frame)).not.toThrow();
	});
});

describe("VideoEncodeNode", () => {
	let context: VideoContext;
	let encodeNode: VideoEncodeNode;
	let onChunk: (c: EncodedContainer) => void;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		context = new VideoContext();
		onChunk = undefined /* TODO: Convert mock */;
		encodeNode = new VideoEncodeNode(context);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoEncodeNode", () => {
		assertEquals(encodeNode.numberOfInputs, 1);
		assertEquals(encodeNode.numberOfOutputs, 1);
	});

	it("should configure encoder", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
		};

		expect(() => encodeNode.configure(config)).not.toThrow();
	});

	it("should process frames and encode", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
		};
		encodeNode.configure(config);

		const frame = new MockVideoFrame();
		expect(() => encodeNode.process(frame)).not.toThrow();
	});

	it("should not encode when not configured", () => {
		const frame = new MockVideoFrame();
		expect(() => encodeNode.process(frame)).not.toThrow();
	});

	it("should dispose and close encoder", () => {
		expect(() => encodeNode.dispose()).not.toThrow();
	});
});

describe("VideoRenderFunctions", () => {
	it("contain should fit frame within canvas maintaining aspect ratio", () => {
		const result = VideoRenderFunctions.contain(640, 480, 800, 600);
		assertEquals(result.width, 800);
		assertEquals(result.height, 600);
		assertEquals(result.x, 0);
		assertEquals(result.y, 0);
	});

	it("cover should cover entire canvas maintaining aspect ratio", () => {
		const result = VideoRenderFunctions.cover(640, 480, 800, 600);
		assertEquals(result.width, 800);
		assertEquals(result.height, 600);
		assertEquals(result.x, 0);
		assertEquals(result.y, 0);
	});

	it("fill should fill entire canvas", () => {
		const result = VideoRenderFunctions.fill(640, 480, 800, 600);
		assertEquals(result.width, 800);
		assertEquals(result.height, 600);
		assertEquals(result.x, 0);
		assertEquals(result.y, 0);
	});

	it("scaleDown should only scale down, never up", () => {
		const result = VideoRenderFunctions.scaleDown(320, 240, 800, 600);
		assertEquals(result.width, 320);
		assertEquals(result.height, 240);
		assertEquals(result.x, 240);
		assertEquals(result.y, 180);
	});
});

// // Mock VideoFrame globally
// class MockVideoFrame implements VideoFrame {
//   displayWidth: number;
//   displayHeight: number;
//   timestamp: number;
//   duration: number | null;
//   codedWidth: number;
//   codedHeight: number;
//   codedRect: DOMRectReadOnly;
//   visibleRect: DOMRectReadOnly;
//   colorSpace: VideoColorSpace;
//   format: VideoPixelFormat;
//   allocationSize: (options?: VideoFrameCopyToOptions) => number;
//   copyTo: any;
//   close: () => void;
//   clone: () => VideoFrame;

//   constructor(width: number = 640, height: number = 480, timestamp: number = 0) {
//     this.displayWidth = width;
//     this.displayHeight = height;
//     this.codedWidth = width;
//     this.codedHeight = height;
//     this.timestamp = timestamp;
//     this.duration = null;
//     this.codedRect = {
//       x: 0,
//       y: 0,
//       width: width,
//       height: height,
//       top: 0,
//       right: width,
//       bottom: height,
//       left: 0,
//       toJSON: () => ({})
//     } as DOMRectReadOnly;
//     this.visibleRect = {
//       x: 0,
//       y: 0,
//       width: width,
//       height: height,
//       top: 0,
//       right: width,
//       bottom: height,
//       left: 0,
//       toJSON: () => ({})
//     } as DOMRectReadOnly;
//     this.colorSpace = {
//       primaries: 'bt709',
//       transfer: 'bt709',
//       matrix: 'bt709',
//       fullRange: false,
//       toJSON: () => ({})
//     } as VideoColorSpace;
//     this.format = 'NV12';
//     this.allocationSize = vi.fn(() => width * height * 1.5);
//     this.copyTo = undefined /* TODO: Convert mock */;
//     this.close = undefined /* TODO: Convert mock */;
//     this.clone = vi.fn(() => new MockVideoFrame(width, height, timestamp));
//   }
// }

// Set VideoFrame globally
(global as any).VideoFrame = MockVideoFrame;

// Mock EncodedVideoChunk
class MockEncodedVideoChunk implements EncodedVideoChunk {
	type: "key" | "delta";
	timestamp: number;
	duration: number | null;
	byteLength: number;
	copyTo: (destination: AllowSharedBufferSource) => void;

	constructor(
		type: "key" | "delta" = "key",
		timestamp: number = 0,
		duration: number | null = 33,
		byteLength: number = 1024,
	) {
		this.type = type;
		this.timestamp = timestamp;
		this.duration = duration;
		this.byteLength = byteLength;
		this.copyTo = vi.fn((dest) => {
			if (dest instanceof Uint8Array) {
				// Fill with dummy data
				for (let i = 0; i < Math.min(dest.length, byteLength); i++) {
					dest[i] = i % 256;
				}
			}
		});
	}
}

// // Mock VideoEncoder
// class MockVideoEncoder {
//   configure = undefined /* TODO: Convert mock */;
//   encode = undefined /* TODO: Convert mock */;
//   flush = undefined /* TODO: Convert mock */;
//   close = undefined /* TODO: Convert mock */;
//   reset = undefined /* TODO: Convert mock */;
// }

describe("VideoEncodeNode", () => {
	let context: VideoContext;
	let encoderNode: VideoEncodeNode;
	let mockEncoder: MockVideoEncoder;
	let mockFrame: MockVideoFrame;
	let onChunk: ReturnType<typeof vi.fn>;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		// Mock the global VideoEncoder
		mockEncoder = new MockVideoEncoder({
			output: undefined, /* TODO: Convert mock */
			error: undefined, /* TODO: Convert mock */
		});
		// When the code calls new VideoEncoder(init) we want the mock instance to receive
		// the init callbacks (output/error) so the node's handlers are wired to the mock.
		(global as any).VideoEncoder = vi.fn((init: any) => {
			// copy the init handlers onto the existing mock instance
			Object.assign(mockEncoder, init);
			return mockEncoder;
		});

		context = new VideoContext();
		onChunk = undefined /* TODO: Convert mock */;
		mockFrame = new MockVideoFrame();
		encoderNode = new VideoEncodeNode(context);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should create VideoEncodeNode", () => {
		assert(encoderNode instanceof VideoEncodeNode);
		assertEquals(encoderNode.numberOfInputs, 1);
		assertEquals(encoderNode.numberOfOutputs, 1);
	});

	it("should configure encoder", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};

		encoderNode.configure(config);

		expect(mockEncoder.configure).toHaveBeenCalledWith(config);
	});

	it("should encode video frame", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		const frame = new MockVideoFrame();
		encoderNode.process(frame);

		expect(mockEncoder.encode).toHaveBeenCalledWith(frame, { keyFrame: false });
	});

	it("should handle encode errors gracefully", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		// Mock encoder.encode to throw an error
		mockEncoder.encode.mockImplementation(() => {
			throw new Error("Encode error");
		});

		const frame = new MockVideoFrame();
		// Should not throw despite the error
		expect(() => encoderNode.process(frame)).not.toThrow();
		expect(mockEncoder.encode).toHaveBeenCalledWith(frame, { keyFrame: false });
	});

	it("should handle frame close errors gracefully", () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		// Mock VideoFrame.close to throw an error
		const frame = new MockVideoFrame();
		const closeSpy = /* TODO: Convert spy */ undefined(frame, "close").mockImplementation(
			() => {
				throw new Error("Close error");
			},
		);

		// Should not throw despite the error
		expect(() => encoderNode.process(frame)).not.toThrow();
		expect(closeSpy).toHaveBeenCalled();
	});

	it("should close encoder", async () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		await encoderNode.close();
		expect(mockEncoder.close).toHaveBeenCalled();
	});

	it("should handle close errors gracefully", async () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		// Mock encoder.close to throw an error
		mockEncoder.close.mockImplementation(() => {
			throw new Error("Close error");
		});

		// Should not throw despite the error
		await expect(encoderNode.close()).resolves.not.toThrow();
		expect(mockEncoder.close).toHaveBeenCalled();
	});

	it("should dispose encoder node", () => {
		encoderNode.dispose();
		// dispose should disconnect and unregister from context
		assertEquals(encoderNode.outputs.size, 0);
		assertEquals(encoderNode.inputs.size, 0);
	});

	it("should encode to destination", async () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		let resolveDone!: (value?: any) => void;
		const mockDestination: EncodeDestination = {
			output: undefined /* TODO: Convert mock */.mockImplementation((chunk) => {
				console.log("mockDestination.output called");
				return Promise.resolve(undefined);
			}),
			done: new Promise((resolve) => resolveDone = resolve),
		};

		// Add destination first
		const encodePromise = encoderNode.encodeTo(mockDestination);

		// Simulate encoding a chunk
		encoderNode.process(mockFrame);

		console.log("encode calls:", (mockEncoder.encode as any).mock.calls);

		// Resolve done to complete the encodeTo
		resolveDone();

		// Wait for the encode promise to resolve
		await expect(encodePromise).resolves.not.toThrow();

		// Check that output was called
		console.log("output calls:", (mockDestination.output as any).mock.calls);
		expect(mockDestination.output).toHaveBeenCalled();
	});
	it("should handle destination errors gracefully in encodeTo", async () => {
		const config: VideoEncoderConfig = {
			codec: "vp8",
			width: 640,
			height: 480,
			bitrate: 1000000,
			framerate: 30,
		};
		encoderNode.configure(config);

		const mockDestination: EncodeDestination = {
			output: undefined /* TODO: Convert mock */.mockRejectedValue(
				new Error("Destination error"),
			),
			done: Promise.resolve(),
		};

		const encodePromise = encoderNode.encodeTo(mockDestination);

		// Simulate encoding a chunk
		encoderNode.process(mockFrame);

		// Should not throw despite destination error
		await expect(encodePromise).resolves.not.toThrow();
		expect(mockDestination.output).toHaveBeenCalled();
	});
});

describe("VideoDecodeNode", () => {
	let context: VideoContext;
	let decoderNode: VideoDecodeNode;
	let mockDecoder: MockVideoDecoder;
	let onFrame: ReturnType<typeof vi.fn>;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		// Mock the global VideoDecoder
		mockDecoder = new MockVideoDecoder({
			output: undefined, /* TODO: Convert mock */
			error: undefined, /* TODO: Convert mock */
		});
		(global as any).VideoDecoder = vi.fn(() => mockDecoder);

		context = new VideoContext();
		onFrame = undefined /* TODO: Convert mock */;
		decoderNode = new VideoDecodeNode(context);
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should create VideoDecodeNode", () => {
		assert(decoderNode instanceof VideoDecodeNode);
		assertEquals(decoderNode.numberOfInputs, 1);
		assertEquals(decoderNode.numberOfOutputs, 1);
	});

	it("should configure decoder", () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};

		decoderNode.configure(config);

		expect(mockDecoder.configure).toHaveBeenCalledWith(config);
	});

	it("should decode encoded container", () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// VideoDecodeNode decodes in decodeFrom method, not in process
		// process method passes decoded frames to next nodes
		const frame = new MockVideoFrame();
		const outputNode = new MockVideoNode();
		decoderNode.connect(outputNode);
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		decoderNode.process(frame);

		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should handle frame close errors gracefully", () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Mock VideoFrame.close to throw an error
		const frame = new MockVideoFrame();
		const closeSpy = /* TODO: Convert spy */ undefined(frame, "close").mockImplementation(
			() => {
				throw new Error("Close error");
			},
		);

		// Should not throw despite the error
		expect(() => decoderNode.process(frame)).not.toThrow();
		expect(closeSpy).toHaveBeenCalled();
	});
	it("should pass decoded frames to outputs when decoder outputs frame", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Connect an output node
		const outputNode = new MockVideoNode();
		decoderNode.connect(outputNode);
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		// Simulate decoder output
		const mockFrame = new MockVideoFrame();
		const outputCallback = (global as any).VideoDecoder.mock.calls[0][0].output;
		await outputCallback(mockFrame);

		expect(processSpy).toHaveBeenCalledWith(mockFrame);
	});

	it("should handle output processing errors gracefully in process", () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Connect an output node that throws an error
		const outputNode = new MockVideoNode();
		decoderNode.connect(outputNode);
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process")
			.mockImplementation(() => {
				throw new Error("Output processing error");
			});

		const frame = new MockVideoFrame();
		// Should not throw despite the error
		expect(() => decoderNode.process(frame)).not.toThrow();
		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should close decoder", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		await decoderNode.close();
		expect(mockDecoder.close).toHaveBeenCalled();
	});

	it("should handle close errors gracefully", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Mock decoder.close to throw an error
		mockDecoder.close.mockImplementation(() => {
			throw new Error("Close error");
		});

		// Should not throw despite the error
		await expect(decoderNode.close()).resolves.not.toThrow();
		expect(mockDecoder.close).toHaveBeenCalled();
	});

	it("should flush decoder", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		await decoderNode.flush();
		expect(mockDecoder.flush).toHaveBeenCalled();
	});

	it("should handle flush errors gracefully", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Mock decoder.flush to throw an error
		mockDecoder.flush.mockImplementation(() => {
			throw new Error("Flush error");
		});

		// Should not throw despite the error
		await expect(decoderNode.flush()).resolves.not.toThrow();
		expect(mockDecoder.flush).toHaveBeenCalled();
	});

	it("should dispose decoder node", () => {
		decoderNode.dispose();
		// dispose should disconnect and unregister from context
		assertEquals(decoderNode.outputs.size, 0);
		assertEquals(decoderNode.inputs.size, 0);
	});

	it("should decode from track reader", async () => {
		const config: VideoDecoderConfig = {
			codec: "vp8",
			codedWidth: 640,
			codedHeight: 480,
		};
		decoderNode.configure(config);

		// Mock TrackReader
		const mockGroup = {
			readFrame: undefined /* TODO: Convert mock */.mockResolvedValue([{
				bytes: new Uint8Array([0, 0, 0, 0, 1, 2, 3]),
			}, undefined])
				.mockResolvedValueOnce([
					{ bytes: new Uint8Array([0, 0, 0, 0, 1, 2, 3]) },
					undefined,
				])
				.mockResolvedValueOnce([undefined, new Error("end of frames")]),
		};
		const mockReader = new ReadableStream();

		const ctx = Promise.resolve();
		await decoderNode.decodeFrom(mockReader);

		expect(mockReader.getReader).toHaveBeenCalled();
		expect(mockDecoder.decode).toHaveBeenCalled();
	});
});

describe("VideoObserveNode", () => {
	let context: VideoContext;
	let observeNode: VideoObserveNode;
	let mockCanvas: MockHTMLCanvasElement;
	let mockObserver: any;

	/* TODO: Convert beforeEach */ beforeEach(() => {
		mockCanvas = new MockHTMLCanvasElement();
		context = new VideoContext({ canvas: mockCanvas as any });

		// Mock IntersectionObserver
		mockObserver = {
			observe: undefined, /* TODO: Convert mock */
			disconnect: undefined, /* TODO: Convert mock */
		};
		vi.stubGlobal(
			"IntersectionObserver",
			vi.fn((callback) => {
				// Store callback for testing
				(mockObserver as any).callback = callback;
				return mockObserver;
			}),
		);

		observeNode = new VideoObserveNode(context); // enableBackground defaults to false
	});

	/* TODO: Convert afterEach */ afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create VideoObserveNode", () => {
		assertEquals(observeNode.numberOfInputs, 1);
		assertEquals(observeNode.numberOfOutputs, 1);
		assertEquals(observeNode.isVisible, true);
	});

	it("should process frames and pass to outputs when visible", () => {
		const outputNode = new MockVideoNode();
		observeNode.connect(outputNode);

		const frame = new MockVideoFrame();
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		observeNode.process(frame);
		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should not process frames when not visible", () => {
		const outputNode = new MockVideoNode();
		observeNode.connect(outputNode);

		// Simulate not intersecting by calling the observer callback
		(mockObserver as any).callback([{ isIntersecting: false }]);

		const frame = new MockVideoFrame();
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		observeNode.process(frame);
		expect(processSpy).not.toHaveBeenCalled();
	});

	it("should handle process errors gracefully", () => {
		const outputNode = new MockVideoNode();
		const errorNode = new MockVideoNode();

		observeNode.connect(outputNode);
		observeNode.connect(errorNode);

		// Make one node throw an error
		/* TODO: Convert spy */ undefined(errorNode, "process").mockImplementation(() => {
			throw new Error("Process error");
		});

		const frame = new MockVideoFrame();
		const processSpy = /* TODO: Convert spy */ undefined(outputNode, "process");

		// Should not throw despite the error
		expect(() => observeNode.process(frame)).not.toThrow();
		expect(processSpy).toHaveBeenCalledWith(frame);
	});

	it("should dispose and disconnect observer", () => {
		const outputNode = new MockVideoNode();
		observeNode.connect(outputNode);

		observeNode.dispose();
		assertEquals(observeNode.outputs.size, 0);
		expect(outputNode.inputs.has(observeNode)).toBe(false);
		expect(mockObserver.disconnect).toHaveBeenCalled();
	});

	it("should observe element", () => {
		const element = document.createElement("div");
		observeNode.observe(element);
		expect(mockObserver.observe).toHaveBeenCalledWith(element);
	});

	it("should get isVisible", () => {
		assertEquals(observeNode.isVisible, true);
		// Simulate not visible
		(mockObserver as any).callback([{ isIntersecting: false }]);
		assertEquals(observeNode.isVisible, false);
	});
});
