import React, { useEffect, useState, useMemo } from 'react';
import useInventoryStore from '../../store/inventoryStore';
import useAuthStore from '../../store/authStore';
import AutocompleteInput from '../../components/AutocompleteInput';
import Pagination from '../../components/Pagination';
import productService from '../../services/productService';
import toast from 'react-hot-toast';
import {
  ArrowDownToLine, ArrowUpFromLine, Settings2, Trash2, RefreshCw,
  Undo2, Plus, Loader2, X, Search, Calendar, FileText,
  TrendingUp, TrendingDown, BarChart3, ClipboardList,
} from 'lucide-react';

/* ── Constants ── */
const MUTATION_TYPE = {
  in:         { label: 'Masuk',        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowDownToLine, sign: '+' },
  out:        { label: 'Keluar',       color: 'bg-red-50 text-red-600 border-red-200',             icon: ArrowUpFromLine,  sign: '-' },
  adjustment: { label: 'Penyesuaian',  color: 'bg-blue-50 text-blue-700 border-blue-200',          icon: Settings2,        sign: '±' },
  disposal:   { label: 'Pemusnahan',   color: 'bg-rose-50 text-rose-600 border-rose-200',          icon: Trash2,           sign: '-' },
  transfer:   { label: 'Transfer',     color: 'bg-purple-50 text-purple-700 border-purple-200',    icon: RefreshCw,        sign: '±' },
  return:     { label: 'Retur',        color: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Undo2,            sign: '-' },
};

const REFERENCE_TYPE_LABEL = {
  goods_receiving: 'Penerimaan Barang',
  sales_order: 'Penjualan',
  opname: 'Stok Opname',
  manual: 'Manual',
  disposal: 'Pemusnahan',
  return: 'Retur Supplier',
};

const MANUAL_TYPES = [
  { value: 'adjustment', label: 'Penyesuaian (Adjustment)' },
  { value: 'disposal', label: 'Pemusnahan (Disposal)' },
  { value: 'transfer', label: 'Transfer' },
];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function StockMutation() {
  const {
    mutations, mutationStats, mutationPagination, mutationLoading, mutationFilters,
    fetchMutations, fetchMutationStats, setMutationFilters, createMutation,
  } = useInventoryStore();
  const { user } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const canCreate = ['superadmin', 'admin', 'gudang', 'apoteker'].includes(user?.role);

  useEffect(() => {
    fetchMutations();
    fetchMutationStats();
  }, [mutationFilters, fetchMutations, fetchMutationStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setMutationFilters({ search: value, page: 1 }), 400),
    [setMutationFilters],
  );

  const handleCreate = async (data) => {
    try {
      await createMutation(data);
      toast.success('Mutasi stok berhasil dicatat');
      setShowForm(false);
      fetchMutations();
      fetchMutationStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mencatat mutasi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mutasi Stok</h1>
          <p className="text-sm text-gray-500 mt-1">Riwayat keluar masuk stok gudang.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-sm transition"
          >
            <Plus size={16} />
            Mutasi Manual
          </button>
        )}
      </div>

      {/* Stats */}
      {mutationStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Mutasi', value: mutationStats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: ClipboardList },
            { label: 'Bulan Ini', value: mutationStats.thisMonth ?? 0, color: 'from-blue-500 to-blue-600', icon: Calendar },
            { label: 'Masuk (Bulan Ini)', value: mutationStats.inThisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
            { label: 'Keluar (Bulan Ini)', value: mutationStats.outThisMonth ?? 0, color: 'from-red-500 to-red-600', icon: TrendingDown },
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
              placeholder="Cari produk, no. referensi, batch..."
              defaultValue={mutationFilters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <select
            value={mutationFilters.type}
            onChange={(e) => setMutationFilters({ type: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
          >
            <option value="">Semua Tipe</option>
            {Object.entries(MUTATION_TYPE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={mutationFilters.dateFrom}
            onChange={(e) => setMutationFilters({ dateFrom: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            value={mutationFilters.dateTo}
            onChange={(e) => setMutationFilters({ dateTo: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            placeholder="Sampai tanggal"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Mutasi</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Tipe</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Produk</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Batch</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Qty</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Saldo</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Referensi</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mutationLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data mutasi...</p>
                  </td>
                </tr>
              ) : mutations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada data mutasi ditemukan.</p>
                  </td>
                </tr>
              ) : (
                mutations.map((mut) => {
                  const mt = MUTATION_TYPE[mut.type] || MUTATION_TYPE.in;
                  const TypeIcon = mt.icon;
                  const prod = mut.productId && typeof mut.productId === 'object' ? mut.productId : {};
                  const isPositive = mut.quantity > 0;

                  return (
                    <tr
                      key={mut._id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setDetailModal(mut)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs font-medium text-gray-700">{mut.mutationNumber || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-gray-700">{formatDate(mut.mutationDate)}</p>
                        <p className="text-[11px] text-gray-400">{formatTime(mut.mutationDate)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${mt.color}`}>
                          <TypeIcon size={11} />
                          {mt.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{prod.name || '-'}</p>
                        <p className="text-xs text-gray-400">{prod.sku || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-600">{mut.batchNumber || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{mut.quantity?.toLocaleString('id-ID') ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                        <div className="text-xs text-gray-500">
                          <span>{mut.balanceBefore?.toLocaleString('id-ID') ?? '-'}</span>
                          <span className="mx-1">→</span>
                          <span className="font-semibold text-gray-700">{mut.balanceAfter?.toLocaleString('id-ID') ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-700">{mut.referenceNumber || '-'}</p>
                        <p className="text-[11px] text-gray-400">{REFERENCE_TYPE_LABEL[mut.referenceType] || mut.referenceType || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell">
                        <p className="text-xs text-gray-600">
                          {typeof mut.createdBy === 'object' ? mut.createdBy?.name : '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={mutationPagination}
          onPageChange={(page) => setMutationFilters({ page })}
          onLimitChange={(limit) => setMutationFilters({ limit, page: 1 })}
          label="Mutasi"
        />
      </div>

      {/* Create Mutation Modal */}
      {showForm && (
        <CreateMutationModal
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <MutationDetailModal
          mutation={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   CREATE MUTATION MODAL
   ═══════════════════════════════════════ */
function CreateMutationModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    type: 'adjustment',
    productId: '',
    productName: '',
    batchId: '',
    batchNumber: '',
    quantity: '',
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { fetchBatches, batches, batchLoading } = useInventoryStore();

  // When product is selected, load its batches
  useEffect(() => {
    if (form.productId) {
      fetchBatches(form.productId, { status: 'active' });
    }
  }, [form.productId, fetchBatches]);

  const handleProductSelect = (product) => {
    setForm((f) => ({
      ...f,
      productId: product._id,
      productName: product.name,
      batchId: '',
      batchNumber: '',
    }));
  };

  const handleProductClear = () => {
    setForm((f) => ({
      ...f,
      productId: '',
      productName: '',
      batchId: '',
      batchNumber: '',
    }));
  };

  const handleBatchChange = (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    setForm((f) => ({
      ...f,
      batchId,
      batchNumber: batch?.batchNumber || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.reason) {
      toast.error('Lengkapi semua field yang wajib');
      return;
    }
    setSubmitting(true);
    const payload = {
      type: form.type,
      productId: form.productId,
      quantity: Number(form.quantity),
      reason: form.reason,
      notes: form.notes || undefined,
    };
    if (form.batchId) payload.batchId = form.batchId;
    await onSubmit(payload);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <Plus size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Mutasi Manual</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Mutasi *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {MANUAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produk *</label>
            <AutocompleteInput
              value={form.productName}
              onChange={(val) => setForm((f) => ({ ...f, productName: val }))}
              onSelect={handleProductSelect}
              onClear={handleProductClear}
              fetchFn={(params) => productService.getAll(params)}
              renderItem={(item) => (
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.sku}</p>
                </div>
              )}
              getDisplayText={(item) => item.name}
              placeholder="Cari produk..."
              searchParams={{ isActive: true }}
            />
          </div>

          {/* Batch */}
          {form.productId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch {form.type === 'disposal' ? '*' : '(opsional)'}
              </label>
              {batchLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Memuat batch...
                </div>
              ) : batches.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Tidak ada batch aktif untuk produk ini.</p>
              ) : (
                <select
                  value={form.batchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="">Pilih batch...</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batchNumber} — Qty: {b.quantity} — ED: {formatDate(b.expiryDate)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder={form.type === 'adjustment' ? 'Positif = tambah, negatif = kurang' : 'Jumlah unit'}
            />
            {form.type === 'adjustment' && (
              <p className="text-xs text-gray-400 mt-1">Gunakan angka positif untuk menambah stok, negatif untuk mengurangi.</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan *</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Alasan mutasi stok..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              placeholder="Catatan tambahan (opsional)..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {submitting ? 'Menyimpan...' : 'Simpan Mutasi'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════ */
function MutationDetailModal({ mutation, onClose }) {
  const mt = MUTATION_TYPE[mutation.type] || MUTATION_TYPE.in;
  const TypeIcon = mt.icon;
  const prod = mutation.productId && typeof mutation.productId === 'object' ? mutation.productId : {};
  const isPositive = mutation.quantity > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mt.color} border`}>
                <TypeIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detail Mutasi</h2>
                <p className="text-xs text-gray-400 font-mono">{mutation.mutationNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Tanggal" value={formatDateTime(mutation.mutationDate)} />
            <InfoRow label="Tipe">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${mt.color}`}>
                <TypeIcon size={10} /> {mt.label}
              </span>
            </InfoRow>
            <InfoRow label="Produk" value={prod.name || '-'} />
            <InfoRow label="SKU" value={prod.sku || '-'} />
            <InfoRow label="Batch" value={mutation.batchNumber || '-'} />
            <InfoRow label="Jumlah">
              <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{mutation.quantity?.toLocaleString('id-ID') ?? 0}
              </span>
            </InfoRow>
            <InfoRow label="Saldo Sebelum" value={mutation.balanceBefore?.toLocaleString('id-ID') ?? '-'} />
            <InfoRow label="Saldo Sesudah" value={mutation.balanceAfter?.toLocaleString('id-ID') ?? '-'} />
            <InfoRow label="No. Referensi" value={mutation.referenceNumber || '-'} />
            <InfoRow label="Sumber" value={REFERENCE_TYPE_LABEL[mutation.referenceType] || mutation.referenceType || '-'} />
          </div>

          {mutation.reason && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Alasan</p>
              <p className="text-sm text-gray-700">{mutation.reason}</p>
            </div>
          )}
          {mutation.notes && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{mutation.notes}</p>
            </div>
          )}

          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Dibuat oleh: {typeof mutation.createdBy === 'object' ? mutation.createdBy?.name : '-'}
            {' • '}{formatDateTime(mutation.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      {children || <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
