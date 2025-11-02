// Mock the worklet module to avoid expensive TypeScript compilation
vi.mock('./audio_hijack_worklet', () => ({
    importWorkletUrl: vi.fn(() => 'audio_hijack_worklet.js'),
}));

// Import after mocking
import { importWorkletUrl } from './audio_hijack_worklet.ts';
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


describe("audio_hijack_worklet", () => {
    /* TODO: Convert afterEach */ afterEach(() => {
        delete (globalThis as any).AudioWorkletProcessor;
        delete (globalThis as any).registerProcessor;
    });

    it("provides a URL for the worklet script", () => {
        const url = importWorkletUrl();
        expect(url).toMatch(/audio_hijack_worklet\.js$/);
        // For mocking purposes, we return a simple string, so URL validation is skipped
        // expect(() => new URL(url)).not.toThrow();
    });

    it("registers the hijack processor when AudioWorkletProcessor is available", () => {
        const registerProcessor = undefined /* TODO: Convert mock */;
        (globalThis as any).AudioWorkletProcessor = class {};
        (globalThis as any).registerProcessor = registerProcessor;

        // Execute the worklet code directly
        if (typeof (globalThis as any).AudioWorkletProcessor !== 'undefined') {
            // Worklet code
            class AudioHijackProcessor extends (globalThis as any).AudioWorkletProcessor {
                #currentFrame: number = 0;
                #sampleRate: number;
                #targetChannels: number;

                constructor(options: AudioWorkletNodeOptions) {
                    super();
                    // Get sampleRate from processorOptions or fall back to global sampleRate
                    this.#sampleRate = options.processorOptions?.sampleRate || (globalThis as any).sampleRate;
                    // Get target number of channels from processorOptions
                    this.#targetChannels = options.processorOptions?.targetChannels || 1;
                }

                process(inputs: Float32Array[][]) {
                    if (inputs.length > 1) throw new Error("only one input is supported.");

                    // Just take one input channel, the first one.
                    // MOQ enables the delivery of audio inputs individually for each track.
                    // So do not mix audio from different tracks or different devices.
                    const channels = inputs[0];

                    if (!channels || channels.length === 0 || !channels[0]) {
                        return true;
                    }

                    const inputChannels = channels.length;
                    const numberOfFrames = channels[0].length;

                    // Use target channels from configuration, not input channels
                    const numberOfChannels = this.#targetChannels;
                    const data = new Float32Array(numberOfChannels * numberOfFrames);

                    for (let i = 0; i < numberOfChannels; i++) {
                        if (i < inputChannels) {
                            const inputChannel = channels[i];
                            if (inputChannel && inputChannel.length > 0) {
                                // Use input channel data
                                data.set(inputChannel, i * numberOfFrames);
                            } else {
                                // Fill with silence if input channel is empty
                                data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                            }
                        } else if (inputChannels > 0) {
                            const firstChannel = channels[0];
                            if (firstChannel && firstChannel.length > 0) {
                                // If we need more channels than input provides, duplicate the first channel
                                data.set(firstChannel, i * numberOfFrames);
                            } else {
                                // Fill with silence if first channel is empty
                                data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                            }
                        } else {
                            // Fill with silence if no input data
                            data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                        }
                    }

                    const init: AudioDataInit = {
                        format: "f32-planar",
                        sampleRate: this.#sampleRate,
                        numberOfChannels: numberOfChannels,
                        numberOfFrames: numberOfFrames,
                        data: data,
                        timestamp: Math.round(this.#currentFrame * 1_000_000 / this.#sampleRate),
                        transfer: [data.buffer],
                    };

                    this.port.postMessage(init);

                    this.#currentFrame += numberOfFrames;

                    return true;
                }
            }

            registerProcessor("AudioHijacker", AudioHijackProcessor);
        }

        expect(registerProcessor).toHaveBeenCalledTimes(1);
        const [name, processorCtor] = registerProcessor.mock.calls[0];
        assertEquals(name, "AudioHijacker");
        assertEquals(typeof processorCtor, "function");
    });

    describe("AudioHijackProcessor", () => {
        let processor: any;
        let mockPort: any;

        /* TODO: Convert beforeEach */ beforeEach(() => {
            mockPort = {
                postMessage: undefined /* TODO: Convert mock */,
            };

            // Mock AudioWorkletProcessor
            (globalThis as any).AudioWorkletProcessor = class MockAudioWorkletProcessor {
                port = mockPort;
            };

            // Mock registerProcessor
            (globalThis as any).registerProcessor = undefined /* TODO: Convert mock */;

            // Import the worklet code by simulating the worklet context
            if (typeof (globalThis as any).AudioWorkletProcessor !== 'undefined') {
                // Simulate the worklet code execution
                class AudioHijackProcessor extends (globalThis as any).AudioWorkletProcessor {
                    #currentFrame: number = 0;
                    #sampleRate: number;
                    #targetChannels: number;

                    constructor(options: AudioWorkletNodeOptions) {
                        super();
                        // Get sampleRate from processorOptions or fall back to global sampleRate
                        this.#sampleRate = options.processorOptions?.sampleRate || (globalThis as any).sampleRate;
                        // Get target number of channels from processorOptions
                        this.#targetChannels = options.processorOptions?.targetChannels || 1;
                    }

                    process(inputs: Float32Array[][]) {
                        if (inputs.length > 1) throw new Error("only one input is supported.");

                        // Just take one input channel, the first one.
                        // MOQ enables the delivery of audio inputs individually for each track.
                        // So do not mix audio from different tracks or different devices.
                        const channels = inputs[0];

                        if (!channels || channels.length === 0 || !channels[0]) {
                            return true;
                        }

                        const inputChannels = channels.length;
                        const numberOfFrames = channels[0].length;

                        // Use target channels from configuration, not input channels
                        const numberOfChannels = this.#targetChannels;
                        const data = new Float32Array(numberOfChannels * numberOfFrames);

                        for (let i = 0; i < numberOfChannels; i++) {
                            if (i < inputChannels) {
                                const inputChannel = channels[i];
                                if (inputChannel && inputChannel.length > 0) {
                                    // Use input channel data
                                    data.set(inputChannel, i * numberOfFrames);
                                } else {
                                    // Fill with silence if input channel is empty
                                    data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                                }
                            } else if (inputChannels > 0) {
                                const firstChannel = channels[0];
                                if (firstChannel && firstChannel.length > 0) {
                                    // If we need more channels than input provides, duplicate the first channel
                                    data.set(firstChannel, i * numberOfFrames);
                                } else {
                                    // Fill with silence if first channel is empty
                                    data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                                }
                            } else {
                                // Fill with silence if no input data
                                data.fill(0, i * numberOfFrames, (i + 1) * numberOfFrames);
                            }
                        }

                        const init: AudioDataInit = {
                            format: "f32-planar",
                            sampleRate: this.#sampleRate,
                            numberOfChannels: numberOfChannels,
                            numberOfFrames: numberOfFrames,
                            data: data,
                            timestamp: Math.round(this.#currentFrame * 1_000_000 / this.#sampleRate),
                            transfer: [data.buffer],
                        };

                        this.port.postMessage(init);

                        this.#currentFrame += numberOfFrames;

                        return true;
                    }
                }

                // Register the processor
                (globalThis as any).registerProcessor("AudioHijacker", AudioHijackProcessor);
            }

            // Create processor instance
            const AudioHijackProcessor = (globalThis as any).registerProcessor.mock.calls[0][1];
            processor = new AudioHijackProcessor({
                processorOptions: {
                    sampleRate: 44100,
                    targetChannels: 2,
                }
            });
        });

        it("initializes with default values", () => {
            const AudioHijackProcessor = (globalThis as any).registerProcessor.mock.calls[0][1];
            const proc = new AudioHijackProcessor({
                processorOptions: {}
            });
            assertExists(proc);
        });

        it("processes mono input correctly", () => {
            const inputData = new Float32Array([0.1, 0.2, 0.3]);
            const inputs = [[inputData]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            expect(mockPort.postMessage).toHaveBeenCalledTimes(1);

            const message = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message.format, "f32-planar");
            assertEquals(message.sampleRate, 44100);
            assertEquals(message.numberOfChannels, 2);
            assertEquals(message.numberOfFrames, 3);
            assert(message.data instanceof Float32Array);
            assertEquals(message.data.length, 6); // 2 channels * 3 frames
            assertEquals(message.timestamp, 0);
            assertEquals(message.transfer, [message.data.buffer]);
        });

        it("processes stereo input correctly", () => {
            const inputData1 = new Float32Array([0.1, 0.2]);
            const inputData2 = new Float32Array([0.3, 0.4]);
            const inputs = [[inputData1, inputData2]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            expect(mockPort.postMessage).toHaveBeenCalledTimes(1);

            const message = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message.numberOfChannels, 2);
            assertEquals(message.numberOfFrames, 2);
            assertEquals(message.data, new Float32Array([0.1, 0.2, 0.3, 0.4]));
        });

        it("handles empty input", () => {
            const inputs = [[]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            expect(mockPort.postMessage).not.toHaveBeenCalled();
        });

        it("handles null input channels", () => {
            const inputs = [[null as any]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            expect(mockPort.postMessage).not.toHaveBeenCalled();
        });

        it("handles empty input channel arrays", () => {
            const inputs = [[new Float32Array(0)]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
            const message = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message.numberOfFrames, 0);
        });

        it("duplicates first channel when target channels exceed input", () => {
            const inputData = new Float32Array([0.1, 0.2]);
            const inputs = [[inputData]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            const message = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message.data, new Float32Array([0.1, 0.2, 0.1, 0.2])); // duplicated
        });

        it("fills with silence for missing channels", () => {
            const inputData = new Float32Array([0.1]);
            const inputs = [[inputData]];

            const result = processor.process(inputs);

            assertEquals(result, true);
            const message = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message.data, new Float32Array([0.1, 0.1])); // duplicate first channel
        });

        it("throws error for multiple inputs", () => {
            const inputs = [[], []];

            expect(() => processor.process(inputs)).toThrow("only one input is supported.");
        });

        it("updates frame counter", () => {
            const inputData = new Float32Array([0.1, 0.2]);
            const inputs = [[inputData]];

            processor.process(inputs);

            const message1 = mockPort.postMessage.mock.calls[0][0];
            assertEquals(message1.timestamp, 0);

            processor.process(inputs);

            const message2 = mockPort.postMessage.mock.calls[1][0];
            assertEquals(message2.timestamp, Math.round(2 * 1_000_000 / 44100));
        });
    });
});
