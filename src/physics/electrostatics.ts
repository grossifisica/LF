/**
 * Eletrostática: Simulação de Campo Elétrico e Linhas de Força
 * 
 * Baseado na Lei de Coulomb e Princípio da Superposição:
 * E_i = (k * q_i / r_i^2) * r_hat_i
 * E_total = sum(E_i)
 */

export interface Charge {
  id: string;
  x: number; // Coordenada X na tela
  y: number; // Coordenada Y na tela
  q: number; // Intensidade em microcoulombs (μC) ou unidades arbitrárias (-10 a +10)
}

export interface Probe {
  id: string;
  x: number;
  y: number;
  testCharge: number; // normalmente +1 (carga de prova positiva) ou -1
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface FieldLinePoint {
  x: number;
  y: number;
}

export interface FieldLine {
  id: string;
  points: FieldLinePoint[];
  fromChargeId: string;
  sign: 1 | -1;
  arrows: { x: number; y: number; angle: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  q: number;
  mass: number;
  history: { x: number; y: number }[];
  active: boolean;
}

// Constante eletrostática de escala visual (k_visual)
export const K_CONST = 60000;
export const MIN_DISTANCE = 14; // Raio mínimo do núcleo da carga para evitar divergência
export const CHARGE_RADIUS = 20;

/**
 * Calcula o vetor campo elétrico resultante no ponto (x, y) devido a todas as cargas.
 */
export function calculateElectricField(
  x: number,
  y: number,
  charges: Charge[]
): Vector2D {
  let ex = 0;
  let ey = 0;

  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const distSq = dx * dx + dy * dy;
    
    // Suavização para evitar singularidade numérica no centro da carga
    const effectiveDistSq = Math.max(distSq, MIN_DISTANCE * MIN_DISTANCE);
    const dist = Math.sqrt(effectiveDistSq);

    // E = (k * q / r^2) * (r_vec / r) = k * q * r_vec / r^3
    const fieldMag = (K_CONST * c.q) / (dist * effectiveDistSq);
    ex += fieldMag * dx;
    ey += fieldMag * dy;
  }

  return { x: ex, y: ey };
}

/**
 * Calcula a contribuição individual de campo de cada carga no ponto (x, y).
 */
export function calculateIndividualFields(
  x: number,
  y: number,
  charges: Charge[]
): { charge: Charge; vector: Vector2D; magnitude: number; dist: number }[] {
  return charges.map((c) => {
    const dx = x - c.x;
    const dy = y - c.y;
    const distSq = dx * dx + dy * dy;
    const effectiveDistSq = Math.max(distSq, MIN_DISTANCE * MIN_DISTANCE);
    const dist = Math.sqrt(effectiveDistSq);

    const fieldMag = (K_CONST * c.q) / (dist * effectiveDistSq);
    const vx = fieldMag * dx;
    const vy = fieldMag * dy;

    return {
      charge: c,
      vector: { x: vx, y: vy },
      magnitude: Math.sqrt(vx * vx + vy * vy),
      dist: Math.sqrt(distSq),
    };
  });
}

/**
 * Calcula o potencial eletrostático V(x, y) = sum(k * q_i / r_i)
 */
export function calculatePotential(
  x: number,
  y: number,
  charges: Charge[]
): number {
  let v = 0;
  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    v += (K_CONST * c.q) / Math.max(dist, MIN_DISTANCE);
  }
  return v;
}

/**
 * Traça as linhas de força pelo método de integração numérica RK4 (Runge-Kutta 4ª ordem).
 * Cada linha começa na borda de uma carga positiva e segue na direção de +E,
 * ou começa em cargas negativas e segue na direção de -E (para configurações puramente negativas ou com sobra de linhas negativas).
 */
export function traceFieldLines(
  charges: Charge[],
  width: number,
  height: number,
  linesPerUnit: number = 8
): FieldLine[] {
  if (charges.length === 0) return [];

  const lines: FieldLine[] = [];
  const stepSize = 4;
  const maxSteps = 450;
  const stopRadius = CHARGE_RADIUS * 0.9;
  const boundsMargin = 60;

  const positiveCharges = charges.filter((c) => c.q > 0);
  const negativeCharges = charges.filter((c) => c.q < 0);

  const totalPositiveQ = positiveCharges.reduce((acc, c) => acc + c.q, 0);
  const totalNegativeQ = negativeCharges.reduce((acc, c) => acc + Math.abs(c.q), 0);

  // 1. Linhas que partem de cargas positivas (seguem direção de +E)
  for (const c of positiveCharges) {
    const numLines = Math.max(8, Math.min(64, Math.round(c.q * linesPerUnit)));
    for (let i = 0; i < numLines; i++) {
      const angle = (2 * Math.PI * i) / numLines;
      const startX = c.x + CHARGE_RADIUS * Math.cos(angle);
      const startY = c.y + CHARGE_RADIUS * Math.sin(angle);

      const points = traceSingleLine(
        startX,
        startY,
        1, // direção para frente (+E)
        charges,
        width,
        height,
        stepSize,
        maxSteps,
        stopRadius,
        boundsMargin
      );

      if (points.length > 3) {
        const arrows = calculateLineArrows(points, 90);
        lines.push({
          id: `line-pos-${c.id}-${i}`,
          points,
          fromChargeId: c.id,
          sign: 1,
          arrows,
        });
      }
    }
  }

  // 2. Se não houver cargas positivas, ou se a carga negativa total for maior que a positiva,
  // traçamos linhas reversas partindo das cargas negativas na direção de -E.
  // Assim visualizamos perfeitamente o campo convergente que vem do infinito!
  if (positiveCharges.length === 0) {
    for (const c of negativeCharges) {
      const numLines = Math.max(8, Math.min(64, Math.round(Math.abs(c.q) * linesPerUnit)));
      for (let i = 0; i < numLines; i++) {
        const angle = (2 * Math.PI * i) / numLines;
        const startX = c.x + CHARGE_RADIUS * Math.cos(angle);
        const startY = c.y + CHARGE_RADIUS * Math.sin(angle);

        const points = traceSingleLine(
          startX,
          startY,
          -1, // direção reversa (-E)
          charges,
          width,
          height,
          stepSize,
          maxSteps,
          stopRadius,
          boundsMargin
        );

        if (points.length > 3) {
          // Pontos foram traçados do negativo para fora; para desenhar na convenção física correta (setas para dentro),
          // invertemos a ordem dos pontos
          const forwardPoints = [...points].reverse();
          const arrows = calculateLineArrows(forwardPoints, 90);
          lines.push({
            id: `line-neg-${c.id}-${i}`,
            points: forwardPoints,
            fromChargeId: c.id,
            sign: -1,
            arrows,
          });
        }
      }
    }
  } else if (totalNegativeQ > totalPositiveQ) {
    // Sobra líquida de cargas negativas: traçamos linhas adicionais convergentes
    const excessFactor = (totalNegativeQ - totalPositiveQ) / totalNegativeQ;
    for (const c of negativeCharges) {
      const extraLinesCount = Math.max(4, Math.round(Math.abs(c.q) * linesPerUnit * excessFactor));
      for (let i = 0; i < extraLinesCount; i++) {
        // Escolhe ângulos intercalados
        const angle = (2 * Math.PI * (i + 0.5)) / extraLinesCount;
        const startX = c.x + CHARGE_RADIUS * Math.cos(angle);
        const startY = c.y + CHARGE_RADIUS * Math.sin(angle);

        const points = traceSingleLine(
          startX,
          startY,
          -1,
          charges,
          width,
          height,
          stepSize,
          maxSteps,
          stopRadius,
          boundsMargin
        );

        if (points.length > 3) {
          const forwardPoints = [...points].reverse();
          const arrows = calculateLineArrows(forwardPoints, 90);
          lines.push({
            id: `line-excess-neg-${c.id}-${i}`,
            points: forwardPoints,
            fromChargeId: c.id,
            sign: -1,
            arrows,
          });
        }
      }
    }
  }

  return lines;
}

/**
 * Traçado numérico de uma única linha de campo utilizando Runge-Kutta 4 (RK4).
 */
function traceSingleLine(
  startX: number,
  startY: number,
  dirSign: 1 | -1,
  charges: Charge[],
  width: number,
  height: number,
  stepSize: number,
  maxSteps: number,
  stopRadius: number,
  boundsMargin: number
): FieldLinePoint[] {
  const points: FieldLinePoint[] = [{ x: startX, y: startY }];
  let currX = startX;
  let currY = startY;

  for (let s = 0; s < maxSteps; s++) {
    // Limite das bordas
    if (
      currX < -boundsMargin ||
      currX > width + boundsMargin ||
      currY < -boundsMargin ||
      currY > height + boundsMargin
    ) {
      break;
    }

    // Verificação de colisão/término em alguma carga
    let reachedCharge = false;
    for (const c of charges) {
      const dx = currX - c.x;
      const dy = currY - c.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= stopRadius && s > 3) {
        reachedCharge = true;
        break;
      }
    }
    if (reachedCharge) break;

    // Integração RK4 para curva suave e precisa
    // k1 = f(r)
    const f1 = getNormalizedField(currX, currY, charges, dirSign);
    if (!f1) break;

    // k2 = f(r + ds/2 * k1)
    const f2 = getNormalizedField(
      currX + 0.5 * stepSize * f1.x,
      currY + 0.5 * stepSize * f1.y,
      charges,
      dirSign
    );
    if (!f2) break;

    // k3 = f(r + ds/2 * k2)
    const f3 = getNormalizedField(
      currX + 0.5 * stepSize * f2.x,
      currY + 0.5 * stepSize * f2.y,
      charges,
      dirSign
    );
    if (!f3) break;

    // k4 = f(r + ds * k3)
    const f4 = getNormalizedField(
      currX + stepSize * f3.x,
      currY + stepSize * f3.y,
      charges,
      dirSign
    );
    if (!f4) break;

    const dx = (stepSize / 6) * (f1.x + 2 * f2.x + 2 * f3.x + f4.x);
    const dy = (stepSize / 6) * (f1.y + 2 * f2.y + 2 * f3.y + f4.y);

    currX += dx;
    currY += dy;
    points.push({ x: currX, y: currY });
  }

  return points;
}

function getNormalizedField(
  x: number,
  y: number,
  charges: Charge[],
  sign: 1 | -1
): Vector2D | null {
  const e = calculateElectricField(x, y, charges);
  const mag = Math.sqrt(e.x * e.x + e.y * e.y);
  if (mag < 1e-6) return null;
  return {
    x: (sign * e.x) / mag,
    y: (sign * e.y) / mag,
  };
}

/**
 * Calcula posições e ângulos de setas ao longo de uma linha de força para indicar o sentido.
 */
function calculateLineArrows(
  points: FieldLinePoint[],
  intervalPx: number
): { x: number; y: number; angle: number }[] {
  if (points.length < 5) return [];

  const arrows: { x: number; y: number; angle: number }[] = [];
  let accumulatedDist = 0;
  let nextArrowDist = intervalPx * 0.6; // Primeira seta um pouco adiantada do início

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const segDist = Math.sqrt(dx * dx + dy * dy);

    accumulatedDist += segDist;

    if (accumulatedDist >= nextArrowDist && i < points.length - 2) {
      const angle = Math.atan2(dy, dx);
      arrows.push({
        x: p1.x,
        y: p1.y,
        angle,
      });
      nextArrowDist += intervalPx;
    }
  }

  return arrows;
}

/**
 * Procura pontos neutros aproximados (onde |E| ~ 0) num grid para destacar na simulação.
 */
export function findNeutralPoints(
  charges: Charge[],
  width: number,
  height: number
): { x: number; y: number }[] {
  if (charges.length < 2) return [];

  const neutralPoints: { x: number; y: number }[] = [];
  const step = 20;

  let minE = Infinity;
  let bestX = 0;
  let bestY = 0;

  for (let x = 40; x < width - 40; x += step) {
    for (let y = 40; y < height - 40; y += step) {
      // Ignora proximidade de cargas
      let nearCharge = false;
      for (const c of charges) {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < CHARGE_RADIUS * 2) {
          nearCharge = true;
          break;
        }
      }
      if (nearCharge) continue;

      const e = calculateElectricField(x, y, charges);
      const mag = Math.hypot(e.x, e.y);

      if (mag < 1.8 && mag < minE) {
        minE = mag;
        bestX = x;
        bestY = y;
      }
    }
  }

  if (minE < 2.5) {
    neutralPoints.push({ x: bestX, y: bestY });
  }

  return neutralPoints;
}
