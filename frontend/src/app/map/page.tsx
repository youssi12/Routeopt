'use client';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { warehousesApi, ordersApi, vehiclesApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { MapPin, Warehouse, Truck, Package } from 'lucide-react';

// Leaflet must be dynamically imported (no SSR)
const MapComponent = dynamic(() => import('../../components/maps/MapView'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-surface-base text-slate-500">
    <div className="text-center"><MapPin size={32} className="mx-auto mb-2 opacity-30" /><p>Loading map...</p></div>
  </div>
) });

export default function MapPage() {
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehousesApi.list().then(r => r.data) });
  const { data: ordersData }      = useQuery({ queryKey: ['orders-map'], queryFn: () => ordersApi.list({ limit: '200' }).then(r => r.data) });
  const { data: vehicles = [] }   = useQuery({ queryKey: ['vehicles'],   queryFn: () => vehiclesApi.list().then(r => r.data) });

  const orders = ordersData?.data ?? [];

  const pending   = orders.filter((o: any) => o.status === 'PENDING').length;
  const assigned  = orders.filter((o: any) => o.status === 'ASSIGNED').length;
  const inTransit = orders.filter((o: any) => o.status === 'IN_TRANSIT').length;

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center gap-6 px-6 py-3 bg-surface-raised border-b border-surface-border flex-shrink-0">
          <h1 className="text-sm font-semibold text-white">Live Map</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Warehouse size={12} className="text-blue-400" /> {warehouses.length} Warehouses</span>
            <span className="flex items-center gap-1.5"><Package size={12} className="text-yellow-400" /> {pending} Pending</span>
            <span className="flex items-center gap-1.5"><Package size={12} className="text-blue-400" /> {assigned + inTransit} Active</span>
            <span className="flex items-center gap-1.5"><Truck size={12} className="text-green-400" /> {vehicles.filter((v: any) => v.status === 'AVAILABLE').length} Available</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Warehouse</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Pending</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Delivered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Failed</span>
          </div>
        </div>

        {/* Map fills remaining height */}
        <div className="flex-1">
          <MapComponent warehouses={warehouses} orders={orders} />
        </div>
      </div>
    </AppShell>
  );
}
