import { describe, it, expect } from "vitest";
import { validateGame } from "$lib/HashChain.server";
import { advanceChain } from "$lib/HashChain.client";

describe("ValidateGame", () => {
	const legitMoves = [
		{ index: 0, flag: false, timestamp: 1781124286838 },
		{ index: 9, flag: true, timestamp: 1781124288999 },
		{ index: 2, flag: false, timestamp: 1781124289381 },
		{ index: 7, flag: false, timestamp: 1781124290196 },
		{ index: 4, flag: false, timestamp: 1781124290991 },
		{ index: 5, flag: true, timestamp: 1781124292829 },
		{ index: 6, flag: true, timestamp: 1781124293563 },
		{ index: 3, flag: false, timestamp: 1781124294396 },
		{ index: 8, flag: true, timestamp: 1781124294653 },
		{ index: 1, flag: false, timestamp: 1781124295321 },
	];

	it("Accepts a correctly hashed game", async () => {
		const startTime = legitMoves[0].timestamp;
		let gameHash = String(startTime);
		for (const move of legitMoves) {
			gameHash = await advanceChain(gameHash, JSON.stringify(move));
		}
		expect(validateGame(startTime, legitMoves, gameHash)).toBe(true);
	});

	it("Rejects a game with an tampered start time", async () => {
		const startTime = legitMoves[0].timestamp;
		let gameHash = String(startTime + 10000); // Try to make the game faster by starting later
		for (const move of legitMoves) {
			gameHash = await advanceChain(gameHash, JSON.stringify(move));
		}
		expect(validateGame(startTime, legitMoves, gameHash)).toBe(false);
	});

	it("Rejects a game with an tampered move", async () => {
		const startTime = legitMoves[0].timestamp;
		let gameHash = String(startTime);
		for (const move of legitMoves) {
			if (move.index == 5) {
				// Tamper with this move
				gameHash = await advanceChain(
					gameHash,
					JSON.stringify({ index: 5, flag: true, timestamp: 12345 })
				);
			} else {
				// Normal hashing
				gameHash = await advanceChain(gameHash, JSON.stringify(move));
			}
		}
		expect(validateGame(startTime, legitMoves, gameHash)).toBe(false);
	});

	it("Rejects a game with missing moves", async () => {
		const startTime = legitMoves[0].timestamp;
		let gameHash = String(startTime);
		for (const move of legitMoves.slice(2, 8)) {
			gameHash = await advanceChain(gameHash, JSON.stringify(move));
		}
		expect(validateGame(startTime, legitMoves, gameHash)).toBe(false);
	});
});
