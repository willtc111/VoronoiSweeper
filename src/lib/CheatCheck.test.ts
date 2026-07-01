import { describe, it, expect } from "vitest";
import { CheatingStatus, checkCheating, MIN_AVG_MOVE_TIME } from "./CheatCheck";
import type { MoveRecord } from "./GameSave";

function retimeMoves(moves: MoveRecord[], speed: number): MoveRecord[] {
	let currentTime = moves[0].timestamp;
	return moves.map((move) => {
		currentTime += speed;
		return {
			...move,
			timestamp: currentTime,
		};
	});
}

describe("CheatCheck", () => {
	const seed = "testboard";

	// Playing normally without any cheating
	const legitMoves = [
		{ index: 69, flag: false, timestamp: 1781124286838 },
		{ index: 41, flag: true, timestamp: 1781124288999 },
		{ index: 52, flag: false, timestamp: 1781124289381 },
		{ index: 73, flag: false, timestamp: 1781124290196 },
		{ index: 50, flag: false, timestamp: 1781124290991 },
		{ index: 45, flag: true, timestamp: 1781124292829 },
		{ index: 6, flag: true, timestamp: 1781124293563 },
		{ index: 21, flag: false, timestamp: 1781124294396 },
		{ index: 21, flag: true, timestamp: 1781124294653 },
		{ index: 124, flag: false, timestamp: 1781124295321 },
		{ index: 110, flag: true, timestamp: 1781124300932 },
		{ index: 146, flag: false, timestamp: 1781124301389 },
		{ index: 59, flag: false, timestamp: 1781124302000 },
		{ index: 108, flag: false, timestamp: 1781124302567 },
		{ index: 112, flag: true, timestamp: 1781124303729 },
		{ index: 104, flag: true, timestamp: 1781124304224 },
		{ index: 112, flag: false, timestamp: 1781124304674 },
		{ index: 43, flag: false, timestamp: 1781124305514 },
		{ index: 70, flag: false, timestamp: 1781124306114 },
		{ index: 68, flag: true, timestamp: 1781124306872 },
		{ index: 14, flag: false, timestamp: 1781124307939 },
		{ index: 122, flag: true, timestamp: 1781124310748 },
		{ index: 107, flag: true, timestamp: 1781124314464 },
		{ index: 90, flag: false, timestamp: 1781124315030 },
		{ index: 95, flag: false, timestamp: 1781124315875 },
		{ index: 51, flag: true, timestamp: 1781124318148 },
		{ index: 1, flag: false, timestamp: 1781124318692 },
		{ index: 60, flag: false, timestamp: 1781124319457 },
		{ index: 82, flag: false, timestamp: 1781124320406 },
		{ index: 113, flag: false, timestamp: 1781124321131 },
		{ index: 8, flag: true, timestamp: 1781124322032 },
		{ index: 89, flag: false, timestamp: 1781124323368 },
		{ index: 35, flag: true, timestamp: 1781124324538 },
		{ index: 58, flag: false, timestamp: 1781124325006 },
		{ index: 62, flag: true, timestamp: 1781124326533 },
		{ index: 14, flag: false, timestamp: 1781124327502 },
		{ index: 134, flag: false, timestamp: 1781124328141 },
		{ index: 81, flag: true, timestamp: 1781124329331 },
		{ index: 75, flag: false, timestamp: 1781124330095 },
		{ index: 31, flag: false, timestamp: 1781124330613 },
		{ index: 143, flag: true, timestamp: 1781124331709 },
		{ index: 56, flag: false, timestamp: 1781124332339 },
		{ index: 56, flag: true, timestamp: 1781124333398 },
		{ index: 36, flag: true, timestamp: 1781124334129 },
		{ index: 32, flag: false, timestamp: 1781124334597 },
		{ index: 32, flag: true, timestamp: 1781124335116 },
		{ index: 32, flag: true, timestamp: 1781124336368 },
		{ index: 128, flag: true, timestamp: 1781124337044 },
		{ index: 128, flag: true, timestamp: 1781124337399 },
		{ index: 128, flag: true, timestamp: 1781124337591 },
		{ index: 128, flag: true, timestamp: 1781124337778 },
		{ index: 120, flag: true, timestamp: 1781124338281 },
		{ index: 48, flag: true, timestamp: 1781124340202 },
		{ index: 153, flag: true, timestamp: 1781124340682 },
		{ index: 115, flag: true, timestamp: 1781124341007 },
		{ index: 72, flag: true, timestamp: 1781124341315 },
		{ index: 124, flag: true, timestamp: 1781124341670 },
		{ index: 72, flag: false, timestamp: 1781124342039 },
		{ index: 133, flag: true, timestamp: 1781124343307 },
		{ index: 100, flag: false, timestamp: 1781124343888 },
		{ index: 120, flag: true, timestamp: 1781124345100 },
		{ index: 72, flag: false, timestamp: 1781124345843 },
		{ index: 76, flag: false, timestamp: 1781124346652 },
		{ index: 115, flag: true, timestamp: 1781124347731 },
		{ index: 102, flag: false, timestamp: 1781124348079 },
		{ index: 71, flag: false, timestamp: 1781124348636 },
		{ index: 71, flag: true, timestamp: 1781124349010 },
		{ index: 55, flag: true, timestamp: 1781124351362 },
		{ index: 74, flag: false, timestamp: 1781124352585 },
		{ index: 15, flag: false, timestamp: 1781124353995 },
		{ index: 136, flag: true, timestamp: 1781124354729 },
		{ index: 117, flag: false, timestamp: 1781124355197 },
		{ index: 34, flag: true, timestamp: 1781124356243 },
		{ index: 129, flag: false, timestamp: 1781124356723 },
		{ index: 18, flag: false, timestamp: 1781124357158 },
		{ index: 86, flag: true, timestamp: 1781124358916 },
		{ index: 88, flag: true, timestamp: 1781124360570 },
		{ index: 128, flag: true, timestamp: 1781124362114 },
		{ index: 88, flag: false, timestamp: 1781124362741 },
		{ index: 32, flag: false, timestamp: 1781124364033 },
		{ index: 0, flag: false, timestamp: 1781124364779 },
		{ index: 67, flag: false, timestamp: 1781124366264 },
		{ index: 67, flag: true, timestamp: 1781124366579 },
		{ index: 42, flag: false, timestamp: 1781124367542 },
	];

	// Flagging the cells in advance by looking at another board
	const cheatingMoves = [
		{ index: 91, flag: true, timestamp: 1781124087875 },
		{ index: 44, flag: true, timestamp: 1781124088356 },
		{ index: 24, flag: true, timestamp: 1781124088600 },
		{ index: 39, flag: true, timestamp: 1781124088889 },
		{ index: 139, flag: true, timestamp: 1781124089707 },
		{ index: 121, flag: true, timestamp: 1781124090078 },
		{ index: 147, flag: true, timestamp: 1781124090763 },
		{ index: 118, flag: true, timestamp: 1781124091481 },
		{ index: 16, flag: true, timestamp: 1781124094837 },
		{ index: 145, flag: true, timestamp: 1781124095866 },
		{ index: 111, flag: true, timestamp: 1781124096448 },
		{ index: 106, flag: true, timestamp: 1781124100617 },
		{ index: 40, flag: true, timestamp: 1781124100980 },
		{ index: 2, flag: true, timestamp: 1781124101375 },
		{ index: 142, flag: true, timestamp: 1781124101731 },
		{ index: 46, flag: true, timestamp: 1781124102184 },
		{ index: 93, flag: true, timestamp: 1781124103884 },
		{ index: 150, flag: true, timestamp: 1781124104495 },
		{ index: 131, flag: true, timestamp: 1781124105109 },
		{ index: 119, flag: true, timestamp: 1781124106135 },
		{ index: 94, flag: true, timestamp: 1781124106504 },
		{ index: 151, flag: true, timestamp: 1781124109331 },
		{ index: 99, flag: true, timestamp: 1781124111307 },
		{ index: 123, flag: true, timestamp: 1781124112033 },
		{ index: 126, flag: true, timestamp: 1781124113383 },
		{ index: 11, flag: true, timestamp: 1781124114123 },
		{ index: 7, flag: true, timestamp: 1781124114702 },
		{ index: 83, flag: false, timestamp: 1781124117441 },
		{ index: 23, flag: false, timestamp: 1781124118545 },
		{ index: 90, flag: false, timestamp: 1781124118944 },
		{ index: 61, flag: false, timestamp: 1781124119403 },
		{ index: 61, flag: false, timestamp: 1781124119883 },
		{ index: 73, flag: false, timestamp: 1781124120234 },
		{ index: 115, flag: false, timestamp: 1781124121129 },
		{ index: 102, flag: false, timestamp: 1781124121768 },
		{ index: 55, flag: false, timestamp: 1781124122457 },
		{ index: 34, flag: false, timestamp: 1781124123234 },
		{ index: 74, flag: false, timestamp: 1781124124137 },
		{ index: 86, flag: false, timestamp: 1781124125523 },
		{ index: 149, flag: false, timestamp: 1781124126236 },
		{ index: 109, flag: false, timestamp: 1781124126859 },
		{ index: 30, flag: false, timestamp: 1781124127561 },
		{ index: 100, flag: false, timestamp: 1781124128527 },
		{ index: 60, flag: false, timestamp: 1781124129136 },
		{ index: 82, flag: false, timestamp: 1781124129537 },
		{ index: 113, flag: false, timestamp: 1781124129939 },
		{ index: 143, flag: false, timestamp: 1781124130618 },
		{ index: 32, flag: false, timestamp: 1781124131561 },
		{ index: 141, flag: false, timestamp: 1781124132093 },
		{ index: 31, flag: false, timestamp: 1781124134407 },
		{ index: 89, flag: false, timestamp: 1781124135040 },
		{ index: 58, flag: false, timestamp: 1781124135580 },
		{ index: 62, flag: false, timestamp: 1781124136361 },
		{ index: 108, flag: false, timestamp: 1781124136927 },
		{ index: 87, flag: false, timestamp: 1781124137522 },
		{ index: 14, flag: false, timestamp: 1781124138146 },
		{ index: 134, flag: false, timestamp: 1781124138650 },
		{ index: 130, flag: false, timestamp: 1781124139620 },
	];

	it("returns true for a normal paced but impossibly lucky game", () => {
		expect(checkCheating(seed, cheatingMoves)).toBe(CheatingStatus.Improbable);
	});

	it("returns true for an impossibly fast game", () => {
		expect(checkCheating(seed, retimeMoves(legitMoves, MIN_AVG_MOVE_TIME - 1))).toBe(CheatingStatus.TooFast);
	});

	it("returns false for a normal game", () => {
		expect(checkCheating(seed, legitMoves)).toBe(CheatingStatus.Fair);
	});
});
