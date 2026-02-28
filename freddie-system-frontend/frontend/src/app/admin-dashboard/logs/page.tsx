'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface LogEntry {
  id: number;
  outletName?: string | null;
  action: string;
  actionType: string;
  actionBy: string;
  notes?: string | null;
  date: string;
}

interface LogsResponse {
  entries: LogEntry[];
}

export default function LogsPage() {
  const router = useRouter();
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchLogsData();
  }, [router]);

  const fetchLogsData = async () => {
    try {
      setLoading(true);
      const response = await api.get<LogsResponse>('/api/admin/logs');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load logs data', err);
      setError(err?.response?.data?.detail || err?.message || 'Unable to load logs data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="logs">
        <div className="text-white">Loading activity logs...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="logs">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="logs">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Activity Logs</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button onClick={fetchLogsData} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Date</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Action</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Type</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">By</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data?.entries.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800">
                    <td className="py-4 text-gray-400 text-sm">{formatDate(log.date)}</td>
                    <td className="py-4 text-white">{log.outletName || '—'}</td>
                    <td className="py-4 text-gray-300">{log.action}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">{log.actionBy}</td>
                    <td className="py-4 text-gray-400 text-sm">{log.notes || '—'}</td>
                  </tr>
                ))}
                {data?.entries.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={6}>
                      No activity logs found.
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
