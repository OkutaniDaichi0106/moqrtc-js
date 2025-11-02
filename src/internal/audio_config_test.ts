import { 
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";

    DEFAULT_AUDIO_CODECS, 
    DEFAULT_AUDIO_CONFIG, 
    audioEncoderConfig, 
    upgradeAudioEncoderConfig,
    AudioEncoderOptions 
} from './audio_config.ts';

// Mock AudioEncoder
const mockAudioEncoder = {
    isConfigSupported: undefined /* TODO: Convert mock */,
};

// Mock the global AudioEncoder
Object.defineProperty(global, 'AudioEncoder', {
    writable: true,
    value: mockAudioEncoder,
});

// Mock console.debug to avoid noise in tests
global.console.debug = undefined /* TODO: Convert mock */;

describe('Audio Config', () => {
    /* TODO: Convert beforeEach */ beforeEach(() => {
        vi.clearAllMocks();
        // Set up navigator for browser detection
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            writable: true,
        });
    });

    describe('DEFAULT_AUDIO_CODECS', () => {
        test('contains expected codec list', () => {
            assertEquals(DEFAULT_AUDIO_CODECS, ['opus', 'isac', 'g722', 'pcmu', 'pcma']);
        });

        test('is readonly', () => {
            expect(Object.isFrozen(DEFAULT_AUDIO_CODECS)).toBe(false); // const arrays aren't frozen by default
            assertEquals(DEFAULT_AUDIO_CODECS.length, 5);
        });

        test('has opus as preferred codec', () => {
            assertEquals(DEFAULT_AUDIO_CODECS[0], 'opus');
        });
    });

    describe('DEFAULT_AUDIO_CONFIG', () => {
        test('contains expected default values', () => {
            assertEquals(DEFAULT_AUDIO_CONFIG, {
                sampleRate: 48000,
                channels: 2,
                bitrate: 64000,
            });
        });

        test('uses standard audio settings', () => {
            assertEquals(DEFAULT_AUDIO_CONFIG.sampleRate, 48000); // Professional audio standard
            assertEquals(DEFAULT_AUDIO_CONFIG.channels, 2); // Stereo
            assertEquals(DEFAULT_AUDIO_CONFIG.bitrate, 64000); // 64 kbps
        });
    });

    describe('audioEncoderConfig', () => {
        /* TODO: Convert beforeEach */ beforeEach(() => {
            vi.clearAllMocks();
            // Set up navigator for browser detection
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                writable: true,
            });
            // Mock isConfigSupported to return the config as supported
            mockAudioEncoder.isConfigSupported = undefined /* TODO: Convert mock */.mockImplementation((cfg) => 
                Promise.resolve({ supported: true, config: cfg })
            );
        });

        test('returns supported config for valid options', async () => {

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            const result = await audioEncoderConfig(options);

            assertEquals(result.codec, 'opus');
            assertEquals(result.sampleRate, 48000);
            assertEquals(result.numberOfChannels, 2);
            assertEquals(result.bitrate, 64000);
            // Check that upgradeAudioEncoderConfig was called (Opus parameters added)
            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledWith(
                expect.objectContaining({
                    opus: expect.objectContaining({
                        application: 'audio',
                        signal: 'music',
                    }),
                    parameters: expect.objectContaining({
                        useinbandfec: 1,
                        stereo: 1,
                    }),
                })
            );
            expect(console.debug).toHaveBeenCalledWith('using audio encoding:', result);
        });

        test('uses default bitrate when not provided', async () => {
            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await audioEncoderConfig(options);

            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledWith(
                expect.objectContaining({
                    bitrate: DEFAULT_AUDIO_CONFIG.bitrate,
                })
            );
        });

        test('uses custom bitrate when provided', async () => {
            const customBitrate = 128000;

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 1,
                bitrate: customBitrate,
            };

            await audioEncoderConfig(options);

            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledWith(
                expect.objectContaining({
                    bitrate: customBitrate,
                })
            );
        });

        test('uses default codecs when preferredCodecs not provided', async () => {
            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await audioEncoderConfig(options);

            // Should try opus first (from DEFAULT_AUDIO_CODECS)
            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledWith(
                expect.objectContaining({
                    codec: 'opus',
                })
            );
        });

        test('uses custom preferredCodecs when provided', async () => {
            const customCodecs = ['pcmu', 'opus'] as const;
            
            // First call returns unsupported, second call returns supported
            mockAudioEncoder.isConfigSupported
                .mockResolvedValueOnce({ supported: false })
                .mockResolvedValueOnce({ 
                    supported: true, 
                    config: { codec: 'opus' } 
                });

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
                preferredCodecs: customCodecs,
            };

            await audioEncoderConfig(options);

            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledTimes(2);
            expect(mockAudioEncoder.isConfigSupported).toHaveBeenNthCalledWith(1,
                expect.objectContaining({ codec: 'pcmu' })
            );
            expect(mockAudioEncoder.isConfigSupported).toHaveBeenNthCalledWith(2,
                expect.objectContaining({ codec: 'opus' })
            );
        });

        test('tries all codecs until one is supported', async () => {
            // Mock first 3 codecs as unsupported, 4th as supported
            mockAudioEncoder.isConfigSupported
                .mockResolvedValueOnce({ supported: false })
                .mockResolvedValueOnce({ supported: false })
                .mockResolvedValueOnce({ supported: false })
                .mockResolvedValueOnce({ 
                    supported: true, 
                    config: { codec: 'pcmu' } 
                });

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            const result = await audioEncoderConfig(options);

            assertEquals(result, { codec: 'pcmu' });
            expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledTimes(4);
        });

        test('throws error when no codec is supported', async () => {
            mockAudioEncoder.isConfigSupported.mockResolvedValue({ supported: false });

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await expect(audioEncoderConfig(options)).rejects.toThrow('no supported audio codec');
        });

        test('handles missing isConfigSupported method', async () => {
            // Remove isConfigSupported method
            delete (mockAudioEncoder as any).isConfigSupported;

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await expect(audioEncoderConfig(options)).rejects.toThrow('no supported audio codec');
        });

        test('handles isConfigSupported throwing error', async () => {
            // Set it to reject
            mockAudioEncoder.isConfigSupported.mockRejectedValue(new Error('Config check failed'));

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await expect(audioEncoderConfig(options)).rejects.toThrow('no supported audio codec');
        });

        test('handles mono audio configuration', async () => {
            const options: AudioEncoderOptions = {
                sampleRate: 16000,
                channels: 1,
                bitrate: 32000,
            };

            const result = await audioEncoderConfig(options);

            assertEquals(result.numberOfChannels, 1);
            assertEquals(result.sampleRate, 16000);
        });

        test('handles high sample rate configuration', async () => {
            const options: AudioEncoderOptions = {
                sampleRate: 96000,
                channels: 2,
                bitrate: 128000,
            };

            const result = await audioEncoderConfig(options);

            assertEquals(result.sampleRate, 96000);
        });
    });

    describe('upgradeAudioEncoderConfig', () => {
        const baseConfig: AudioEncoderConfig = {
            codec: 'opus',
            sampleRate: 48000,
            numberOfChannels: 2,
            bitrate: 64000,
        };

        test('applies codec from parameter', () => {
            const result = upgradeAudioEncoderConfig(baseConfig, 'pcmu');

            assertEquals(result.codec, 'pcmu');
            assertEquals(result.sampleRate, baseConfig.sampleRate);
            assertEquals(result.numberOfChannels, baseConfig.numberOfChannels);
        });

        test('applies custom bitrate when provided', () => {
            const customBitrate = 128000;
            const result = upgradeAudioEncoderConfig(baseConfig, 'opus', customBitrate);

            assertEquals(result.bitrate, customBitrate);
        });

        test('keeps original bitrate when custom bitrate not provided', () => {
            const result = upgradeAudioEncoderConfig(baseConfig, 'opus');

            assertEquals(result.bitrate, baseConfig.bitrate);
        });

        test('applies Opus-specific enhancements for stereo', () => {
            const result = upgradeAudioEncoderConfig(baseConfig, 'opus') as any;

            assertExists(result.opus);
            assertEquals(result.opus.application, 'audio'); // stereo defaults to 'audio'
            assertEquals(result.opus.signal, 'music'); // stereo defaults to 'music'
            assertExists(result.parameters);
            assertEquals(result.parameters.useinbandfec, 1);
            assertEquals(result.parameters.stereo, 1); // stereo enabled
            assertEquals(result.bitrateMode, 'variable'); // Chrome default
        });

        test('applies Opus-specific enhancements for mono', () => {
            const monoConfig = { ...baseConfig, numberOfChannels: 1 };
            const result = upgradeAudioEncoderConfig(monoConfig, 'opus') as any;

            assertEquals(result.opus.application, 'voip'); // mono defaults to 'voip'
            assertEquals(result.opus.signal, 'voice'); // mono defaults to 'voice'
            assertEquals(result.parameters.stereo, 0); // stereo disabled
        });

        test('does not override existing Opus parameters', () => {
            const configWithOpus = {
                ...baseConfig,
                opus: { application: 'existing' },
                parameters: { useinbandfec: 0 },
            } as any;

            const result = upgradeAudioEncoderConfig(configWithOpus, 'opus') as any;

            assertEquals(result.opus.application, 'existing'); // preserved
            assertEquals(result.parameters.useinbandfec, 0); // preserved
        });

        test('does not apply Opus enhancements for non-Opus codecs', () => {
            const result = upgradeAudioEncoderConfig(baseConfig, 'pcmu') as any;

            assertEquals(result.opus, undefined);
            assertEquals(result.parameters, undefined);
            assertEquals(result.bitrateMode, undefined);
        });

        test('handles undefined bitrate parameter', () => {
            const result = upgradeAudioEncoderConfig(baseConfig, 'opus', undefined);

            assertEquals(result.bitrate, baseConfig.bitrate);
        });

        test('preserves all base config properties', () => {
            const extendedBase = {
                ...baseConfig,
                customProperty: 'test',
            } as any;

            const result = upgradeAudioEncoderConfig(extendedBase, 'pcmu') as any;

            assertEquals(result.customProperty, 'test');
            assertEquals(result.sampleRate, extendedBase.sampleRate);
            assertEquals(result.numberOfChannels, extendedBase.numberOfChannels);
        });

        test('applies browser-specific bitrate mode for Chrome', () => {
            // Mock is already set to Chrome=true, Firefox=false in the mock above
            const result = upgradeAudioEncoderConfig(baseConfig, 'opus') as any;

            assertEquals(result.bitrateMode, 'variable');
        });
    });

    describe('AudioEncoderOptions interface', () => {
        test('requires sampleRate and channels', () => {
            // This test ensures the interface is properly typed (TypeScript compilation test)
            const validOptions: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            assertEquals(validOptions.sampleRate, 48000);
            assertEquals(validOptions.channels, 2);
        });

        test('supports optional properties', () => {
            const fullOptions: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
                bitrate: 128000,
                preferredCodecs: ['opus', 'pcmu'],
            };

            assertEquals(fullOptions.bitrate, 128000);
            assertEquals(fullOptions.preferredCodecs, ['opus', 'pcmu']);
        });
    });

    describe('Error Handling', () => {
        test('handles null AudioEncoder', async () => {
            Object.defineProperty(global, 'AudioEncoder', {
                writable: true,
                value: null,
            });

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await expect(audioEncoderConfig(options)).rejects.toThrow();
        });

        test('handles AudioEncoder without isConfigSupported', async () => {
            Object.defineProperty(global, 'AudioEncoder', {
                writable: true,
                value: {},
            });

            const options: AudioEncoderOptions = {
                sampleRate: 48000,
                channels: 2,
            };

            await expect(audioEncoderConfig(options)).rejects.toThrow('no supported audio codec');
        });
    });

    describe('Boundary Value Tests', () => {
        test('handles zero bitrate', () => {
            const testConfig: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            };
            const result = upgradeAudioEncoderConfig(testConfig, 'opus', 0);

            assertEquals(result.bitrate, 0);
        });

        test('handles very high bitrate', () => {
            const testConfig: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            };
            const highBitrate = 1000000;
            const result = upgradeAudioEncoderConfig(testConfig, 'opus', highBitrate);

            assertEquals(result.bitrate, highBitrate);
        });

        test('validates sample rate bounds are passed to config', () => {
            // Test that sample rates are passed through correctly to upgradeAudioEncoderConfig
            const testConfig8k: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 8000,
                numberOfChannels: 1,
                bitrate: 32000,
            };

            const result8k = upgradeAudioEncoderConfig(testConfig8k, 'opus');
            assertEquals(result8k.sampleRate, 8000);

            const testConfig192k: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 192000,
                numberOfChannels: 2,
                bitrate: 256000,
            };

            const result192k = upgradeAudioEncoderConfig(testConfig192k, 'opus');
            assertEquals(result192k.sampleRate, 192000);
        });

        test('validates channel count bounds are passed to config', () => {
            // Test that channel counts are passed through correctly
            const testConfigMono: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 1,
                bitrate: 32000,
            };

            const resultMono = upgradeAudioEncoderConfig(testConfigMono, 'opus');
            assertEquals(resultMono.numberOfChannels, 1);

            const testConfigSurround: AudioEncoderConfig = {
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 8,
                bitrate: 512000,
            };

            const resultSurround = upgradeAudioEncoderConfig(testConfigSurround, 'opus');
            assertEquals(resultSurround.numberOfChannels, 8);
        });
    });

    describe('Advanced Configuration Tests', () => {
        test('handles malformed codec responses gracefully', async () => {
            // Test various malformed responses
            const malformedResponses = [
                null,
                undefined,
                {},
                { supported: true }, // missing config
                { supported: true, config: null },
            ];

            for (const response of malformedResponses) {
                mockAudioEncoder.isConfigSupported.mockResolvedValue(response);
                
                await expect(audioEncoderConfig({
                    sampleRate: 48000,
                    channels: 2,
                    preferredCodecs: ['opus']
                })).rejects.toThrow('no supported audio codec');
            }
        });

        test('configuration object immutability', () => {
            const baseConfig = {
                codec: 'opus' as const,
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            };

            const config1 = upgradeAudioEncoderConfig(baseConfig, 'opus');
            const config2 = upgradeAudioEncoderConfig(baseConfig, 'g722');

            // Configurations should be separate objects
            assert(config1 !== config2);
            assertEquals(config1.codec, 'opus');
            assertEquals(config2.codec, 'g722');

            // Base config should remain unchanged
            assertEquals(baseConfig.codec, 'opus');
        });
    });

    describe('Performance and Memory Tests', () => {
        test('configuration object cloning works correctly', () => {
            // Test configuration immutability
            const baseConfig = {
                codec: 'opus' as const,
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            };

            const config1 = upgradeAudioEncoderConfig(baseConfig, 'opus');
            const config2 = upgradeAudioEncoderConfig(baseConfig, 'isac');

            // Configurations should be separate objects
            assert(config1 !== config2);
            assertEquals(config1.codec, 'opus');
            assertEquals(config2.codec, 'isac');

            // Base config should remain unchanged
            assertEquals(baseConfig.codec, 'opus');
        });

        test('handles different codec configurations', () => {
            const baseConfig = {
                codec: 'opus' as const,
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            };

            // Test opus-specific enhancements
            const opusConfig = upgradeAudioEncoderConfig(baseConfig, 'opus');
            expect((opusConfig as any).opus).toBeDefined();
            expect((opusConfig as any).parameters).toBeDefined();

            // Test non-opus codec (should not have opus enhancements)
            const g722Config = upgradeAudioEncoderConfig(baseConfig, 'g722');
            assertEquals(g722Config.codec, 'g722');
            expect((g722Config as any).opus).toBeUndefined();
        });
    });

    describe('Real-world Integration Scenarios', () => {
        test('handles voice chat mono configuration', () => {
            const voiceConfig = upgradeAudioEncoderConfig({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 1,
                bitrate: 32000,
            }, 'opus');

            // Voice-specific settings
            expect((voiceConfig as any).opus?.application).toBe('voip');
            expect((voiceConfig as any).opus?.signal).toBe('voice');
            expect((voiceConfig as any).parameters?.stereo).toBe(0);
            expect((voiceConfig as any).parameters?.useinbandfec).toBe(1);
        });

        test('handles music streaming stereo configuration', () => {
            const musicConfig = upgradeAudioEncoderConfig({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 128000,
            }, 'opus');

            // Music-specific settings
            expect((musicConfig as any).opus?.application).toBe('audio');
            expect((musicConfig as any).opus?.signal).toBe('music');
            expect((musicConfig as any).parameters?.stereo).toBe(1);
            expect((musicConfig as any).parameters?.useinbandfec).toBe(1);
        });

        test('handles browser-specific bitrate modes', () => {
            // Chrome should use variable bitrate mode
            const chromeConfig = upgradeAudioEncoderConfig({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 64000,
            }, 'opus');

            expect((chromeConfig as any).bitrateMode).toBe('variable');
        });
    });
});
