'use client';
import AppShell from '../../components/layout/AppShell';
import { Settings, Database, Cpu, Globe, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20} className="text-brand-400" /> Settings</h1>
          <p className="text-sm text-slate-400">System configuration</p>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Globe size={14} className="text-brand-400" /> System Info</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Logged in as', value: `${user?.name} (${user?.role})` },
                { label: 'API Endpoint', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000' },
                { label: 'Version', value: '1.0.0' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={14} className="text-brand-400" /> Algorithm Defaults</h3>
            <div className="space-y-3">
              {[
                { label: 'Default TSP Algorithm', value: 'Genetic Algorithm' },
                { label: 'GA Population Size', value: '100' },
                { label: 'GA Generations', value: '500' },
                { label: 'SA Cooling Rate', value: '0.995' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className="text-brand-400 font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Database size={14} className="text-brand-400" /> Cache & Performance</h3>
            <div className="space-y-3">
              {[
                { label: 'Route Cache TTL', value: '1 hour' },
                { label: 'Analytics Cache TTL', value: '60 seconds' },
                { label: 'Vehicle Cache TTL', value: '60 seconds' },
                { label: 'Fuel Price ($/L)', value: '1.85' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className="text-white font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
