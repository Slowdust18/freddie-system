'use client';

import { useRouter } from 'next/navigation';
import { Home, FileText, CreditCard, Shield, BarChart3, FileCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const router = useRouter();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/admin-dashboard' },
    { id: 'onboarding', label: 'Onboarding', icon: FileText, path: '/admin-dashboard/onboarding' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/admin-dashboard/billing' },
    { id: 'access', label: 'Access Control', icon: Shield, path: '/admin-dashboard/access' },
    { id: 'performance', label: 'Performance', icon: BarChart3, path: '/admin-dashboard/performance' },
    { id: 'logs', label: 'Logs', icon: FileCheck, path: '/admin-dashboard/logs' },
    { id: 'accounts', label: 'Accounts', icon: Users, path: '/admin-dashboard/accounts' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white tracking-tight">FREDDIE</h1>
          <p className="text-xs text-gray-400 mt-1">AI Review Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-black border-b border-gray-800 flex items-center justify-end px-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Admin</p>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white"
              >
                Sign Out
              </button>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-700">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
