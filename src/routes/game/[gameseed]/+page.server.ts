import { base } from "$app/paths";
import { type HighScore } from "$lib/Leaderboard";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, params }) => {
	const leaderboard: HighScore[] = await fetch(`${base}/api/leaderboard?game_id=${params.gameseed}`)
		.then((res) => res.json())
		.catch((err) => {
			console.log(err);
			return [];
		});

	return {
		gameseed: params.gameseed,
		leaderboard: leaderboard,
	};
};
