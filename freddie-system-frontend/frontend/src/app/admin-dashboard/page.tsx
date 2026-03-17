'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Power, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Outlet {
  id: number;
  name: string;
  is_active: boolean;
  subscription_plan: string;
  place_id: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOutlets();
  }, [router]);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const response = await api.get<Outlet[]>('/api/admin/outlets');
      setOutlets(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load outlets', err);
      setError(err?.response?.data?.detail || 'Unable to fetch outlets.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tenantId: number, currentName: string) => {
    if (!window.confirm(`Are you sure you want to toggle the subscription for ${currentName}?`)) return;

    try {
      const response = await api.post(`/api/admin/outlets/${tenantId}/toggle`);
      
      setOutlets((prev) =>
        prev.map((outlet) =>
          outlet.id === tenantId ? { ...outlet, is_active: response.data.is_active } : outlet
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle status', err);
      alert('Failed to update subscription status.');
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="overview">
        <div className="flex h-64 items-center justify-center text-white">Loading Master Control...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="overview">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Master Control</h1>
          <p className="text-gray-400">Manage all onboarded client subscriptions and bot access.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <Card className="bg-gray-900 border-gray-800 text-white shadow-xl">
          <CardHeader className="bg-gray-900 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">Active Clients</CardTitle>
                <CardDescription className="text-gray-400">Flip the switch to pause AI review processing.</CardDescription>
              </div>
              <Button onClick={fetchOutlets} variant="outline" size="sm" className="bg-black border-gray-700 text-white hover:bg-gray-800 hover:text-white">
                Refresh Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/50">
                    <th className="p-4 text-sm font-medium text-gray-400">ID</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Outlet Name</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Plan</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Bot Status</th>
                    <th className="p-4 text-sm font-medium text-gray-400 text-right">Kill Switch</th>
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet) => (
                    <tr key={outlet.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-gray-500 font-mono">#{outlet.id}</td>
                      <td className="p-4">
                        <p className="font-semibold text-white">{outlet.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{outlet.place_id || 'No Place ID'}</p>
                      </td>
                      <td className="p-4">
                        <span className="capitalize text-gray-300">{outlet.subscription_plan}</span>
                      </td>
                      <td className="p-4">
                        {outlet.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex w-fit items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex w-fit items-center gap-1">
                            <XCircle className="w-3 h-3" /> Paused
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => toggleStatus(outlet.id, outlet.name)}
                          variant={outlet.is_active ? "destructive" : "default"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Power className="w-4 h-4" />
                          {outlet.is_active ? 'Pause Service' : 'Enable Service'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {outlets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No outlets found in the database. Did you run the seed script?
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}