'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AccountUser {
  id: number;
  name?: string | null;
  email: string;
  role: string;
  status: string;
  joined: string;
  outletId?: number | null;
}

interface AccountsSummary {
  totalUsers: number;
  activeUsers: number;
  rolesBreakdown: Record<string, number>;
}

interface AccountsResponse {
  summary: AccountsSummary;
  users: AccountUser[];
}

export default function AccountsPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAccountsData();
  }, [router]);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const response = await api.get<AccountsResponse>('/api/admin/accounts');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load accounts data', err);
      setError(err?.response?.data?.detail || err?.message || 'Unable to load accounts data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="accounts">
        <div className="text-white">Loading accounts data...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="accounts">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="accounts">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Accounts</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-white">{data?.summary.totalUsers ?? 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Active Users</h3>
            <p className="text-4xl font-bold text-green-400">{data?.summary.activeUsers ?? 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Roles</h3>
            <div className="text-sm text-gray-300 mt-2">
              {data?.summary.rolesBreakdown && Object.entries(data.summary.rolesBreakdown).map(([role, count]) => (
                <div key={role}>{role}: {count}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">User Accounts</h2>
            <button onClick={fetchAccountsData} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Name</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Email</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Role</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Joined</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((account) => (
                  <tr key={account.id} className="border-b border-gray-800">
                    <td className="py-4 text-white">{account.name || 'N/A'}</td>
                    <td className="py-4 text-gray-400">{account.email}</td>
                    <td className="py-4 text-gray-300">{account.role}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        account.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {account.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{formatDate(account.joined)}</td>
                    <td className="py-4 text-gray-500 text-sm">
                      {account.outletId ? `Outlet ${account.outletId}` : '—'}
                    </td>
                  </tr>
                ))}
                {data?.users.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
