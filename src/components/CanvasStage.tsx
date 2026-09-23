import React, { useRef, useEffect, useState } from 'react';
import {
  Charge,
  Probe,
  calculateElectricField,
  calculateIndividualFields,
  traceFieldLines,
  findNeutralPoints,
  CHARGE_RADIUS,
} from '../physics/electrostatics';

export interface MovingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  q: number;
  trail: { x: number; y: number }[];
  life: number;
}

interface CanvasStageProps {
  charges: Charge[];
  probes: Probe[];
  activeProbeId: string | null;
  selectedChargeId: string | null;
  showFieldLines: boolean;
  showArrows: boolean;
  showVectorGrid: boolean;
  showEquipotentials: boolean;
  showSuperposition: boolean;
  showNeutralPoint: boolean;
  linesPerUnit: number;
  vectorScale: number;
  testChargeSign: 1 | -1;
  isParticleModeActive: boolean;
  freeParticles: MovingParticle[];
  onAddParticle: (x: number, y: number) => void;
  onSelectCharge: (id: string | null) => void;
  onUpdateChargePosition: (id: string, x: number, y: number) => void;
  onUpdateProbePosition: (id: string, x: number, y: number) => void;
  onAddProbeAtPosition: (x: number, y: number) => void;
  onSelectProbe: (id: string) => void;
  onDimensionsChange: (width: number, height: number) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  charges,
  probes,
  activeProbeId,
  selectedChargeId,
  showFieldLines,
  showArrows,
  showVectorGrid,
  showEquipotentials,
  showSuperposition,
  showNeutralPoint,
  linesPerUnit,
  vectorScale,
  isParticleModeActive,
  freeParticles,
  onAddParticle,
  onSelectCharge,
  onUpdateChargePosition,
  onUpdateProbePosition,
  onAddProbeAtPosition,
  onSelectProbe,
  onDimensionsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estado de arrasto
  const [draggingType, setDraggingType] = useState<'charge' | 'probe' | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Monitorar redimensionamento do container com ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          const w = Math.round(width);
          const h = Math.round(height);
          setDimensions({ width: w, height: h });
          onDimensionsChange(w, h);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onDimensionsChange]);

  // Função principal de renderização no Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 1. Limpar fundo (Slate profundo estilo laboratório científico)
    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, w, h);

    // Grade milimétrica suave de laboratório
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    ctx.beginPath();
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = gridSize; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 2. Superfícies Equipotenciais (se ativado)
    if (showEquipotentials && charges.length > 0) {
      drawEquipotentials(ctx, charges);
    }

    // 3. Grade de Vetores do Campo Elétrico (Vector Field Grid)
    if (showVectorGrid && charges.length > 0) {
      drawVectorGrid(ctx, charges, w, h, vectorScale);
    }

    // 4. Linhas de Força (Streamlines)
    if (showFieldLines && charges.length > 0) {
      const lines = traceFieldLines(charges, w, h, linesPerUnit);
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const line of lines) {
        if (line.points.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'; // Cyan luminoso com transparência
        ctx.shadowColor = 'rgba(56, 189, 248, 0.25)';
        ctx.shadowBlur = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Setas direcionais nas linhas
        if (showArrows && line.arrows.length > 0) {
          for (const arrow of line.arrows) {
            drawArrowHead(ctx, arrow.x, arrow.y, arrow.angle, 6, '#38bdf8');
          }
        }
      }
    }

    // 5. Ponto Neutro (se ativado e detectado)
    if (showNeutralPoint && charges.length >= 2) {
      const neutralPts = findNeutralPoints(charges, w, h);
      for (const np of neutralPts) {
        ctx.save();
        ctx.strokeStyle = '#eab308';
        ctx.fillStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.arc(np.x, np.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(np.x - 18, np.y);
        ctx.lineTo(np.x + 18, np.y);
        ctx.moveTo(np.x, np.y - 18);
        ctx.lineTo(np.x, np.y + 18);
        ctx.stroke();

        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText('Ponto Neutro (E ≈ 0)', np.x + 22, np.y + 4);
        ctx.restore();
      }
    }

    // 6. Rastro e partícula livre de teste em movimento
    for (const p of freeParticles) {
      if (p.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.strokeStyle = p.q > 0 ? 'rgba(244, 63, 94, 0.5)' : 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.q > 0 ? '#f43f5e' : '#0ea5e9';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // 7. Desenhar Cargas Fixas
    for (const c of charges) {
      const isSelected = c.id === selectedChargeId;
      drawCharge(ctx, c, isSelected);
    }

    // 8. Desenhar Sensores e Vetores Campo Elétrico (E_resultante e decomposição) com escala ampliada
    for (const probe of probes) {
      const isActive = probe.id === activeProbeId;
      drawProbeAndVector(ctx, probe, charges, isActive, showSuperposition, vectorScale);
    }
  }, [
    charges,
    probes,
    activeProbeId,
    selectedChargeId,
    showFieldLines,
    showArrows,
    showVectorGrid,
    showEquipotentials,
    showSuperposition,
    showNeutralPoint,
    linesPerUnit,
    vectorScale,
    dimensions,
    freeParticles,
  ]);

  // Métodos de renderização modular
  const drawCharge = (
    ctx: CanvasRenderingContext2D,
    c: Charge,
    isSelected: boolean
  ) => {
    const isPos = c.q > 0;
    const colorPrimary = isPos ? '#f43f5e' : '#0284c7';
    const colorGlow = isPos ? 'rgba(244, 63, 94, 0.35)' : 'rgba(2, 132, 199, 0.35)';

    ctx.save();

    // Halo
    ctx.beginPath();
    ctx.arc(c.x, c.y, CHARGE_RADIUS + 7, 0, Math.PI * 2);
    ctx.fillStyle = colorGlow;
    ctx.fill();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, CHARGE_RADIUS + 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Corpo esférico
    const grad = ctx.createRadialGradient(
      c.x - 5,
      c.y - 5,
      2,
      c.x,
      c.y,
      CHARGE_RADIUS
    );
    grad.addColorStop(0, isPos ? '#fda4af' : '#7dd3fc');
    grad.addColorStop(0.7, colorPrimary);
    grad.addColorStop(1, isPos ? '#9f1239' : '#0369a1');

    ctx.beginPath();
    ctx.arc(c.x, c.y, CHARGE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Sinal central (+ ou −)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPos ? '+' : '−', c.x, c.y - 1);

    // Etiqueta com valor da carga
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e2e8f0';
    const signPrefix = isPos ? '+' : '';
    const label = `${signPrefix}${c.q} µC`;
    ctx.fillText(label, c.x, c.y + CHARGE_RADIUS + 16);

    ctx.restore();
  };

  const drawProbeAndVector = (
    ctx: CanvasRenderingContext2D,
    probe: Probe,
    allCharges: Charge[],
    isActive: boolean,
    superposition: boolean,
    scale: number
  ) => {
    if (allCharges.length === 0) return;

    const netE = calculateElectricField(probe.x, probe.y, allCharges);
    const netMag = Math.hypot(netE.x, netE.y);

    ctx.save();

    // Decomposição de Superposição Vetorial com escala ampliada
    if (superposition && allCharges.length > 1) {
      const individuals = calculateIndividualFields(probe.x, probe.y, allCharges);
      for (const ind of individuals) {
        if (ind.magnitude < 0.05) continue;
        const isPos = ind.charge.q > 0;
        const color = isPos ? 'rgba(244, 63, 94, 0.9)' : 'rgba(56, 189, 248, 0.9)';

        // Escala ampliada dos componentes de superposição
        const baseLen = 35 + 26 * Math.log(1 + ind.magnitude / 25);
        const len = Math.min(260, baseLen * scale);
        const angle = Math.atan2(ind.vector.y, ind.vector.x);
        const endX = probe.x + len * Math.cos(angle);
        const endY = probe.y + len * Math.sin(angle);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(probe.x, probe.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        drawArrowHead(ctx, endX, endY, angle, 9, color);

        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`E_${ind.charge.q > 0 ? '+' : '−'} (${Math.round(ind.magnitude)} N/C)`, endX + 8, endY + 4);
      }
    }

    // Vetor Resultante E (Grande, robusto, em roxo com seta marcante e rótulo claro)
    if (netMag > 0.1) {
      const angle = Math.atan2(netE.y, netE.x);
      // Escala substancialmente aumentada: vetores longos e fáceis de visualizar
      const baseLen = 50 + 38 * Math.log(1 + netMag / 20);
      const arrowLength = Math.min(380, baseLen * scale);
      const endX = probe.x + arrowLength * Math.cos(angle);
      const endY = probe.y + arrowLength * Math.sin(angle);

      ctx.strokeStyle = '#c084fc'; // Roxo vibrante (Purple-400)
      ctx.lineWidth = isActive ? 4.0 : 3.2;
      ctx.setLineDash([]);
      ctx.shadowColor = 'rgba(168, 85, 247, 0.85)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(probe.x, probe.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      drawArrowHead(ctx, endX, endY, angle, 14, '#c084fc');
      ctx.shadowBlur = 0;

      // Rótulo na ponta do vetor com contraste e legibilidade
      const deg = Math.round((angle * 180) / Math.PI);
      const angleFormatted = deg < 0 ? deg + 360 : deg;
      const magFormatted = Math.round(netMag);
      const labelText = `E = ${magFormatted} N/C  (${angleFormatted}°)`;

      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(labelText).width;
      
      const tagX = endX + 12;
      const tagY = endY - 6;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(tagX - 5, tagY - 12, textWidth + 10, 19, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f3e8ff';
      ctx.fillText(labelText, tagX, tagY + 2);
    }

    // Marcador do Sensor (Ponto de teste q₀)
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#c084fc' : '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(probe.x - 5, probe.y);
    ctx.lineTo(probe.x + 5, probe.y);
    ctx.moveTo(probe.x, probe.y - 5);
    ctx.lineTo(probe.x, probe.y + 5);
    ctx.stroke();

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('Sensor (q₀)', probe.x, probe.y - 13);

    ctx.restore();
  };

  const drawVectorGrid = (
    ctx: CanvasRenderingContext2D,
    allCharges: Charge[],
    w: number,
    h: number,
    scale: number
  ) => {
    const spacing = 48;
    ctx.save();
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        let tooClose = false;
        for (const c of allCharges) {
          if (Math.hypot(x - c.x, y - c.y) < CHARGE_RADIUS * 1.5) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        const e = calculateElectricField(x, y, allCharges);
        const mag = Math.hypot(e.x, e.y);
        if (mag < 0.05) continue;

        const angle = Math.atan2(e.y, e.x);
        // Escala aumentada para a grade de vetores também
        const baseLen = 14 + 10 * Math.log(1 + mag / 20);
        const len = Math.min(42, baseLen * (scale * 0.7));

        const startX = x - (len / 2) * Math.cos(angle);
        const startY = y - (len / 2) * Math.sin(angle);
        const endX = x + (len / 2) * Math.cos(angle);
        const endY = y + (len / 2) * Math.sin(angle);

        const alpha = Math.min(0.85, 0.25 + (mag / 250) * 0.65);
        ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        drawArrowHead(ctx, endX, endY, angle, 5.5, `rgba(192, 132, 252, ${alpha})`);
      }
    }
    ctx.restore();
  };

  const drawEquipotentials = (
    ctx: CanvasRenderingContext2D,
    allCharges: Charge[]
  ) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);

    const potentialRadii = [35, 60, 95, 140, 200];
    for (const c of allCharges) {
      for (const r of potentialRadii) {
        ctx.beginPath();
        const steps = 40;
        for (let s = 0; s <= steps; s++) {
          const theta = (s * 2 * Math.PI) / steps;
          const px = c.x + r * Math.cos(theta);
          const py = c.y + r * Math.sin(theta);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number,
    color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.45);
    ctx.lineTo(-size * 0.7, 0);
    ctx.lineTo(-size, size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Coordenadas
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Se estiver no modo de soltar partícula teste livre
    if (isParticleModeActive) {
      onAddParticle(x, y);
      return;
    }

    // 1. Checa se clicou em uma carga existente
    for (let i = charges.length - 1; i >= 0; i--) {
      const c = charges[i];
      const dist = Math.hypot(x - c.x, y - c.y);
      if (dist <= CHARGE_RADIUS + 8) {
        setDraggingType('charge');
        setDraggingId(c.id);
        onSelectCharge(c.id);
        return;
      }
    }

    // 2. Checa se clicou em um sensor de campo elétrico
    for (const p of probes) {
      const dist = Math.hypot(x - p.x, y - p.y);
      if (dist <= 20) {
        setDraggingType('probe');
        setDraggingId(p.id);
        onSelectProbe(p.id);
        return;
      }
    }

    // 3. Clique em espaço livre do canvas:
    // Move o sensor ativo para lá ou adiciona novo sensor se não houver nenhum
    if (activeProbeId) {
      onUpdateProbePosition(activeProbeId, x, y);
    } else {
      onAddProbeAtPosition(x, y);
    }
    onSelectCharge(null);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingType || !draggingId) return;
    const { x, y } = getCanvasCoords(e);

    const margin = CHARGE_RADIUS + 8;
    const boundedX = Math.max(margin, Math.min(dimensions.width - margin, x));
    const boundedY = Math.max(margin, Math.min(dimensions.height - margin, y));

    if (draggingType === 'charge') {
      onUpdateChargePosition(draggingId, boundedX, boundedY);
    } else if (draggingType === 'probe') {
      onUpdateProbePosition(draggingId, boundedX, boundedY);
    }
  };

  const handlePointerUp = () => {
    setDraggingType(null);
    setDraggingId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};
