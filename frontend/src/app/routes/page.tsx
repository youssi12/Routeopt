'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { routesApi, ordersApi, vehiclesApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Route, Plus, Navigation, Clock, DollarSign, Zap } from 'lucide-react';

const ALGO_BADGE: Record<string, string> = {
  NEAREST_NEIGHBOR:    'badge badge-warning',
  GENETIC:             'badge badge-success',
  SIMULATED_ANNEALING: 'badge badge-info',
};

export default function RoutesPage() {
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', algorithm: 'GENETIC', order_ids: [] as string[] });

  const { data: routes = [], refetch } = useQuery({ queryKey: ['routes'], queryFn: () => routesApi.list().then(r => r.data) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => vehiclesApi.list().then(r => r.data) });
  const { data: ordersData } = useQuery({ queryKey: ['orders', 'PENDING'], queryFn: () => ordersApi.list({ status: 'PENDING' }).then(r => r.data) });
  const pendingOrders = ordersData?.data ?? [];

  async function handleGenerate() {
    if (!form.vehicle_id || form.order_ids.length === 0) return;
    setGenerating(true);
    try {
      await routesApi.generate({ ...form });
      refetch();
      setShowForm(false);
      setForm({ vehicle_id: '', algorithm: 'GENETIC', order_ids: [] });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Route Plans</h1>
            <p className="text-sm text-slate-400">{routes.length} routes generated</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Generate Route
          </button>
        </div>

        {/* Route generation form */}
        {showForm && (
          <div className="card mb-6 border-brand-500/30">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={14} className="text-brand-400" /> Generate Optimized Route
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Vehicle</label>
                <select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles.filter((v: any) => v.status === 'AVAILABLE').map((v: any) => (
                    <option key={v.id} value={v.id}>{v.license_plate} – {v.model} ({v.capacity_kg}kg)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Algorithm</label>
                <select className="select" value={form.algorithm} onChange={(e) => setForm({ ...form, algorithm: e.target.value })}>
                  <option value="NEAREST_NEIGHBOR">Nearest Neighbor (fast)</option>
                  <option value="SIMULATED_ANNEALING">Simulated Annealing (balanced)</option>
                  <option value="GENETIC">Genetic Algorithm (optimal)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Pending Orders ({form.order_ids.length} selected)</label>
              <div className="bg-surface-overlay rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {pendingOrders.map((o: any) => (
                  <label key={o.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.order_ids.includes(o.id)}
                      onChange={(e) => setForm({
                        ...form,
                        order_ids: e.target.checked
                          ? [...form.order_ids, o.id]
                          : form.order_ids.filter(id => id !== o.id),
                      })}
                      className="accent-brand-500"
                    />
                    <span className={`badge mr-1 ${o.priority === 'HIGH' ? 'badge-high' : o.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>{o.priority}</span>
                    {o.customer_name} – {o.delivery_address}
                    <span className="text-slate-500 ml-auto">{o.weight_kg}kg</span>
                  </label>
                ))}
                {pendingOrders.length === 0 && <p className="text-slate-500 text-xs">No pending orders</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleGenerate} disabled={generating || !form.vehicle_id || form.order_ids.length === 0} className="btn-primary">
                {generating ? 'Optimizing...' : 'Generate Route'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Routes table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-overlay">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Algorithm</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Stops</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Distance</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Duration</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Fuel Cost</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Score</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {routes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  <Route size={32} className="mx-auto mb-2 opacity-30" />
                  No routes yet. Generate your first route above.
                </td></tr>
              )}
              {routes.map((r: any) => (
                <tr key={r.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <p className="font-mono text-white text-xs">{r.license_plate}</p>
                    <p className="text-slate-500 text-xs">{r.model}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={ALGO_BADGE[r.algorithm_used] ?? 'badge'}>
                      {r.algorithm_used?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.stop_count}</td>
                  <td className="px-4 py-3 text-slate-300 flex items-center gap-1">
                    <Navigation size={11} className="text-slate-500" />{parseFloat(r.distance_km).toFixed(1)} km
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="flex items-center gap-1"><Clock size={11} className="text-slate-500" />{Math.round(r.duration_minutes)} min</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="flex items-center gap-1"><DollarSign size={11} className="text-slate-500" />{parseFloat(r.fuel_cost).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-surface-base rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${r.optimization_score}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{parseFloat(r.optimization_score).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : r.status === 'PLANNED' ? 'badge-info' : 'badge-low'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
