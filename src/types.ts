export interface Charge {
  id: number;
  q: number; // Charge value in arbitrary units (e.g., -5 to +5)
  x: number; // X position, normalized (0 to 100) or canvas coordinates. Let's use normalized (0 to 100)% for easy coordinate management on resize.
  y: number; // Y position, normalized (0 to 100)%
  visible: boolean; // Whether the charge is enabled
}

export interface SimulationPreset {
  name: string;
  description: string;
  charges: Charge[];
}

export interface PhysicsVector {
  x: number;
  y: number;
  vx: number; // X component of field strength
  vy: number; // Y component of field strength
  magnitude: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FieldLine {
  points: Point[];
  isForPositiveCharge: boolean;
}

