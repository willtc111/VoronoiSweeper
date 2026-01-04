export type Point2D = [number, number];

export function distance(a: Point2D, b: Point2D) {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  return Math.sqrt(dx*dx + dy*dy);
}

export function angle_between(a: Point2D, b: Point2D): number {
  let diff = [a[0] - b[0], a[1] - b[1]];
  return Math.atan2(diff[1], diff[0]);
}

export function circumcircleCenter(points: [Point2D, Point2D, Point2D]): Point2D {
  if (points.length != 3) {
    throw new Error("Need exactly 3 points to compute circumcircle");
  }
  let x1 = points[0][0];
  let y1 = points[0][1];
  let x2 = points[1][0];
  let y2 = points[1][1];
  let x3 = points[2][0];
  let y3 = points[2][1];
  let det = 2.0 * (
    x1 * (y2 - y3) +
    x2 * (y3 - y1) +
    x3 * (y1 - y2)
  );
  if (det == 0.0) {
    console.error(`Points ${points[0]}, ${points[1]}, ${points[2]} are collinear`);
    throw new Error("Points are collinear");
  }

  let center_x = (
    (x1*x1 + y1*y1) * (y2 - y3) +
    (x2*x2 + y2*y2) * (y3 - y1) +
    (x3*x3 + y3*y3) * (y1 - y2)
  ) / det;
  let center_y = (
    (x1*x1 + y1*y1) * (x3 - x2) +
    (x2*x2 + y2*y2) * (x1 - x3) +
    (x3*x3 + y3*y3) * (x2 - x1)
  ) / det;

  return [center_x, center_y];
}
