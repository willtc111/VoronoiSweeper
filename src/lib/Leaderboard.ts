import { base } from "$app/paths";
import type { CheatingStatus } from "./CheatCheck";
import type { MoveRecord } from "./GameSave";

export type LeaderboardEntry = {
	name: string;
	game_id: string;
	time_ms: number;
	created_at: string;
};

export type HighScore = {
	name: string | undefined;
	time_ms: number;
};

export type WinDetails = {
	startTime: number;
	moves: MoveRecord[];
	validationHash: string;
};

export type SubmissionResult = {
	success: boolean;
	cheatingStatus?: CheatingStatus;
};

export async function getLeaderboard(gameseed: string): Promise<HighScore[]> {
	return await fetch(`${base}/api/leaderboard?game_id=${gameseed}`)
		.then((res) => res.json())
		.then((leaderboard) => leaderboard)
		.catch((error) => {
			console.log(error);
			return [];
		});
}

export async function postHighScore(
	gameseed: string,
	name: string,
	win: WinDetails
): Promise<SubmissionResult> {
	return await fetch(`${base}/api/leaderboard`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name,
			game_id: gameseed,
			startTime: win.startTime,
			moves: win.moves,
			validationHash: win.validationHash,
		}),
	})
		.then((res) => res.json())
		.catch((error) => {
			console.log(error);
			return { success: false };
		});
}

export function insertHighScore(leaderboard: HighScore[], newScore: HighScore): HighScore[] {
	if (leaderboard.length == 0) {
		return [newScore];
	}

	leaderboard = [...leaderboard]; // Clone to avoid mutating the original leaderboard

	const insertIndex = leaderboard.findIndex((entry) => newScore.time_ms < entry.time_ms);
	if (insertIndex === -1) {
		return [...leaderboard, newScore];
	}

	leaderboard.splice(insertIndex, 0, newScore);
	return leaderboard;
}

export function sanitizeName(name: string) {
	// Remove any non-alphanumeric characters and limit to 3 characters
	return name
		.toUpperCase()
		.replace(/[^A-Z0-9 ]/g, "")
		.substring(0, 3);
}

export function calculateTotalTime(winDetails: WinDetails): number {
	// Last move timestamp minus the start timestamp
	return winDetails.moves[winDetails.moves.length - 1].timestamp - winDetails.startTime;
}
