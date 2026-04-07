import React, { useEffect, useState, useMemo } from 'react';
import useFinanceStore from '../../store/financeStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  Plus, SquarePen, Trash2, X, Loader2, AlertTriangle,
  Link2, Unlink, CheckCircle, Clock, Ban,
  ArrowUpRight, ArrowDownRight, CircleDollarSign, Landmark,
} from 'lucide-react';

/* ── Constants ── */
const MATCH_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'unmatched', label: 'Belum Cocok' },
  { value: 'matched', label: 'Sudah Cocok' },
  { value: 'reconciled', label: 'Rekonsiliasi' },
];

const MATCH_COLORS = {
  unmatched: 'bg-amber-50 text-amber-700 border-amber-200',
  matched: 'bg-blue-50 text-blue-700 border-blue-200',
  reconciled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const MATCH_ICONS = {
  unmatched: Clock,
  matched: Link2,
  reconciled: CheckCircle,
};

const CAN_CRUD_ROLES = ['superadmin', 'admin', 'keuangan'];

export default function BankReconciliation() {
  const {
    bankTransactions, bankPagination, reconSummary, isLoading, bankFilters: filters,
    fetchBankTransactions, fetchReconSummary, setBankFilters: setFilters,
    deleteBankTransaction,
    unmatchTransaction,
  } = useFinanceStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const canCrud = CAN_CRUD_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [matchModal, setMatchModal] = useState(null);

  useEffect(() => {
    fetchBankTransactions();
    fetchReconSummary();
  }, [filters, fetchBankTransactions, fetchReconSummary]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingTx(null); setShowForm(true); };
  const openEdit = (tx) => { setEditingTx(tx); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingTx(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBankTransaction(oid(deleteConfirm));
      toast.success('Transaksi bank berhasil dihapus');
      setDeleteConfirm(null);
      fetchBankTransactions();
      fetchReconSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleUnmatch = async (tx) => {
    try {
      await unmatchTransaction(oid(tx));
      toast.success('Match dibatalkan');
      fetchBankTransactions();
      fetchReconSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal unmatch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekonsiliasi Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Cocokkan transaksi bank dengan pembayaran di sistem.</p>
        </div>
        {canCrud && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Input Transaksi Bank
          </button>
        )}
      </div>

      {/* Summary Bar */}
      {reconSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Belum Cocok', value: reconSummary.unmatchedCount ?? 0, amount: reconSummary.unmatchedAmount ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock },
            { label: 'Sudah Cocok', value: reconSummary.matchedCount ?? 0, amount: reconSummary.matchedAmount ?? 0, color: 'from-blue-500 to-blue-600', icon: Link2 },
            { label: 'Rekonsiliasi', value: reconSummary.reconciledCount ?? 0, amount: reconSummary.reconciledAmount ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { label: 'Selisih', value: null, amount: reconSummary.difference ?? 0, color: 'from-red-500 to-red-600', icon: CircleDollarSign },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    {s.value !== null && <span className="text-xl font-bold text-gray-900">{s.value}</span>}
                    <p className="text-xs text-gray-500">{formatCurrency(s.amount)}</p>
                  </div>
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
              placeholder="Cari keterangan, referensi..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.matchStatus}
            onChange={(e) => setFilters({ matchStatus: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            {MATCH_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Keterangan</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Debit</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Kredit</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Matched Payment</th>
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
              ) : (bankTransactions || []).length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Landmark className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada transaksi bank ditemukan.</p>
                </td></tr>
              ) : (
                bankTransactions.map((tx) => {
                  const matchStatus = tx.matchStatus || 'unmatched';
                  const MatchIcon = MATCH_ICONS[matchStatus] || Clock;
                  return (
                    <tr key={oid(tx)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(tx.date)}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{tx.description || '-'}</p>
                        <p className="text-xs text-gray-400">{tx.bankAccount || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {tx.type === 'debit' ? (
                          <span className="text-emerald-600 font-medium">{formatCurrency(tx.amount)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {tx.type === 'credit' ? (
                          <span className="text-red-600 font-medium">{formatCurrency(tx.amount)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {tx.matchedPayment ? (
                          <span className="text-sm text-blue-600">{tx.matchedPayment.paymentNumber || tx.matchedPaymentId}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${MATCH_COLORS[matchStatus] || MATCH_COLORS.unmatched}`}>
                          <MatchIcon size={12} />
                          {matchStatus === 'unmatched' ? 'Belum Cocok' : matchStatus === 'matched' ? 'Cocok' : 'Rekonsiliasi'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {canCrud && matchStatus === 'unmatched' && (
                            <>
                              <button onClick={() => setMatchModal(tx)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Match dengan Pembayaran">
                                <Link2 size={16} />
                              </button>
                              <button onClick={() => openEdit(tx)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                                <SquarePen size={16} />
                              </button>
                              <button onClick={() => setDeleteConfirm(tx)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Hapus">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {canCrud && matchStatus === 'matched' && (
                            <button onClick={() => handleUnmatch(tx)} className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Unmatch">
                              <Unlink size={16} />
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
          pagination={bankPagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="transaksi bank"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <BankTxFormModal
          tx={editingTx}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchBankTransactions(); fetchReconSummary(); }}
        />
      )}
      {matchModal && (
        <MatchModal
          bankTx={matchModal}
          onClose={() => setMatchModal(null)}
          onMatched={() => { setMatchModal(null); fetchBankTransactions(); fetchReconSummary(); }}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Transaksi Bank?</h3>
            <p className="text-sm text-gray-500 mb-5">Transaksi ini akan dihapus permanen.</p>
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
   BANK TX FORM MODAL
   ═══════════════════════════════════════ */
function BankTxFormModal({ tx, onClose, onSaved }) {
  const { createBankTransaction, updateBankTransaction } = useFinanceStore();
  const isEdit = !!tx;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: tx?.date ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    description: tx?.description || '',
    type: tx?.type || 'debit',
    amount: tx?.amount || '',
    bankAccount: tx?.bankAccount || '',
    reference: tx?.reference || '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (isEdit) {
        await updateBankTransaction(oid(tx), payload);
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await createBankTransaction(payload);
        toast.success('Transaksi berhasil ditambahkan');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Transaksi Bank' : 'Input Transaksi Bank'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${form.type === 'debit' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="debit" checked={form.type === 'debit'} onChange={(e) => set('type', e.target.value)} className="sr-only" />
                <ArrowUpRight size={14} /> Debit (Masuk)
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${form.type === 'credit' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="credit" checked={form.type === 'credit'} onChange={(e) => set('type', e.target.value)} className="sr-only" />
                <ArrowDownRight size={14} /> Kredit (Keluar)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} min="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="0" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="Transfer dari PT ABC..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rekening Bank</label>
            <input type="text" value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="BCA - 1234567890" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referensi (opsional)</label>
            <input type="text" value={form.reference} onChange={(e) => set('reference', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="No. transfer / bukti bayar" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Simpan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MATCH MODAL
   ═══════════════════════════════════════ */
function MatchModal({ bankTx, onClose, onMatched }) {
  const { payments, fetchPayments, matchTransaction } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      if (p.status !== 'verified') return false;
      if (search && !((p.paymentNumber || '').toLowerCase().includes(search.toLowerCase()) || (p.reference || '').toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [payments, search]);

  const handleMatch = async (paymentId) => {
    setLoading(true);
    try {
      await matchTransaction(oid(bankTx), paymentId);
      toast.success('Transaksi bank berhasil di-match');
      onMatched();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal match');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Match dengan Pembayaran</h2>
            <p className="text-sm text-gray-500">
              {bankTx.description} — {formatCurrency(bankTx.amount)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Cari pembayaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => (
                <div key={oid(p)} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.paymentNumber}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(p.paymentDate)} · {p.type === 'incoming' ? 'Masuk' : 'Keluar'} · {p.reference || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</span>
                    <button
                      onClick={() => handleMatch(oid(p))}
                      disabled={loading}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Match
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Tidak ada pembayaran yang terverifikasi</p>
            )}
          </div>
        </div>
      </div>
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
