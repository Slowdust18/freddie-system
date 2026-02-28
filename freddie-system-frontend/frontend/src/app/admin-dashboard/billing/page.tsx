'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface BillingMetrics {
  totalRevenue: number;
  pendingPayments: number;
  activeSubscriptions: number;
}

interface BillingTransaction {
  outlet: string;
  plan?: string | null;
  amount: number;
  status: string;
  billingDate: string;
  dueAmount: number;
}

interface BillingResponse {
  metrics: BillingMetrics;
  transactions: BillingTransaction[];
}

export default function BillingPage() {
  const router = useRouter();
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBillingData();
  }, [router]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await api.get<BillingResponse>('/api/admin/billing');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load billing data', err);
      setError(err?.response?.data?.detail || err?.message || 'Unable to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="billing">
        <div className="text-white">Loading billing data...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="billing">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="billing">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Billing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-white">₹{data?.metrics.totalRevenue.toLocaleString() ?? 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Pending Payments</h3>
            <p className="text-4xl font-bold text-yellow-500">₹{data?.metrics.pendingPayments.toLocaleString() ?? 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Active Subscriptions</h3>
            <p className="text-4xl font-bold text-white">{data?.metrics.activeSubscriptions ?? 0}</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <button onClick={fetchBillingData} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Plan</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Amount</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Due</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="py-4 text-white">{item.outlet}</td>
                    <td className="py-4 text-gray-300 capitalize">{item.plan || 'trial'}</td>
                    <td className="py-4 text-white font-semibold">₹{item.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">₹{item.dueAmount.toLocaleString()}</td>
                    <td className="py-4 text-gray-400">{formatDate(item.billingDate)}</td>
                  </tr>
                ))}
                {data?.transactions.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={6}>
                      No transactions found.
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
