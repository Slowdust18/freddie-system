'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface Account {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  outlet_name: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return router.push('/login');
    
    api.get<Account[]>('/api/admin/accounts')
      .then(res => setAccounts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <AdminLayout currentPage="accounts">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">User Accounts</h1>
        <p className="text-gray-400 mb-8">All registered credentials accessing the system.</p>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="bg-gray-900 border-b border-gray-800">
            <CardTitle>System Access</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-black/50 text-gray-400 text-sm">
                  <th className="p-4">ID</th>
                  <th className="p-4">Email / Username</th>
                  <th className="p-4">Assigned Outlet</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-gray-800">
                    <td className="p-4 text-gray-500 font-mono">#{acc.id}</td>
                    <td className="p-4 font-semibold">{acc.email}</td>
                    <td className="p-4 text-gray-300">{acc.outlet_name}</td>
                    <td className="p-4">
                      <span className={`capitalize ${acc.role === 'admin' ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={acc.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                        {acc.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}