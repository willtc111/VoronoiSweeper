import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// GET: Fetch the most recent games
export const GET: RequestHandler = async ({ url, platform }) => {
	const result = await platform!.env.DB.prepare(
		`SELECT name, game_id, time_ms, created_at FROM leaderboard ORDER BY created_at DESC LIMIT 10`
	).all();

	return json(result.results);
};
