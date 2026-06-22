'use client';
import { useState } from 'react';
import { optimizationApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Zap, Play, TrendingDown, Clock, Navigation, Dna } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

// Demo stops near Paris
const DEMO_STOPS = [
  { id: 'A', latitude: 48.8566, longitude: 2.3522 },
  { id: 'B', latitude: 48.8738, longitude: 2.2950 },
  { id: 'C', latitude: 48.8600, longitude: 2.3400 },
  { id: 'D', latitude: 48.8643, longitude: 2.3796 },
  { id: 'E', latitude: 48.8531, longitude: 2.3488 },
  { id: 'F', latitude: 48.8680, longitude: 2.3320 },
  { id: 'G', latitude: 48.8460, longitude: 2.3700 },
  { id: 'H', latitude: 48.8780, longitude: 2.3200 },
];

interface CompareResult {
  nearest_neighbor:    { distance: number; runtimeMs: number; route: string[] };
  simulated_annealing: { distance: number; runtimeMs: number; route: string[] };
  genetic:             { distance: number; runtimeMs: number; route: string[]; improvement: number };
}

export default function OptimizationPage() {
  const [result, setResult]   = useState<CompareResult | null>(null);
  const [gaResult, setGaResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [gaLoading, setGaLoading] = useState(false);

  async function runComparison() {
    setLoading(true);
    try {
      const { data } = await optimizationApi.compare({ stops: DEMO_STOPS });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function runGenetic() {
    setGaLoading(true);
    try {
      const { data } = await optimizationApi.genetic({ stops: DEMO_STOPS, config: { generations: 500, populationSize: 100 } });
      setGaResult(data);
    } finally {
      setGaLoading(false);
    }
  }

  const best = result ? Math.min(result.nearest_neighbor.distance, result.simulated_annealing.distance, result.genetic.distance) : 0;

  function bar(dist: number) {
    const pct = best > 0 ? (best / dist) * 100 : 0;
    return pct;
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-brand-400" /> Optimization Engine
          </h1>
          <p className="text-sm text-slate-400">Compare TSP algorithms on 8 delivery stops</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={runComparison} disabled={loading} className="btn-primary flex items-center gap-2">
            <Play size={14} /> {loading ? 'Running...' : 'Compare All Algorithms'}
          </button>
          <button onClick={runGenetic} disabled={gaLoading} className="btn-secondary flex items-center gap-2">
            <Dna size={14} /> {gaLoading ? 'Evolving...' : 'Run Genetic (500 gen)'}
          </button>
        </div>

        {/* Comparison table */}
        {result && (
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Algorithm Comparison</h3>
            <div className="space-y-4">
              {[
                { name: 'Nearest Neighbor', data: result.nearest_neighbor, color: '#f59e0b', desc: 'Greedy heuristic – O(n²)' },
                { name: 'Simulated Annealing', data: result.simulated_annealing, color: '#3b82f6', desc: 'Probabilistic metaheuristic' },
                { name: 'Genetic Algorithm', data: result.genetic, color: '#22c55e', desc: 'Evolutionary computation' },
              ].map(({ name, data, color, desc }) => (
                <div key={name} className="bg-surface-overlay rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">{name}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color }}>{data.distance} km</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Clock size={10} /> {data.runtimeMs}ms
                      </p>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="h-2 bg-surface-base rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${bar(data.distance)}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>Route: {(data as any).route?.join(' → ')}</span>
                    <span>{bar(data.distance).toFixed(1)}% efficiency</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Winner */}
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                <TrendingDown size={12} /> Best result: {best.toFixed(2)} km
                {result.genetic.distance === best && (
                  <span className="ml-1">(Genetic Algorithm wins — {result.genetic.improvement}% improvement over initial)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Genetic evolution chart */}
        {gaResult?.generations?.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Dna size={14} className="text-green-400" /> Genetic Algorithm Evolution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distance reduced by <span className="text-green-400 font-medium">{gaResult.improvement}%</span> over {gaResult.generations[gaResult.generations.length - 1]?.generation} generations
            </p>
            <div className="h-64">
              <Line
                data={{
                  labels: gaResult.generations.map((g: any) => `Gen ${g.generation}`),
                  datasets: [
                    {
                      label: 'Best Distance (km)',
                      data:  gaResult.generations.map((g: any) => g.bestDistance),
                      borderColor: '#22c55e',
                      backgroundColor: '#22c55e15',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 3,
                    },
                    {
                      label: 'Avg Distance (km)',
                      data: gaResult.generations.map((g: any) => g.avgDistance),
                      borderColor: '#64748b',
                      borderDash: [4, 4],
                      tension: 0.4,
                      pointRadius: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
                  scales: {
                    x: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
                    y: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Nearest Neighbor', desc: 'Starts at depot, always visits the closest unvisited stop next. Fast but not globally optimal.', complexity: 'O(n²)', color: 'text-yellow-400' },
            { title: 'Simulated Annealing', desc: 'Accepts worse solutions with decreasing probability, allowing escape from local optima.', complexity: 'O(n·T)', color: 'text-blue-400' },
            { title: 'Genetic Algorithm', desc: 'Evolves a population of routes using selection, crossover, and mutation over hundreds of generations.', complexity: 'O(g·p·n)', color: 'text-green-400' },
          ].map(({ title, desc, complexity, color }) => (
            <div key={title} className="card border-l-2 border-surface-border">
              <p className={`text-sm font-semibold ${color}`}>{title}</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{desc}</p>
              <p className="text-xs font-mono text-slate-600 mt-2">Complexity: {complexity}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
