export function millisecondsToTimeString(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);
	const hoursStr = totalHours.toString().padStart(2, "0");
	const minutesStr = (totalMinutes % 60).toString().padStart(2, "0");
	const secondsStr = (totalSeconds % 60).toString().padStart(2, "0");
	return `${hoursStr}:${minutesStr}:${secondsStr}`;
}
