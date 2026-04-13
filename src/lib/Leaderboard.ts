import { base } from "$app/paths";

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

export async function getLeaderboard(gameseed: string): Promise<HighScore[]> {
	return await fetch(`${base}/api/leaderboard?game_id=${gameseed}`)
		.then((res) => res.json())
		.then((leaderboard) => leaderboard)
		.catch((error) => {
			console.log(error);
			return [];
		});
}

export async function postHighScore(gameseed: string, name: string, time_ms: number) {
	await fetch(`${base}/api/leaderboard`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, game_id: gameseed, time_ms: time_ms }),
	});
}

export function insertHighScore(leaderboard: HighScore[], newScore: HighScore): HighScore[] {
	if (leaderboard.length == 0) {
		return [newScore];
	}

	leaderboard = [...leaderboard]; // Clone to avoid mutating the original leaderboard

	let insertIndex = leaderboard.findIndex((entry) => newScore.time_ms < entry.time_ms);
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
