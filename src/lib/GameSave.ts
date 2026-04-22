import { advanceChain } from "./HashChain";
import type { WinDetails } from "./Leaderboard";

export enum SaveKey {
	Seed = "SaveSeed",
	Moves = "SaveMoves",
	StartTime = "SaveStartTime",
	ValidationHash = "SaveValidationHash",
}

export type MoveRecord = {
	index: number;
	flag: boolean;
	timestamp: number;
};

export async function addToSave(
	index: number,
	flag: boolean,
	seed: string,
	startTime: number | undefined
) {
	let moves: string = "";
	if (localStorage.getItem(SaveKey.Seed) != seed) {
		// Create a new save, overwriting any previous save if one existed
		localStorage.setItem(SaveKey.Seed, seed);
		localStorage.setItem(SaveKey.StartTime, String(startTime));
		localStorage.setItem(SaveKey.ValidationHash, String(startTime));
	} else {
		// Get the existing save
		moves = localStorage.getItem(SaveKey.Moves) ?? "";
		if (moves.length != 0) {
			moves = moves + ", ";
		}
	}
	const moveStr = JSON.stringify({ index, flag, timestamp: Date.now() });
	localStorage.setItem(SaveKey.Moves, moves + moveStr);

	localStorage.setItem(SaveKey.ValidationHash, await advanceChain(getValidationHash(), moveStr));
}

export function loadSave(
	seed: string,
	flagCell: (index: number, fromSave?: boolean) => void,
	clickCell: (index: number, isExpand?: boolean, fromSave?: boolean) => void
): { startTime: number | undefined; timer: number } {
	if (localStorage.getItem(SaveKey.Seed) != seed) {
		// The current save is not for this game, return default values
		return { startTime: undefined, timer: 0 };
	}

	const moves: MoveRecord[] = getMoves();
	const startTime = getStartTime();
	const timer = moves[moves.length - 1].timestamp - startTime;
	for (let move of moves) {
		if (move.flag) {
			flagCell(move.index, true);
		} else {
			clickCell(move.index, false, true);
		}
	}

	return { startTime, timer };
}

export function clearSave() {
	Object.values(SaveKey).forEach((k) => {
		localStorage.removeItem(k);
	});
}

function getMoves(): MoveRecord[] {
	return JSON.parse(`[${localStorage.getItem(SaveKey.Moves) ?? ""}]`);
}

function getStartTime(): number {
	return Number(localStorage.getItem(SaveKey.StartTime)) ?? Date.now();
}

function getValidationHash(defaultHash: string = ""): string {
	return localStorage.getItem(SaveKey.ValidationHash) ?? defaultHash;
}

export function getSaveAsWinDetails(): WinDetails {
	return {
		startTime: getStartTime(),
		moves: getMoves(),
		validationHash: getValidationHash(),
	};
}
