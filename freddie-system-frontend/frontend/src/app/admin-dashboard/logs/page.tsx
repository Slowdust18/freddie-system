'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface LogEntry {
  id: number;
  outlet_name: string;
  customer: string;
  rating: number;
  status: string;
  date: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get<LogEntry[]>('/api/admin/logs');
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return router.push('/login');
    fetchLogs();
  }, [router]);

  return (
    <AdminLayout currentPage="logs">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">System Logs</h1>
        <p className="text-gray-400 mb-8">Master feed of all AI review processing.</p>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-900 border-b border-gray-800">
            <CardTitle>Global Activity</CardTitle>
            <Button onClick={fetchLogs} variant="outline" size="sm" className="bg-black border-gray-700 hover:bg-gray-800">
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-black/50 text-gray-400 text-sm">
                  <th className="p-4">Date</th>
                  <th className="p-4">Outlet</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800">
                    <td className="p-4 text-sm text-gray-400">{formatDate(log.date)}</td>
                    <td className="p-4 font-semibold">{log.outlet_name}</td>
                    <td className="p-4 text-gray-300">{log.customer}</td>
                    <td className="p-4 text-yellow-500 font-bold">{log.rating} ★</td>
                    <td className="p-4">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No logs generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}