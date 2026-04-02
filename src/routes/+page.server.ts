import { base } from "$app/paths";
import { type LeaderboardEntry } from "$lib/Leaderboard";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, params }) => {

	const latestGames: LeaderboardEntry[] = await fetch(`${base}/api/leaderboard/latest`)
		.then((res) => res.json())
		.catch((err) => {
			console.log(err);
			return [];
		});

	return {
		latestGames: latestGames,
	};
};
