import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// GET: Fetch top scores for a specific game
export const GET: RequestHandler = async ({ url, platform }) => {
	const game_id = url.searchParams.get("game_id");
	if (!game_id) return json({ error: "Missing game_id" }, { status: 400 });

	const result = await platform!.env.DB.prepare(
		`SELECT name, time_ms, created_at
			FROM leaderboard
			WHERE game_id = ?
			ORDER BY time_ms ASC
			LIMIT 10`
	)
		.bind(game_id)
		.all();

	return json(result.results);
};

// POST: submit a score for a specific game
export const POST: RequestHandler = async ({ request, platform }) => {
	const { name, game_id, time_ms } = await request.json();

	if (!name || !game_id || !time_ms) {
		return json({ error: "Missing fields" }, { status: 400 });
	}

	const trimmedName = name.trim().substring(0, 3); // Limit name length

	await platform!.env.DB.prepare(
		`INSERT INTO leaderboard (name, game_id, time_ms) VALUES (?, ?, ?)`
	)
		.bind(trimmedName, game_id, time_ms)
		.run();

	return json({ success: true });
};
