import { redirect } from "@sveltejs/kit";

export function load() {
	console.log("Missing game ID, redirecting back to home");
	throw redirect(303, "..");
}
