'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import Toast from '@/components/Toast';

interface RoleSummary {
  id: string;
  name: string;
  description: string;
  users: number;
  permissions: string[];
  dbId?: number | null;
}

interface ModulePermission {
  module: string;
  view: boolean;
  edit: boolean;
}

interface AccessResponse {
  roles: RoleSummary[];
  permissions: ModulePermission[];
  users: AccessUser[];
}

interface AccessUser {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  outlet_id?: number | null;
  customRoleId?: number | null;
  customRoleName?: string | null;
}

interface RoleFormState {
  name: string;
  description: string;
  permissions: Record<string, boolean>;
}

export default function AccessControlPage() {
  const router = useRouter();
  const [data, setData] = useState<AccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState | null>(null);
  const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAccessData();
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

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      const response = await api.get<AccessResponse>('/api/admin/access');
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load access control data', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to load access data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const moduleNames = useMemo(() => data?.permissions.map((perm) => perm.module) ?? [], [data]);
  const customRoles = useMemo(() => data?.roles.filter((role) => role.dbId) ?? [], [data]);

  const initializeRoleForm = (role?: RoleSummary | null): RoleFormState => {
    const permissions = moduleNames.reduce<Record<string, boolean>>((acc, module) => {
      acc[module] = role?.permissions.includes(module) ?? false;
      return acc;
    }, {});

    return {
      name: role?.name ?? '',
      description: role?.description ?? '',
      permissions,
    };
  };

  const openCreateRoleModal = () => {
    setFormError(null);
    setEditingRole(null);
    setRoleForm(initializeRoleForm(null));
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role: RoleSummary) => {
    if (!role.dbId) {
      showToast('System roles cannot be edited.', 'error');
      return;
    }
    setFormError(null);
    setEditingRole(role);
    setRoleForm(initializeRoleForm(role));
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setRoleForm(null);
    setEditingRole(null);
    setFormError(null);
  };

  const togglePermission = (module: string) => {
    setRoleForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: !prev.permissions[module],
        },
      };
    });
  };

  const handleRoleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleForm) {
      return;
    }

    const trimmedName = roleForm.name.trim();
    if (!trimmedName) {
      setFormError('Role name is required.');
      return;
    }

    const selectedPermissions = moduleNames.filter((module) => roleForm.permissions[module]);
    if (!selectedPermissions.length) {
      setFormError('Select at least one module permission.');
      return;
    }

    const payload = {
      name: trimmedName,
      description: roleForm.description.trim() || undefined,
      permissions: selectedPermissions,
    };

    try {
      setRoleActionLoading(true);
      setFormError(null);
      if (editingRole?.dbId) {
        await api.put(`/api/admin/access/roles/${editingRole.dbId}`, payload);
        showToast('Role updated successfully.', 'success');
      } else {
        await api.post('/api/admin/access/roles', payload);
        showToast('Role created successfully.', 'success');
      }
      closeRoleModal();
      await fetchAccessData();
    } catch (err: any) {
      console.error('Failed to save role', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to save role.';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setRoleActionLoading(false);
    }
  };

  const handleDeleteRole = async (role: RoleSummary) => {
    if (!role.dbId) {
      showToast('System roles cannot be deleted.', 'error');
      return;
    }
    const confirmed = window.confirm(`Delete role "${role.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setRoleActionLoading(true);
      await api.delete(`/api/admin/access/roles/${role.dbId}`);
      showToast('Role deleted successfully.', 'success');
      await fetchAccessData();
    } catch (err: any) {
      console.error('Failed to delete role', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to delete role.';
      showToast(message, 'error');
    } finally {
      setRoleActionLoading(false);
    }
  };

  const handleUserRoleChange = async (
    event: ChangeEvent<HTMLSelectElement>,
    user: AccessUser
  ) => {
    const selectedValue = event.target.value;
    const roleId = selectedValue ? Number(selectedValue) : null;

    try {
      setAssigningUserId(user.id);
      await api.post(`/api/admin/access/users/${user.id}/assign-role`, {
        role_id: roleId,
      });
      showToast(
        roleId ? `Assigned ${user.email} to custom role.` : `Removed custom role for ${user.email}.`,
        'success'
      );
      await fetchAccessData();
    } catch (err: any) {
      console.error('Failed to update user role', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to update user role.';
      showToast(message, 'error');
    } finally {
      setAssigningUserId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="access">
        <div className="text-white">Loading access control...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="access">
        <div className="text-red-400">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="access">
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">Access Control</h1>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={openCreateRoleModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            disabled={roleActionLoading}
          >
            + Add Role
          </button>
          <button
            onClick={fetchAccessData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            disabled={roleActionLoading}
          >
            Refresh
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Roles</h2>
            <span className="text-sm text-gray-500">Custom roles are editable; system roles are read-only.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Role ID</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Role Name</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Description</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Assigned Users</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Role Permissions</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.roles.map((role) => (
                  <tr key={role.id} className="border-b border-gray-800">
                    <td className="py-4 text-white">{role.id}</td>
                    <td className="py-4 text-white">{role.name}</td>
                    <td className="py-4 text-gray-300">{role.description}</td>
                    <td className="py-4 text-white">{role.users}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => (
                          <span key={perm} className="text-gray-400 text-sm bg-gray-800 px-2 py-1 rounded-md">{perm}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-60"
                          disabled={roleActionLoading}
                        >
                          Edit
                        </button>
                        {role.dbId && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-400 hover:text-red-300 disabled:opacity-60"
                            disabled={roleActionLoading}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.roles.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-400" colSpan={6}>
                      No roles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Role Permissions</h2>
          <div className="space-y-4">
            {data?.permissions.map((perm) => (
              <div key={perm.module} className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-white">{perm.module}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={perm.view} readOnly className="w-4 h-4" />
                    <span className="text-gray-400 text-sm">View</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={perm.edit} readOnly className="w-4 h-4" />
                    <span className="text-gray-400 text-sm">Edit</span>
                  </label>
                </div>
              </div>
            ))}
            {!data?.permissions.length && (
              <p className="text-gray-400 text-sm">No permission records available.</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Custom Role Assignments</h2>
            <span className="text-sm text-gray-500">Assign persisted custom roles to specific users.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Name</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Email</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Base Role</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Custom Role</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 pb-4">Outlet</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800">
                    <td className="py-4 text-white">{user.full_name || '—'}</td>
                    <td className="py-4 text-gray-400">{user.email}</td>
                    <td className="py-4 text-gray-300 capitalize">{user.role}</td>
                    <td className="py-4">
                      <select
                        value={user.customRoleId ? user.customRoleId.toString() : ''}
                        onChange={(event) => handleUserRoleChange(event, user)}
                        className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        disabled={!customRoles.length || assigningUserId === user.id}
                      >
                        <option value="">No custom role</option>
                        {customRoles
                          .filter((role): role is RoleSummary & { dbId: number } => Boolean(role.dbId))
                          .map((role) => (
                            <option key={role.dbId} value={role.dbId.toString()}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-gray-500 text-sm">
                      {user.outlet_id ? `Outlet ${user.outlet_id}` : '—'}
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
          {!customRoles.length && (
            <p className="text-sm text-yellow-500 mt-4">
              Create a custom role to enable assignments.
            </p>
          )}
        </div>
      </div>

      {showRoleModal && roleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
              <button onClick={closeRoleModal} className="text-gray-400 hover:text-gray-200 text-sm">Close</button>
            </div>
            <form onSubmit={handleRoleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role Name</label>
                <input
                  value={roleForm.name}
                  onChange={(event) => setRoleForm((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                  className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Super Reviewer"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(event) => setRoleForm((prev) => prev ? { ...prev, description: event.target.value } : prev)}
                  className="w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Short description for the role"
                />
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-2">Module Permissions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {moduleNames.map((module) => (
                    <label key={module} className="flex items-center gap-2 rounded-lg border border-gray-800 bg-black px-3 py-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions[module] ?? false}
                        onChange={() => togglePermission(module)}
                        className="w-4 h-4"
                      />
                      <span>{module}</span>
                    </label>
                  ))}
                  {!moduleNames.length && <span className="text-sm text-gray-500">No modules available.</span>}
                </div>
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleActionLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {roleActionLoading ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
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
