import React, { useEffect, useMemo, useState } from 'react';
import useFinanceStore from '../../store/financeStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  TrendingUp, Loader2, Clock, AlertTriangle, CheckCircle, CircleDollarSign, Plus, X,
} from 'lucide-react';

const AGING_OPTIONS = [
  { value: '', label: 'Semua Aging' },
  { value: 'current', label: 'Lancar (0-30 hari)' },
  { value: '31-60', label: '31-60 hari' },
  { value: '61-90', label: '61-90 hari' },
  { value: '90+', label: '> 90 hari' },
];

const PAYMENT_METHODS = [
  { value: 'transfer_bank', label: 'Transfer Bank' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'giro', label: 'Giro' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function AccountsReceivable() {
  const {
    receivables,
    receivablePagination,
    isLoading,
    receivableFilters: filters,
    fetchReceivables,
    setReceivableFilters: setFilters,
    createReceivablePayment,
  } = useFinanceStore();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInitial, setPaymentInitial] = useState(null);

  useEffect(() => {
    fetchReceivables();
  }, [filters, fetchReceivables]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const receivableSummary = useMemo(() => {
    const summary = {
      totalOutstanding: 0,
      current: 0,
      overdue: 0,
      invoiceCount: 0,
      overdueCount: 0,
    };

    (receivables || []).forEach((r) => {
      const remaining = Number(r?.remainingAmount ?? r?.totalOutstanding ?? 0);
      const daysOverdue = Number(r?.daysOverdue ?? 0);

      summary.invoiceCount += 1;
      summary.totalOutstanding += remaining;
      if (daysOverdue > 0) {
        summary.overdue += remaining;
        summary.overdueCount += 1;
      } else {
        summary.current += remaining;
      }
    });

    return summary;
  }, [receivables]);

  const openPaymentForm = (initialData = null) => {
    setPaymentInitial(initialData);
    setShowPaymentForm(true);
  };

  const handleQuickPay = (row) => {
    const paymentInitialData = buildInitialReceivablePaymentData(row);
    if (!paymentInitialData?.invoiceId) {
      toast.error('Invoice untuk baris ini tidak tersedia. Gunakan input manual.');
      openPaymentForm();
      return;
    }
    openPaymentForm(paymentInitialData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Piutang Usaha (Accounts Receivable)</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan piutang customer serta form pembuatan piutang (draft incoming payment).</p>
        </div>
        <button
          onClick={() => openPaymentForm()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Buat Piutang
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Piutang', value: receivableSummary.totalOutstanding, color: 'from-blue-500 to-blue-600', icon: CircleDollarSign, type: 'currency' },
          { label: 'Lancar', value: receivableSummary.current, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle, type: 'currency' },
          { label: 'Jatuh Tempo', value: receivableSummary.overdue, color: 'from-amber-500 to-amber-600', icon: AlertTriangle, type: 'currency' },
          { label: 'Jumlah Invoice', value: receivableSummary.invoiceCount, color: 'from-blue-500 to-indigo-600', icon: Clock, type: 'count' },
          { label: 'Invoice Overdue', value: receivableSummary.overdueCount, color: 'from-orange-500 to-orange-600', icon: AlertTriangle, type: 'count' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                  <Icon size={16} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-lg font-bold text-gray-900">{s.type === 'currency' ? formatCurrency(s.value) : s.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari invoice, pelanggan..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.aging}
            onChange={(e) => setFilters({ aging: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            {AGING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Invoice</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pelanggan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tgl Invoice</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Jatuh Tempo</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Total</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Terbayar</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Sisa</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Overdue</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (receivables || []).length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center">
                  <TrendingUp className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada piutang ditemukan.</p>
                </td></tr>
              ) : (
                receivables.map((r) => (
                  <tr key={r._id || r.id || r.invoiceNumber} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{r.invoiceNumber || r._id || '-'}</p>
                      <p className="text-xs text-gray-400">Status: {r.status || '-'}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-gray-800 truncate">{r.customerId?.name || '-'}</p>
                      <p className="text-xs text-gray-400">{r.customerId?.code || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{formatDate(r.invoiceDate)}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{formatDate(r.dueDate)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600 hidden xl:table-cell">{formatCurrency(r.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600 hidden xl:table-cell">{formatCurrency(r.paidAmount)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(r.remainingAmount)}</td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${Number(r.daysOverdue || 0) > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {Number(r.daysOverdue || 0) > 0 ? `${r.daysOverdue} hari` : 'Lancar'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickPay(r)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Bayar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={receivablePagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="piutang"
        />
      </div>

      {showPaymentForm && (
        <ReceivablePaymentModal
          initialData={paymentInitial}
          onClose={() => {
            setShowPaymentForm(false);
            setPaymentInitial(null);
          }}
          onSubmit={async ({ invoiceId, ...payload }) => {
            await createReceivablePayment({ invoiceId, ...payload });
            toast.success('Piutang berhasil dibuat');
            setShowPaymentForm(false);
            setPaymentInitial(null);
            fetchReceivables();
          }}
        />
      )}
    </div>
  );
}

function ReceivablePaymentModal({ onClose, onSubmit, initialData }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceId: initialData?.invoiceId || '',
    amount: initialData?.amount ?? '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'transfer_bank',
    referenceNumber: initialData?.referenceNumber || '',
    bankAccount: initialData?.bankAccount || '',
    notes: initialData?.notes || '',
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.invoiceId.trim()) {
      toast.error('Invoice ID wajib diisi');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran piutang');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Buat Piutang</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice ID *</label>
            <input
              type="text"
              value={form.invoiceId}
              onChange={(e) => set('invoiceId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Masukkan ID invoice sales"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bayar *</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => set('paymentDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Referensi</label>
              <input
                type="text"
                value={form.referenceNumber}
                onChange={(e) => set('referenceNumber', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Akun Bank</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => set('bankAccount', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Buat Piutang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function extractInvoiceId(row) {
  if (!row) return '';

  if (typeof row?._id === 'string' && row._id) return row._id;
  if (typeof row?.id === 'string' && row.id) return row.id;

  const direct =
    row.invoiceId
    || row.salesInvoiceId
    || row.invoice?._id
    || row.invoice?.id;

  if (typeof direct === 'string' && direct) return direct;
  if (direct && typeof direct === 'object' && direct._id) return direct._id;

  const invoices = Array.isArray(row.invoices) ? row.invoices : [];
  const firstInvoice = invoices.find((inv) => (inv?.remainingAmount ?? inv?.outstandingAmount ?? 0) > 0) || invoices[0];
  if (!firstInvoice) return '';

  if (typeof firstInvoice === 'string') return firstInvoice;
  return firstInvoice.invoiceId || firstInvoice._id || firstInvoice.id || '';
}

function getOutstandingInvoice(row) {
  if (row?.invoiceNumber || row?.remainingAmount != null) return row;
  const invoices = Array.isArray(row?.invoices) ? row.invoices : [];
  return invoices.find((inv) => (inv?.remainingAmount ?? inv?.outstandingAmount ?? 0) > 0) || invoices[0] || null;
}

function buildInitialReceivablePaymentData(row) {
  const invoice = getOutstandingInvoice(row);
  const invoiceId = extractInvoiceId(row);
  const remainingAmount = Number(invoice?.remainingAmount ?? invoice?.outstandingAmount ?? row?.totalOutstanding ?? 0);
  const referenceNumber = invoice?.invoiceNumber || row?._id || row?.id || '';
  const customerName = row?.customerId?.name || row?.customer?.name || '';

  return {
    invoiceId,
    amount: remainingAmount > 0 ? remainingAmount : '',
    referenceNumber,
    bankAccount: '',
    notes: referenceNumber
      ? `Pembayaran piutang invoice ${referenceNumber}${customerName ? ` (${customerName})` : ''}`
      : '',
  };
}
