import React, { useEffect, useState, useMemo } from 'react';
import useFinanceStore from '../../store/financeStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import financeService from '../../services/financeService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  CreditCard, Loader2, CheckCircle, Clock, Ban,
  ArrowUpRight, ArrowDownRight, CircleDollarSign,
  Wallet, FileText, Calendar,
} from 'lucide-react';

/* ── Constants ── */
const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  { value: 'verified', label: 'Terverifikasi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const PAYMENT_TYPES = [
  { value: 'incoming', label: 'Penerimaan (Masuk)' },
  { value: 'outgoing', label: 'Pengeluaran (Keluar)' },
];

const PAYMENT_METHODS = [
  { value: 'transfer_bank', label: 'Transfer Bank' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'giro', label: 'Giro / Cek' },
  { value: 'lainnya', label: 'Lainnya' },
];

const PAYMENT_SOURCE_TYPES = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'manual', label: 'Manual' },
];

const STATUS_MAP = Object.fromEntries(PAYMENT_STATUS.map((s) => [s.value, s]));
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'keuangan'];
const CAN_VERIFY_ROLES = ['superadmin', 'admin'];

export default function PaymentManagement() {
  const {
    payments, paymentStats, paymentPagination, isLoading, paymentFilters: filters,
    fetchPayments, fetchPaymentStats, setPaymentFilters: setFilters,
    deletePayment, verifyPayment,
  } = useFinanceStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canVerify = CAN_VERIFY_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [filters, fetchPayments, fetchPaymentStats]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingPayment(null); setShowForm(true); };
  const openEdit = (p) => { setEditingPayment(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingPayment(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePayment(oid(deleteConfirm));
      toast.success('Pembayaran berhasil dihapus');
      setDeleteConfirm(null);
      fetchPayments();
      fetchPaymentStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleVerify = async (payment) => {
    try {
      await verifyPayment(oid(payment));
      toast.success('Pembayaran berhasil diverifikasi');
      fetchPayments();
      fetchPaymentStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pembayaran masuk dan keluar.</p>
        </div>
        {canCrud && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Buat Pembayaran
          </button>
        )}
      </div>

      {/* Stats */}
      {paymentStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Pembayaran', value: paymentStats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: CreditCard, isCount: true },
            { label: 'Masuk Bulan Ini', value: paymentStats.incomingThisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: ArrowUpRight },
            { label: 'Keluar Bulan Ini', value: paymentStats.outgoingThisMonth ?? 0, color: 'from-red-500 to-red-600', icon: ArrowDownRight },
            { label: 'Pending Verifikasi', value: paymentStats.pendingCount ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock, isCount: true },
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
              placeholder="Cari nomor pembayaran, referensi..."
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
            {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {PAYMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={filters.sourceType || ''}
            onChange={(e) => setFilters({ sourceType: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Sumber</option>
            {PAYMENT_SOURCE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Pembayaran</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Tipe</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Metode</th>
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
              ) : (payments || []).length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada pembayaran ditemukan.</p>
                </td></tr>
              ) : (
                payments.map((p) => {
                  const st = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <tr key={oid(p)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{p.paymentNumber}</p>
                        <p className="text-xs text-gray-400">{p.invoice?.invoiceNumber || p.invoiceNumber || p.referenceNumber || p.reference || p.purchaseOrderNumber || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.type === 'incoming' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.type === 'incoming' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {p.type === 'incoming' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell capitalize">{(p.paymentMethod || '-').replace('_', ' ')}</td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{formatDate(p.paymentDate)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          <st.icon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShowDetail(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Detail">
                            <Eye size={16} />
                          </button>
                          {canCrud && p.status === 'pending' && (
                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                              <SquarePen size={16} />
                            </button>
                          )}
                        {/* Reference: Invoice or PO (purchases tracked on PO) */}
                          {canVerify && p.status === 'pending' && (
                            <button onClick={() => handleVerify(p)} className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Verifikasi">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {canCrud && p.status === 'pending' && (
                            <button onClick={() => setDeleteConfirm(p)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Hapus">
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
          pagination={paymentPagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="pembayaran"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <PaymentFormModal
          payment={editingPayment}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchPayments(); fetchPaymentStats(); }}
        />
      )}
      {showDetail && <PaymentDetailModal payment={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && (
        <DeleteConfirmModal
          payment={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   FORM MODAL
   ═══════════════════════════════════════ */
function PaymentFormModal({ payment, onClose, onSaved }) {
  const { createPayment, updatePayment } = useFinanceStore();
  const isEdit = !!payment;
  const [loading, setLoading] = useState(false);
  const [accountOptions, setAccountOptions] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);

  const [form, setForm] = useState({
    paymentNumber: payment?.paymentNumber || '',
    type: payment?.type || 'incoming',
    paymentMethod: payment?.paymentMethod || 'transfer_bank',
    paymentDate: payment?.paymentDate ? payment.paymentDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    amount: payment?.amount || '',
    reference: payment?.reference || '',
    invoiceId: payment?.invoiceId || '',
    invoiceNumber: payment?.invoiceNumber || '',
    bankAccount: payment?.bankAccount || '',
    notes: payment?.notes || '',
  });
  const isIncoming = form.type === 'incoming';
  const invoiceRefLabel = isIncoming ? 'Referensi Invoice Penjualan' : 'Referensi Invoice Pembelian';
  const invoiceRefPlaceholder = isIncoming ? 'Cari nomor invoice penjualan...' : 'Cari nomor invoice pembelian...';

  useEffect(() => {
    let isMounted = true;
    const loadAccounts = async () => {
      setAccountLoading(true);
      try {
        const { data } = await financeService.getChartOfAccounts({ isActive: true });
        const flattened = flattenAccounts(data?.data || []);
        const bankLike = flattened.filter((a) => {
          const name = (a.name || '').toLowerCase();
          return a.category === 'asset' && (name.includes('bank') || name.includes('kas'));
        });
        if (isMounted) {
          setAccountOptions(bankLike.length ? bankLike : flattened);
        }
      } catch {
        if (isMounted) {
          setAccountOptions([]);
        }
      } finally {
        if (isMounted) {
          setAccountLoading(false);
        }
      }
    };

    loadAccounts();
    return () => { isMounted = false; };
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const handleTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      type,
      reference: '',
      invoiceId: '',
      invoiceNumber: '',
      amount: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (isEdit) {
        await updatePayment(oid(payment), payload);
        toast.success('Pembayaran berhasil diperbarui');
      } else {
        await createPayment(payload);
        toast.success('Pembayaran berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Pembayaran' : 'Buat Pembayaran Baru'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pembayaran</label>
            <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white">
              {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
            <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white">
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{invoiceRefLabel}</label>
            <AutocompleteInput
              value={form.reference}
              onChange={(text) => set('reference', text)}
              onSelect={(inv) => {
                const autoAmount = Number(inv.remainingAmount ?? inv.totalAmount ?? inv.grandTotal ?? 0);
                set('reference', inv.invoiceNumber);
                set('invoiceId', inv._id || inv.id);
                set('invoiceNumber', inv.invoiceNumber);
                set('amount', autoAmount > 0 ? autoAmount : '');
              }}
              onClear={() => { set('reference', ''); set('invoiceId', ''); set('invoiceNumber', ''); }}
              fetchFn={async (params) => {
                const res = isIncoming
                  ? await financeService.getSalesInvoices(params)
                  : await financeService.getPurchaseInvoices(params);

                const raw = res.data?.data || [];
                const filtered = raw.filter((inv) => {
                  const status = inv.status || '';
                  const remaining = Number(inv.remainingAmount ?? inv.totalAmount ?? inv.grandTotal ?? 0);
                  return ['sent', 'partially_paid', 'overdue'].includes(status) && remaining > 0;
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
                  <p className="text-xs text-gray-400">{inv.customer?.name || inv.customerName || inv.supplier?.name || inv.supplierName || '-'} &middot; {formatCurrency(inv.totalAmount || inv.grandTotal || 0)}</p>
                </div>
              )}
              placeholder={invoiceRefPlaceholder}
              inputClassName="!rounded-xl"
            />
            {form.invoiceId && <p className="text-xs text-emerald-600 mt-1">Invoice terpilih: {form.invoiceNumber || form.reference}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} min="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="0" />
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Bank</label>
            <select
              value={form.bankAccount}
              onChange={(e) => set('bankAccount', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              <option value="">{accountLoading ? 'Memuat chart of accounts...' : 'Pilih rekening / akun kas-bank'}</option>
              {accountOptions.map((acc) => (
                <option key={acc._id || acc.code} value={`${acc.code} - ${acc.name}`}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
            {!accountLoading && accountOptions.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Chart of accounts belum tersedia, silakan isi lewat modul GL terlebih dahulu.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Simpan' : 'Buat Pembayaran'}
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
function PaymentDetailModal({ payment, onClose }) {
  const invoiceNumber = payment.invoice?.invoiceNumber || payment.invoiceNumber || payment.reference || '-';
  const counterpartName = payment.type === 'incoming'
    ? (payment.customer?.name || '-')
    : (payment.supplier?.name || '-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Detail Pembayaran</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <InfoRow label="No. Pembayaran" value={payment.paymentNumber} />
          <InfoRow label="Tipe" value={payment.type === 'incoming' ? 'Penerimaan (Masuk)' : 'Pengeluaran (Keluar)'} />
          <InfoRow label="Status" value={STATUS_MAP[payment.status]?.label || payment.status} />
          <InfoRow label="Metode" value={(payment.paymentMethod || '-').replace('_', ' ')} />
          <InfoRow label="Tanggal" value={formatDate(payment.paymentDate)} />
          <InfoRow label="Jumlah" value={formatCurrency(payment.amount)} />
          <InfoRow label="No. Invoice" value={invoiceNumber} />
          <InfoRow label={payment.type === 'incoming' ? 'Pelanggan' : 'Supplier'} value={counterpartName} />
          <InfoRow label="No. Referensi" value={payment.referenceNumber || '-'} />
          <InfoRow label="Rekening Bank" value={payment.bankAccount || '-'} />
          <InfoRow label="Catatan" value={payment.notes || '-'} />
          <InfoRow label="Diverifikasi oleh" value={payment.verifiedBy?.name || '-'} />
          <InfoRow label="Tanggal Verifikasi" value={formatDate(payment.verifiedAt)} />
          <InfoRow label="Catatan Verifikasi" value={payment.verificationNotes || '-'} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ payment, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Pembayaran?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Pembayaran <strong>{payment.paymentNumber}</strong> akan dihapus permanen.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">Hapus</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
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

function flattenAccounts(nodes = []) {
  const out = [];
  const walk = (list) => {
    list.forEach((node) => {
      out.push({
        _id: node._id,
        code: node.code,
        name: node.name,
        category: node.category,
        level: node.level,
      });
      if (Array.isArray(node.children) && node.children.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return out;
}
