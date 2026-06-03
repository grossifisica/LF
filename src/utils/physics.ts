import { Charge, Point, PhysicsVector, FieldLine } from "../types";

/**
 * Calculates the electric field vectors at a specific coordinate (px, py)
 * @param px - X coordinate in pixels
 * @param py - Y coordinate in pixels
 * @param charges - List of active charges
 * @param canvasWidth - Current canvas width in pixels
 * @param canvasHeight - Current canvas height in pixels
 */
export function calculateFieldAt(
  px: number,
  py: number,
  charges: Charge[],
  canvasWidth: number,
  canvasHeight: number
): { vx: number; vy: number; magnitude: number; individualFields: PhysicsVector[] } {
  let rx = 0;
  let ry = 0;
  const individualFields: PhysicsVector[] = [];

  // Scaling factor to make forces visually readable on scale (k = scale constant)
  const k = 150000;

  for (const charge of charges) {
    if (!charge.visible || charge.q === 0) {
      individualFields.push({ x: px, y: py, vx: 0, vy: 0, magnitude: 0 });
      continue;
    }

    // Charge position mapped from percentage (0-100) to actual canvas pixels
    const cx = (charge.x / 100) * canvasWidth;
    const cy = (charge.y / 100) * canvasHeight;

    const dx = px - cx;
    const dy = py - cy;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);

    // Singularity protection (if point is inside the charge radius)
    if (r < 12) {
      individualFields.push({ x: px, y: py, vx: 0, vy: 0, magnitude: 0 });
      continue;
    }

    // Coulomb's Law: E = k * q / r^2
    // Vector components: Ex = E * cos(theta) = k * q * dx / r^3
    const magnitude = (k * Math.abs(charge.q)) / r2;
    const vx = (k * charge.q * dx) / (r2 * r);
    const vy = (k * charge.q * dy) / (r2 * r);

    individualFields.push({
      x: px,
      y: py,
      vx,
      vy,
      magnitude,
    });

    rx += vx;
    ry += vy;
  }

  const resultantMagnitude = Math.sqrt(rx * rx + ry * ry);

  return {
    vx: rx,
    vy: ry,
    magnitude: resultantMagnitude,
    individualFields,
  };
}

/**
 * Generates lines of force starting near charges and propagating step by step.
 */
export function traceFieldLines(
  charges: Charge[],
  canvasWidth: number,
  canvasHeight: number,
  densityFactor: number
): FieldLine[] {
  const lines: FieldLine[] = [];
  const rStart = 16; // Starting radius outside charge center to trigger trace
  const stepSize = 4; // Step resolution in pixels
  const maxSteps = 240; // Max line length to control canvas bound bounds

  for (const charge of charges) {
    if (!charge.visible || charge.q === 0) continue;

    const cx = (charge.x / 100) * canvasWidth;
    const cy = (charge.y / 100) * canvasHeight;

    // Number of field lines is proportional to charge magnitude
    const baseLinesCount = Math.max(4, Math.round(densityFactor * Math.abs(charge.q) * 6));
    const isPositive = charge.q > 0;

    for (let i = 0; i < baseLinesCount; i++) {
      // Offset starting angle slightly to avoid boring grid-alignment behavior
      const offset = 0.08;
      const angle = (2 * Math.PI * i) / baseLinesCount + offset;

      const startX = cx + rStart * Math.cos(angle);
      const startY = cy + rStart * Math.sin(angle);

      const linePoints: Point[] = [{ x: startX, y: startY }];
      let currX = startX;
      let currY = startY;

      for (let step = 0; step < maxSteps; step++) {
        // Runge-Kutta 2 (Heun's Method) for perfect physical tangency and integration stability
        const field1 = calculateFieldAt(currX, currY, charges, canvasWidth, canvasHeight);
        if (field1.magnitude < 1e-3) break;

        const ux1 = (field1.vx / field1.magnitude) * (isPositive ? 1 : -1);
        const uy1 = (field1.vy / field1.magnitude) * (isPositive ? 1 : -1);

        // Predictor step
        const predX = currX + ux1 * stepSize;
        const predY = currY + uy1 * stepSize;

        const field2 = calculateFieldAt(predX, predY, charges, canvasWidth, canvasHeight);
        let ux = ux1;
        let uy = uy1;

        if (field2.magnitude >= 1e-3) {
          const ux2 = (field2.vx / field2.magnitude) * (isPositive ? 1 : -1);
          const uy2 = (field2.vy / field2.magnitude) * (isPositive ? 1 : -1);
          // Average velocity vectors to compute tangent correction
          ux = (ux1 + ux2) / 2;
          uy = (uy1 + uy2) / 2;
          const uLen = Math.sqrt(ux * ux + uy * uy);
          if (uLen > 1e-3) {
            ux /= uLen;
            uy /= uLen;
          }
        }

        const nextX = currX + ux * stepSize;
        const nextY = currY + uy * stepSize;

        // Out of bounds check with generous boundary buffer
        const buffer = 80;
        if (
          nextX < -buffer ||
          nextX > canvasWidth + buffer ||
          nextY < -buffer ||
          nextY > canvasHeight + buffer
        ) {
          break;
        }

        // Singularity/Charge proximity check
        let reachedTarget = false;
        for (const targetCharge of charges) {
          if (!targetCharge.visible || targetCharge.q === 0) continue;
          
          const tcx = (targetCharge.x / 100) * canvasWidth;
          const tcy = (targetCharge.y / 100) * canvasHeight;
          const tdx = nextX - tcx;
          const tdy = nextY - tcy;
          const dist = Math.sqrt(tdx * tdx + tdy * tdy);

          // If the line gets back within the radius of any charge, we terminate
          if (dist < 14) {
            reachedTarget = true;
            break;
          }
        }

        linePoints.push({ x: nextX, y: nextY });

        if (reachedTarget) {
          break;
        }

        currX = nextX;
        currY = nextY;
      }

      if (linePoints.length > 1) {
        lines.push({
          points: linePoints,
          isForPositiveCharge: isPositive,
        });
      }
    }
  }

  return lines;
}
