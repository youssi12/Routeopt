'use client';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Truck, Plus, Fuel, Weight } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:   'badge badge-success',
  IN_ROUTE:    'badge badge-info',
  MAINTENANCE: 'badge badge-warning',
};

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list().then(r => r.data),
  });

  const available   = vehicles.filter((v: any) => v.status === 'AVAILABLE').length;
  const inRoute     = vehicles.filter((v: any) => v.status === 'IN_ROUTE').length;
  const maintenance = vehicles.filter((v: any) => v.status === 'MAINTENANCE').length;

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Fleet Management</h1>
            <p className="text-sm text-slate-400">{vehicles.length} vehicles total</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        {/* Status overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Available',   count: available,   color: 'border-green-500 text-green-400' },
            { label: 'In Route',    count: inRoute,     color: 'border-blue-500 text-blue-400' },
            { label: 'Maintenance', count: maintenance, color: 'border-yellow-500 text-yellow-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`card border-l-2 ${color.split(' ')[0]}`}>
              <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Vehicle cards */}
        {isLoading && <div className="text-slate-500 text-center py-12">Loading...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <div key={v.id} className="card hover:border-brand-500/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                    <Truck size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white font-mono text-sm">{v.license_plate}</p>
                    <p className="text-xs text-slate-500">{v.model || 'Unknown model'}</p>
                  </div>
                </div>
                <span className={STATUS_COLOR[v.status] ?? 'badge'}>{v.status.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-surface-overlay rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Weight size={11} className="text-slate-500" />
                    <span className="text-xs text-slate-500">Capacity</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{v.capacity_kg} kg</p>
                </div>
                <div className="bg-surface-overlay rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Fuel size={11} className="text-slate-500" />
                    <span className="text-xs text-slate-500">Fuel</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{v.fuel_consumption} L/100km</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
