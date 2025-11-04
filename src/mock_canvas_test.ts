import { spy } from "@std/testing/mock";

// Mock canvas context
export const mockCanvasContext = {
	clearRect: spy(() => {}),
	drawImage: spy(() => {}),
	fillText: spy(() => {}),
	fillStyle: "",
	font: "",
	textAlign: "left" as CanvasTextAlign,
	textBaseline: "top" as CanvasTextBaseline,
};

// Mock canvas element
export const mockCanvas = {
	getContext: spy((contextType: string) => {
		if (contextType === "2d") {
			return mockCanvasContext;
		}
		return null;
	}),
	width: 320,
	height: 240,
};
