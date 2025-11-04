// filepath: src/media/mock_media_stream_track_test.ts
// Mock MediaStreamTrack for testing
export class MockMediaStreamTrack implements MediaStreamTrack {
	kind: "audio" | "video" = "video";
	id: string;
	label = "";
	enabled = true;
	muted = false;
	readyState: MediaStreamTrackState = "live";
	contentHint = "";
	onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
	onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
	onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null;
	stopCallCount = 0;
	getSettingsResult: MediaTrackSettings | undefined;

	constructor(id: string, kind: "audio" | "video" = "video") {
		this.id = id;
		this.kind = kind;
	}

	stop(): void {
		this.stopCallCount++;
	}

	// Stub other methods/properties
	getCapabilities(): MediaTrackCapabilities {
		throw new Error("Not implemented");
	}
	getConstraints(): MediaTrackConstraints {
		throw new Error("Not implemented");
	}
	getSettings(): MediaTrackSettings {
		if (this.getSettingsResult) {
			return this.getSettingsResult;
		}
		throw new Error("Not implemented");
	}
	applyConstraints(): Promise<void> {
		throw new Error("Not implemented");
	}
	clone(): MediaStreamTrack {
		throw new Error("Not implemented");
	}
	addEventListener(): void {
		throw new Error("Not implemented");
	}
	removeEventListener(): void {
		throw new Error("Not implemented");
	}
	dispatchEvent(): boolean {
		throw new Error("Not implemented");
	}
}