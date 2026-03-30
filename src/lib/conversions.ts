
export function millisecondsToTimeString(ms: number): string {
	let totalSeconds = Math.floor(ms / 1000);
	let totalMinutes = Math.floor(totalSeconds / 60);
	let hoursStr = Math.floor(totalMinutes / 60)
		.toString()
		.padStart(2, "0");
	let minutesStr = (totalMinutes % 60).toString().padStart(2, "0");
	let secondsStr = (totalSeconds % 60).toString().padStart(2, "0");
	return `${hoursStr}:${minutesStr}:${secondsStr}`;
}