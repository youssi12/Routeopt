'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Warehouse, Truck, Package, Route,
  Zap, BarChart3, Settings, LogOut, Map,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Map View',     href: '/map',           icon: Map },
  { label: 'Warehouses',   href: '/warehouses',    icon: Warehouse },
  { label: 'Vehicles',     href: '/vehicles',      icon: Truck },
  { label: 'Orders',       href: '/orders',        icon: Package },
  { label: 'Routes',       href: '/routes',        icon: Route },
  { label: 'Optimization', href: '/optimization',  icon: Zap },
  { label: 'Analytics',    href: '/analytics',     icon: BarChart3 },
  { label: 'Settings',     href: '/settings',      icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-surface-raised border-r border-surface-border flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Route size={16} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">RouteOpt</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Logistics Intelligence</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all
                  ${active
                    ? 'bg-brand-500/15 text-brand-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-overlay'
                  }`}
              >
                <Icon size={16} className={active ? 'text-brand-400' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-surface-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
