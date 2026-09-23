/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Charge, Probe, calculateElectricField } from './physics/electrostatics';
import { Header } from './components/Header';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasStage, MovingParticle } from './components/CanvasStage';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Estado das cargas (inicializado com um Dipolo Elétrico clássico)
  const [charges, setCharges] = useState<Charge[]>([
    { id: 'c1', x: 340, y: 300, q: 3 },
    { id: 'c2', x: 560, y: 300, q: -3 },
  ]);

  // Sensores de Vetor Campo Elétrico (inicializado com um sensor ativo no centro superior do dipolo)
  const [probes, setProbes] = useState<Probe[]>([
    { id: 'p1', x: 450, y: 180, testCharge: 1 },
  ]);
  const [activeProbeId, setActiveProbeId] = useState<string | null>('p1');
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);

  // Escala ampliada do vetor campo elétrico (padrão 2.2x para visualização clara de vetores grandes)
  const [vectorScale, setVectorScale] = useState<number>(2.2);

  // Camadas de visualização
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const [showVectorGrid, setShowVectorGrid] = useState(false);
  const [showEquipotentials, setShowEquipotentials] = useState(false);
  const [showSuperposition, setShowSuperposition] = useState(true);
  const [showNeutralPoint, setShowNeutralPoint] = useState(true);
  const [linesPerUnit, setLinesPerUnit] = useState(8);

  // Partículas Livres em Movimento
  const [isParticleModeActive, setIsParticleModeActive] = useState(false);
  const [freeParticles, setFreeParticles] = useState<MovingParticle[]>([]);

  // Adicionar Carga
  const handleAddCharge = useCallback((sign: 1 | -1) => {
    const id = `charge-${Date.now()}`;
    const cx = dimensions.width * 0.5;
    const cy = dimensions.height * 0.5;
    const jitterX = (Math.random() - 0.5) * 160;
    const jitterY = (Math.random() - 0.5) * 160;
    const newCharge: Charge = {
      id,
      x: cx + jitterX,
      y: cy + jitterY,
      q: sign * 3,
    };
    setCharges((prev) => [...prev, newCharge]);
    setSelectedChargeId(id);
  }, [dimensions]);

  // Atualizar Carga
  const handleUpdateCharge = useCallback((id: string, updates: Partial<Charge>) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  // Atualizar Posição da Carga
  const handleUpdateChargePosition = useCallback((id: string, x: number, y: number) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  }, []);

  // Remover Carga
  const handleDeleteCharge = useCallback((id: string) => {
    setCharges((prev) => prev.filter((c) => c.id !== id));
    setSelectedChargeId((curr) => (curr === id ? null : curr));
  }, []);

  // Duplicar Carga
  const handleDuplicateCharge = useCallback((charge: Charge) => {
    const id = `charge-${Date.now()}`;
    const duplicated: Charge = {
      ...charge,
      id,
      x: charge.x + 35,
      y: charge.y + 35,
    };
    setCharges((prev) => [...prev, duplicated]);
    setSelectedChargeId(id);
  }, []);

  // Posicionar ou Adicionar Sensor no Canvas
  const handleAddProbeAtPosition = useCallback((x: number, y: number) => {
    const id = `probe-${Date.now()}`;
    const newProbe: Probe = { id, x, y, testCharge: 1 };
    setProbes((prev) => [...prev, newProbe]);
    setActiveProbeId(id);
  }, []);

  // Posicionar Sensor no Centro
  const handleAddProbeCenter = useCallback(() => {
    const cx = dimensions.width * 0.5 + (Math.random() * 60 - 30);
    const cy = dimensions.height * 0.35 + (Math.random() * 60 - 30);
    handleAddProbeAtPosition(cx, cy);
  }, [dimensions, handleAddProbeAtPosition]);

  // Atualizar Posição do Sensor
  const handleUpdateProbePosition = useCallback((id: string, x: number, y: number) => {
    setProbes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    );
  }, []);

  // Remover Sensor
  const handleDeleteProbe = useCallback((id: string) => {
    setProbes((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0) {
        setActiveProbeId(filtered[0].id);
      } else {
        setActiveProbeId(null);
      }
      return filtered;
    });
  }, []);

  // Centralizar Cargas na Tela
  const handleCenterCharges = useCallback(() => {
    if (charges.length === 0) return;
    const avgX = charges.reduce((acc, c) => acc + c.x, 0) / charges.length;
    const avgY = charges.reduce((acc, c) => acc + c.y, 0) / charges.length;
    const targetX = dimensions.width / 2;
    const targetY = dimensions.height / 2;
    const dx = targetX - avgX;
    const dy = targetY - avgY;
    setCharges((prev) => prev.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy })));
  }, [charges, dimensions]);

  // Limpar Todas as Cargas
  const handleClearAll = useCallback(() => {
    setCharges([]);
    setSelectedChargeId(null);
  }, []);

  // Resetar Simulador para Dipolo Padrão
  const handleReset = useCallback(() => {
    const w = dimensions.width || 900;
    const h = dimensions.height || 600;
    setCharges([
      { id: 'c1', x: w * 0.38, y: h * 0.5, q: 3 },
      { id: 'c2', x: w * 0.62, y: h * 0.5, q: -3 },
    ]);
    setProbes([{ id: 'p1', x: w * 0.5, y: h * 0.35, testCharge: 1 }]);
    setActiveProbeId('p1');
    setSelectedChargeId(null);
    setFreeParticles([]);
  }, [dimensions]);

  // Lançar Partícula Livre
  const handleAddParticle = useCallback((x: number, y: number) => {
    setFreeParticles((prev) => [
      ...prev.slice(-7), // Manter no máximo 8 partículas simultâneas
      {
        x,
        y,
        vx: 0,
        vy: 0,
        q: 1,
        trail: [{ x, y }],
        life: 0,
      },
    ]);
  }, []);

  // Limpar Partículas Livres
  const handleClearParticles = useCallback(() => {
    setFreeParticles([]);
  }, []);

  // Loop de física para as partículas em movimento livre sob F = q*E
  useEffect(() => {
    if (freeParticles.length === 0) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      setFreeParticles((prev) => {
        return prev
          .map((p) => {
            const e = calculateElectricField(p.x, p.y, charges);
            const scaleForce = 85;
            const ax = p.q * e.x * scaleForce;
            const ay = p.q * e.y * scaleForce;

            const damping = 0.985;
            const vx = (p.vx + ax * dt) * damping;
            const vy = (p.vy + ay * dt) * damping;

            const nextX = p.x + vx * dt;
            const nextY = p.y + vy * dt;

            const trail = [...p.trail, { x: nextX, y: nextY }];
            if (trail.length > 50) trail.shift();

            return {
              ...p,
              x: nextX,
              y: nextY,
              vx,
              vy,
              trail,
              life: p.life + dt,
            };
          })
          .filter(
            (p) =>
              p.life < 12 &&
              p.x > -50 &&
              p.x < dimensions.width + 50 &&
              p.y > -50 &&
              p.y < dimensions.height + 50
          );
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [freeParticles.length, charges, dimensions]);

  // Ajuste inicial se as dimensões mudarem e for a primeira vez
  const handleDimensionsChange = useCallback((w: number, h: number) => {
    setDimensions((prev) => {
      if (Math.abs(prev.width - w) > 20 || Math.abs(prev.height - h) > 20) {
        setCharges((currCharges) => {
          return currCharges.map((c) => ({
            ...c,
            x: Math.max(30, Math.min(w - 30, (c.x / prev.width) * w)),
            y: Math.max(30, Math.min(h - 30, (c.y / prev.height) * h)),
          }));
        });
        setProbes((currProbes) => {
          return currProbes.map((p) => ({
            ...p,
            x: Math.max(30, Math.min(w - 30, (p.x / prev.width) * w)),
            y: Math.max(30, Math.min(h - 30, (p.y / prev.height) * h)),
          }));
        });
        return { width: w, height: h };
      }
      return prev;
    });
  }, []);

  const selectedCharge = charges.find((c) => c.id === selectedChargeId) || null;
  const activeProbe = probes.find((p) => p.id === activeProbeId) || probes[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header Superior Principal */}
      <Header
        onAddCharge={handleAddCharge}
        onReset={handleReset}
      />

      {/* 2. Workspace Principal (Canvas sem obstruções + Barra Lateral de Controles) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Coluna da Simulação: Toolbar Externa + Canvas 100% Desobstruído */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <CanvasToolbar
            charges={charges}
            isParticleModeActive={isParticleModeActive}
            setIsParticleModeActive={setIsParticleModeActive}
            particleCount={freeParticles.length}
            vectorScale={vectorScale}
            setVectorScale={setVectorScale}
            onClearParticles={handleClearParticles}
            onCenterCharges={handleCenterCharges}
            onAddProbeCenter={handleAddProbeCenter}
            onClearAll={handleClearAll}
          />

          <div className="flex-1 relative overflow-hidden bg-slate-950">
            <CanvasStage
              charges={charges}
              probes={probes}
              activeProbeId={activeProbe?.id || null}
              selectedChargeId={selectedChargeId}
              showFieldLines={showFieldLines}
              showArrows={showArrows}
              showVectorGrid={showVectorGrid}
              showEquipotentials={showEquipotentials}
              showSuperposition={showSuperposition}
              showNeutralPoint={showNeutralPoint}
              linesPerUnit={linesPerUnit}
              vectorScale={vectorScale}
              testChargeSign={1}
              isParticleModeActive={isParticleModeActive}
              freeParticles={freeParticles}
              onAddParticle={handleAddParticle}
              onSelectCharge={setSelectedChargeId}
              onUpdateChargePosition={handleUpdateChargePosition}
              onUpdateProbePosition={handleUpdateProbePosition}
              onAddProbeAtPosition={handleAddProbeAtPosition}
              onSelectProbe={setActiveProbeId}
              onDimensionsChange={handleDimensionsChange}
            />
          </div>
        </div>

        {/* Barra Lateral com Todos os Controles e Inspetor de Vetor */}
        <Sidebar
          charges={charges}
          selectedCharge={selectedCharge}
          activeProbe={activeProbe}
          vectorScale={vectorScale}
          setVectorScale={setVectorScale}
          onSelectCharge={setSelectedChargeId}
          onUpdateCharge={handleUpdateCharge}
          onDeleteCharge={handleDeleteCharge}
          onDuplicateCharge={handleDuplicateCharge}
          onAddCharge={handleAddCharge}
          onDeleteProbe={handleDeleteProbe}
          onAddProbeCenter={handleAddProbeCenter}
          showFieldLines={showFieldLines}
          setShowFieldLines={setShowFieldLines}
          showArrows={showArrows}
          setShowArrows={setShowArrows}
          showVectorGrid={showVectorGrid}
          setShowVectorGrid={setShowVectorGrid}
          showEquipotentials={showEquipotentials}
          setShowEquipotentials={setShowEquipotentials}
          showSuperposition={showSuperposition}
          setShowSuperposition={setShowSuperposition}
          showNeutralPoint={showNeutralPoint}
          setShowNeutralPoint={setShowNeutralPoint}
          linesPerUnit={linesPerUnit}
          setLinesPerUnit={setLinesPerUnit}
          isParticleModeActive={isParticleModeActive}
          setIsParticleModeActive={setIsParticleModeActive}
          onClearParticles={handleClearParticles}
          particleCount={freeParticles.length}
        />
      </div>
    </div>
  );
}
