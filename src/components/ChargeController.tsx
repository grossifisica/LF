import React from "react";
import { Charge } from "../types";
import { Eye, EyeOff, Zap, Plus, Minus } from "lucide-react";

interface ChargeControllerProps {
  charges: Charge[];
  onUpdateCharge: (updated: Charge) => void;
}

export const ChargeController: React.FC<ChargeControllerProps> = ({
  charges,
  onUpdateCharge,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="charge_controller_grid">
      {charges.map((charge, index) => {
        const isPositive = charge.q > 0;
        const absValue = Math.abs(charge.q);

        const handleToggleVisible = () => {
          onUpdateCharge({ ...charge, visible: !charge.visible });
        };

        const handleToggleSign = () => {
          // Keep magnitude but flip sign
          const newQ = -charge.q;
          onUpdateCharge({ ...charge, q: newQ === 0 ? 1 : newQ });
        };

        const handleMagnitudeChange = (val: number) => {
          const currentSign = charge.q >= 0 ? 1 : -1;
          const newQ = val * currentSign;
          onUpdateCharge({ ...charge, q: newQ });
        };

        const handleXChange = (val: number) => {
          onUpdateCharge({ ...charge, x: val });
        };

        const handleYChange = (val: number) => {
          onUpdateCharge({ ...charge, y: val });
        };

        return (
          <div
            key={charge.id}
            id={`charge_card_${charge.id}`}
            className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
              charge.visible
                ? isPositive
                  ? "bg-slate-900/60 border-rose-500/30 hover:border-rose-500/50 shadow-md shadow-rose-500/5"
                  : "bg-slate-900/60 border-blue-500/30 hover:border-blue-500/50 shadow-md shadow-blue-500/5"
                : "bg-slate-900/20 border-slate-800 opacity-60"
            }`}
          >
            {/* Header section with charge ID and visible/invisible toggle */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    charge.visible
                      ? isPositive
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  q{charge.id}
                </span>
                <span className="font-semibold text-sm text-slate-200">
                  Carga Elétrica {charge.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* On/Off Switch */}
                <button
                  id={`btn_toggle_visible_${charge.id}`}
                  onClick={handleToggleVisible}
                  title={charge.visible ? "Desativar Carga" : "Ativar Carga"}
                  className={`p-1.5 rounded-lg border transition-all ${
                    charge.visible
                      ? "bg-slate-800/80 text-emerald-400 border-emerald-500/20 hover:bg-slate-800"
                      : "bg-slate-950/40 text-slate-500 border-slate-800 hover:bg-slate-900"
                  }`}
                >
                  {charge.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            {/* If charge is disabled, overlay or disable input elements */}
            {!charge.visible ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                Esta carga está desativada. Ative-a para projetar o campo.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 1. Sign Selection Button and Intensity Slider */}
                <div className="grid grid-cols-5 gap-3 items-center">
                  <span className="text-slate-400 col-span-1">Sinal:</span>
                  <div className="col-span-4 flex rounded-lg overflow-hidden border border-slate-800 p-0.5 bg-slate-950">
                    <button
                      id={`btn_positive_${charge.id}`}
                      type="button"
                      onClick={() => {
                        if (charge.q < 0) handleToggleSign();
                      }}
                      className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                        isPositive
                          ? "bg-rose-500 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Plus size={12} className="stroke-[3]" />
                      <span>Positivo (+)</span>
                    </button>
                    <button
                      id={`btn_negative_${charge.id}`}
                      type="button"
                      onClick={() => {
                        if (charge.q > 0) handleToggleSign();
                      }}
                      className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                        !isPositive
                          ? "bg-blue-500 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Minus size={12} className="stroke-[3]" />
                      <span>Negativo (-)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Intensity (Charge value in nanocoulombs or units) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap size={12} className="text-amber-400" />
                      Intensidade da Carga:
                    </span>
                    <span className="font-mono text-slate-200">{absValue.toFixed(1)} u.c.</span>
                  </div>
                  <input
                    id={`input_range_q_${charge.id}`}
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.5"
                    value={absValue}
                    onChange={(e) => handleMagnitudeChange(parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-950 accent-${
                      isPositive ? "rose-500" : "blue-500"
                    }`}
                  />
                </div>

                {/* 3. Coordinates Slider Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Position X Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Posição X:</span>
                      <span className="font-mono text-slate-200">{charge.x.toFixed(0)}%</span>
                    </div>
                    <input
                      id={`input_range_x_${charge.id}`}
                      type="range"
                      min="5"
                      max="95"
                      step="1"
                      value={charge.x}
                      onChange={(e) => handleXChange(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>

                  {/* Position Y Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Posição Y:</span>
                      <span className="font-mono text-slate-200">{charge.y.toFixed(0)}%</span>
                    </div>
                    <input
                      id={`input_range_y_${charge.id}`}
                      type="range"
                      min="5"
                      max="95"
                      step="1"
                      value={charge.y}
                      onChange={(e) => handleYChange(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
