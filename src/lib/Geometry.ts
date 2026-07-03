export type Point2D = [number, number];

export function equal(a: Point2D, b: Point2D): boolean {
	return a[0] === b[0] && a[1] === b[1];
}

export function distance(a: Point2D, b: Point2D): number {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	return Math.sqrt(dx * dx + dy * dy);
}

export function average(a: Point2D, b: Point2D): Point2D {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function angle_between(a: Point2D, b: Point2D): number {
	const diff = [a[0] - b[0], a[1] - b[1]];
	return Math.atan2(diff[1], diff[0]);
}

export function circumcircleCenter(points: [Point2D, Point2D, Point2D]): Point2D {
	if (points.length != 3) {
		throw new Error("Need exactly 3 points to compute circumcircle");
	}
	const x1 = points[0][0];
	const y1 = points[0][1];
	const x2 = points[1][0];
	const y2 = points[1][1];
	const x3 = points[2][0];
	const y3 = points[2][1];
	const det = 2.0 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
	if (det == 0.0) {
		// Points are collinear, so just use average of the points instead of the circumcenter
		const avgPt = [(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3] as Point2D;
		return avgPt;
	}

	const center_x =
		((x1 * x1 + y1 * y1) * (y2 - y3) +
			(x2 * x2 + y2 * y2) * (y3 - y1) +
			(x3 * x3 + y3 * y3) * (y1 - y2)) /
		det;
	const center_y =
		((x1 * x1 + y1 * y1) * (x3 - x2) +
			(x2 * x2 + y2 * y2) * (x1 - x3) +
			(x3 * x3 + y3 * y3) * (x2 - x1)) /
		det;

	return [center_x, center_y];
}

/**
 * Clip a polygon to a rectangular bounding box using the Sutherland-Hodgman algorithm
 *
 * @param polygon Polygon vertices
 * @param minX Minimum x-coordinate of the bounding box
 * @param maxX Maximum x-coordinate of the bounding box
 * @param minY Minimum y-coordinate of the bounding box
 * @param maxY Maximum y-coordinate of the bounding box
 * @returns Clipped polygon vertices
 */
export function clipPolygon(
	polygon: Point2D[],
	minX: number,
	maxX: number,
	minY: number,
	maxY: number
): Point2D[] {
	if (polygon.length === 0) {
		return [];
	}

	let output = polygon;

	const polygonClosed = equal(output[0], output[output.length - 1]);
	if (polygonClosed) {
		output = output.slice(0, -1);
	}

	output = clipEdgeH(output, maxY, true); // top: keep y <= maxY
	output = clipEdgeV(output, minX, false); // left: keep x >= minX
	output = clipEdgeH(output, minY, false); // bottom: keep y >= minY
	output = clipEdgeV(output, maxX, true); // right: keep x <= maxX

	output = dedupeConsecutive(output);

	if (polygonClosed && output.length > 1) {
		output.push(output[0]);
	}
	return output;
}

/**
 * Clips a list of points to a horizontal edge
 *
 * @param points Polygon vertices
 * @param y Y value of the boundary edge
 * @param keepLTE Whether to keep points with y <= edge (true) or y >= edge (false)
 * @returns Clipped polygon vertices
 */
function clipEdgeH(points: Point2D[], y: number, keepLTE: boolean): Point2D[] {
	const n = points.length;
	if (n === 0) {
		return [];
	}
	const output: Point2D[] = [];
	let prev = points[n - 1];
	let prevIn = keepLTE ? prev[1] <= y : prev[1] >= y;
	for (let i = 0; i < n; i++) {
		const cur = points[i];
		const curIn = keepLTE ? cur[1] <= y : cur[1] >= y;
		if (curIn !== prevIn) {
			const t = (y - prev[1]) / (cur[1] - prev[1]);
			output.push([prev[0] + t * (cur[0] - prev[0]), y]);
		}
		if (curIn) output.push(cur);
		prev = cur;
		prevIn = curIn;
	}
	return output;
}

/**
 * Clips a list of points to a vertical edge
 *
 * @param points Polygon vertices
 * @param x X value of the boundary edge
 * @param keepLTE Whether to keep points with x <= edge (true) or x >= edge (false)
 * @returns Clipped polygon vertices
 */
function clipEdgeV(points: Point2D[], x: number, keepLTE: boolean): Point2D[] {
	const n = points.length;
	if (n === 0) {
		return [];
	}
	const output: Point2D[] = [];
	let prev = points[n - 1];
	let prevIn = keepLTE ? prev[0] <= x : prev[0] >= x;
	for (let i = 0; i < n; i++) {
		const cur = points[i];
		const curIn = keepLTE ? cur[0] <= x : cur[0] >= x;
		if (curIn !== prevIn) {
			const t = (x - prev[0]) / (cur[0] - prev[0]);
			output.push([x, prev[1] + t * (cur[1] - prev[1])]);
		}
		if (curIn) output.push(cur);
		prev = cur;
		prevIn = curIn;
	}
	return output;
}

/**
 * Remove duplicate consecutive points from a circular list of points
 * @param points circular array of points
 * @returns Array of consecutively unique points
 */
function dedupeConsecutive(points: Point2D[]): Point2D[] {
	const n = points.length;
	if (n === 0) {
		return points;
	}
	const output: Point2D[] = [];
	let prev = points[n - 1]; // Start with the last point to handle circularity
	for (let i = 0; i < n; i++) {
		const cur = points[i];
		if (!equal(cur, prev)) {
			output.push(cur);
		}
		prev = cur;
	}
	return output;
}
