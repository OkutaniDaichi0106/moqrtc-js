import { spy } from "@std/testing/mock";

// Mock video element
export const mockVideo = {
	readyState: 0,
	videoWidth: 640,
	videoHeight: 480,
	currentTime: 0,
	duration: 0,
	paused: true,
	play: spy(() => Promise.resolve()),
	pause: spy(() => {}),
	addEventListener: spy(() => {}),
	removeEventListener: spy(() => {}),
};
