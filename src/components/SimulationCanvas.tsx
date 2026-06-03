import React, { useRef, useEffect, useState } from "react";
import { Charge, Point, PhysicsVector, FieldLine } from "../types";
import { calculateFieldAt, traceFieldLines } from "../utils/physics";

interface SimulationCanvasProps {
  charges: Charge[];
  onUpdateChargePosition: (id: number, x: number, y: number) => void;
  showIndividualFields: boolean;
  showResultantField: boolean;
  showLinesOfForce: boolean;
  linesDensity: number; // Factor 0.5 to 2.0
  vectorGridDensity: number; // Spacing in pixels (e.g., 30 to 60)
  animateFlow: boolean; // Flowing dots
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  charges,
  onUpdateChargePosition,
  showIndividualFields,
  showResultantField,
  showLinesOfForce,
  linesDensity,
  vectorGridDensity,
  animateFlow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [animationTick, setAnimationTick] = useState(0);

  // Handle ResizeObserver to maintain fluid fluid width/height without stretching
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // set dimensions (with minimum aspect size)
        setDimensions({
          width: Math.max(width, 320),
          height: Math.max(height, 450),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // RequestAnimationFrame tick for flowing particles
  useEffect(() => {
    if (!animateFlow) return;

    let animId: number;
    const tick = () => {
      setAnimationTick((prev) => (prev + 0.5) % 100);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [animateFlow]);

  // Translate mouse event coords to canvas coordinates & normalized (%) coordinates
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { px: 0, py: 0, xPercent: 0, yPercent: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Convert to percentage (0 - 100)
    const xPercent = (px / rect.width) * 100;
    const yPercent = (py / rect.height) * 100;

    return { px, py, xPercent, yPercent };
  };

  // Find charge near coordinates (within radius)
  const getChargeAtCoords = (px: number, py: number) => {
    const threshold = 22; // px radius for selection
    for (const charge of charges) {
      if (!charge.visible) continue;
      const tcx = (charge.x / 100) * dimensions.width;
      const tcy = (charge.y / 100) * dimensions.height;
      const dist = Math.sqrt((px - tcx) ** 2 + (py - tcy) ** 2);
      if (dist <= threshold) {
        return charge.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py } = getMouseCoords(e);
    const chargeId = getChargeAtCoords(px, py);
    if (chargeId !== null) {
      setDraggedId(chargeId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py, xPercent, yPercent } = getMouseCoords(e);
    
    // Process hover detection
    const hovered = getChargeAtCoords(px, py);
    setHoveredId(hovered);

    // Process Drag update
    if (draggedId !== null) {
      // Clamp values between 3% and 97% to keep charge inside boundary
      const clampedX = Math.max(3, Math.min(97, xPercent));
      const clampedY = Math.max(3, Math.min(97, yPercent));
      onUpdateChargePosition(draggedId, clampedX, clampedY);
    }
  };

  const handleMouseUpOrLeave = () => {
    setDraggedId(null);
  };

  // Draw arrow helper
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    lineWidth: number = 1.5,
    arrowheadSize: number = 6,
    opacity: number = 1
  ) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 2) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    // Draw main arrow vector line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead angled lines
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowheadSize * Math.cos(angle - Math.PI / 6),
      toY - arrowheadSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowheadSize * Math.cos(angle + Math.PI / 6),
      toY - arrowheadSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;

    // Clear Canvas with a clean technical slate background (soft grid)
    ctx.fillStyle = "#111827"; // Tailwind neutral-900 (slate-900 like)
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid lines in background
    ctx.strokeStyle = "#1F2937"; // Tailwind neutral-800
    ctx.lineWidth = 1;
    const backgroundGridSize = 40;
    for (let x = 0; x < width; x += backgroundGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += backgroundGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const activeCharges = charges.filter((c) => c.visible && c.q !== 0);

    // 1. Draw ELECTRIC FIELD VECTORS (GRID) if active
    if ((showIndividualFields || showResultantField) && activeCharges.length > 0) {
      const gridSpacing = vectorGridDensity;
      
      // Calculate limits to center grid neatly
      const startX = Math.round((width % gridSpacing) / 2) + gridSpacing / 2;
      const startY = Math.round((height % gridSpacing) / 2) + gridSpacing / 2;

      for (let px = startX; px < width; px += gridSpacing) {
        for (let py = startY; py < height; py += gridSpacing) {
          // Avoid drawing arrows too close to active charges
          let tooCloseToCharge = false;
          for (const charge of activeCharges) {
            const cx = (charge.x / 100) * width;
            const cy = (charge.y / 100) * height;
            const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            if (d < 28) {
              tooCloseToCharge = true;
              break;
            }
          }
          if (tooCloseToCharge) continue;

          // Calculate field vectors
          const field = calculateFieldAt(px, py, activeCharges, width, height);

          // DRAW INDIVIDUAL FIELDS (Roxo / Light Purple, e.g., #C084FC)
          if (showIndividualFields) {
            field.individualFields.forEach((indField, idx) => {
              const ch = activeCharges[idx];
              if (!ch || indField.magnitude < 1e-3) return;

              const angle = Math.atan2(indField.vy, indField.vx);
              // Scale factor for length: proportional to square root of magnitude with generous head space
              const maxL = 20;
              const minL = 3;
              const ratio = Math.min(1, Math.sqrt(indField.magnitude / 180));
              const scaledL = minL + (maxL - minL) * ratio;
              
              const toX = px + scaledL * Math.cos(angle);
              const toY = py + scaledL * Math.sin(angle);

              // Set opacity proportional to field strength to indicate gradient
              const opacity = 0.12 + 0.58 * ratio;

              // Individual fields are represented with soft purple (Roxo claro)
              drawArrow(ctx, px, py, toX, toY, "#C084FC", 1.0, 4, opacity);
            });
          }

          // DRAW RESULTANT FIELD (Bold Roxo / Deep Purple, #A78BFA)
          if (showResultantField && field.magnitude > 1e-3) {
            const angle = Math.atan2(field.vy, field.vx);
            const maxL = 26;
            const minL = 5;
            const ratio = Math.min(1, Math.sqrt(field.magnitude / 220));
            const scaledL = minL + (maxL - minL) * ratio;

            const toX = px + scaledL * Math.cos(angle);
            const toY = py + scaledL * Math.sin(angle);

            // Opacity scales with resultant field density
            const opacity = 0.22 + 0.78 * ratio;

            // Resultant vector: vibrant royal purple (Roxo vibrante)
            drawArrow(ctx, px, py, toX, toY, "#A78BFA", 2.0, 5.5, opacity);
          }
        }
      }
    }

    // 2. Draw LINES OF FORCE (Linhas de força) - Azul (#3B82F6)
    if (showLinesOfForce && activeCharges.length > 0) {
      const lineOfForces = traceFieldLines(activeCharges, width, height, linesDensity);

      lineOfForces.forEach((line) => {
        const pts = line.points;
        if (pts.length < 2) return;

        // Draw the curved force line using Canvas stroke
        ctx.save();
        ctx.strokeStyle = "rgba(59, 130, 246, 0.45)"; // Soft blue line
        ctx.lineWidth = 1.75;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j].x, pts[j].y);
        }
        ctx.stroke();
        ctx.restore();

        // Draw direction arrowheads along the lines (placed strategically at intervals)
        // Draw an arrow for roughly every 80 steps/positions, depending on line length
        const arrowDistance = 64; // distance in steps
        const numArrows = Math.max(1, Math.floor(pts.length / arrowDistance));

        for (let arrowIdx = 1; arrowIdx <= numArrows; arrowIdx++) {
          const rawIndex = arrowIdx * arrowDistance - Math.floor(arrowDistance / 2);
          const iPos = Math.min(pts.length - 2, Math.max(1, rawIndex));
          
          const p2 = pts[iPos];
          if (!p2) continue;

          // Compute exact physical angle from resultant field at point p2
          const localField = calculateFieldAt(p2.x, p2.y, activeCharges, width, height);
          const angle = Math.atan2(localField.vy, localField.vx);

          // Draw a small blue arrowhead directly on the line
          ctx.save();
          ctx.fillStyle = "#3B82F6"; // Electric Blue
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          const headSize = 6.5;
          ctx.lineTo(
            p2.x - headSize * Math.cos(angle - Math.PI / 6),
            p2.y - headSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            p2.x - headSize * Math.cos(angle + Math.PI / 6),
            p2.y - headSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Draw animated flowing dots
        if (animateFlow) {
          // Flow moving along physical direction
          // Map tick (0 to 100) into a sliding position along the line points array
          const particleCount = 2; // Dots per line structure
          const totalPoints = pts.length;

          for (let pIdx = 0; pIdx < particleCount; pIdx++) {
            // Relative phase offset
            const phase = (animationTick + pIdx * (100 / particleCount)) % 100;
            const fraction = phase / 100;

            // Physical path index mapping
            let ptsIndex = Math.floor(fraction * totalPoints);

            // If negative charged line, flow belongs backwards (towards index 0)
            if (!line.isForPositiveCharge) {
              ptsIndex = totalPoints - 1 - ptsIndex;
            }

            const activePt = pts[ptsIndex];
            if (activePt) {
              ctx.save();
              // Radiant glowing light blue flowing particle
              ctx.shadowColor = "#60A5FA";
              ctx.shadowBlur = 8;
              ctx.fillStyle = "#93C5FD"; // Soft blue-colored spark
              ctx.beginPath();
              ctx.arc(activePt.x, activePt.y, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      });
    }

    // 3. Draw CHARGE CIRCLES on top
    charges.forEach((charge) => {
      if (!charge.visible) return;

      const cx = (charge.x / 100) * width;
      const cy = (charge.y / 100) * height;
      const isPositive = charge.q > 0;
      const isDragging = dragIdMatches(charge.id);
      const isHovered = hoveredId === charge.id;

      // Outer glowing halo based on charge level & sign
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);

      const colorBase = isPositive ? "239, 68, 68" : "59, 130, 246"; // Red (Positive) / Blue (Negative)
      const absQ = Math.abs(charge.q);
      const pulseIntensity = 0.15 + (absQ / 10) * 0.3; // Glow depends on charge magnitude
      
      ctx.fillStyle = `rgba(${colorBase}, ${isDragging ? 0.25 : isHovered ? 0.2 : 0.12})`;
      ctx.fill();
      
      ctx.strokeStyle = `rgba(${colorBase}, ${isDragging ? 0.8 : isHovered ? 0.6 : 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Main core circle representing the Charge
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = isPositive ? "#EF4444" : "#3B82F6"; // High contrast red / blue
      ctx.fill();
      ctx.lineWidth = isDragging || isHovered ? 2 : 1;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
      ctx.restore();

      // Sign ('+' or '-') and charge identification label
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const signText = isPositive ? "+" : charge.q < 0 ? "-" : "0";
      ctx.fillText(signText, cx, cy - 0.5);
      ctx.restore();

      // Draw charge ID caption (q1, q2...) and magnitude text side/underneath
      ctx.save();
      // Drop shadow background for text readability
      ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
      ctx.font = "11px system-ui, sans-serif";
      const badgeText = `q${charge.id}: ${charge.q > 0 ? "+" : ""}${charge.q.toFixed(1)} u.c.`;
      const textWidth = ctx.measureText(badgeText).width;
      ctx.fillRect(cx - (textWidth + 8) / 2, cy + 22, textWidth + 8, 16);

      ctx.fillStyle = "#F3F4F6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, cx, cy + 30);
      ctx.restore();
    });

  }, [
    dimensions,
    charges,
    showIndividualFields,
    showResultantField,
    showLinesOfForce,
    linesDensity,
    vectorGridDensity,
    animateFlow,
    draggedId,
    hoveredId,
    animationTick,
  ]);

  // Assist TS with dynamic Drag IDs
  const dragIdMatches = (id: number) => draggedId === id;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] md:h-[580px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 bg-slate-950 flex flex-col"
      id="simulation_container"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="w-full flex-grow cursor-grab active:cursor-grabbing select-none block"
        id="physics_canvas"
      />
      
      {/* HUD overlays indicating dragging instructions or interactive helper */}
      <div
        className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-gray-300 pointer-events-none select-none flex items-center gap-2"
        id="hud_instructions"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Arraste as cargas no painel para mover</span>
      </div>

      <div
        className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-gray-300 pointer-events-none select-none flex gap-3"
        id="hud_color_legend"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 bg-violet-400 rounded-sm"></span>
          <span>Campo (Roxo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 bg-blue-500 rounded-sm"></span>
          <span>Linhas (Azul)</span>
        </div>
      </div>
    </div>
  );
};
