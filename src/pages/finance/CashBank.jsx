import React, { useEffect, useMemo, useState } from 'react';
import useFinanceStore from '../../store/financeStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  Landmark, Plus, Loader2, X,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const CAN_CRUD_ROLES = ['superadmin', 'admin', 'keuangan'];

export default function CashBank() {
  const {
    bankTransactions, bankPagination, isLoading, bankFilters: filters,
    fetchBankTransactions, setBankFilters: setFilters,
  } = useFinanceStore();

  const currentUser = useAuthStore((s) => s.user);
  const canCrud = CAN_CRUD_ROLES.includes(currentUser?.role || '');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchBankTransactions();
  }, [filters, fetchBankTransactions]);

  const totals = useMemo(() => {
    return (bankTransactions || []).reduce(
      (acc, tx) => {
        if (tx.type === 'debit') acc.debit += Number(tx.amount || 0);
        if (tx.type === 'credit') acc.credit += Number(tx.amount || 0);
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [bankTransactions]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kas &amp; Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Transaksi kas/bank masuk dan keluar berbasis endpoint aktif finance.</p>
        </div>
        {canCrud && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Input Transaksi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Debit (Masuk)" value={formatCurrency(totals.debit)} color="text-emerald-600" icon={ArrowUpRight} />
        <StatCard label="Total Kredit (Keluar)" value={formatCurrency(totals.credit)} color="text-red-600" icon={ArrowDownRight} />
        <StatCard label="Net Cashflow" value={formatCurrency(totals.debit - totals.credit)} color={(totals.debit - totals.credit) >= 0 ? 'text-emerald-600' : 'text-red-600'} icon={Landmark} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari keterangan, rekening, referensi..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Keterangan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Rekening</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Referensi</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Debit</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (bankTransactions || []).length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Landmark className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Belum ada transaksi kas/bank.</p>
                </td></tr>
              ) : (
                bankTransactions.map((tx) => (
                  <tr key={oid(tx)} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3.5 text-gray-800">{tx.description || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{tx.bankAccount || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{tx.reference || '-'}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{tx.type === 'debit' ? formatCurrency(tx.amount) : '-'}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-red-600">{tx.type === 'credit' ? formatCurrency(tx.amount) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={bankPagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="transaksi kas/bank"
        />
      </div>

      {showForm && (
        <CashBankFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchBankTransactions();
          }}
        />
      )}
    </div>
  );
}

function CashBankFormModal({ onClose, onSaved }) {
  const { createBankTransaction } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'debit',
    amount: '',
    description: '',
    bankAccount: '',
    reference: '',
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      await createBankTransaction({
        ...form,
        amount: Number(form.amount),
      });
      toast.success('Transaksi kas/bank berhasil dibuat');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Input Transaksi Kas/Bank</h2>
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
                <ArrowUpRight size={14} /> Debit
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${form.type === 'credit' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="credit" checked={form.type === 'credit'} onChange={(e) => set('type', e.target.value)} className="sr-only" />
                <ArrowDownRight size={14} /> Kredit
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="Transfer bank, pembayaran supplier, dll" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label>
            <input type="text" value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="BCA - 123456789" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referensi</label>
            <input type="text" value={form.reference} onChange={(e) => set('reference', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="No. transfer / voucher" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  const IconComponent = icon;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-3 mt-2">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-sm">
          {IconComponent ? <IconComponent size={16} className="text-white" strokeWidth={2} /> : null}
        </div>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );
}

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
