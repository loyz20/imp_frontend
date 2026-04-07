import React, { useEffect, useState, useMemo } from 'react';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  apoteker: 'Apoteker',
  keuangan: 'Keuangan',
  gudang: 'Gudang',
  sales: 'Sales',
  user: 'User',
};

/* ── Main Page ── */
export default function UserManagement() {
  const {
    users, stats, pagination, isLoading, filters,
    fetchUsers, fetchStats, setFilters, deleteUser, changeStatus, changeRole,
  } = useUserStore();
  const currentUser = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters, fetchUsers, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingUser(null); setShowForm(true); };
  const openEdit = (user) => { setEditingUser(user); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingUser(null); };

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id || user._id === currentUser?.id) {
      toast.error('Tidak bisa mengubah status sendiri');
      return;
    }
    try {
      await changeStatus(user._id || user.id, !user.isActive);
      toast.success(`User berhasil di${user.isActive ? 'nonaktif' : 'aktif'}kan`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleChangeRole = async (user, role) => {
    if (user.id === currentUser?.id || user._id === currentUser?.id) {
      toast.error('Tidak bisa mengubah role sendiri');
      return;
    }
    try {
      await changeRole(user._id || user.id, role);
      toast.success('Role berhasil diubah');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah role');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm._id || deleteConfirm.id);
      toast.success('User berhasil dihapus');
      setDeleteConfirm(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const uid = (u) => u._id || u.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua pengguna sistem PBF.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah User
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total User', value: stats.total, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Aktif', value: stats.active, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Nonaktif', value: stats.inactive, color: 'from-rose-500 to-rose-600' },
            { label: 'Admin', value: (stats.byRole?.superadmin || 0) + (stats.byRole?.admin || 0), color: 'from-amber-500 to-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-sm font-bold">{s.value}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ role: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Role</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="apoteker">Apoteker</option>
            <option value="keuangan">Keuangan</option>
            <option value="gudang">Gudang</option>
            <option value="sales">Sales</option>
            <option value="user">User</option>
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ isActive: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ sort: e.target.value, page: filters.page })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="-createdAt">Terbaru</option>
            <option value="createdAt">Terlama</option>
            <option value="name">Nama A-Z</option>
            <option value="-name">Nama Z-A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">User</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Telepon</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Login Terakhir</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Memuat data...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada user ditemukan.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={uid(user)} className="hover:bg-gray-50/50 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{user.phone || '-'}</td>
                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user, e.target.value)}
                        disabled={uid(user) === currentUser?.id}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none transition ${
                          user.role === 'admin' || user.role === 'superadmin'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : user.role === 'apoteker'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        } disabled:opacity-50`}
                      >
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                        <option value="apoteker">Apoteker</option>
                        <option value="keuangan">Keuangan</option>
                        <option value="gudang">Gudang</option>
                        <option value="sales">Sales</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={uid(user) === currentUser?.id}
                        className="disabled:opacity-50"
                      >
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </button>
                    </td>
                    {/* Last login */}
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setShowDetail(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Detail"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          disabled={uid(user) === currentUser?.id}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="user"
        />
      </div>

      {/* Modals */}
      {showForm && <UserFormModal user={editingUser} onClose={closeForm} onSaved={() => { closeForm(); fetchUsers(); fetchStats(); }} />}
      {showDetail && <UserDetailModal user={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal user={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
    </div>
  );
}

/* ── User Form Modal (Create / Edit) ── */
function UserFormModal({ user, onClose, onSaved }) {
  const { createUser, updateUser } = useUserStore();
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    role: user?.role || 'user',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      province: user?.address?.province || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'Indonesia',
    },
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleAddress = (e) => setForm((p) => ({ ...p, address: { ...p.address, [e.target.name]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await updateUser(user._id || user.id, payload);
        toast.success('User berhasil diperbarui');
      } else {
        await createUser(payload);
        toast.success('User berhasil ditambahkan');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEdit ? '(kosongkan jika tidak diubah)' : '*'}</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required={!isEdit}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white">
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="apoteker">Apoteker</option>
                <option value="keuangan">Keuangan</option>
                <option value="gudang">Gudang</option>
                <option value="sales">Sales</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Alamat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <input type="text" name="street" value={form.address.street} onChange={handleAddress} placeholder="Jalan"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
              </div>
              <input type="text" name="city" value={form.address.city} onChange={handleAddress} placeholder="Kota"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
              <input type="text" name="province" value={form.address.province} onChange={handleAddress} placeholder="Provinsi"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
              <input type="text" name="postalCode" value={form.address.postalCode} onChange={handleAddress} placeholder="Kode Pos"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
              <input type="text" name="country" value={form.address.country} onChange={handleAddress} placeholder="Negara"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {loading ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── User Detail Modal ── */
function UserDetailModal({ user, onClose }) {
  const fields = [
    { label: 'Nama', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Telepon', value: user.phone || '-' },
    { label: 'Role', value: ROLE_LABELS[user.role] || user.role },
    { label: 'Status', value: user.isActive ? 'Aktif' : 'Nonaktif' },
    { label: 'Email Terverifikasi', value: user.isEmailVerified ? 'Ya' : 'Belum' },
    { label: 'Alamat', value: user.address ? [user.address.street, user.address.city, user.address.province, user.address.postalCode].filter(Boolean).join(', ') : '-' },
    { label: 'Login Terakhir', value: user.lastLoginAt ? formatDate(user.lastLoginAt) : '-' },
    { label: 'Dibuat', value: formatDate(user.createdAt) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Detail User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          {/* Fields */}
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{f.label}</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteConfirmModal({ user, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Hapus User?</h3>
        <p className="text-sm text-gray-500 mb-6">
          User <strong>{user.name}</strong> akan dinonaktifkan. Aksi ini tidak bisa dibatalkan.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
