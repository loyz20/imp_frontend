import React, { useEffect, useState, useMemo } from 'react';
import useProductStore from '../../store/productStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  Download, Upload, Plus, Eye, SquarePen, Trash2, X, Check, AlertCircle,
  Hash, QrCode, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck,
  FileText, FlaskConical, SlidersHorizontal, Pencil,
  Package, ArrowRight, AlertTriangle, Ban, CheckCircle, CircleAlert,
  Loader2, PlusCircle, RefreshCw, Info,
} from 'lucide-react';

/* ── Constants ── */
const KATEGORI_OPTIONS = [
  { value: 'obat', label: 'Obat' },
  { value: 'alat_kesehatan', label: 'Alkes' },
];

const GOLONGAN_BY_CATEGORY = {
  obat: [
    { value: 'prekursor', label: 'Prekursor', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'obat_tertentu', label: 'Obat Tertentu', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'obat_keras', label: 'Obat Keras', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'obat_bebas_terbatas', label: 'Obat Bebas Terbatas', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'obat_bebas', label: 'Obat Bebas', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { value: 'suplemen', label: 'Suplemen', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    { value: 'obat_tradisional', label: 'Obat Tradisional', color: 'bg-lime-100 text-lime-800 border-lime-200' },
    { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ],
  alat_kesehatan: [
    { value: 'elektromedik_non_radiasi', label: 'Elektromedik Non Radiasi', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'non_elektromedik_non_steril', label: 'Non Elektromedik Non Steril', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    { value: 'non_elektromedik_steril', label: 'Non Elektromedik Steril', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { value: 'diagnostik_invitro', label: 'Diagnostik Invitro', color: 'bg-violet-100 text-violet-800 border-violet-200' },
    { value: 'bmhp', label: 'BMHP', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
    { value: 'pkrt', label: 'PKRT', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ],
};

const GOLONGAN_OPTIONS = Object.values(GOLONGAN_BY_CATEGORY)
  .flat()
  .filter((item, index, arr) => arr.findIndex((it) => it.value === item.value) === index);

const BENTUK_SEDIAAN = [
  'Tablet', 'Kaplet', 'Kapsul', 'Sirup', 'Suspensi', 'Emulsi', 'Drops', 'Injeksi',
  'Salep', 'Krim', 'Gel', 'Suppositoria', 'Ovula', 'Inhaler', 'Patch', 'Infus',
  'Serbuk', 'Granul', 'Larutan', 'Tetes Mata', 'Tetes Telinga', 'Spray',
  'Alat Kesehatan', 'Lainnya',
];

const SATUAN_OPTIONS = [
  'Box', 'Botol', 'Tube', 'Strip', 'Blister', 'Ampul', 'Vial', 'Sachet',
  'Pcs', 'Pack', 'Rol', 'Lembar', 'Set', 'Kg', 'Gram', 'Liter', 'mL',
];

const KATEGORI_LABELS = {
  ...Object.fromEntries(KATEGORI_OPTIONS.map((k) => [k.value, k.label])),
  alat_kesehatan: 'Alkes',
};
const GOLONGAN_MAP = Object.fromEntries(GOLONGAN_OPTIONS.map((g) => [g.value, g]));

function normalizeProductCategory(category) {
  if (category === 'alkes') return 'alat_kesehatan';
  return category || 'obat';
}

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'apoteker'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];
const CAN_IMPORT_ROLES = ['superadmin', 'admin'];

/* ── Main Page ── */
export default function ProductManagement() {
  const {
    products, stats, pagination, isLoading, filters,
    fetchProducts, fetchStats, setFilters, deleteProduct, changeStatus,
    exportProducts, exportLoading,
  } = useProductStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);
  const canImport = CAN_IMPORT_ROLES.includes(userRole);
  const safeProducts = Array.isArray(products) ? products : [];

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [filters, fetchProducts, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingProduct(null); setShowForm(true); };
  const openEdit = (product) => { setEditingProduct(product); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProduct(null); };

  const handleToggleStatus = async (product) => {
    try {
      await changeStatus(product._id || product.id, !product.isActive);
      toast.success(`Produk berhasil di${product.isActive ? 'nonaktif' : 'aktif'}kan`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm._id || deleteConfirm.id);
      toast.success('Produk berhasil dihapus');
      setDeleteConfirm(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error('Produk memiliki transaksi aktif dan tidak bisa dihapus. Nonaktifkan saja.');
      } else {
        toast.error(err.response?.data?.message || 'Gagal menghapus produk');
      }
    }
  };

  const handleExport = async () => {
    try {
      await exportProducts({
        category: filters.category || undefined,
        golongan: filters.golongan || undefined,
        isActive: filters.isActive || undefined,
        format: 'xlsx',
      });
      toast.success('Data produk berhasil diekspor');
    } catch {
      toast.error('Gagal mengekspor data produk');
    }
  };

  const pid = (p) => p._id || p.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data obat, alkes, dan produk farmasi sesuai regulasi BPOM & CDOB.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            {exportLoading ? 'Mengekspor...' : 'Export'}
          </button>
          {canImport && (
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} />
              Import
            </button>
          )}
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Aktif', value: stats.active ?? 0, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Stok Rendah', value: stats.lowStock ?? 0, color: 'from-amber-500 to-amber-600' },
            { label: 'Mendekati Kedaluwarsa', value: stats.nearExpiry ?? 0, color: 'from-rose-500 to-rose-600' },
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
              placeholder="Cari nama produk, kode produk, atau No. Registrasi..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <select
            value={filters.golongan}
            onChange={(e) => setFilters({ golongan: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Golongan</option>
            {GOLONGAN_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
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
            <option value="sku">Kode Produk A-Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Produk</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Golongan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Sediaan</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Memuat data...</td></tr>
              ) : safeProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada produk ditemukan.</td></tr>
              ) : (
                safeProducts.map((product) => {
                  const gol = GOLONGAN_MAP[product.golongan];
                  return (
                    <tr key={pid(product)} className="hover:bg-gray-50/50 transition-colors">
                      {/* Product info */}
                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {product.sku && <span className="mr-2">Kode: {product.sku}</span>}
                            {product.nie && <span>NIE: {product.nie}</span>}
                          </p>
                          {product.manufacturer && (
                            <p className="text-xs text-gray-400 truncate">{product.manufacturer}</p>
                          )}
                        </div>
                      </td>
                      {/* Kategori */}
                      <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">
                        {KATEGORI_LABELS[product.category] || product.category || '-'}
                      </td>
                      {/* Golongan */}
                      <td className="px-5 py-3.5">
                        {gol ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${gol.color}`}>
                            {gol.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {/* Sediaan */}
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        <div>
                          <p>{product.bentukSediaan || '-'}</p>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => canCrud && handleToggleStatus(product)} disabled={!canCrud}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            {product.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetail(product)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canCrud && (
                            <button
                              onClick={() => openEdit(product)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <SquarePen size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirm(product)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

                {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="produk"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchProducts(); fetchStats(); }}
        />
      )}
      {showDetail && <ProductDetailModal product={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal product={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); fetchProducts(); fetchStats(); }} />}
    </div>
  );
}
/* ── Product Form Modal (Create / Edit) ── */
function ProductFormModal({ product, onClose, onSaved }) {
  const { createProduct, updateProduct } = useProductStore();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    // Informasi Umum
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: normalizeProductCategory(product?.category),
    golongan: product?.golongan || '',
    // Regulasi
    nie: product?.nie || '',
    noBpom: product?.noBpom || '',
    // Farmasi
    bentukSediaan: product?.bentukSediaan || '',
    zatAktif: product?.zatAktif || '',
    satuan: product?.satuan || 'Box',
    satuanKecil: product?.satuanKecil || '',
    isiPerSatuan: product?.isiPerSatuan || '',
    ppn: product?.ppn ?? true,
    // Stok & Gudang
    stokMinimum: product?.stokMinimum || '',
    // Produsen
    manufacturer: product?.manufacturer || '',
    // Lainnya
    keterangan: product?.keterangan || '',
    isActive: product?.isActive ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => {
      const nextValue = type === 'checkbox' ? checked : value;
      if (name === 'category') {
        const nextGolonganOptions = GOLONGAN_BY_CATEGORY[nextValue] || [];
        const hasCurrentGolongan = nextGolonganOptions.some((g) => g.value === p.golongan);
        return {
          ...p,
          category: nextValue,
          golongan: hasCurrentGolongan ? p.golongan : '',
        };
      }
      if (name === 'sku') {
        return { ...p, sku: String(nextValue).toUpperCase() };
      }
      return { ...p, [name]: nextValue };
    });
    if (validationErrors[name]) {
      setValidationErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Nama produk minimal 2 karakter';
    if (form.name && form.name.trim().length > 200) errs.name = 'Nama produk maksimal 200 karakter';
    const validGolongan = (GOLONGAN_BY_CATEGORY[form.category] || []).some((g) => g.value === form.golongan);
    if (!validGolongan) errs.golongan = 'Golongan wajib sesuai kategori produk';
    if (form.category === 'obat' && !form.nie) errs.nie = 'NIE wajib diisi untuk kategori Obat';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);

      const tabByField = {
        name: 0,
        sku: 0,
        category: 0,
        golongan: 0,
        nie: 1,
        noBpom: 1,
        bentukSediaan: 1,
        zatAktif: 1,
        satuan: 2,
        satuanKecil: 2,
        isiPerSatuan: 2,
        stokMinimum: 2,
        ppn: 2,
        keterangan: 3,
        isActive: 3,
      };
      const firstErrorKey = Object.keys(errs)[0];
      setActiveTab(tabByField[firstErrorKey] ?? 0);
      toast.error(errs[firstErrorKey] || 'Periksa kembali form, terdapat kesalahan');
      return;
    }
    setLoading(true);
    try {
      const payload = {};
      for (const [key, val] of Object.entries(form)) {
        if (val !== '' && val !== null && val !== undefined) payload[key] = val;
      }
      if (payload.stokMinimum) payload.stokMinimum = Number(payload.stokMinimum);
      if (payload.isiPerSatuan) payload.isiPerSatuan = Number(payload.isiPerSatuan);

      if (isEdit) {
        await updateProduct(product._id || product.id, payload);
        toast.success('Produk berhasil diperbarui');
      } else {
        await createProduct(payload);
        toast.success('Produk berhasil ditambahkan');
      }
      onSaved();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Gagal menyimpan produk';
      if (status === 409) {
        toast.error(`Duplikat: ${msg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Umum', icon: <Package size={16} /> },
    { label: 'Farmasi', icon: <FlaskConical size={16} /> },
    { label: 'Satuan', icon: <SlidersHorizontal size={16} /> },
    { label: 'Lainnya', icon: <SlidersHorizontal size={16} /> },
  ];

  // eslint-disable-next-line no-unused-vars
  const fmtRp = (v) => v ? `Rp ${Number(v).toLocaleString('id-ID')}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Gradient Header ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div className={`px-6 py-5 ${isEdit ? 'bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600' : 'bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isEdit ? (
                  <Pencil size={20} className="text-white" />
                ) : (
                  <Plus size={20} className="text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <p className="text-xs text-white/70">{isEdit ? `Mengedit: ${product?.name}` : 'Isi informasi produk lengkap di bawah'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step Indicator ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
          <div className="flex items-center mt-5 gap-1">
            {steps.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center relative group cursor-pointer" onClick={() => setActiveTab(i)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < activeTab ? 'bg-white text-emerald-600' : i === activeTab ? 'bg-white text-emerald-600 ring-4 ring-white/30 scale-110' : 'bg-white/20 text-white/70'}`}>
                  {i < activeTab ? (
                    <Check size={16} strokeWidth={3} />
                  ) : s.icon}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${i <= activeTab ? 'text-white' : 'text-white/50'}`}>{s.label}</span>
                {i < steps.length - 1 && (
                  <div className={`absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 ${i < activeTab ? 'bg-white/80' : 'bg-white/20'} transition-colors`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Form Body (scrollable) ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto" id="product-form">
          <div className="p-6 space-y-5">

            {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 1: Informasi Umum ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
            {activeTab === 0 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Nama Produk - Hero field */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Produk <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    placeholder="Contoh: Amoxicillin 500mg Kapsul"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${validationErrors.name ? 'border-red-400 bg-red-50 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`} />
                  {validationErrors.name && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Kode Produk & Barcode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                      <Hash size={14} className="text-gray-400" />
                      Kode Produk
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={form.sku}
                      readOnly
                      placeholder={form.category === 'obat' ? 'Auto: F0001' : 'Auto: A0001'}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Dibuat otomatis oleh backend saat produk disimpan.
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                      <QrCode size={14} className="text-gray-400" />
                      Barcode
                    </label>
                    <input type="text" name="barcode" value={form.barcode} onChange={handleChange}
                      placeholder="Scan atau input manual"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                  </div>
                </div>

                {/* Kategori & Golongan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                      Kategori <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select name="category" value={form.category} onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white appearance-none pr-10">
                        {KATEGORI_OPTIONS.map((k) => (
                          <option key={k.value} value={k.value}>{k.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                      Golongan <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select name="golongan" value={form.golongan} onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-xl border hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white appearance-none pr-10 ${validationErrors.golongan ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                        <option value="">-- Pilih Golongan --</option>
                        {(GOLONGAN_BY_CATEGORY[form.category] || []).map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    {form.golongan && GOLONGAN_MAP[form.golongan] && (
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          GOLONGAN_MAP[form.golongan].color
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {GOLONGAN_MAP[form.golongan].label}
                        </span>
                      </div>
                    )}
                    {validationErrors.golongan && (
                      <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        {validationErrors.golongan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Produsen */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produsen</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Pabrik / Manufaktur</label>
                      <input type="text" name="manufacturer" value={form.manufacturer} onChange={handleChange}
                        placeholder="PT Sanbe Farma"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 2: Farmasi & Regulasi ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
            {activeTab === 1 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Registration cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-xl border p-4 ${validationErrors.nie ? 'border-red-300 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${validationErrors.nie ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <ShieldCheck size={16} className={validationErrors.nie ? 'text-red-600' : 'text-emerald-600'} />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">NIE</label>
                    </div>
                    <input type="text" name="nie" value={form.nie} onChange={handleChange}
                      placeholder="DKL1234567890A1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${validationErrors.nie ? 'border-red-300 focus:ring-red-200 focus:ring-2' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'} bg-white`} />
                    {validationErrors.nie && (
                      <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        {validationErrors.nie}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">No. BPOM</label>
                    </div>
                    <input type="text" name="noBpom" value={form.noBpom} onChange={handleChange}
                      placeholder="Nomor registrasi BPOM"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white" />
                  </div>
                </div>

                {/* Pharmaceutical details */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <FlaskConical size={14} />
                    Detail Farmasi
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Bentuk Sediaan</label>
                      <div className="relative">
                        <select name="bentukSediaan" value={form.bentukSediaan} onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white appearance-none pr-10">
                          <option value="">-- Pilih --</option>
                          {BENTUK_SEDIAAN.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Zat Aktif / Komposisi</label>
                    <textarea name="zatAktif" value={form.zatAktif} onChange={handleChange} rows={2}
                      placeholder="Amoxicillin trihydrate setara Amoxicillin 500mg"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Satuan & Stok ── */}
            {activeTab === 2 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Unit Conversion Visual */}
                <div className="bg-linear-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Konversi Satuan</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Satuan Besar</label>
                      <div className="relative">
                        <select name="satuan" value={form.satuan} onChange={handleChange}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white appearance-none pr-8">
                          {SATUAN_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center pt-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 text-xs font-bold">×{form.isiPerSatuan || 'N'}</span>
                      </div>
                      <ArrowRight size={16} className="text-gray-400 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Satuan Kecil</label>
                      <input type="text" name="satuanKecil" value={form.satuanKecil} onChange={handleChange}
                        placeholder="Tablet, Kapsul"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 mb-1 block">Isi Per Satuan</label>
                    <input type="number" name="isiPerSatuan" value={form.isiPerSatuan} onChange={handleChange}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                    {form.isiPerSatuan && form.satuan && form.satuanKecil && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        1 {form.satuan} = {form.isiPerSatuan} {form.satuanKecil}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stok & PPN */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Stok Minimum</label>
                    <input type="number" name="stokMinimum" value={form.stokMinimum} onChange={handleChange}
                      placeholder="Peringatan jika stok rendah"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="relative inline-flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="ppn" checked={form.ppn} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">PPN 11%</span>
                        <p className="text-[10px] text-gray-400">Produk kena pajak</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Lainnya ── */}
            {activeTab === 3 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Status toggle */}
                <div className={`rounded-xl border p-4 ${form.isActive ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.isActive ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                        {form.isActive ? (
                          <CheckCircle size={20} className="text-emerald-600" />
                        ) : (
                          <Ban size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Status Produk</p>
                        <p className="text-xs text-gray-500">{form.isActive ? 'Aktif - dapat ditransaksikan' : 'Nonaktif - tidak muncul di transaksi'}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Keterangan / Catatan</label>
                  <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={4}
                    placeholder="Informasi tambahan mengenai produk ini..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none" />
                </div>

                {/* Regulatory Warnings */}
                {(form.golongan === 'prekursor' || form.golongan === 'obat_tertentu' || form.golongan === 'obat_keras') && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Perhatian Regulasi</p>
                      <p className="text-xs text-amber-600 mt-0.5">Untuk golongan ini, pastikan distribusi dan dokumentasi mengikuti ketentuan regulasi yang berlaku.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sticky Footer ──ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between">
          <button type="button"
            onClick={() => activeTab > 0 ? setActiveTab(activeTab - 1) : onClose()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} />
            {activeTab > 0 ? 'Sebelumnya' : 'Batal'}
          </button>
          <div className="flex items-center gap-3">
            {activeTab < 3 ? (
              <button type="button" onClick={() => setActiveTab(activeTab + 1)}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                Lanjut
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" form="product-form" disabled={loading}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors ${isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {isEdit ? 'Perbarui' : 'Simpan'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Product Detail Modal Ã¢â€â‚¬Ã¢â€â‚¬ */
function ProductDetailModal({ product, onClose }) {
  const [activeTab, setActiveTab] = useState('umum');
  const gol = GOLONGAN_MAP[product.golongan];
  const stockSummary = product.stockSummary;

  const tabs = [
    { key: 'umum', label: 'Umum', icon: (
      <Package size={16} />
    )},
    { key: 'farmasi', label: 'Farmasi', icon: (
      <FlaskConical size={16} />
    )},
    { key: 'harga', label: 'Satuan & Stok', icon: (
      <SlidersHorizontal size={16} />
    )},
    { key: 'info', label: 'Info', icon: (
      <Info size={16} />
    )},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Hero Header ── */}
        <div className="relative bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-700 px-6 pt-5 pb-6 text-white shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>

          {/* Category pill */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-sm text-white/90 mb-2.5 tracking-wide uppercase">
            {KATEGORI_LABELS[product.category] || product.category}
          </span>

          <h2 className="text-xl font-bold leading-tight pr-10 mb-2">{product.name}</h2>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {product.sku && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 font-mono text-xs">
                <QrCode size={14} className="opacity-70" />
                {product.sku}
              </span>
            )}
            {gol && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${gol.color}`}>
                {gol.label}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${product.isActive ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-300' : 'bg-red-400'}`} />
              {product.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>

        {/* ── Stock Summary Cards ── */}
        {stockSummary && (
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100 bg-gray-50/60 shrink-0">
            <div className="px-4 py-3 text-center border-r border-gray-100">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Stok</p>
              <p className="text-lg font-bold text-gray-900">{stockSummary.totalStock ?? 0}</p>
            </div>
            <div className="px-4 py-3 text-center border-r border-gray-100">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Batch</p>
              <p className="text-lg font-bold text-gray-900">{stockSummary.totalBatches ?? 0}</p>
            </div>
            <div className="px-4 py-3 text-center border-r border-gray-100">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">ED Terdekat</p>
              <p className="text-sm font-bold text-amber-600">
                {stockSummary.nearestExpiry ? new Date(stockSummary.nearestExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Expired</p>
              <p className={`text-lg font-bold ${(stockSummary.expiredBatches ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stockSummary.expiredBatches ?? 0}</p>
            </div>
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div className="flex border-b border-gray-100 bg-white px-2 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors relative ${
                activeTab === t.key
                  ? 'text-emerald-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon}
              {t.label}
              {activeTab === t.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Tab: Umum */}
          {activeTab === 'umum' && (
            <div className="space-y-5">
              {/* 2-col grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Nama Produk" value={product.name} span={2} />
                <DetailField label="Kode Produk" value={product.sku} mono />
                <DetailField label="Barcode" value={product.barcode} mono />
                <DetailField label="Kategori" value={KATEGORI_LABELS[product.category] || product.category} />
                <DetailField label="Golongan" badge={gol} />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Produsen</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailField label="Pabrik / Manufacturer" value={product.manufacturer} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Farmasi */}
          {activeTab === 'farmasi' && (
            <div className="space-y-5">
              {/* Regulatory cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">No. Izin Edar (NIE)</p>
                  <p className={`text-sm font-semibold ${product.nie ? 'text-gray-900 font-mono' : 'text-gray-300'}`}>{product.nie || 'Belum diisi'}</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">No. BPOM</p>
                  <p className={`text-sm font-semibold ${product.noBpom ? 'text-gray-900 font-mono' : 'text-gray-300'}`}>{product.noBpom || 'Belum diisi'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Bentuk Sediaan" value={product.bentukSediaan} />
              </div>

              {product.zatAktif && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Zat Aktif / Komposisi</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">{product.zatAktif}</p>
                </div>
              )}

              {/* Regulatory warnings */}
              {(product.golongan === 'prekursor' || product.golongan === 'obat_tertentu' || product.golongan === 'obat_keras') && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CircleAlert size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Perhatian Regulasi</p>
                    <p className="text-xs text-amber-600 leading-relaxed">Pastikan distribusi mengikuti ketentuan izin fasilitas dan regulasi yang berlaku.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Harga & Stok */}
          {activeTab === 'harga' && (
            <div className="space-y-5">
              {/* Unit info */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Satuan & Konversi</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
                    <p className="text-[11px] text-gray-400 mb-0.5">Satuan Besar</p>
                    <p className="text-sm font-semibold text-gray-900">{product.satuan || '-'}</p>
                  </div>
                  {product.isiPerSatuan && (
                    <>
                      <div className="flex flex-col items-center text-gray-300">
                        <span className="text-xs">Ãƒâ€”{product.isiPerSatuan}</span>
                        <ArrowRight size={16} />
                      </div>
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
                        <p className="text-[11px] text-gray-400 mb-0.5">Satuan Kecil</p>
                        <p className="text-sm font-semibold text-gray-900">{product.satuanKecil || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Other stok info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-100 pt-4">
                <DetailField label="Stok Minimum" value={product.stokMinimum ? `${product.stokMinimum} ${product.satuan || ''}` : null} />
                <DetailField label="PPN" value={product.ppn ? 'Ya (11%)' : 'Tidak'} />
              </div>
            </div>
          )}

          {/* Tab: Info */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              {product.keterangan && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Keterangan</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">{product.keterangan}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Riwayat</p>
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute left-3.5 top-3 bottom-3 w-px bg-gray-200" />
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 z-10">
                        <PlusCircle size={14} className="text-emerald-600" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-gray-900">Dibuat</p>
                        <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>
                        {product.createdBy?.name && <p className="text-xs text-gray-400 mt-0.5">oleh {product.createdBy.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 z-10">
                        <RefreshCw size={14} className="text-blue-600" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-gray-900">Terakhir diperbarui</p>
                        <p className="text-xs text-gray-500">{formatDate(product.updatedAt)}</p>
                        {product.updatedBy?.name && <p className="text-xs text-gray-400 mt-0.5">oleh {product.updatedBy.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {product.barcode && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Barcode</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <QrCode size={20} className="text-gray-400" />
                    <span className="font-mono text-sm text-gray-700">{product.barcode}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Detail Field Component ── */
function DetailField({ label, value, badge, mono, span }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {badge ? (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}>
          {badge.label}
        </span>
      ) : (
        <p className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-300'} ${mono ? 'font-mono' : ''}`}>
          {value || '-'}
        </p>
      )}
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteConfirmModal({ product, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Hapus Produk?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Produk <strong>{product.name}</strong> akan dihapus dari sistem. Pastikan produk ini tidak memiliki transaksi aktif.
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

/* ── Import Modal ── */
function ImportModal({ onClose, onDone }) {
  const { importLoading, importResult, clearImportResult, createProduct } = useProductStore();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [localProcessing, setLocalProcessing] = useState(false);
  const [localResult, setLocalResult] = useState(null);
  // generate and download an Excel template for import
  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = [
        'name','barcode','category','golongan','bentukSediaan','zatAktif',
        'satuan','isiPerSatuan','ppn','manufacturer',
        'nie','noBpom','stokMinimum','isActive','notes'
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-import-template-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      toast.error('Gagal membuat template. Pastikan dependency terinstal.');
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) { setFile(null); return; }
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(xls|xlsx|csv)$/i)) {
      setError('Format file harus .xls, .xlsx, atau .csv');
      setFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setLocalResult(null);
    setLocalProcessing(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      let imported = 0;
      let skipped = 0;
      const errorDetails = [];
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const payload = {
          name: row.name || row.Nama || row.nama || '',
          barcode: row.barcode || '',
          category: row.category || row.kategori || '',
          golongan: row.golongan || '',
          bentukSediaan: row.bentukSediaan || row.bentuk || '',
          zatAktif: row.zatAktif || row.zat || '',
          satuan: row.satuan || '',
          isiPerSatuan: row.isiPerSatuan || row.isi || '',
          ppn: row.ppn === '' ? true : (String(row.ppn).toLowerCase() === 'true' || Number(row.ppn) === 1),
          manufacturer: row.manufacturer || row.produsen || '',
          nie: row.nie || '',
          noBpom: row.noBpom || '',
          stokMinimum: row.stokMinimum || 0,
          isActive: row.isActive === '' ? true : (String(row.isActive).toLowerCase() === 'true' || Number(row.isActive) === 1),
          notes: row.notes || row.keterangan || '',
        };
        if (!payload.name) {
          skipped += 1;
          errorDetails.push({ row: i + 2, message: 'Nama produk kosong' });
          continue;
        }
        try {
          await createProduct(payload);
          imported += 1;
        } catch (err) {
          skipped += 1;
          const msg = err.response?.data?.message || err.message || 'Gagal membuat';
          errorDetails.push({ row: i + 2, message: msg });
        }
      }
      const result = { totalRows: rows.length, imported, skipped, errorDetails };
      setLocalResult(result);
      toast.success(`Import selesai: ${imported} berhasil, ${skipped} gagal`);
    } catch (err) {
      console.error(err);
      setError('Gagal memproses file. Pastikan format sesuai template.');
    }
    setLocalProcessing(false);
  };

  const handleClose = () => {
    clearImportResult();
    onClose();
  };

  const result = localResult || importResult;
  const loading = localProcessing || importLoading;

  const handleDone = () => {
    clearImportResult();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Import Produk</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                <p className="font-medium mb-1">Panduan Import:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Format file: .xlsx atau .csv</li>
                  <li>Maksimal ukuran: 5MB</li>
                  <li>Download template terlebih dahulu untuk format kolom yang benar</li>
                </ul>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih File</label>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                  {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
                </div>
                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <button type="button" onClick={downloadTemplate} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50">
                    Download Template
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="button" onClick={handleUpload} disabled={!file || loading}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Mengimpor...' : 'Upload & Import'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${result?.imported > 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {result?.imported > 0 ? (
                    <Check size={24} className="text-emerald-600" />
                  ) : (
                    <CircleAlert size={24} className="text-amber-600" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Hasil Import</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Total Baris</p>
                  <p className="text-lg font-bold text-gray-900">{result?.totalRows ?? 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-600">Berhasil</p>
                  <p className="text-lg font-bold text-emerald-700">{result?.imported ?? 0}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-600">Gagal</p>
                  <p className="text-lg font-bold text-red-700">{result?.skipped ?? 0}</p>
                </div>
              </div>

              {/* Error details */}
              {result?.errorDetails && result.errorDetails.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Detail Error:</p>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600">Baris</th>
                          <th className="px-3 py-2 text-left text-gray-600">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.errorDetails.map((err, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-gray-700">{err.row}</td>
                            <td className="px-3 py-1.5 text-red-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={handleDone}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
                  Selesai
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
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
