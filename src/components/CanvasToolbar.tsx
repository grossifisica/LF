import React from 'react';
import { Charge } from '../physics/electrostatics';
import { Crosshair, Sparkles, RefreshCw, Focus, Trash2, ArrowUpRight } from 'lucide-react';

interface CanvasToolbarProps {
  charges: Charge[];
  isParticleModeActive: boolean;
  setIsParticleModeActive: (val: boolean) => void;
  particleCount: number;
  vectorScale: number;
  setVectorScale: (val: number) => void;
  onClearParticles: () => void;
  onCenterCharges: () => void;
  onAddProbeCenter: () => void;
  onClearAll: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  charges,
  isParticleModeActive,
  setIsParticleModeActive,
  particleCount,
  vectorScale,
  setVectorScale,
  onClearParticles,
  onCenterCharges,
  onAddProbeCenter,
  onClearAll,
}) => {
  const positiveCount = charges.filter((c) => c.q > 0).length;
  const negativeCount = charges.filter((c) => c.q < 0).length;
  const netQ = charges.reduce((acc, c) => acc + c.q, 0);

  const scalePresets = [1.0, 1.8, 2.5, 3.5];

  return (
    <div className="h-11 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 select-none text-xs">
      {/* Left: Summary and hint */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400 font-sans font-medium">Cargas:</span>
          {positiveCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
              +{positiveCount} {positiveCount === 1 ? 'positiva' : 'positivas'}
            </span>
          )}
          {negativeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
              {negativeCount} {negativeCount === 1 ? 'negativa' : 'negativas'}
            </span>
          )}
          {charges.length === 0 && (
            <span className="text-slate-500 italic">Nenhuma carga</span>
          )}
          <span className="text-slate-500 ml-1">
            (Q_liq = {netQ > 0 ? `+${netQ.toFixed(1)}` : netQ.toFixed(1)} µC)
          </span>
        </div>

        <div className="hidden xl:block h-3.5 w-[1px] bg-slate-800" />

        {/* Vector Scale Quick Control */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 px-2 py-1 rounded-lg border border-purple-500/30">
          <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-medium text-purple-200">Escala Vetor E:</span>
          <div className="flex items-center gap-1">
            {scalePresets.map((scale) => {
              const active = Math.abs(vectorScale - scale) < 0.15;
              return (
                <button
                  key={scale}
                  onClick={() => setVectorScale(scale)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded font-semibold cursor-pointer transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`Definir escala dos vetores para ${scale}x`}
                >
                  {scale}x
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Quick Tools */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onAddProbeCenter}
          className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-purple-500/30"
          title="Posicionar sensor de vetor campo elétrico"
        >
          <Crosshair className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-medium">+ Sensor E</span>
        </button>

        <button
          onClick={() => setIsParticleModeActive(!isParticleModeActive)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs border ${
            isParticleModeActive
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800 border-transparent'
          }`}
          title="Ative para clicar na tela e soltar cargas testes livres"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isParticleModeActive ? 'Modo Partícula (Ativo)' : 'Soltar Carga Livre'}</span>
        </button>

        {particleCount > 0 && (
          <button
            onClick={onClearParticles}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            title="Limpar partículas livres"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar Rastro</span>
          </button>
        )}

        <div className="h-3.5 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={onCenterCharges}
          className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Centralizar todas as cargas na tela"
        >
          <Focus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Centralizar</span>
        </button>

        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          title="Remover todas as cargas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Limpar</span>
        </button>
      </div>
    </div>
  );
};
