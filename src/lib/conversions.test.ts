import { describe, it, expect } from "vitest";
import { millisecondsToTimeString } from "./conversions";

describe("conversions", () => {
	it("should return 00:00:00 for sub-second values", () => {
		expect(millisecondsToTimeString(999)).toBe("00:00:00");
	});

	it("should pad hours, minutes, and seconds to two digits", () => {
		const s = 1000;
		const m = 60 * s;
		const h = 60 * m;
		expect(millisecondsToTimeString(s)).toBe("00:00:01");
		expect(millisecondsToTimeString(m)).toBe("00:01:00");
		expect(millisecondsToTimeString(h)).toBe("01:00:00");
		expect(millisecondsToTimeString(h + m + s)).toBe("01:01:01");
	});

	it("should allow hours with more than two digits", () => {
		expect(millisecondsToTimeString(2756601000)).toBe("765:43:21");
	});
});
