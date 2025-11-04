export class MockVideoEncoder {
    // static helper
    static async isConfigSupported(config: any) {
        // Simulate supported config for certain codecs
        const supportedCodecs = ['avc1.640028', 'vp8', 'vp09'];
        const isSupported = supportedCodecs.some((codec) => config.codec.startsWith(codec));

        return {
            supported: isSupported,
            config: isSupported ? config : null,
        };
    }

    output?: (chunk: any) => void;
    error?: (e: any) => void;

    configureCalled = false;
    configureCalls: any[][] = [];

    encodeCalled = false;
    encodeCalls: any[][] = [];

    flushCalled = false;
    flushCalls: any[][] = [];

    closeCalled = false;
    closeCalls: any[][] = [];

    resetCalled = false;
    resetCalls: any[][] = [];

    constructor(init?: any) {
        if (init) Object.assign(this, init);
    }

    configure(config: any) {
        this.configureCalled = true;
        this.configureCalls.push([config]);
    }

    encode(frame: any, options?: any) {
        this.encodeCalled = true;
        this.encodeCalls.push([frame, options || { keyFrame: false }]);
    }

    async flush() {
        this.flushCalled = true;
        this.flushCalls.push([]);
        return Promise.resolve();
    }

    close() {
        this.closeCalled = true;
        this.closeCalls.push([]);
    }

    reset() {
        this.resetCalled = true;
        this.resetCalls.push([]);
    }
}