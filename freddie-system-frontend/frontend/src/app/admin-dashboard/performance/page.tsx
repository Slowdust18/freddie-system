'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface PerformanceMetrics {
  totalReviews: number;
  avgRating: number;
  responseRate: number;
  avgResponseTimeHours: number;
}

interface OutletPerformance {
  outletId: number;
  outletName: string;
  totalReviews: number;
  avgRating: number;
  responseRate: number;
}

interface PerformanceResponse {
  metrics: PerformanceMetrics;
  outlets: OutletPerformance[];
}

export default function PerformancePage() {
  const router = useRouter();
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPerformanceData();
  }, [router]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get<PerformanceResponse>('/api/admin/performance');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load performance data', err);
      setError(err?.response?.data?.detail || err?.message || 'Unable to load performance data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="performance">
        <div className="text-white">Loading performance data...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="performance">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="performance">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Performance</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Reviews</h3>
            <p className="text-4xl font-bold text-white">{data?.metrics.totalReviews.toLocaleString() ?? 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Average Rating</h3>
            <p className="text-4xl font-bold text-white">{data?.metrics.avgRating.toFixed(1) ?? '0.0'}</p>
            <p className="text-sm text-yellow-500 mt-2">{'★'.repeat(Math.round(data?.metrics.avgRating ?? 0))}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Response Rate</h3>
            <p className="text-4xl font-bold text-white">{data?.metrics.responseRate.toFixed(0) ?? 0}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Response Time</h3>
            <p className="text-4xl font-bold text-white">{data?.metrics.avgResponseTimeHours.toFixed(1) ?? '0.0'}h</p>
            <p className="text-sm text-gray-400 mt-2">Average</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Outlet Performance</h2>
            <button onClick={fetchPerformanceData} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Total Reviews</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Avg Rating</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Response Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.outlets.map((outlet) => (
                  <tr key={outlet.outletId} className="border-b border-gray-800">
                    <td className="py-4 text-white">{outlet.outletName}</td>
                    <td className="py-4 text-gray-300">{outlet.totalReviews}</td>
                    <td className="py-4 text-white">{outlet.avgRating.toFixed(1)}</td>
                    <td className="py-4 text-gray-300">{outlet.responseRate.toFixed(0)}%</td>
                  </tr>
                ))}
                {data?.outlets.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={4}>
                      No outlet performance data available.
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
