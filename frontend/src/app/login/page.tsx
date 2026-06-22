'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Route, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router     = useRouter();
  const [email, setEmail]       = useState('admin@routeopt.io');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials. Try admin@routeopt.io / Admin@123');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(26,151,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(26,151,230,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
            <Route size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RouteOpt</h1>
          <p className="text-slate-400 text-sm mt-1">Logistics Intelligence Platform</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-surface-border">
            <p className="text-xs text-slate-500 font-medium mb-2">Demo credentials:</p>
            <div className="space-y-1 text-xs text-slate-500 font-mono">
              <div>admin@routeopt.io / Admin@123</div>
              <div>manager@routeopt.io / Admin@123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
