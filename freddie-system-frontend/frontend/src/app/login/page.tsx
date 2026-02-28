'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userEmail', data.user.email);

      if (data.user.outlet_id) {
        localStorage.setItem('outletId', data.user.outlet_id.toString());
      } else {
        localStorage.removeItem('outletId');
      }

      const destination = data.user.role === 'admin' ? '/admin-dashboard' : '/outlet-dashboard';
      router.push(destination);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.detail;
      setError(backendMessage || err?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-black to-gray-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white tracking-tight mb-2">FREDDIE</h1>
            <p className="text-sm text-gray-400 tracking-widest">AI REVIEW AUTOMATION SYSTEM</p>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Create your<br />Account
          </h2>
          <p className="text-gray-400 text-lg">
            AI That Understands Every Star.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">FREDDIE</h1>
            <p className="text-xs text-gray-400 tracking-widest">AI REVIEW AUTOMATION SYSTEM</p>
          </div>
          
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Sign In</h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="E - mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black border border-gray-700 text-white rounded-lg font-medium hover:bg-gray-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Join us'}
                <span>→</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-500">Or</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <button
                type="button"
                className="w-full py-3 bg-black border border-gray-700 text-white rounded-lg font-medium hover:bg-gray-900 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Sign in with Apple ID
              </button>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-3 font-semibold">Demo Credentials:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white font-medium">Admin</p>
                      <p className="text-xs text-gray-500 font-mono">admin@example.com</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@example.com');
                        setPassword('admin123');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Use →
                    </button>
                  </div>
                  <div className="border-t border-gray-800 pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white font-medium">Outlet Manager</p>
                      <p className="text-xs text-gray-500 font-mono">outlet1@example.com</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('outlet1@example.com');
                        setPassword('outlet123');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Use →
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
