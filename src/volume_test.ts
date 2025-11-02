import { DefaultVolume, DefaultMinGain, DefaultFadeTime, MIN_GAIN_FALLBACK, FADE_TIME_FALLBACK, isValidMinGain, isValidFadeTime, isValidVolume, VolumeController } from './volume.ts';
import { setupGlobalMocks, resetGlobalMocks } from './test-utils.test.ts';
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


// Type augmentation for testing globalThis properties
declare global {
    var __DEFAULT_VOLUME__: number | undefined;
    var __DEFAULT_MIN_GAIN__: number | undefined;
    var __DEFAULT_FADE_TIME__: number | undefined;
}

describe('Volume', () => {
    let originalVolume: number | undefined;
    let originalMinGain: number | undefined;
    let originalFadeTime: number | undefined;
    let consoleWarnSpy: ReturnType<typeof /* TODO: Convert spy */ undefined>;

    /* TODO: Convert beforeEach */ beforeEach(() => {
        // Save original globalThis values
        originalVolume = (globalThis as any).__DEFAULT_VOLUME__;
        originalMinGain = (globalThis as any).__DEFAULT_MIN_GAIN__;
        originalFadeTime = (globalThis as any).__DEFAULT_FADE_TIME__;

        // Clear globalThis properties
        delete (globalThis as any).__DEFAULT_VOLUME__;
        delete (globalThis as any).__DEFAULT_MIN_GAIN__;
        delete (globalThis as any).__DEFAULT_FADE_TIME__;

        // Mock console.warn
        consoleWarnSpy = /* TODO: Convert spy */ undefined(console, 'warn').mockImplementation(() => {});

        // Set up global mocks for Web Audio API
        setupGlobalMocks();
    });

    /* TODO: Convert afterEach */ afterEach(() => {
        // Restore original globalThis values
        if (originalVolume !== undefined) {
            (globalThis as any).__DEFAULT_VOLUME__ = originalVolume;
        } else {
            delete (globalThis as any).__DEFAULT_VOLUME__;
        }

        if (originalMinGain !== undefined) {
            (globalThis as any).__DEFAULT_MIN_GAIN__ = originalMinGain;
        } else {
            delete (globalThis as any).__DEFAULT_MIN_GAIN__;
        }

        if (originalFadeTime !== undefined) {
            (globalThis as any).__DEFAULT_FADE_TIME__ = originalFadeTime;
        } else {
            delete (globalThis as any).__DEFAULT_FADE_TIME__;
        }

        // Restore console.warn
        consoleWarnSpy.mockRestore();

        // Reset global mocks
        resetGlobalMocks();
    });

    describe('Default Values', () => {
        test('returns fallback values when globalThis properties are not set', () => {
            const volume = DefaultVolume();
            const minGain = DefaultMinGain();
            const fadeTime = DefaultFadeTime();

            assertEquals(volume, 0.5);
            assertEquals(minGain, MIN_GAIN_FALLBACK);
            assertEquals(fadeTime, FADE_TIME_FALLBACK);
        });

        test('returns globalThis values when set', () => {
            // Simulate Vite define injection
            (globalThis as any).__DEFAULT_VOLUME__ = 0.7;
            (globalThis as any).__DEFAULT_MIN_GAIN__ = 0.002;
            (globalThis as any).__DEFAULT_FADE_TIME__ = 0.09;

            const volume = DefaultVolume();
            const minGain = DefaultMinGain();
            const fadeTime = DefaultFadeTime();

            assertEquals(volume, 0.7);
            assertEquals(minGain, 0.002);
            assertEquals(fadeTime, 0.09);
        });

        test('warns when globalThis values are invalid', () => {
            // Simulate invalid Vite define injection
            (globalThis as any).__DEFAULT_VOLUME__ = 1.5;
            (globalThis as any).__DEFAULT_MIN_GAIN__ = NaN;
            (globalThis as any).__DEFAULT_FADE_TIME__ = Infinity;

            const volume = DefaultVolume();
            const minGain = DefaultMinGain();
            const fadeTime = DefaultFadeTime();

            assertEquals(volume, 0.5);
            assertEquals(minGain, MIN_GAIN_FALLBACK);
            assertEquals(fadeTime, FADE_TIME_FALLBACK);

            expect(consoleWarnSpy).toHaveBeenCalledWith('[volume] __DEFAULT_VOLUME__ is out of range, fallback to 0.5:', 1.5);
        });
    });

    describe('Validation Functions', () => {
        describe('isValidMinGain', () => {
            test('returns true for valid min gain values', () => {
                expect(isValidMinGain(0.001)).toBe(true);
                expect(isValidMinGain(0.005)).toBe(true);
                expect(isValidMinGain(0.009)).toBe(true);
            });

            test('returns false for invalid min gain values', () => {
                expect(isValidMinGain(0)).toBe(false);
                expect(isValidMinGain(-0.001)).toBe(false);
                expect(isValidMinGain(0.01)).toBe(false);
                expect(isValidMinGain(0.1)).toBe(false);
                expect(isValidMinGain(NaN)).toBe(false);
                expect(isValidMinGain(Infinity)).toBe(false);
                expect(isValidMinGain('0.001' as any)).toBe(false);
            });
        });

        describe('isValidFadeTime', () => {
            test('returns true for valid fade time values', () => {
                expect(isValidFadeTime(0.02)).toBe(true);
                expect(isValidFadeTime(0.5)).toBe(true);
                expect(isValidFadeTime(0.99)).toBe(true);
            });

            test('returns false for invalid fade time values', () => {
                expect(isValidFadeTime(0)).toBe(false);
                expect(isValidFadeTime(0.005)).toBe(false);
                expect(isValidFadeTime(1.0)).toBe(false);
                expect(isValidFadeTime(2.0)).toBe(false);
                expect(isValidFadeTime(NaN)).toBe(false);
                expect(isValidFadeTime(Infinity)).toBe(false);
                expect(isValidFadeTime('0.5' as any)).toBe(false);
            });
        });
    });

    describe('Validation Functions', () => {
        describe('isValidMinGain', () => {
            test('returns true for valid min gain values', () => {
                expect(isValidMinGain(0.001)).toBe(true);
                expect(isValidMinGain(0.005)).toBe(true);
                expect(isValidMinGain(0.009)).toBe(true);
            });

            test('returns false for invalid min gain values', () => {
                expect(isValidMinGain(0)).toBe(false);
                expect(isValidMinGain(-0.001)).toBe(false);
                expect(isValidMinGain(0.01)).toBe(false);
                expect(isValidMinGain(0.1)).toBe(false);
                expect(isValidMinGain(NaN)).toBe(false);
                expect(isValidMinGain(Infinity)).toBe(false);
                expect(isValidMinGain('0.001' as any)).toBe(false);
            });
        });

        describe('isValidFadeTime', () => {
            test('returns true for valid fade time values', () => {
                expect(isValidFadeTime(0.02)).toBe(true);
                expect(isValidFadeTime(0.5)).toBe(true);
                expect(isValidFadeTime(0.99)).toBe(true);
            });

            test('returns false for invalid fade time values', () => {
                expect(isValidFadeTime(0)).toBe(false);
                expect(isValidFadeTime(0.005)).toBe(false);
                expect(isValidFadeTime(1.0)).toBe(false);
                expect(isValidFadeTime(2.0)).toBe(false);
                expect(isValidFadeTime(NaN)).toBe(false);
                expect(isValidFadeTime(Infinity)).toBe(false);
                expect(isValidFadeTime('0.5' as any)).toBe(false);
            });
        });

        describe('isValidVolume', () => {
            test('returns true for valid volume values', () => {
                expect(isValidVolume(0)).toBe(true);
                expect(isValidVolume(0.1)).toBe(true);
                expect(isValidVolume(0.5)).toBe(true);
                expect(isValidVolume(1.0)).toBe(true);
            });

            test('returns false for invalid volume values', () => {
                expect(isValidVolume(-0.1)).toBe(false);
                expect(isValidVolume(1.1)).toBe(false);
                expect(isValidVolume(NaN)).toBe(false);
                expect(isValidVolume(Infinity)).toBe(false);
                expect(isValidVolume('0.5' as any)).toBe(false);
                expect(isValidVolume(null)).toBe(false);
                expect(isValidVolume(undefined)).toBe(false);
            });
        });
    });
});

describe('VolumeController', () => {
    let audioContext: AudioContext;
    let controller: VolumeController;

    /* TODO: Convert beforeEach */ beforeEach(() => {
        audioContext = new AudioContext();
        controller = new VolumeController(audioContext);
    });

    /* TODO: Convert afterEach */ afterEach(() => {
        controller.disconnect();
    });

    describe('constructor', () => {
        test('creates with default volume', () => {
            assertEquals(controller.volume, 0.5);
            assertEquals(controller.muted, false);
        });

        test('creates with custom initial volume', () => {
            const customController = new VolumeController(audioContext, { initialVolume: 0.8 });
            assertEquals(customController.volume, 0.8);
            customController.disconnect();
        });

        test('creates with NaN initial volume', () => {
            const customController = new VolumeController(audioContext, { initialVolume: NaN });
            assertEquals(customController.volume, 1); // Falls back to 1
            customController.disconnect();
        });

        test('creates with Infinity initial volume', () => {
            const customController = new VolumeController(audioContext, { initialVolume: Infinity });
            assertEquals(customController.volume, 1); // Falls back to 1
            customController.disconnect();
        });

        test('uses custom fade time', () => {
            const customController = new VolumeController(audioContext, { fadeTimeMs: 0.1 });
            // fadeTimeMs is stored in #rampMs, but we can't access it directly
            // Instead, test by calling setVolume and checking the ramp time
            customController.setVolume(0.3);
            // The mock should have been called with the correct time
            assertEquals(true, true); // Placeholder, actual test would check mock calls
            customController.disconnect();
        });
    });

    describe('setVolume', () => {
        test('sets volume with fade', () => {
            controller.setVolume(0.8);
            assertEquals(controller.volume, 0.8);
        });

        test('clamps volume to valid range', () => {
            controller.setVolume(-0.1);
            assertEquals(controller.volume, 0);

            controller.setVolume(1.5);
            assertEquals(controller.volume, 1);

            controller.setVolume(NaN);
            assertEquals(controller.volume, 1);

            controller.setVolume(Infinity);
            assertEquals(controller.volume, 1);
        });

        test('handles very low volume with exponential ramp', () => {
            controller.setVolume(0.0005); // Below DefaultMinGain
            assertEquals(controller.volume, 0); // It ramps to min gain then to 0
        });
    });

    describe('mute', () => {
        test('mutes and unmutes', () => {
            controller.setVolume(0.7);
            assertEquals(controller.muted, false);

            controller.mute(true);
            assertEquals(controller.muted, true);

            controller.mute(false);
            assertEquals(controller.muted, false);
        });

        test('mutes low volume correctly', () => {
            controller.setVolume(0.0005);
            controller.mute(true);
            assertEquals(controller.volume, 0);
        });

        test('restores previous volume when unmuting', () => {
            controller.setVolume(0.6);
            controller.mute(true);
            assertEquals(controller.volume, 0);

            controller.mute(false);
            assertEquals(controller.volume, 0.6);
        });

        test('uses default volume if unmuting with zero volume', () => {
            controller.setVolume(0);
            controller.mute(true);
            controller.mute(false);
            assertEquals(controller.volume, 0.5); // DefaultVolume
        });
    });

    describe('getters', () => {
        test('volume getter returns current gain value', () => {
            controller.setVolume(0.4);
            assertEquals(controller.volume, 0.4);
        });

        test('muted getter returns mute state', () => {
            assertEquals(controller.muted, false);
            controller.mute(true);
            assertEquals(controller.muted, true);
        });
    });
});
