'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Toast from '@/components/Toast';

interface OnboardingMetrics {
  pendingApprovals: number;
  thisMonth: number;
  totalActive: number;
}

interface OnboardingOutlet {
  id: number;
  name: string;
  plan?: string | null;
  status: string;
  signedDate: string;
}

interface OnboardingResponse {
  metrics: OnboardingMetrics;
  recentOutlets: OnboardingOutlet[];
}

interface OutletFormState {
  name: string;
  plan: string;
  status: string;
  businessType: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  notes: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

const PLAN_OPTIONS = [
  { value: 'trial', label: 'Trial (30 days)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'halfyearly', label: 'Half-yearly' },
  { value: 'annual', label: 'Annual' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pause', label: 'Paused' },
];

const BUSINESS_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'gym', label: 'Gym' },
  { value: 'wedding_hall', label: 'Wedding Hall' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [outletForm, setOutletForm] = useState<OutletFormState | null>(null);
  const [editingOutlet, setEditingOutlet] = useState<OnboardingOutlet | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOnboardingData();
  }, [router]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, variant });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  };

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const response = await api.get<OnboardingResponse>('/api/admin/onboarding');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load onboarding data', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to load onboarding data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const normalizePlanForForm = (plan?: string | null) => {
    if (!plan) {
      return 'trial';
    }
    switch (plan.toLowerCase()) {
      case 'trial':
      case 'trial_30_days':
        return 'trial';
      case 'monthly':
        return 'monthly';
      case 'quarterly':
        return 'quarterly';
      case 'halfyearly':
        return 'halfyearly';
      case 'annual':
        return 'annual';
      default:
        return 'monthly';
    }
  };

  const buildEmptyForm = (): OutletFormState => ({
    name: '',
    plan: 'trial',
    status: 'active',
    businessType: '',
    contactEmail: '',
    contactPhone: '',
    whatsappNumber: '',
    notes: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
  });

  const openCreateOutletModal = () => {
    setFormError(null);
    setEditingOutlet(null);
    setOutletForm(buildEmptyForm());
    setShowOutletModal(true);
  };

  const openEditOutletModal = (outlet: OnboardingOutlet) => {
    setFormError(null);
    setEditingOutlet(outlet);
    setOutletForm({
      name: outlet.name,
      plan: normalizePlanForForm(outlet.plan),
      status: outlet.status.toLowerCase(),
      businessType: '',
      contactEmail: '',
      contactPhone: '',
      whatsappNumber: '',
      notes: '',
      subscriptionStartDate: outlet.signedDate ? outlet.signedDate.substring(0, 10) : '',
      subscriptionEndDate: '',
    });
    setShowOutletModal(true);
  };

  const closeOutletModal = () => {
    setShowOutletModal(false);
    setOutletForm(null);
    setEditingOutlet(null);
    setFormError(null);
  };

  const formatPlanLabel = (plan?: string | null) => {
    const normalized = normalizePlanForForm(plan);
    const option = PLAN_OPTIONS.find((item) => item.value === normalized);
    return option ? option.label : 'Monthly';
  };

  const buildOutletPayload = (form: OutletFormState) => {
    const payload: Record<string, unknown> = {
      name: form.name,
      plan: form.plan,
      status: form.status,
    };

    if (form.businessType) payload.business_type = form.businessType;
    if (form.contactEmail) payload.contact_email = form.contactEmail;
    if (form.contactPhone) payload.contact_phone = form.contactPhone;
    if (form.whatsappNumber) payload.whatsapp_number = form.whatsappNumber;
    if (form.notes) payload.notes = form.notes.trim();
    if (form.subscriptionStartDate) payload.subscription_start_date = form.subscriptionStartDate;
    if (form.subscriptionEndDate) payload.subscription_end_date = form.subscriptionEndDate;

    return payload;
  };

  const handleOutletSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!outletForm) {
      return;
    }

    const trimmedName = outletForm.name.trim();
    if (!trimmedName) {
      setFormError('Outlet name is required.');
      return;
    }

    if (outletForm.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(outletForm.contactEmail.trim())) {
        setFormError('Enter a valid contact email.');
        return;
      }
    }

    if (outletForm.contactPhone && outletForm.contactPhone.trim().length < 7) {
      setFormError('Contact phone should be at least 7 characters.');
      return;
    }

    if (outletForm.subscriptionStartDate && outletForm.subscriptionEndDate) {
      if (new Date(outletForm.subscriptionEndDate) < new Date(outletForm.subscriptionStartDate)) {
        setFormError('Subscription end date must be after start date.');
        return;
      }
    }

    const payload = buildOutletPayload({ ...outletForm, name: trimmedName });

    try {
      setSubmissionLoading(true);
      setFormError(null);
      if (editingOutlet) {
        await api.put(`/api/admin/onboarding/outlets/${editingOutlet.id}`, payload);
        showToast('Outlet updated successfully.', 'success');
      } else {
        await api.post('/api/admin/onboarding/outlets', payload);
        showToast('Outlet created successfully.', 'success');
      }
      closeOutletModal();
      await fetchOnboardingData();
    } catch (err: any) {
      console.error('Failed to save outlet', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to save outlet.';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handlePauseOutlet = async (outlet: OnboardingOutlet) => {
    const confirmed = window.confirm(`Pause outlet "${outlet.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setSubmissionLoading(true);
      await api.delete(`/api/admin/onboarding/outlets/${outlet.id}`);
      showToast('Outlet paused successfully.', 'success');
      await fetchOnboardingData();
    } catch (err: any) {
      console.error('Failed to pause outlet', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to pause outlet.';
      showToast(message, 'error');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const formatStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'active') {
      return 'bg-green-500/20 text-green-300';
    }
    return 'bg-yellow-500/20 text-yellow-200';
  };

  const recentOutlets = useMemo(() => data?.recentOutlets ?? [], [data]);

  if (loading) {
    return (
      <AdminLayout currentPage="onboarding">
        <div className="text-white">Loading onboarding data...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="onboarding">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="onboarding">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Onboarding</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white">New Outlet Registration</h3>
                <p className="text-sm text-gray-400 mt-1">Add and configure new outlets</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openCreateOutletModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-60"
                  disabled={submissionLoading}
                >
                  + Add Outlet
                </button>
                <button
                  onClick={fetchOnboardingData}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm disabled:opacity-60"
                  disabled={submissionLoading}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Pending Approvals</p>
                <p className="text-3xl font-bold text-white mt-2">{data?.metrics.pendingApprovals ?? 0}</p>
              </div>
              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-3xl font-bold text-white mt-2">{data?.metrics.thisMonth ?? 0}</p>
              </div>
              <div className="bg-black border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">Total Active</p>
                <p className="text-3xl font-bold text-white mt-2">{data?.metrics.totalActive ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Onboardings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Plan</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Signed</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOutlets.map((outlet) => (
                  <tr key={outlet.id} className="border-b border-gray-800">
                    <td className="py-4 text-white">{outlet.name}</td>
                    <td className="py-4 text-gray-300">{formatPlanLabel(outlet.plan)}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${formatStatusBadge(outlet.status)}`}>
                        {outlet.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{formatDate(outlet.signedDate)}</td>
                    <td className="py-4">
                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() => openEditOutletModal(outlet)}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-60"
                          disabled={submissionLoading}
                        >
                          Edit
                        </button>
                        {outlet.status.toLowerCase() !== 'pause' && (
                          <button
                            onClick={() => handlePauseOutlet(outlet)}
                            className="text-red-400 hover:text-red-300 disabled:opacity-60"
                            disabled={submissionLoading}
                          >
                            Pause
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {recentOutlets.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={5}>
                      No outlets onboarded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showOutletModal && outletForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{editingOutlet ? 'Edit Outlet' : 'Create Outlet'}</h3>
              <button onClick={closeOutletModal} className="text-gray-400 hover:text-gray-200 text-sm">Close</button>
            </div>
            <form onSubmit={handleOutletSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Outlet Name</label>
                  <input
                    value={outletForm.name}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Kolapasi Anna Nagar"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Plan</label>
                  <select
                    value={outletForm.plan}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, plan: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Status</label>
                  <select
                    value={outletForm.status}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, status: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Business Type</label>
                  <select
                    value={outletForm.businessType}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, businessType: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {BUSINESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={outletForm.contactEmail}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, contactEmail: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Contact Phone</label>
                  <input
                    value={outletForm.contactPhone}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, contactPhone: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">WhatsApp Number</label>
                  <input
                    value={outletForm.whatsappNumber}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, whatsappNumber: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Notes</label>
                  <input
                    value={outletForm.notes}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, notes: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Anna Nagar, Chennai"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Subscription Start</label>
                  <input
                    type="date"
                    value={outletForm.subscriptionStartDate}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, subscriptionStartDate: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Subscription End</label>
                  <input
                    type="date"
                    value={outletForm.subscriptionEndDate}
                    onChange={(event) => setOutletForm((prev) => prev ? { ...prev, subscriptionEndDate: event.target.value } : prev)}
                    className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeOutletModal}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submissionLoading ? 'Saving...' : editingOutlet ? 'Save Changes' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => {
            if (toastTimerRef.current) {
              clearTimeout(toastTimerRef.current);
              toastTimerRef.current = null;
            }
            setToast(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
