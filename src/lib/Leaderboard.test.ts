import { describe, it, expect } from "vitest";
import { insertHighScore, sanitizeName } from "./Leaderboard";

describe("Leaderboard", () => {
	const leaderboard = [
		{ name: "AAA", time_ms: 10 },
		{ name: "BBB", time_ms: 20 },
		{ name: "CCC", time_ms: 30 },
		{ name: "DDD", time_ms: 40 },
		{ name: "EEE", time_ms: 50 },
		{ name: "FFF", time_ms: 60 },
		{ name: "GGG", time_ms: 70 },
		{ name: "HHH", time_ms: 80 },
		{ name: "III", time_ms: 90 },
		{ name: "JJJ", time_ms: 100 },
	];

	describe("insertHighScore", () => {
		it("should insert a new score in an empty leaderboard", () => {
			const winner = { name: "NEW", time_ms: 99 };
			const leaderboard = insertHighScore([], winner);
			expect(leaderboard.length).toEqual(1);
			expect(leaderboard[0]).toEqual(winner);
		});

		it("should insert a new score at the top when it is the best and drop the last score", () => {
			const before = leaderboard;
			const winner = { name: "NEW", time_ms: 1 };
			const after = insertHighScore(before, winner);
			expect(after.length).toEqual(10);
			expect(after[0]).toEqual(winner);
			expect(after.slice(1)).toEqual(before.slice(0, -1));
		});

		it("should insert a new score in the middle of the leaderboard", () => {
			const before = leaderboard.slice(0, 2);
			const winner = { name: "NEW", time_ms: 15 };
			const after = insertHighScore(before, winner);
			expect(after.length).toEqual(3);
			expect(after).toEqual([leaderboard[0], winner, leaderboard[1]]);
		});

		it("should insert a new score at the end when it is the worst", () => {
			const before = leaderboard.slice(0, -1);
			const winner = { name: "NEW", time_ms: 999 };
			const after = insertHighScore(before, winner);
			expect(after.length).toEqual(10);
			expect(after.slice(0, 9)).toEqual(before);
			expect(after[9]).toEqual(winner);
		});

		it("should not insert a new score when there are already 10 better scores", () => {
			const before = leaderboard;
			const winner = { name: "NEW", time_ms: 999 };
			const after = insertHighScore(before, winner);
			expect(after.length).toEqual(10);
			expect(after).toEqual(before);
		});
	});

	describe("sanitizeName", () => {
		it("should convert names to uppercase", () => {
			expect(sanitizeName("abc")).toEqual("ABC");
		});

		it("should remove non-alphanumeric characters", () => {
			expect(sanitizeName("A1?")).toEqual("A1");
		});

		it("should limit names to 3 characters", () => {
			expect(sanitizeName("ABCDE")).toEqual("ABC");
		});
	});
});
