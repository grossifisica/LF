import React, { useState } from 'react';
import { Charge, Probe, calculateElectricField, calculateIndividualFields, calculatePotential } from '../physics/electrostatics';
import {
  Sliders,
  Zap,
  Trash2,
  Copy,
  Compass,
  Activity,
  Eye,
  Crosshair,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface SidebarProps {
  charges: Charge[];
  selectedCharge: Charge | null;
  activeProbe: Probe | null;
  vectorScale: number;
  setVectorScale: (val: number) => void;
  onSelectCharge: (id: string | null) => void;
  onUpdateCharge: (id: string, updates: Partial<Charge>) => void;
  onDeleteCharge: (id: string) => void;
  onDuplicateCharge: (charge: Charge) => void;
  onAddCharge: (sign: 1 | -1) => void;
  onDeleteProbe: (id: string) => void;
  onAddProbeCenter: () => void;
  showFieldLines: boolean;
  setShowFieldLines: (val: boolean) => void;
  showArrows: boolean;
  setShowArrows: (val: boolean) => void;
  showVectorGrid: boolean;
  setShowVectorGrid: (val: boolean) => void;
  showEquipotentials: boolean;
  setShowEquipotentials: (val: boolean) => void;
  showSuperposition: boolean;
  setShowSuperposition: (val: boolean) => void;
  showNeutralPoint: boolean;
  setShowNeutralPoint: (val: boolean) => void;
  linesPerUnit: number;
  setLinesPerUnit: (val: number) => void;
  isParticleModeActive: boolean;
  setIsParticleModeActive: (val: boolean) => void;
  onClearParticles: () => void;
  particleCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  charges,
  selectedCharge,
  activeProbe,
  vectorScale,
  setVectorScale,
  onSelectCharge,
  onUpdateCharge,
  onDeleteCharge,
  onDuplicateCharge,
  onAddCharge,
  onDeleteProbe,
  onAddProbeCenter,
  showFieldLines,
  setShowFieldLines,
  showArrows,
  setShowArrows,
  showVectorGrid,
  setShowVectorGrid,
  showEquipotentials,
  setShowEquipotentials,
  showSuperposition,
  setShowSuperposition,
  showNeutralPoint,
  setShowNeutralPoint,
  linesPerUnit,
  setLinesPerUnit,
  isParticleModeActive,
  setIsParticleModeActive,
  onClearParticles,
  particleCount,
}) => {
  const [activeTab, setActiveTab] = useState<'vetor' | 'cargas' | 'camadas'>('vetor');

  // Cálculos do sensor ativo de vetor campo elétrico
  const netField = activeProbe && charges.length > 0
    ? calculateElectricField(activeProbe.x, activeProbe.y, charges)
    : null;
  const netMag = netField ? Math.hypot(netField.x, netField.y) : 0;
  const angleRad = netField ? Math.atan2(netField.y, netField.x) : 0;
  const angleDeg = Math.round((angleRad * 180) / Math.PI);
  const normalizedDeg = angleDeg < 0 ? angleDeg + 360 : angleDeg;
  const potential = activeProbe && charges.length > 0
    ? calculatePotential(activeProbe.x, activeProbe.y, charges)
    : 0;
  const individualContributions = activeProbe && charges.length > 0
    ? calculateIndividualFields(activeProbe.x, activeProbe.y, charges)
    : [];

  return (
    <aside className="w-full lg:w-[350px] shrink-0 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full overflow-hidden select-none z-20">
      {/* Navigation Tabs Header (3 Abas: Vetor E, Cargas, Camadas) */}
      <div className="grid grid-cols-3 bg-slate-950/80 border-b border-slate-800 p-1 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('vetor')}
          className={`py-2 px-1 text-center rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'vetor'
              ? 'bg-slate-800 text-purple-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] leading-none">Vetor E</span>
        </button>

        <button
          onClick={() => setActiveTab('cargas')}
          className={`py-2 px-1 text-center rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'cargas'
              ? 'bg-slate-800 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] leading-none">Cargas</span>
        </button>

        <button
          onClick={() => setActiveTab('camadas')}
          className={`py-2 px-1 text-center rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'camadas'
              ? 'bg-slate-800 text-sky-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] leading-none">Camadas</span>
        </button>
      </div>

      {/* Tab Content Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: VETOR CAMPO ELÉTRICO */}
        {activeTab === 'vetor' && (
          <div className="space-y-4">
            {/* Quick Action: Colocar Sensor */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Sensor de Campo Elétrico
                </span>
                <span className="text-[11px] text-slate-400">
                  Posiciona o sensor q₀ no espaço
                </span>
              </div>
              <button
                onClick={onAddProbeCenter}
                className="px-2.5 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>+ Sensor E</span>
              </button>
            </div>

            {/* Controle de Escala / Tamanho dos Vetores */}
            <div className="bg-slate-950/85 rounded-xl p-3.5 border border-purple-500/30 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Escala dos Vetores:</span>
                </span>
                <span className="font-mono text-xs font-bold text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                  {vectorScale.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.1"
                value={vectorScale}
                onChange={(e) => setVectorScale(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {[1.0, 1.8, 2.5, 3.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setVectorScale(s)}
                    className={`flex-1 py-1 text-[10px] font-mono font-semibold rounded cursor-pointer transition-all ${
                      Math.abs(vectorScale - s) < 0.15
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {activeProbe && netField ? (
              <div className="space-y-3.5">
                {/* Leitura da Magnitude e Direção */}
                <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400 text-xs">Módulo |E|:</span>
                    <span className="text-xl font-bold font-mono text-purple-300 tabular-nums">
                      {netMag.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-slate-400">N/C</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <span>Direção / Ângulo:</span>
                    <span className="font-mono text-slate-200 tabular-nums font-semibold">
                      {normalizedDeg}° ({angleRad.toFixed(2)} rad)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400">Componente Ex:</span>
                      <div className="font-mono font-semibold text-slate-200 tabular-nums text-xs">
                        {netField.x.toFixed(1)} N/C
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Componente Ey:</span>
                      <div className="font-mono font-semibold text-slate-200 tabular-nums text-xs">
                        {netField.y.toFixed(1)} N/C
                      </div>
                    </div>
                  </div>
                </div>

                {/* Potencial Elétrico */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Potencial Eletrostático V:</span>
                  </div>
                  <span className="font-mono font-bold text-purple-200 tabular-nums">
                    {potential.toFixed(0)} V
                  </span>
                </div>

                {/* Superposição Vetorial: Decomposição das Cargas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Princípio da Superposição:</span>
                    <span className="font-mono text-[11px]">E = Σ Eᵢ</span>
                  </div>

                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                    {individualContributions.map((ind, idx) => (
                      <div
                        key={ind.charge.id}
                        className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                              ind.charge.q > 0 ? 'bg-rose-600' : 'bg-sky-600'
                            }`}
                          >
                            {ind.charge.q > 0 ? '+' : '−'}
                          </span>
                          <span className="text-slate-300 text-[11px]">
                            q{idx + 1} ({ind.charge.q > 0 ? `+${ind.charge.q}` : ind.charge.q} µC)
                          </span>
                        </div>
                        <span className="font-mono text-slate-200 tabular-nums text-[11px]">
                          {ind.magnitude.toFixed(1)} N/C
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão de Remover Sensor */}
                <button
                  onClick={() => onDeleteProbe(activeProbe.id)}
                  className="w-full py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Sensor do Canvas</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 space-y-2">
                <Compass className="w-6 h-6 mx-auto text-purple-400" />
                <p className="font-semibold text-slate-200">Nenhum Sensor Posicionado</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Clique em qualquer local do canvas para posicionar o vetor campo elétrico resultante.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CARGAS */}
        {activeTab === 'cargas' && (
          <div className="space-y-4">
            {/* Quick Add Charges Buttons */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>Adicionar Nova Carga</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {charges.length} {charges.length === 1 ? 'carga' : 'cargas'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddCharge(1)}
                  className="flex items-center justify-center gap-2 p-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 rounded-xl transition-all cursor-pointer font-semibold text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    +
                  </div>
                  <span>Carga Positiva</span>
                </button>

                <button
                  onClick={() => onAddCharge(-1)}
                  className="flex items-center justify-center gap-2 p-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 rounded-xl transition-all cursor-pointer font-semibold text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    −
                  </div>
                  <span>Carga Negativa</span>
                </button>
              </div>
            </div>

            {/* Painel da Carga Selecionada */}
            {selectedCharge ? (
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-amber-500/30 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                        selectedCharge.q > 0 ? 'bg-rose-600' : 'bg-sky-600'
                      }`}
                    >
                      {selectedCharge.q > 0 ? '+' : '−'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Carga Selecionada
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        X: {Math.round(selectedCharge.x)}px, Y: {Math.round(selectedCharge.y)}px
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateCharge(selectedCharge)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Duplicar esta carga"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCharge(selectedCharge.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Excluir carga"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alternador de Sinal */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
                    Sinal da Carga:
                  </div>
                  <div className="grid grid-cols-2 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      onClick={() =>
                        onUpdateCharge(selectedCharge.id, {
                          q: Math.abs(selectedCharge.q),
                        })
                      }
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        selectedCharge.q > 0
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      + Positiva
                    </button>
                    <button
                      onClick={() =>
                        onUpdateCharge(selectedCharge.id, {
                          q: -Math.abs(selectedCharge.q),
                        })
                      }
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        selectedCharge.q < 0
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      − Negativa
                    </button>
                  </div>
                </div>

                {/* Slider de Intensidade */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Intensidade |q|:</span>
                    <span className="font-mono font-bold text-amber-300 text-xs tabular-nums">
                      {Math.abs(selectedCharge.q).toFixed(1)} µC
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={Math.abs(selectedCharge.q)}
                    onChange={(e) => {
                      const newMag = parseFloat(e.target.value);
                      const sign = selectedCharge.q >= 0 ? 1 : -1;
                      onUpdateCharge(selectedCharge.id, { q: sign * newMag });
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>0.5 µC</span>
                    <span>5.0 µC</span>
                    <span>10.0 µC</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-center text-xs text-slate-400 space-y-1">
                <Sliders className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                <p className="font-medium text-slate-300">Nenhuma Carga Selecionada</p>
                <p className="text-[11px] text-slate-500">
                  Clique diretamente em uma carga no canvas para modificar seu sinal ou intensidade.
                </p>
              </div>
            )}

            {/* Lista de Todas as Cargas em Cena */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Cargas em Simulação ({charges.length})
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                {charges.map((c, idx) => {
                  const isSelected = c.id === selectedCharge?.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCharge(c.id)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-slate-950/50 border-slate-800/60 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                            c.q > 0 ? 'bg-rose-600' : 'bg-sky-600'
                          }`}
                        >
                          {c.q > 0 ? '+' : '−'}
                        </span>
                        <span className="font-medium">
                          Carga #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold tabular-nums text-slate-200">
                          {c.q > 0 ? `+${c.q}` : c.q} µC
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCharge(c.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAMADAS & VISUALIZAÇÃO */}
        {activeTab === 'camadas' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400">
              Camadas Visuais do Simulador
            </div>

            <div className="space-y-2 text-xs">
              {/* Linhas de Força */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Linhas de Força</div>
                  <div className="text-[11px] text-slate-500">Traçado contínuo do campo</div>
                </div>
                <input
                  type="checkbox"
                  checked={showFieldLines}
                  onChange={(e) => setShowFieldLines(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                />
              </label>

              {/* Setas de Sentido */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Setas Direcionais</div>
                  <div className="text-[11px] text-slate-500">Sentido do campo (+ para −)</div>
                </div>
                <input
                  type="checkbox"
                  checked={showArrows}
                  onChange={(e) => setShowArrows(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                />
              </label>

              {/* Superposição Vetorial */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Superposição Vetorial</div>
                  <div className="text-[11px] text-slate-500">Mostra vetores parciais E₁, E₂</div>
                </div>
                <input
                  type="checkbox"
                  checked={showSuperposition}
                  onChange={(e) => setShowSuperposition(e.target.checked)}
                  className="w-4 h-4 accent-purple-400 cursor-pointer rounded"
                />
              </label>

              {/* Grade de Vetores */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Grade de Vetores (Grid)</div>
                  <div className="text-[11px] text-slate-500">Amostragem em todo o plano em roxo</div>
                </div>
                <input
                  type="checkbox"
                  checked={showVectorGrid}
                  onChange={(e) => setShowVectorGrid(e.target.checked)}
                  className="w-4 h-4 accent-purple-400 cursor-pointer rounded"
                />
              </label>

              {/* Superfícies Equipotenciais */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Equipotenciais (V = const)</div>
                  <div className="text-[11px] text-slate-500">Perpendiculares às linhas</div>
                </div>
                <input
                  type="checkbox"
                  checked={showEquipotentials}
                  onChange={(e) => setShowEquipotentials(e.target.checked)}
                  className="w-4 h-4 accent-purple-400 cursor-pointer rounded"
                />
              </label>

              {/* Ponto Neutro */}
              <label className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-950">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">Ponto Neutro (E ≈ 0)</div>
                  <div className="text-[11px] text-slate-500">Equilíbrio eletrostático</div>
                </div>
                <input
                  type="checkbox"
                  checked={showNeutralPoint}
                  onChange={(e) => setShowNeutralPoint(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                />
              </label>
            </div>

            {/* Slider de Densidade de Linhas */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Densidade de Linhas:</span>
                <span className="font-mono text-sky-400 font-bold tabular-nums">
                  {linesPerUnit} linhas/µC
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="1"
                value={linesPerUnit}
                onChange={(e) => setLinesPerUnit(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Leve (4)</span>
                <span>Padrão (8)</span>
                <span>Denso (14)</span>
              </div>
            </div>

            {/* Partícula Livre em Movimento */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span>Partículas Teste em Movimento</span>
                {particleCount > 0 && (
                  <span className="text-[11px] text-amber-300 font-mono">
                    {particleCount} ativas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Demonstra que a trajetória de uma carga acelerada (F = q·E) pode divergir da linha
                de força devido à inércia.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsParticleModeActive(!isParticleModeActive)}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isParticleModeActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isParticleModeActive ? '✓ Clique no Canvas p/ Soltar' : 'Modo Lançar Partícula'}
                </button>
                {particleCount > 0 && (
                  <button
                    onClick={onClearParticles}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Limpar partículas da tela"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
