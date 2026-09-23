import { Charge } from './electrostatics';

export interface PresetConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  charges: (width: number, height: number) => Charge[];
}

export const PRESETS: PresetConfig[] = [
  {
    id: 'dipole',
    name: 'Dipolo Elétrico (+q e -q)',
    category: 'Clássicos',
    description: 'Duas cargas de mesmo módulo e sinais opostos. Linhas nascem na carga positiva e convergem para a negativa.',
    charges: (w, h) => [
      { id: 'c1', x: w * 0.35, y: h * 0.5, q: 3 },
      { id: 'c2', x: w * 0.65, y: h * 0.5, q: -3 },
    ],
  },
  {
    id: 'equal_repulsion',
    name: 'Cargas Iguais (+q e +q)',
    category: 'Clássicos',
    description: 'Repulsão eletrostática. As linhas se afastam uma das outras e nunca se cruzam, formando um ponto neutro (E = 0) no centro.',
    charges: (w, h) => [
      { id: 'c1', x: w * 0.35, y: h * 0.5, q: 3 },
      { id: 'c2', x: w * 0.65, y: h * 0.5, q: 3 },
    ],
  },
  {
    id: 'unequal_charges',
    name: 'Cargas Desiguais (+3q e -1q)',
    category: 'Assimétricos',
    description: 'A carga de +3q emite 3 vezes mais linhas de força que a carga de -1q absorve. As linhas restantes propagam-se para o infinito.',
    charges: (w, h) => [
      { id: 'c1', x: w * 0.32, y: h * 0.5, q: 3 },
      { id: 'c2', x: w * 0.68, y: h * 0.5, q: -1 },
    ],
  },
  {
    id: 'single_pos',
    name: 'Carga Positiva Isolada (+q)',
    category: 'Fundamentais',
    description: 'Campo elétrico radialmente divergente. As linhas de força apontam em linha reta para fora, estendendo-se ao infinito.',
    charges: (w, h) => [
      { id: 'c1', x: w * 0.5, y: h * 0.5, q: 4 },
    ],
  },
  {
    id: 'single_neg',
    name: 'Carga Negativa Isolada (-q)',
    category: 'Fundamentais',
    description: 'Campo elétrico radialmente convergente. As linhas de força vêm do infinito e apontam diretamente para a carga.',
    charges: (w, h) => [
      { id: 'c1', x: w * 0.5, y: h * 0.5, q: -4 },
    ],
  },
  {
    id: 'quadrupole',
    name: 'Quadrupolo Elétrico',
    category: 'Avançados',
    description: 'Quatro cargas alternadas nos vértices de um quadrado (+, -, +, -), demonstrando a rica geometria do campo multipolar.',
    charges: (w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const d = Math.min(w, h) * 0.18;
      return [
        { id: 'c1', x: cx - d, y: cy - d, q: 2.5 },
        { id: 'c2', x: cx + d, y: cy - d, q: -2.5 },
        { id: 'c3', x: cx + d, y: cy + d, q: 2.5 },
        { id: 'c4', x: cx - d, y: cy + d, q: -2.5 },
      ];
    },
  },
  {
    id: 'parallel_plates',
    name: 'Placas Paralelas (Capacitor)',
    category: 'Avançados',
    description: 'Aproximação de campo uniforme entre duas fileiras de cargas opostas, com efeito de borda nas extremidades.',
    charges: (w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const spacing = 50;
      const list: Charge[] = [];
      const count = 5;
      const startY = cy - ((count - 1) * spacing) / 2;

      for (let i = 0; i < count; i++) {
        list.push({
          id: `pos-${i}`,
          x: cx - 110,
          y: startY + i * spacing,
          q: 1.5,
        });
        list.push({
          id: `neg-${i}`,
          x: cx + 110,
          y: startY + i * spacing,
          q: -1.5,
        });
      }
      return list;
    },
  },
];
