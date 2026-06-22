'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Plus, Warehouse, Trash2, MapPin } from 'lucide-react';

export default function WarehousesPage() {
  const qc  = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '' });

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (body: any) => warehousesApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setShowForm(false); setForm({ name: '', address: '', latitude: '', longitude: '' }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMut.mutate({ ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) });
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Warehouses</h1>
            <p className="text-sm text-slate-400">{warehouses.length} locations</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Add Warehouse
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 border-brand-500/30">
            <h3 className="text-sm font-semibold text-white mb-4">New Warehouse</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Name</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Main Distribution Hub" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Address</label>
                <input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required placeholder="123 Logistics Ave" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Latitude</label>
                <input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} required placeholder="48.8566" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Longitude</label>
                <input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} required placeholder="2.3522" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating...' : 'Create Warehouse'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {isLoading && <div className="text-slate-500 text-center py-12">Loading...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map((w: any) => (
            <div key={w.id} className="card group hover:border-brand-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Warehouse size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{w.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{w.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMut.mutate(w.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-surface-overlay rounded-lg px-3 py-2">
                <MapPin size={11} />
                {parseFloat(w.latitude).toFixed(4)}, {parseFloat(w.longitude).toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
