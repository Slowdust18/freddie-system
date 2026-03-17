'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCircle, Key } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    place_id: '',
    plan: 'monthly',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/admin/onboard', formData);
      setMessage({ type: 'success', text: response.data.message });
      
      // Clear form on success
      setFormData({ name: '', place_id: '', plan: 'monthly', email: '', password: '' });
      
      // Optional: Redirect back to the Master Switchboard after 2 seconds
      setTimeout(() => router.push('/admin-dashboard'), 2000);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err?.response?.data?.detail || 'Failed to onboard client. Check connection.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="onboarding">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Onboard New Client</h1>
          <p className="text-gray-400">Register a new outlet and generate their login credentials.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 border ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <Card className="bg-gray-900 border-gray-800 text-white shadow-xl">
          <CardHeader className="bg-gray-900 border-b border-gray-800">
            <CardTitle className="text-xl text-white">Client Details</CardTitle>
            <CardDescription className="text-gray-400">This will create both the database record and their access account.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Business Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2 text-blue-400">
                  <Store className="w-5 h-5" /> Business Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Outlet Name</label>
                    <Input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="e.g. Starbucks Anna Nagar" 
                      required 
                      className="bg-black border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Google Place ID</label>
                    <Input 
                      name="place_id" 
                      value={formData.place_id} 
                      onChange={handleChange} 
                      placeholder="e.g. ChIJr8ADgyFkUjoR..." 
                      required 
                      className="bg-black border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Subscription Plan</label>
                    <select 
                      name="plan" 
                      value={formData.plan} 
                      onChange={handleChange}
                      className="flex h-12 w-full rounded-lg border-2 border-gray-700 bg-black px-4 py-3 text-base text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="trial">Trial (30 Days)</option>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 my-6"></div>

              {/* Account Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2 text-purple-400">
                  <UserCircle className="w-5 h-5" /> Owner Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Login Email</label>
                    <Input 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="owner@restaurant.com" 
                      required 
                      className="bg-black border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Temporary Password</label>
                    <Input 
                      name="password" 
                      type="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      required 
                      className="bg-black border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={loading} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Creating Account...' : 'Onboard Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}