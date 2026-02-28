'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminStats {
  totalOutlets: number;
  activeOutlets: number;
  totalReviews: number;
  avgResponseRate: number;
}

interface OutletSummary {
  id: number;
  name: string;
  location?: string | null;
  businessType: string;
  avgRating: number;
  totalReviews: number;
  positivePercentage: number;
  signedDate: string;
  planType: string;
  isActive: boolean;
}

interface AlertItem {
  type: string;
  outlet_id: number;
  outlet_name: string;
  message: string;
  severity: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [outlets, setOutlets] = useState<OutletSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, outletsRes, alertsRes] = await Promise.all([
        api.get<AdminStats>('/api/admin/stats'),
        api.get<OutletSummary[]>('/api/admin/outlets'),
        api.get<{ alerts: AlertItem[] }>('/api/admin/alerts'),
      ]);

      setStats(statsRes.data);
      setOutlets(outletsRes.data);
      setAlerts(alertsRes.data.alerts || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to fetch dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const platformAvgRating = outlets.length
    ? outlets.reduce((sum, outlet) => sum + outlet.avgRating, 0) / outlets.length
    : 0;

  if (loading) {
    return (
      <AdminLayout currentPage="overview">
        <div className="text-white">Loading dashboard...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="overview">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="overview">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Outlets</h3>
            <p className="text-5xl font-bold text-white">{stats?.totalOutlets ?? 0}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Active Vs Inactive</h3>
            <div className="text-white">
              <p className="text-4xl font-semibold">{stats?.activeOutlets ?? 0}</p>
              <p className="text-sm text-gray-400">Active of {stats?.totalOutlets ?? 0}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Average Rating</h3>
            <p className="text-5xl font-bold text-white">{platformAvgRating.toFixed(1)}</p>
            <p className="text-sm text-gray-400">Across onboarded outlets</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Escalations</h3>
            <p className="text-5xl font-bold text-white">{alerts.length}</p>
            <p className="text-sm text-gray-400">Alerts needing review</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Outlets</h2>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Plan</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Signed</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Avg Rating</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Reviews</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Positive %</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {outlets.slice(0, 10).map((outlet) => (
                  <tr key={outlet.id} className="border-b border-gray-800">
                    <td className="py-4 text-white">{outlet.name}</td>
                    <td className="py-4 text-gray-300 capitalize">{outlet.planType}</td>
                    <td className="py-4 text-gray-400">{formatDate(outlet.signedDate)}</td>
                    <td className="py-4 text-white">{outlet.avgRating.toFixed(1)}</td>
                    <td className="py-4 text-white">{outlet.totalReviews}</td>
                    <td className="py-4 text-white">{outlet.positivePercentage.toFixed(1)}%</td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          outlet.isActive ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-200'
                        }`}
                      >
                        {outlet.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                  </tr>
                ))}
                {outlets.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={7}>
                      No outlets found. Try refreshing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400">All clear! No alerts at the moment.</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={`${alert.type}-${alert.outlet_id}`} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">{alert.outlet_name}</p>
                    <p className="text-sm text-gray-400">{alert.message}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-red-400">{alert.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
