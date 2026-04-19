/* eslint-disable react-hooks/static-components */
import React, { useEffect, useState, useMemo } from 'react';
import useSupplierStore from '../../store/supplierStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  Building2, Phone, MapPin, FileText, User,
  Loader2, ShieldCheck, Truck, CreditCard, Clock, CheckCircle, Ban,
} from 'lucide-react';

/* ── Constants ── */
const SUPPLIER_TYPES = [
  { value: 'pbf', label: 'PBF' },
  { value: 'dak', label: 'DAK' },
  { value: 'pbf_dak', label: 'PBF + DAK' },
  { value: 'industri', label: 'Industri' },
  { value: 'importir', label: 'Importir' },
  { value: 'distributor_alkes', label: 'Distributor Alkes' },
  { value: 'lainnya', label: 'Lainnya' },
];

const PAYMENT_TERM_OPTIONS = [
  { value: 0, label: 'COD (Cash on Delivery)' },
  { value: 7, label: 'Net 7 Hari' },
  { value: 14, label: 'Net 14 Hari' },
  { value: 30, label: 'Net 30 Hari' },
  { value: 45, label: 'Net 45 Hari' },
  { value: 60, label: 'Net 60 Hari' },
  { value: 90, label: 'Net 90 Hari' },
];

const TYPE_LABELS = Object.fromEntries(SUPPLIER_TYPES.map((t) => [t.value, t.label]));

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function SupplierManagement() {
  const {
    suppliers, stats, pagination, isLoading, filters,
    fetchSuppliers, fetchStats, setFilters, deleteSupplier, changeStatus,
  } = useSupplierStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, [filters, fetchSuppliers, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingSupplier(null); setShowForm(true); };
  const openEdit = (supplier) => { setEditingSupplier(supplier); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingSupplier(null); };

  const handleToggleStatus = async (supplier) => {
    try {
      await changeStatus(sid(supplier), !supplier.isActive);
      toast.success(`Supplier berhasil di${supplier.isActive ? 'nonaktif' : 'aktif'}kan`);
      fetchSuppliers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteSupplier(sid(deleteConfirm));
      toast.success('Supplier berhasil dihapus');
      setDeleteConfirm(null);
      fetchSuppliers();
      fetchStats();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error('Supplier memiliki transaksi aktif dan tidak bisa dihapus. Nonaktifkan saja.');
      } else {
        toast.error(err.response?.data?.message || 'Gagal menghapus supplier');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Supplier</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data supplier PBF, DAK, industri, importir, distributor alkes, dan lainnya.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Tambah Supplier
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Supplier', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: Truck },
            { label: 'Aktif', value: stats.active ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { label: 'Distributor', value: stats.distributor ?? 0, color: 'from-blue-500 to-blue-600', icon: Building2 },
            { label: 'Produsen', value: stats.produsen ?? 0, color: 'from-purple-500 to-purple-600', icon: ShieldCheck },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{s.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama supplier, kode, atau kontak..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ type: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Tipe</option>
            {SUPPLIER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Supplier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Tipe</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Kontak</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Kota</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">CDOB/CDAKB</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : safeSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada supplier ditemukan.</p>
                  </td>
                </tr>
              ) : (
                safeSuppliers.map((supplier) => (
                  <tr key={sid(supplier)} className="hover:bg-gray-50/50 transition-colors">
                    {/* Supplier info */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{supplier.name}</p>
                        {supplier.code && (
                          <p className="text-xs text-gray-400 truncate">Kode: {supplier.code}</p>
                        )}
                      </div>
                    </td>
                    {/* Tipe */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {TYPE_LABELS[supplier?.type] || supplier?.type || '-'}
                      </span>
                    </td>
                    {/* Kontak */}
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {supplier.contactPerson && (
                          <p className="text-xs flex items-center gap-1"><User size={12} className="text-gray-400" /> {supplier.contactPerson}</p>
                        )}
                        {supplier.phone && (
                          <p className="text-xs flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {supplier.phone}</p>
                        )}
                      </div>
                    </td>
                    {/* Kota */}
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                      {supplier.address?.city || '-'}
                    </td>
                    {/* CDOB/CDAKB */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      {(supplier.cdobCdakb?.number || supplier.cdobCdakbLicense?.number || supplier.cdobCertificate?.number) ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <ShieldCheck size={12} /> {supplier.cdobCdakb?.number || supplier.cdobCdakbLicense?.number || supplier.cdobCertificate?.number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => canCrud && handleToggleStatus(supplier)} disabled={!canCrud}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          supplier.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${supplier.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setShowDetail(supplier)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {canCrud && (
                          <button
                            onClick={() => openEdit(supplier)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <SquarePen size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirm(supplier)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
          label="supplier"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchSuppliers(); fetchStats(); }}
        />
      )}
      {showDetail && <SupplierDetailModal supplier={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal supplier={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
    </div>
  );
}

/* ═══════════════════════════════════════
   SUPPLIER FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function SupplierFormModal({ supplier, onClose, onSaved }) {
  const { createSupplier, updateSupplier } = useSupplierStore();
  const { dateFormat = 'DD/MM/YYYY' } = useSettings();
  const isEdit = !!supplier;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [form, setForm] = useState({
    // Identitas
    name: supplier?.name || '',
    type: supplier?.type || 'pbf',
    // Kontak
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    // Alamat
    address: {
      street: supplier?.address?.street || '',
      city: supplier?.address?.city || '',
      province: supplier?.address?.province || '',
    },
    // Perizinan
    izinSarana: {
      number: supplier?.izinSarana?.number || supplier?.facilityLicense?.number || supplier?.pbfLicense?.number || '',
      expiryDate: supplier?.izinSarana?.expiryDate
        ? supplier.izinSarana.expiryDate.slice(0, 10)
        : (supplier?.facilityLicense?.expiryDate
          ? supplier.facilityLicense.expiryDate.slice(0, 10)
          : (supplier?.pbfLicense?.expiryDate ? supplier.pbfLicense.expiryDate.slice(0, 10) : '')),
    },
    cdobCdakb: {
      number: supplier?.cdobCdakb?.number || supplier?.cdobCdakbLicense?.number || supplier?.cdobCertificate?.number || '',
      expiryDate: supplier?.cdobCdakb?.expiryDate
        ? supplier.cdobCdakb.expiryDate.slice(0, 10)
        : (supplier?.cdobCdakbLicense?.expiryDate
          ? supplier.cdobCdakbLicense.expiryDate.slice(0, 10)
          : (supplier?.cdobCertificate?.expiryDate ? supplier.cdobCertificate.expiryDate.slice(0, 10) : '')),
    },
    sipSik: {
      number: supplier?.sipSik?.number || supplier?.sipSikLicense?.number || '',
      expiryDate: supplier?.sipSik?.expiryDate
        ? supplier.sipSik.expiryDate.slice(0, 10)
        : (supplier?.sipSikLicense?.expiryDate ? supplier.sipSikLicense.expiryDate.slice(0, 10) : ''),
    },
    // Pembayaran
    paymentTermDays: supplier?.paymentTermDays ?? 30,
    bankAccount: {
      bankName: supplier?.bankAccount?.bankName || '',
      accountNumber: supplier?.bankAccount?.accountNumber || '',
      accountName: supplier?.bankAccount?.accountName || '',
    },
    // Lainnya
    npwp: supplier?.npwp || '',
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  });

  const [dateDrafts, setDateDrafts] = useState({
    izinSaranaExpiry: formatDateInputByFormat(
      supplier?.izinSarana?.expiryDate || supplier?.facilityLicense?.expiryDate || supplier?.pbfLicense?.expiryDate || '',
      dateFormat,
    ),
    cdobCdakbExpiry: formatDateInputByFormat(
      supplier?.cdobCdakb?.expiryDate || supplier?.cdobCdakbLicense?.expiryDate || supplier?.cdobCertificate?.expiryDate || '',
      dateFormat,
    ),
    sipSikExpiry: formatDateInputByFormat(
      supplier?.sipSik?.expiryDate || supplier?.sipSikLicense?.expiryDate || '',
      dateFormat,
    ),
  });

  useEffect(() => {
    setDateDrafts({
      izinSaranaExpiry: formatDateInputByFormat(form.izinSarana.expiryDate, dateFormat),
      cdobCdakbExpiry: formatDateInputByFormat(form.cdobCdakb.expiryDate, dateFormat),
      sipSikExpiry: formatDateInputByFormat(form.sipSik.expiryDate, dateFormat),
    });
  }, [form.izinSarana.expiryDate, form.cdobCdakb.expiryDate, form.sipSik.expiryDate, dateFormat]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setForm((p) => ({
      ...p,
      [parent]: { ...p[parent], [field]: value },
    }));
  };

  const handleDateDraftChange = (key, value) => {
    setDateDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const commitDateDraft = (key, parent, field) => {
    const rawValue = dateDrafts[key] ?? '';
    if (!rawValue.trim()) {
      handleNestedChange(parent, field, '');
      return;
    }

    const isoValue = parseDateInputByFormat(rawValue, dateFormat);
    if (!isoValue) {
      toast.error(`Format tanggal harus ${dateFormat}`);
      setDateDrafts((prev) => ({
        ...prev,
        [key]: formatDateInputByFormat(form[parent]?.[field], dateFormat),
      }));
      return;
    }

    handleNestedChange(parent, field, isoValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nama supplier wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const toOptionalText = (value) => {
        const text = typeof value === 'string' ? value.trim() : value;
        return text ? text : null;
      };
      const toLicense = (license) => ({
        number: toOptionalText(license?.number),
        expiryDate: license?.expiryDate || null,
      });

      const payload = {
        name: form.name.trim(),
        type: form.type,
        contactPerson: toOptionalText(form.contactPerson),
        phone: toOptionalText(form.phone),
        address: {
          street: toOptionalText(form.address?.street),
          city: toOptionalText(form.address?.city),
          province: toOptionalText(form.address?.province),
        },
        izinSarana: toLicense(form.izinSarana),
        cdobCdakb: toLicense(form.cdobCdakb),
        sipSik: toLicense(form.sipSik),
        paymentTermDays: Number(form.paymentTermDays ?? 30),
        bankAccount: {
          bankName: toOptionalText(form.bankAccount?.bankName),
          accountNumber: toOptionalText(form.bankAccount?.accountNumber),
          accountName: toOptionalText(form.bankAccount?.accountName),
        },
        npwp: toOptionalText(form.npwp),
        notes: toOptionalText(form.notes),
        isActive: !!form.isActive,
      };

      if (isEdit) {
        await updateSupplier(sid(supplier), payload);
        toast.success('Supplier berhasil diperbarui');
      } else {
        await createSupplier(payload);
        toast.success('Supplier berhasil ditambahkan');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} supplier`);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { label: 'Identitas', icon: Building2 },
    { label: 'Kontak & Alamat', icon: MapPin },
    { label: 'Perizinan', icon: ShieldCheck },
    { label: 'Pembayaran', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Supplier' : 'Tambah Supplier Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === i
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Tab 0: Identitas */}
          {activeTab === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Supplier *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="PT. Pharma Distributor Indonesia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Supplier</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                  >
                    {SUPPLIER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NPWP</label>
                  <input
                    name="npwp"
                    value={form.npwp}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="XX.XXX.XXX.X-XXX.XXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                  placeholder="Catatan tambahan tentang supplier..."
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition duration-200 ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-gray-700">Supplier Aktif</span>
              </div>
            </div>
          )}

          {/* Tab 1: Kontak & Alamat */}
          {activeTab === 1 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-gray-800">Informasi Kontak</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Kontak</label>
                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="Nama PIC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="021-xxxxxxxx"
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 pt-3">Alamat</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jalan</label>
                  <input
                    value={form.address.street}
                    onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="Jl. Industri No. 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kota</label>
                  <input
                    value={form.address.city}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
                  <input
                    value={form.address.province}
                    onChange={(e) => handleNestedChange('address', 'province', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Perizinan */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Izin Sarana
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Izin Sarana</label>
                    <input
                      value={form.izinSarana.number}
                      onChange={(e) => handleNestedChange('izinSarana', 'number', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="IS-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Expired</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dateDrafts.izinSaranaExpiry}
                      onChange={(e) => handleDateDraftChange('izinSaranaExpiry', e.target.value)}
                      onBlur={() => commitDateDraft('izinSaranaExpiry', 'izinSarana', 'expiryDate')}
                      placeholder={dateFormat}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Nomor CDOB/CDAKB
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor CDOB/CDAKB</label>
                    <input
                      value={form.cdobCdakb.number}
                      onChange={(e) => handleNestedChange('cdobCdakb', 'number', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="CDOB/CDAKB-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Expired</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dateDrafts.cdobCdakbExpiry}
                      onChange={(e) => handleDateDraftChange('cdobCdakbExpiry', e.target.value)}
                      onBlur={() => commitDateDraft('cdobCdakbExpiry', 'cdobCdakb', 'expiryDate')}
                      placeholder={dateFormat}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  Nomor SIP/SIK
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor SIP/SIK</label>
                    <input
                      value={form.sipSik.number}
                      onChange={(e) => handleNestedChange('sipSik', 'number', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="SIP/SIK-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Expired</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dateDrafts.sipSikExpiry}
                      onChange={(e) => handleDateDraftChange('sipSikExpiry', e.target.value)}
                      onBlur={() => commitDateDraft('sipSikExpiry', 'sipSik', 'expiryDate')}
                      placeholder={dateFormat}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Regulasi Perizinan</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Pastikan Izin Sarana, Nomor CDOB/CDAKB, dan Nomor SIP/SIK selalu valid.
                      Sistem akan memberikan peringatan jika dokumen mendekati masa expired.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Pembayaran */}
          {activeTab === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Pembayaran</label>
                <select
                  name="paymentTermDays"
                  value={form.paymentTermDays}
                  onChange={(e) => setForm((p) => ({ ...p, paymentTermDays: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                >
                  {PAYMENT_TERM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 pt-2">Rekening Bank</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Bank</label>
                  <input
                    value={form.bankAccount.bankName}
                    onChange={(e) => handleNestedChange('bankAccount', 'bankName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="BCA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Rekening</label>
                  <input
                    value={form.bankAccount.accountNumber}
                    onChange={(e) => handleNestedChange('bankAccount', 'accountNumber', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="1234567890"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Atas Nama</label>
                  <input
                    value={form.bankAccount.accountName}
                    onChange={(e) => handleNestedChange('bankAccount', 'accountName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="PT. Pharma Distributor"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {activeTab > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab - 1)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Sebelumnya
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            {activeTab < TABS.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab + 1)}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Menyimpan...</span>
                ) : (
                  <span className="flex items-center gap-2"><Check size={14} /> {isEdit ? 'Perbarui' : 'Simpan'}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SUPPLIER DETAIL MODAL
   ═══════════════════════════════════════ */
function SupplierDetailModal({ supplier, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const TABS = ['Umum', 'Kontak', 'Perizinan', 'Pembayaran'];
  const izinSarana = supplier.izinSarana || supplier.facilityLicense || supplier.pbfLicense;
  const cdobCdakb = supplier.cdobCdakb || supplier.cdobCdakbLicense || supplier.cdobCertificate;
  const sipSik = supplier.sipSik || supplier.sipSikLicense;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isExpiringSoon = (dateStr, days = 30) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= days;
  };

  const LicenseStatus = ({ date }) => {
    if (!date) return <span className="text-xs text-gray-400">Belum diisi</span>;
    if (isExpired(date)) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><Ban size={12} /> Expired</span>;
    if (isExpiringSoon(date)) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Clock size={12} /> Segera Expired</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle size={12} /> Aktif</span>;
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {Icon && <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Truck size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{supplier.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {supplier.code && <span className="text-xs text-gray-400">Kode: {supplier.code}</span>}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    supplier.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${supplier.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === i
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 0 && (
            <div className="space-y-1">
              <InfoRow label="Nama Supplier" value={supplier.name} icon={Building2} />
              <InfoRow label="Kode" value={supplier.code} icon={FileText} />
              <InfoRow label="Tipe" value={TYPE_LABELS[supplier?.type] || supplier?.type || '-'} icon={Truck} />
              <InfoRow label="NPWP" value={supplier.npwp} icon={FileText} />
              <InfoRow label="Catatan" value={supplier.notes} icon={FileText} />
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Kontak</h3>
                <div className="space-y-1">
                  <InfoRow label="Nama Kontak" value={supplier.contactPerson} icon={User} />
                  <InfoRow label="Telepon" value={supplier.phone} icon={Phone} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Alamat</h3>
                <div className="space-y-1">
                  <InfoRow label="Jalan" value={supplier.address?.street} icon={MapPin} />
                  <InfoRow label="Kota" value={supplier.address?.city} />
                  <InfoRow label="Provinsi" value={supplier.address?.province} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Izin Sarana
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Nomor Izin Sarana</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{izinSarana?.number || '-'}</p>
                    </div>
                    <LicenseStatus date={izinSarana?.expiryDate} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tanggal Expired</p>
                    <p className={`text-sm font-medium mt-0.5 ${isExpired(izinSarana?.expiryDate) ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatDate(izinSarana?.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Nomor CDOB/CDAKB
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Nomor CDOB/CDAKB</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{cdobCdakb?.number || '-'}</p>
                    </div>
                    <LicenseStatus date={cdobCdakb?.expiryDate} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tanggal Expired</p>
                    <p className={`text-sm font-medium mt-0.5 ${isExpired(cdobCdakb?.expiryDate) ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatDate(cdobCdakb?.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  Nomor SIP/SIK
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Nomor SIP/SIK</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{sipSik?.number || '-'}</p>
                    </div>
                    <LicenseStatus date={sipSik?.expiryDate} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tanggal Expired</p>
                    <p className={`text-sm font-medium mt-0.5 ${isExpired(sipSik?.expiryDate) ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatDate(sipSik?.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400">Term Pembayaran</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {supplier.paymentTermDays === 0 ? 'COD' : `Net ${supplier.paymentTermDays} Hari`}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Rekening Bank</h3>
                <div className="space-y-1">
                  <InfoRow label="Nama Bank" value={supplier.bankAccount?.bankName} icon={CreditCard} />
                  <InfoRow label="No. Rekening" value={supplier.bankAccount?.accountNumber} />
                  <InfoRow label="Atas Nama" value={supplier.bankAccount?.accountName} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ supplier, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Hapus Supplier?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Anda yakin ingin menghapus <strong>{supplier.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex items-center gap-3 mt-6 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Menghapus...</span>
              ) : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function sid(obj) {
  return obj?.id || obj?._id || obj;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function formatDateInputByFormat(isoDate, format) {
  if (!isoDate) return '';
  const [year, month, day] = String(isoDate).split('-');
  if (!year || !month || !day) return '';
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

function parseDateInputByFormat(input, format) {
  const value = String(input || '').trim();
  if (!value) return '';

  if (format === 'YYYY-MM-DD') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  }

  const parts = value.split('/').map((p) => p.trim());
  if (parts.length !== 3) return '';
  const [a, b, c] = parts;
  if (!/^\d{1,2}$/.test(a) || !/^\d{1,2}$/.test(b) || !/^\d{4}$/.test(c)) return '';

  const day = format === 'MM/DD/YYYY' ? b.padStart(2, '0') : a.padStart(2, '0');
  const month = format === 'MM/DD/YYYY' ? a.padStart(2, '0') : b.padStart(2, '0');
  const year = c;

  const d = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  if (d.getFullYear() !== Number(year) || d.getMonth() + 1 !== Number(month) || d.getDate() !== Number(day)) return '';

  return `${year}-${month}-${day}`;
}
