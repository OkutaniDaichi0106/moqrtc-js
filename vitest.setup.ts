// Minimal test setup: shim WebAudio and other globals that tests expect at runtime.

// Provide a minimal GainNode so classes that extend it won't throw at import-time.
// The implementation is intentionally minimal — tests that exercise audio logic should mock
// behavior at a higher level.
class StubGainNode {
  constructor() {}
}

// Attach to global/window
(globalThis as any).GainNode = StubGainNode;

// Provide a minimal AudioWorkletProcessor stub if referenced
class StubAudioWorkletProcessor {
  constructor() {}
}
(globalThis as any).AudioWorkletProcessor = StubAudioWorkletProcessor;

// If test code expects window or document, jsdom provides them already via environment: 'jsdom'

export {};
