import React from 'react';
import { Plus, RotateCcw, Zap } from 'lucide-react';

interface HeaderProps {
  onAddCharge: (sign: 1 | -1) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddCharge,
  onReset,
}) => {
  return (
    <header className="h-14 px-5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 via-amber-500 to-sky-500 p-[1.5px] shadow-sm">
          <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center font-bold text-xs tracking-tighter text-amber-300">
            E·q
          </div>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span>Linhas de força - Prof. Grossi</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold uppercase tracking-wider hidden sm:inline-block">
              Simulador
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Visualização vetorial do campo eletrostático resultante e linhas de campo
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          title="Reiniciar configuração para dipolo padrão"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reiniciar</span>
        </button>

        <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80">
          <button
            onClick={() => onAddCharge(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-600/40 rounded-md transition-all cursor-pointer whitespace-nowrap"
          >
            <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              +
            </div>
            <span>Carga +q</span>
          </button>
          <div className="w-[1px] h-4 bg-slate-700" />
          <button
            onClick={() => onAddCharge(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:text-white hover:bg-sky-600/40 rounded-md transition-all cursor-pointer whitespace-nowrap"
          >
            <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              −
            </div>
            <span>Carga −q</span>
          </button>
        </div>
      </div>
    </header>
  );
};
