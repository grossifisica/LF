import { useState } from "react";
import { Charge } from "./types";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { ChargeController } from "./components/ChargeController";
import {
  Eye,
  EyeOff,
  Zap,
  Sliders,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

export default function App() {
  // Initialize with a beautiful standard electric dipole preset
  const defaultCharges: Charge[] = [
    { id: 1, q: 4.0, x: 33, y: 50, visible: true },
    { id: 2, q: -4.0, x: 67, y: 50, visible: true },
    { id: 3, q: 3.0, x: 50, y: 20, visible: false },
    { id: 4, q: -3.0, x: 50, y: 80, visible: false },
  ];

  const [charges, setCharges] = useState<Charge[]>(defaultCharges);
  
  // Visibility toggles requested by the user
  const [showIndividualFields, setShowIndividualFields] = useState(true);
  const [showResultantField, setShowResultantField] = useState(true);
  const [showLinesOfForce, setShowLinesOfForce] = useState(true);

  // Additional didactic settings to enrich the simulation controls
  const [linesDensity, setLinesDensity] = useState(1.0); // 0.5 to 2.0
  const [vectorGridDensity, setVectorGridDensity] = useState(40); // spacing in px
  const [animateFlow, setAnimateFlow] = useState(true);

  // Update a single charge's parameters
  const handleUpdateCharge = (updated: Charge) => {
    setCharges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Update position only (triggered by dragging in the Canvas)
  const handleUpdateChargePosition = (id: number, x: number, y: number) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  };

  // Load loaded presets from didactic panel
  const handleLoadPreset = (presetCharges: Charge[]) => {
    setCharges(presetCharges);
  };

  // Reset to default starting settings
  const handleResetToDefault = () => {
    setCharges(defaultCharges);
    setShowIndividualFields(true);
    setShowResultantField(true);
    setShowLinesOfForce(true);
    setLinesDensity(1.0);
    setVectorGridDensity(40);
    setAnimateFlow(true);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-violet-500/30 selection:text-violet-200"
      id="app_root_container"
    >
      {/* Upper header segment, clean design */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-4" id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-violet-500 to-blue-500 text-white p-1 rounded-lg">
                <Zap size={18} className="animate-pulse" />
              </span>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Linhas de força - Prof. Grossi
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3" id="quick_links">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              v1.2.0 | Didático
            </span>
          </div>
        </div>
      </header>

      {/* Main Container body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="app_main">
        
        {/* Left Column: Simulation Canvas Visualizer & Immediate Control Buttons */}
        <section className="col-span-1 lg:col-span-7 flex flex-col gap-6" id="visual_column">
          
          {/* Draggable Active Simulation Canvas wrapper */}
          <SimulationCanvas
            charges={charges}
            onUpdateChargePosition={handleUpdateChargePosition}
            showIndividualFields={showIndividualFields}
            showResultantField={showResultantField}
            showLinesOfForce={showLinesOfForce}
            linesDensity={linesDensity}
            vectorGridDensity={vectorGridDensity}
            animateFlow={animateFlow}
          />

          {/* Visibility Controls requested by user specification */}
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-xl space-y-4 shadow-sm" id="visibility_controls">
            <div className="border-b border-slate-800/80 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Visualização de Vetores e Linhas
              </h2>
              <span className="text-[10px] text-slate-500">Toggle de visibilidade direta</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="visibility_toggle_buttons">
              {/* Individual Fields Toggle */}
              <button
                id="btn_toggle_individual_fields"
                onClick={() => setShowIndividualFields(!showIndividualFields)}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition duration-200 ${
                  showIndividualFields
                    ? "bg-violet-950/40 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-500/5 hover:bg-violet-950/60"
                    : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400 hover:bg-slate-900/40"
                }`}
                title="Ativar/Desativar representação dos campos de cada carga isoladamente"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${showIndividualFields ? "bg-violet-400" : "bg-slate-600"}`}></div>
                  <span className="font-medium text-xs">Campos Individuais</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {showIndividualFields ? "Visível (Roxo)" : "Invisível"}
                </div>
              </button>

              {/* Resultant Field Toggle */}
              <button
                id="btn_toggle_resultant_field"
                onClick={() => setShowResultantField(!showResultantField)}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition duration-200 ${
                  showResultantField
                    ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/5 hover:bg-indigo-950/60"
                    : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400 hover:bg-slate-900/40"
                }`}
                title="Ativar/Desativar representação resultante da superposição (E_res)"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${showResultantField ? "bg-indigo-400" : "bg-slate-600"}`}></div>
                  <span className="font-semibold text-xs">Campo Resultante</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {showResultantField ? "Visível (Roxo)" : "Invisível"}
                </div>
              </button>

              {/* Lines of Force Toggle */}
              <button
                id="btn_toggle_lines_of_force"
                onClick={() => setShowLinesOfForce(!showLinesOfForce)}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition duration-200 ${
                  showLinesOfForce
                    ? "bg-blue-950/40 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/5 hover:bg-blue-950/65"
                    : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400 hover:bg-slate-900/40"
                }`}
                title="Ativar/Desativar traçado das linhas de fluxo contínuo"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${showLinesOfForce ? "bg-blue-400" : "bg-slate-600"}`}></div>
                  <span className="font-medium text-xs">Linhas de Força</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {showLinesOfForce ? "Visível (Azul)" : "Invisível"}
                </div>
              </button>
            </div>
          </div>

          {/* Precision variables adjustments */}
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-xl space-y-4" id="density_adjustments_container">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders size={13} className="text-violet-400" />
              Opções do Simulador
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Line Density slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Densidade de Linhas:</span>
                  <span className="font-mono text-slate-300">{(linesDensity * 100).toFixed(0)}%</span>
                </div>
                <input
                  id="density_lines_slider"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.25"
                  value={linesDensity}
                  onChange={(e) => setLinesDensity(parseFloat(e.target.value))}
                  disabled={!showLinesOfForce}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              {/* Vector array spacing */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Resolução do Vetor:</span>
                  <span className="font-mono text-slate-300">
                    {vectorGridDensity === 30 ? "Alta" : vectorGridDensity === 40 ? "Média" : "Baixa"}
                  </span>
                </div>
                <input
                  id="resolution_grid_slider"
                  type="range"
                  min="30"
                  max="60"
                  step="10"
                  value={vectorGridDensity}
                  onChange={(e) => setVectorGridDensity(parseInt(e.target.value))}
                  disabled={!showIndividualFields && !showResultantField}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              {/* Flow Animation Play/Pause */}
              <div className="flex items-center justify-between md:justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 select-none">Fluxo de Carga:</span>
                <button
                  id="btn_toggle_flow_particles"
                  onClick={() => setAnimateFlow(!animateFlow)}
                  disabled={!showLinesOfForce}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition ${
                    animateFlow
                      ? "bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/20"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-750"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {animateFlow ? <Pause size={12} /> : <Play size={12} />}
                  <span>{animateFlow ? "Rodando" : "Pausado"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: 4 Individual Charge Panels */}
        <section className="col-span-1 lg:col-span-5 flex flex-col gap-6" id="control_column">
          
          {/* 4 Charge Controllers panel */}
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-xl space-y-4" id="param_panel">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-3" id="param_panel_header">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders size={14} className="text-violet-400" />
                Controle das 4 Cargas Elétricas
              </h2>
              <button
                id="btn_reset_simulation"
                onClick={handleResetToDefault}
                className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-1 bg-slate-800/40 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50 cursor-pointer"
                title="Resetar cargas e visualizações para o padrão inicial"
              >
                <RefreshCw size={10} />
                Resetar
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mude a posição no slider ou arraste os círculos numerados diretamente no simulador para ver os vetores roxos e as linhas azuis atualizarem instantaneamente:
            </p>

            <ChargeController
              charges={charges}
              onUpdateCharge={handleUpdateCharge}
            />
          </div>

        </section>

      </main>

      {/* Elegant informative Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/40 text-[11px] text-slate-500 py-6 px-4 mt-auto text-center font-sans" id="app_footer">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>© 2026 Laboratório Didático de Eletrostática. Desenvolvido para fins de estudo e ensino de Física Moderna.</p>
          <div className="flex items-center justify-center gap-4 text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block"></span>
              <span>Individual / Resultante: Roxo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Linhas de Força: Azul</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
