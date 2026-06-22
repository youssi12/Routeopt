'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Plus, Search, Package, Clock, AlertTriangle } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'badge badge-warning',
  ASSIGNED:   'badge badge-info',
  IN_TRANSIT: 'badge badge-info',
  DELIVERED:  'badge badge-success',
  FAILED:     'badge bg-red-500/20 text-red-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   'badge badge-high',
  MEDIUM: 'badge badge-medium',
  LOW:    'badge badge-low',
};

export default function OrdersPage() {
  const qc              = useQueryClient();
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, priorityFilter],
    queryFn: () => ordersApi.list({ status: statusFilter || undefined, priority: priorityFilter || undefined }).then(r => r.data),
  });

  const orders: any[] = data?.data ?? [];
  const filtered = orders.filter(
    o => !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.delivery_address.toLowerCase().includes(search.toLowerCase())
  );

  function deadline(d: string | null) {
    if (!d) return null;
    const h = (new Date(d).getTime() - Date.now()) / 3_600_000;
    if (h < 0)  return <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={10} /> Overdue</span>;
    if (h < 4)  return <span className="text-orange-400 text-xs flex items-center gap-1"><Clock size={10} /> {h.toFixed(1)}h</span>;
    return <span className="text-slate-400 text-xs">{h.toFixed(0)}h left</span>;
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Orders</h1>
            <p className="text-sm text-slate-400">{data?.total ?? 0} total orders</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Order
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-9"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['PENDING','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select w-36" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            {['HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-overlay">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Address</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Weight</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Deadline</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Warehouse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading orders...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  No orders found
                </td></tr>
              )}
              {filtered.map((o: any) => (
                <tr key={o.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-white">{o.customer_name}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{o.delivery_address}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{o.weight_kg} kg</td>
                  <td className="px-4 py-3"><span className={PRIORITY_BADGE[o.priority]}>{o.priority}</span></td>
                  <td className="px-4 py-3">{deadline(o.deadline)}</td>
                  <td className="px-4 py-3"><span className={STATUS_BADGE[o.status] ?? 'badge'}>{o.status}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{o.warehouse_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
