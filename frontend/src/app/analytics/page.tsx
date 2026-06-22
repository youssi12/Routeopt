'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { BarChart3, Truck, Route, DollarSign, Navigation } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const CHART_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
    y: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
  },
};

export default function AnalyticsPage() {
  const { data: vehicles = [] } = useQuery({ queryKey: ['analytics-vehicles'], queryFn: () => analyticsApi.vehicles().then(r => r.data) });
  const { data: routes   = [] } = useQuery({ queryKey: ['analytics-routes'],   queryFn: () => analyticsApi.routes().then(r => r.data) });
  const { data: costs    = [] } = useQuery({ queryKey: ['analytics-costs'],    queryFn: () => analyticsApi.costs().then(r => r.data) });

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-400" /> Analytics
          </h1>
          <p className="text-sm text-slate-400">Fleet performance & cost analysis</p>
        </div>

        {/* Cost trend chart */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Fuel Cost & Distance (30 days)</h3>
          <div className="h-56">
            <Line
              data={{
                labels: costs.map((c: any) => c.date?.slice(5)),
                datasets: [
                  {
                    label: 'Fuel Cost ($)',
                    data: costs.map((c: any) => parseFloat(c.fuel_cost || 0).toFixed(2)),
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b15',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y',
                  },
                  {
                    label: 'Distance (km)',
                    data: costs.map((c: any) => parseFloat(c.distance_km || 0).toFixed(1)),
                    borderColor: '#3b82f6',
                    tension: 0.4,
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                ...CHART_BASE as any,
                scales: {
                  x:  { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
                  y:  { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' }, position: 'left' },
                  y1: { grid: { drawOnChartArea: false }, ticks: { color: '#64748b' }, position: 'right' },
                },
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Vehicle utilization chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Truck size={14} className="text-brand-400" /> Vehicle Distance Ranking
            </h3>
            <div className="h-52">
              <Bar
                data={{
                  labels: vehicles.slice(0, 8).map((v: any) => v.license_plate),
                  datasets: [{
                    label: 'Total Distance (km)',
                    data: vehicles.slice(0, 8).map((v: any) => parseFloat(v.total_distance || 0)),
                    backgroundColor: '#1a97e650',
                    borderColor: '#1a97e6',
                    borderWidth: 1,
                    borderRadius: 4,
                  }],
                }}
                options={CHART_BASE as any}
              />
            </div>
          </div>

          {/* Route efficiency by algorithm */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Route size={14} className="text-brand-400" /> Optimization Score by Algorithm
            </h3>
            <div className="h-52">
              <Bar
                data={{
                  labels: ['Nearest Neighbor', 'Simulated Annealing', 'Genetic'],
                  datasets: [{
                    label: 'Avg Optimization Score',
                    data: [
                      (() => { const r = routes.filter((x: any) => x.algorithm_used === 'NEAREST_NEIGHBOR'); return r.length ? r.reduce((a: number, x: any) => a + parseFloat(x.optimization_score), 0) / r.length : 0; })(),
                      (() => { const r = routes.filter((x: any) => x.algorithm_used === 'SIMULATED_ANNEALING'); return r.length ? r.reduce((a: number, x: any) => a + parseFloat(x.optimization_score), 0) / r.length : 0; })(),
                      (() => { const r = routes.filter((x: any) => x.algorithm_used === 'GENETIC'); return r.length ? r.reduce((a: number, x: any) => a + parseFloat(x.optimization_score), 0) / r.length : 0; })(),
                    ],
                    backgroundColor: ['#f59e0b50', '#3b82f650', '#22c55e50'],
                    borderColor:     ['#f59e0b',   '#3b82f6',   '#22c55e'],
                    borderWidth: 1,
                    borderRadius: 4,
                  }],
                }}
                options={CHART_BASE as any}
              />
            </div>
          </div>
        </div>

        {/* Vehicles table */}
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-surface-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Truck size={14} className="text-brand-400" /> Vehicle Performance
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-overlay">
                {['Vehicle', 'Model', 'Total Routes', 'Distance', 'Fuel Cost', 'Deliveries', 'Avg Score'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {vehicles.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500 text-sm">No vehicle data yet</td></tr>
              )}
              {vehicles.map((v: any) => (
                <tr key={v.id} className="table-row-hover">
                  <td className="px-4 py-3 font-mono text-white text-xs">{v.license_plate}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.model || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{v.total_routes}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="flex items-center gap-1"><Navigation size={11} className="text-slate-500" />{v.total_distance} km</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="flex items-center gap-1"><DollarSign size={11} className="text-slate-500" />{v.total_fuel_cost}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{v.total_deliveries}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-surface-base rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${v.avg_score}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{v.avg_score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Routes table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Route size={14} className="text-brand-400" /> Route History
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-overlay">
                {['Vehicle', 'Algorithm', 'Stops', 'Distance', 'Duration', 'Fuel', 'Delivered', 'Score'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {routes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500 text-sm">No route data yet</td></tr>
              )}
              {routes.slice(0, 20).map((r: any) => (
                <tr key={r.id} className="table-row-hover">
                  <td className="px-4 py-3 font-mono text-white text-xs">{r.license_plate}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${r.algorithm_used === 'GENETIC' ? 'badge-success' : r.algorithm_used === 'SIMULATED_ANNEALING' ? 'badge-info' : 'badge-warning'}`}>
                      {r.algorithm_used === 'NEAREST_NEIGHBOR' ? 'NN' : r.algorithm_used === 'SIMULATED_ANNEALING' ? 'SA' : 'GA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.stop_count}</td>
                  <td className="px-4 py-3 text-slate-300">{parseFloat(r.distance_km).toFixed(1)} km</td>
                  <td className="px-4 py-3 text-slate-300">{Math.round(r.duration_minutes)} min</td>
                  <td className="px-4 py-3 text-slate-300">${parseFloat(r.fuel_cost).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300">{r.delivered_count}/{r.stop_count}</td>
                  <td className="px-4 py-3 text-xs text-brand-400 font-medium">{parseFloat(r.optimization_score).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
