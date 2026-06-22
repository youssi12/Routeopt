'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import AppShell from '../../components/layout/AppShell';
import { Package, Truck, Route, DollarSign, Navigation, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
    y: { grid: { color: '#1e2d45' }, ticks: { color: '#64748b' } },
  },
};

function KPICard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: () => analyticsApi.dashboard().then(r => r.data) });
  const { data: trend } = useQuery({ queryKey: ['orders-trend'], queryFn: () => analyticsApi.ordersTrend().then(r => r.data) });

  const labels   = trend?.map((r: any) => r.date?.slice(5)) ?? [];
  const delivered = trend?.map((r: any) => r.delivered)   ?? [];
  const failed    = trend?.map((r: any) => r.failed)      ?? [];

  return (
    <AppShell>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time logistics intelligence</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KPICard label="Total Orders"      value={dash?.orders?.total_orders ?? '—'}      sub={`${dash?.orders?.pending ?? 0} pending`}     icon={Package}   color="bg-blue-500/20 text-blue-400" />
          <KPICard label="Active Routes"     value={dash?.routes?.active_routes ?? '—'}      sub="live"                                           icon={Route}     color="bg-green-500/20 text-green-400" />
          <KPICard label="Available Vehicles" value={dash?.vehicles?.available ?? '—'}       sub={`of ${dash?.vehicles?.total_vehicles ?? 0}`}   icon={Truck}     color="bg-purple-500/20 text-purple-400" />
          <KPICard label="Fuel Cost Today"   value={`$${dash?.fuelCostToday ?? '0'}`}        sub="USD"                                            icon={DollarSign} color="bg-orange-500/20 text-orange-400" />
          <KPICard label="Distance Today"    value={`${dash?.distanceToday ?? '0'} km`}      sub=""                                               icon={Navigation} color="bg-teal-500/20 text-teal-400" />
          <KPICard label="Success Rate"      value={`${dash?.successRate ?? '0'}%`}           sub="deliveries"                                    icon={TrendingUp}  color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Deliveries trend */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Delivery Performance (14 days)</h3>
            <div className="h-52">
              <Bar
                data={{
                  labels,
                  datasets: [
                    { label: 'Delivered', data: delivered, backgroundColor: '#22c55e80', borderColor: '#22c55e', borderWidth: 1, borderRadius: 4 },
                    { label: 'Failed',    data: failed,    backgroundColor: '#ef444480', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 },
                  ],
                }}
                options={CHART_OPTS as any}
              />
            </div>
          </div>

          {/* Vehicle status donut */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Vehicle Status</h3>
            <div className="h-52">
              <Doughnut
                data={{
                  labels: ['Available', 'In Route', 'Maintenance'],
                  datasets: [{
                    data: [
                      dash?.vehicles?.available    ?? 0,
                      dash?.vehicles?.in_route     ?? 0,
                      dash?.vehicles?.maintenance  ?? 0,
                    ],
                    backgroundColor: ['#22c55e50', '#3b82f650', '#f59e0b50'],
                    borderColor:     ['#22c55e',   '#3b82f6',   '#f59e0b'],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending',    value: dash?.orders?.pending,    color: 'border-yellow-500' },
            { label: 'In Transit', value: dash?.orders?.in_transit, color: 'border-blue-500' },
            { label: 'Delivered',  value: dash?.orders?.delivered,  color: 'border-green-500' },
            { label: 'Failed',     value: dash?.orders?.failed,     color: 'border-red-500' },
          ].map((s) => (
            <div key={s.label} className={`card border-l-2 ${s.color}`}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value ?? '0'}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
