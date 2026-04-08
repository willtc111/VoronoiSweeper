import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// GET: Fetch the most recent daily games
export const GET: RequestHandler = async ({ url, platform }) => {
	const result = await platform!.env.DB.prepare(
		`SELECT name, game_id, time_ms, created_at
			FROM leaderboard
			WHERE game_id GLOB '20[0-9][0-9][0-1][1-9][0-3][0-9]'
			ORDER BY created_at
			DESC LIMIT 10`
	).all();

	return json(result.results);
};
