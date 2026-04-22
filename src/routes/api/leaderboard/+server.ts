import { validateGame } from "$lib/HashChain";
import { calculateTotalTime, sanitizeName } from "$lib/Leaderboard";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// GET: Fetch leaderboard scores for a specific game
export const GET: RequestHandler = async ({ url, platform }) => {
	const game_id = url.searchParams.get("game_id");
	if (!game_id) return json({ error: "Missing game_id" }, { status: 400 });

	const result = await platform!.env.DB.prepare(
		`SELECT name, time_ms, created_at
			FROM leaderboard
			WHERE game_id = ?
			ORDER BY time_ms ASC`
	)
		.bind(game_id)
		.all();

	return json(result.results);
};

// POST: submit a score for a specific game
export const POST: RequestHandler = async ({ request, platform }) => {
	const { name, game_id, startTime, moves, validationHash } = await request.json();

	if (!name || !game_id || !startTime || !moves || !validationHash) {
		return json(
			{
				error:
					"Missing fields, body must include 'name', 'game_id', 'startTime', 'moves', and 'validationHash'",
			},
			{ status: 400 }
		);
	}

	if (moves.length == 0) {
		return json({ error: "Must include a non-zero number of moves" }, { status: 400 });
	}

	// Validate the moves
	if (!(await validateGame(startTime, moves, validationHash))) {
		return json({ error: "Submission rejected due to invalid validation hash" }, { status: 422 });
	}

	let time_ms = calculateTotalTime({ startTime, moves, validationHash });
	const sanitizedName = sanitizeName(name).trim();

	await platform!.env.DB.prepare(
		`INSERT INTO leaderboard (name, game_id, time_ms) VALUES (?, ?, ?)`
	)
		.bind(sanitizedName, game_id, time_ms)
		.run();

	return json({ success: true });
};
