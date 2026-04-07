import React, { useEffect, useState, useMemo } from 'react';
import useFinanceStore from '../../store/financeStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import customerService from '../../services/customerService';
import supplierService from '../../services/supplierService';
import financeService from '../../services/financeService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Loader2,
  FileText, CheckCircle, Clock, Ban, AlertTriangle,
  CreditCard, ArrowUpRight, ArrowDownRight, CircleDollarSign,
} from 'lucide-react';

/* ── Constants ── */
const MEMO_TYPES = [
  { value: 'credit_memo', label: 'Credit Memo', desc: 'Mengurangi piutang (misal: retur / diskon)' },
  { value: 'debit_memo', label: 'Debit Memo', desc: 'Menambah piutang (misal: biaya tambahan)' },
];

const MEMO_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  { value: 'approved', label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  { value: 'posted', label: 'Diposting', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(MEMO_STATUS.map((s) => [s.value, s]));
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'keuangan'];
const CAN_APPROVE_ROLES = ['superadmin', 'admin'];

export default function CreditDebitMemo() {
  const {
    memos, memoStats, memoPagination, isLoading, memoFilters: filters,
    fetchMemos, fetchMemoStats, setMemoFilters: setFilters,
    deleteMemo, approveMemo,
  } = useFinanceStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canApprove = CAN_APPROVE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchMemos();
    fetchMemoStats();
  }, [filters, fetchMemos, fetchMemoStats]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingMemo(null); setShowForm(true); };
  const openEdit = (m) => { setEditingMemo(m); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingMemo(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMemo(oid(deleteConfirm));
      toast.success('Memo berhasil dihapus');
      setDeleteConfirm(null);
      fetchMemos();
      fetchMemoStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus memo');
    }
  };

  const handleApprove = async (memo) => {
    try {
      await approveMemo(oid(memo));
      toast.success('Memo berhasil disetujui & diposting ke GL');
      fetchMemos();
      fetchMemoStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui memo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit / Debit Memo</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola memo penyesuaian piutang dan hutang. Auto-posting ke General Ledger saat disetujui.</p>
        </div>
        {canCrud && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Buat Memo
          </button>
        )}
      </div>

      {/* Stats */}
      {memoStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Memo', value: memoStats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: FileText, isCount: true },
            { label: 'Credit Memo', value: memoStats.totalCreditAmount ?? 0, color: 'from-emerald-500 to-emerald-600', icon: ArrowDownRight },
            { label: 'Debit Memo', value: memoStats.totalDebitAmount ?? 0, color: 'from-red-500 to-red-600', icon: ArrowUpRight },
            { label: 'Pending Approval', value: memoStats.pendingCount ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock, isCount: true },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className={`${s.isCount ? 'text-2xl' : 'text-lg'} font-bold text-gray-900`}>
                    {s.isCount ? s.value : formatCurrency(s.value)}
                  </span>
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
              placeholder="Cari nomor memo, referensi..."
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
            {MEMO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {MEMO_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Memo</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Tipe</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Pelanggan/Supplier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tanggal</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Jumlah</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (memos || []).length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada memo ditemukan.</p>
                </td></tr>
              ) : (
                memos.map((m) => {
                  const st = STATUS_MAP[m.status] || STATUS_MAP.draft;
                  return (
                    <tr key={oid(m)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{m.memoNumber}</p>
                        <p className="text-xs text-gray-400">Ref: {m.invoiceNumber || m.reference || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.type === 'credit_memo' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.type === 'credit_memo' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {m.type === 'credit_memo' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{m.partyName || m.customerName || m.supplierName || '-'}</td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{formatDate(m.memoDate)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(m.totalAmount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          <st.icon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShowDetail(m)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Detail">
                            <Eye size={16} />
                          </button>
                          {canCrud && m.status === 'draft' && (
                            <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                              <SquarePen size={16} />
                            </button>
                          )}
                          {canApprove && m.status === 'draft' && (
                            <button onClick={() => handleApprove(m)} className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Setujui">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {canCrud && m.status === 'draft' && (
                            <button onClick={() => setDeleteConfirm(m)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Hapus">
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
        <Pagination
          pagination={memoPagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="memo"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <MemoFormModal
          memo={editingMemo}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchMemos(); fetchMemoStats(); }}
        />
      )}
      {showDetail && <MemoDetailModal memo={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Memo?</h3>
            <p className="text-sm text-gray-500 mb-5">Memo <strong>{deleteConfirm.memoNumber}</strong> akan dihapus permanen.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   FORM MODAL
   ═══════════════════════════════════════ */
function MemoFormModal({ memo, onClose, onSaved }) {
  const { createMemo, updateMemo } = useFinanceStore();
  const isEdit = !!memo;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: memo?.type || 'credit_memo',
    memoDate: memo?.memoDate ? memo.memoDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    partyType: memo?.supplierId || memo?.supplierName ? 'supplier' : 'customer',
    customerId: resolveCustomerIdStr(memo),
    supplierId: resolveSupplierIdStr(memo),
    reference: memo?.reference || '',
    invoiceId: memo?.invoiceId || '',
    invoiceNumber: memo?.invoiceNumber || '',
    partyName: memo?.partyName || memo?.customerName || memo?.supplierName || '',
    reason: memo?.reason || '',
    notes: memo?.notes || '',
    items: memo?.items?.length
      ? memo.items.map((it) => ({ description: it.description || '', amount: it.amount || 0 }))
      : [{ description: '', amount: 0 }],
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setItem = (idx, key, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };
    setForm((f) => ({ ...f, items }));
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { description: '', amount: 0 }] }));
  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const totalAmount = form.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const partyLabel = form.partyType === 'supplier' ? 'Supplier' : 'Pelanggan';
  const partyPlaceholder = form.partyType === 'supplier' ? 'Cari supplier...' : 'Cari pelanggan...';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      toast.error('Total jumlah harus lebih dari 0');
      return;
    }
    if (!form.customerId && !form.supplierId) {
      toast.error('Customer atau Supplier wajib dipilih');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        totalAmount,
        items: form.items.map((it) => ({ ...it, amount: Number(it.amount) || 0 })),
        customerId: form.partyType === 'customer' ? form.customerId : undefined,
        supplierId: form.partyType === 'supplier' ? form.supplierId : undefined,
      };
      if (isEdit) {
        await updateMemo(oid(memo), payload);
        toast.success('Memo berhasil diperbarui');
      } else {
        await createMemo(payload);
        toast.success('Memo berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan memo');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Memo' : 'Buat Memo Baru'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Memo</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white">
              {MEMO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.memoDate} onChange={(e) => set('memoDate', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
          </div>

          {/* Party Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Relasi</label>
            <select
              value={form.partyType}
              onChange={(e) => setForm((f) => ({
                ...f,
                partyType: e.target.value,
                customerId: '',
                supplierId: '',
                partyName: '',
                invoiceId: '',
                invoiceNumber: '',
                reference: '',
              }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              <option value="customer">Pelanggan</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {/* Party Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{partyLabel}</label>
            <AutocompleteInput
              value={form.partyName}
              onChange={(text) => set('partyName', text)}
              onSelect={(item) => {
                if (form.partyType === 'supplier') {
                  setForm((f) => ({
                    ...f,
                    supplierId: item._id || item.id,
                    customerId: '',
                    partyName: item.name,
                    invoiceId: '',
                    invoiceNumber: '',
                    reference: '',
                  }));
                } else {
                  setForm((f) => ({
                    ...f,
                    customerId: item._id || item.id,
                    supplierId: '',
                    partyName: item.name,
                    invoiceId: '',
                    invoiceNumber: '',
                    reference: '',
                  }));
                }
              }}
              onClear={() => setForm((f) => ({
                ...f,
                customerId: '',
                supplierId: '',
                partyName: '',
                invoiceId: '',
                invoiceNumber: '',
                reference: '',
              }))}
              fetchFn={(params) => (
                form.partyType === 'supplier'
                  ? supplierService.getAll({ ...params, isActive: true })
                  : customerService.getAll({ ...params, isActive: true })
              )}
              getDisplayText={(item) => item.name}
              renderItem={(item) => (
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.code || '-'} &middot; {item.phone || '-'}</p>
                </div>
              )}
              placeholder={partyPlaceholder}
              inputClassName="!rounded-xl"
            />
            {(form.customerId || form.supplierId) && (
              <p className="text-xs text-emerald-600 mt-1">{partyLabel} terpilih</p>
            )}
          </div>

          {/* Invoice Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referensi Invoice (opsional)</label>
            <AutocompleteInput
              value={form.reference || form.invoiceNumber}
              onChange={(text) => set('reference', text)}
              onSelect={(inv) => {
                setForm((f) => ({
                  ...f,
                  reference: inv.invoiceNumber,
                  invoiceId: inv._id || inv.id || '',
                  invoiceNumber: inv.invoiceNumber || '',
                }));
              }}
              onClear={() => setForm((f) => ({ ...f, reference: '', invoiceId: '', invoiceNumber: '' }))}
              fetchFn={async (params) => {
                const res = form.partyType === 'supplier'
                  ? await financeService.getPurchaseInvoices({
                    ...params,
                    ...(form.supplierId ? { supplierId: form.supplierId } : {}),
                  })
                  : await financeService.getSalesInvoices({
                    ...params,
                    ...(form.customerId ? { customerId: form.customerId } : {}),
                  });

                const raw = res.data?.data || [];
                const filtered = raw.filter((inv) => {
                  const status = inv.status || '';
                  return ['sent', 'partially_paid', 'paid', 'overdue'].includes(status);
                });

                return {
                  ...res,
                  data: {
                    ...res.data,
                    data: filtered,
                  },
                };
              }}
              getDisplayText={(inv) => inv.invoiceNumber}
              renderItem={(inv) => (
                <div>
                  <p className="font-medium text-gray-800">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-400">
                    {inv.customer?.name || inv.customerName || inv.supplier?.name || inv.supplierName || '-'}
                    {' '}·{' '}
                    {formatCurrency(inv.totalAmount || inv.grandTotal || 0)}
                  </p>
                </div>
              )}
              placeholder="Cari nomor invoice..."
              inputClassName="!rounded-xl"
            />
            {form.invoiceId && <p className="text-xs text-emerald-600 mt-1">Invoice terpilih: {form.invoiceNumber}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan</label>
            <input type="text" value={form.reason} onChange={(e) => set('reason', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="Alasan memo..." />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Item</label>
              <button type="button" onClick={addItem} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Tambah Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => setItem(i, 'description', e.target.value)}
                    placeholder="Keterangan"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => setItem(i, 'amount', e.target.value)}
                    placeholder="Jumlah"
                    min="0"
                    className="w-36 px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-sm font-semibold text-gray-700">Total: {formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Simpan' : 'Buat Memo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════ */
function MemoDetailModal({ memo, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await (await import('../../services/financeService')).default.getMemoById(oid(memo));
        if (!cancelled) setDetail(res.data);
      } catch { /* */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [memo]);

  const d = detail || memo;
  const st = STATUS_MAP[d.status] || STATUS_MAP.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Memo</h2>
            <p className="text-sm text-gray-500">{d.memoNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading && !detail ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${st.color}`}>
                <st.icon size={12} />
                {st.label}
              </span>

              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Tipe" value={d.type === 'credit_memo' ? 'Credit Memo' : 'Debit Memo'} />
                <InfoRow label="Tanggal" value={formatDate(d.memoDate)} />
                <InfoRow label="Pelanggan/Supplier" value={d.partyName || d.customerName || d.supplierName || '-'} />
                <InfoRow label="Ref. Invoice" value={d.invoiceNumber || '-'} />
                <InfoRow label="Alasan" value={d.reason || '-'} />
                <InfoRow label="Total" value={formatCurrency(d.totalAmount)} />
              </div>

              {/* Items */}
              {d.items?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Item</h3>
                  <div className="space-y-1">
                    {d.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-800">{it.description || '-'}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {d.notes && (
                <div>
                  <p className="text-xs text-gray-500">Catatan</p>
                  <p className="text-sm text-gray-700 mt-0.5">{d.notes}</p>
                </div>
              )}

              {d.approvedBy && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <InfoRow label="Disetujui oleh" value={d.approvedBy?.name || '-'} />
                  <InfoRow label="Tanggal Persetujuan" value={formatDate(d.approvedAt)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/* ── Helpers ── */
function oid(o) { return o._id || o.id; }

function formatCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function resolveCustomerIdStr(obj) {
  const customer = obj?.customer && typeof obj.customer === 'object'
    ? obj.customer
    : obj?.customerId && typeof obj.customerId === 'object'
      ? obj.customerId
      : null;
  if (customer?._id) return customer._id;
  if (typeof obj?.customerId === 'string') return obj.customerId;
  return '';
}

function resolveSupplierIdStr(obj) {
  const supplier = obj?.supplier && typeof obj.supplier === 'object'
    ? obj.supplier
    : obj?.supplierId && typeof obj.supplierId === 'object'
      ? obj.supplierId
      : null;
  if (supplier?._id) return supplier._id;
  if (typeof obj?.supplierId === 'string') return obj.supplierId;
  return '';
}
