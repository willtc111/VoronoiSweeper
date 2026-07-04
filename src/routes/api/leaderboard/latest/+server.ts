import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// GET: Fetch the 10 most recent daily games that aren't cheaters
export const GET: RequestHandler = async ({ platform }) => {
	const result = await platform!.env.DB.prepare(
		`SELECT l.name, l.game_id, l.time_ms, l.created_at
			FROM leaderboard l
			WHERE l.game_id GLOB '20[0-9][0-9][0-1][1-9][0-3][0-9]'
				AND NOT EXISTS (
					SELECT 1 FROM flagged_games f where f.leaderboard_id = l.id
				)
			ORDER BY l.created_at
			DESC LIMIT 10`
	).all();

	return json(result.results);
};
