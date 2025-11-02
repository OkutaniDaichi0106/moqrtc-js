// Lightweight runtime stub for @okutanidaichi/moqt used during tests.
// Exports are intentionally minimal; tests that need richer behavior should mock modules
// or the tests themselves provide vi.mock replacements.

export type BroadcastPath = string;
export type TrackName = string;
export type Session = any;
export type TrackReader = any;
export type TrackWriter = any;
export type Announcement = any;
export type AnnouncementReader = any;

export const TrackNotFoundErrorCode = Symbol("TrackNotFoundErrorCode");
export const SubscribeCanceledErrorCode = Symbol("SubscribeCanceledErrorCode");
export const InternalAnnounceErrorCode = Symbol("InternalAnnounceErrorCode");

export function validateBroadcastPath(p: string): string {
	// Basic passthrough for tests; real validation is not required during unit tests
	return p;
}

// Export placeholder classes/functions referenced at runtime
export function TrackReaderStub(): void {}
export function TrackWriterStub(): void {}

export const DEFAULT_BROADCAST_VERSION = "v1";

export default {} as any;
