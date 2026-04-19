import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import useFinanceStore from '../../store/financeStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import InvoicePrintTemplate from '../../components/InvoicePrintTemplate';
import env from '../../config/env';
import toast from 'react-hot-toast';
import {
  Eye, X, Loader2, FileText, Send, Ban,
  CheckCircle, Clock, AlertTriangle, CircleDollarSign,
  Printer, Calendar, Building2, CreditCard, Upload,
} from 'lucide-react';

/* ── Constants ── */
const INVOICE_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  { value: 'sent', label: 'Terkirim', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  { value: 'partially_paid', label: 'Dibayar Sebagian', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CreditCard },
  { value: 'paid', label: 'Lunas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'overdue', label: 'Jatuh Tempo', color: 'bg-red-50 text-red-600 border-red-200', icon: AlertTriangle },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(INVOICE_STATUS.map((s) => [s.value, s]));
const CAN_ACTION_ROLES = ['superadmin', 'admin', 'keuangan'];
const INVOICE_TYPE_MAP = {
  sales: { label: 'Penjualan', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  purchase: { label: 'Pembelian', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function InvoiceManagement() {
  const {
    invoices, invoiceStats, invoicePagination, isLoading, invoiceFilters: filters,
    fetchInvoices, fetchInvoiceStats, setInvoiceFilters: setFilters,
    sendInvoice, cancelInvoice,
  } = useFinanceStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const canAction = CAN_ACTION_ROLES.includes(userRole);

  const [showDetail, setShowDetail] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [uploadInvoiceTarget, setUploadInvoiceTarget] = useState(null);
  const uploadInputRef = useRef(null);
  const activeType = filters.invoiceType || 'sales';

  const handlePrint = useCallback(async (inv) => {
    try {
      const { data: res } = await (await import('../../services/financeService')).default.getInvoiceById(oid(inv));
      setPrintInvoice(res.data);
      setTimeout(() => window.print(), 300);
    } catch {
      setPrintInvoice(inv);
      setTimeout(() => window.print(), 300);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchInvoiceStats();
  }, [filters, fetchInvoices, fetchInvoiceStats]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const handleSend = async (invoice) => {
    try {
      await sendInvoice(oid(invoice));
      toast.success('Invoice berhasil dikirim');
      fetchInvoices();
      fetchInvoiceStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim invoice');
    }
  };

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    try {
      await cancelInvoice(oid(cancelConfirm), cancelReason);
      toast.success('Invoice berhasil dibatalkan');
      setCancelConfirm(null);
      setCancelReason('');
      fetchInvoices();
      fetchInvoiceStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan invoice');
    }
  };

  const handleOpenUpload = (invoice) => {
    setUploadInvoiceTarget(invoice);
    uploadInputRef.current?.click();
  };

  const handleViewDocument = (invoice) => {
    const documentUrl = getInvoiceDocumentUrl(invoice);
    if (!documentUrl) {
      toast.error('Dokumen belum tersedia');
      return;
    }
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadInvoiceTarget) return;
    try {
      const { default: financeService } = await import('../../services/financeService');
      await financeService.uploadInvoiceDocument(oid(uploadInvoiceTarget), file);
      toast.success('Dokumen invoice pembelian berhasil diupload');
      fetchInvoices();
      fetchInvoiceStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload dokumen invoice pembelian');
    } finally {
      setUploadInvoiceTarget(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice / Faktur</h1>
        <p className="text-sm text-gray-500 mt-1">Invoice otomatis dari pengiriman yang selesai. Kelola pengiriman dan pelunasan invoice.</p>
      </div>

      {/* Stats */}
      {invoiceStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Invoice', value: invoiceStats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: FileText, isCount: true },
            { label: 'Outstanding', value: invoiceStats.totalOutstanding ?? 0, color: 'from-blue-500 to-blue-600', icon: CircleDollarSign },
            { label: 'Overdue', value: invoiceStats.overdueCount ?? 0, color: 'from-red-500 to-red-600', icon: AlertTriangle, isCount: true },
            { label: 'Lunas Bulan Ini', value: invoiceStats.paidThisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 inline-flex gap-2">
        <button
          onClick={() => setFilters({ invoiceType: 'sales', page: 1 })}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeType === 'sales'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Invoice Penjualan
        </button>
        <button
          onClick={() => setFilters({ invoiceType: 'purchase', page: 1 })}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeType === 'purchase'
              ? 'bg-amber-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Invoice Pembelian
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={activeType === 'purchase' ? 'Cari nomor invoice, supplier...' : 'Cari nomor invoice, pelanggan...'}
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {INVOICE_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={filters.overdue}
            onChange={(e) => setFilters({ overdue: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua</option>
            <option value="true">Overdue Saja</option>
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Invoice</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pihak</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tanggal</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Jatuh Tempo</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Total</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Sisa</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (invoices || []).length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada invoice ditemukan.</p>
                </td></tr>
              ) : (
                invoices.map((inv) => {
                  const st = STATUS_MAP[inv.status] || STATUS_MAP.draft;
                  const typeMeta = INVOICE_TYPE_MAP[inv.invoiceType] || { label: inv.invoiceType || 'Lainnya', color: 'bg-gray-100 text-gray-700 border-gray-200' };
                  const statusLabel = getInvoiceStatusLabel(inv);
                  const isOverdue = inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && !['paid', 'cancelled'].includes(inv.status));
                  const canSendInvoice = canAction && inv.invoiceType === 'sales' && inv.status === 'draft';
                  const canCancelSales = ['draft', 'sent'].includes(inv.status) || (inv.status === 'overdue' && (inv.paidAmount || 0) === 0);
                  const canCancelPurchase = ['draft', 'sent', 'overdue'].includes(inv.status) && (inv.paidAmount || 0) === 0;
                  const canCancelInvoice = canAction && (inv.invoiceType === 'sales' ? canCancelSales : canCancelPurchase);
                  return (
                    <tr key={oid(inv)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeMeta.color}`}>
                            {typeMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{getPrimaryReference(inv)}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-gray-800">{getCounterpartyName(inv)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{getSecondaryReference(inv)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600 hidden xl:table-cell">
                        <span className={inv.remainingAmount > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600'}>
                          {formatCurrency(inv.remainingAmount ?? inv.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          <st.icon size={12} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShowDetail(inv)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Detail">
                            <Eye size={16} />
                          </button>
                          {inv.invoiceType === 'purchase' ? (
                            <>
                              {hasInvoiceDocument(inv) && (
                                <button
                                  onClick={() => handleViewDocument(inv)}
                                  className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Lihat Dokumen"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenUpload(inv)}
                                className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                title={hasInvoiceDocument(inv) ? 'Ganti Dokumen' : 'Upload Dokumen'}
                              >
                                <Upload size={16} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handlePrint(inv)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Cetak">
                              <Printer size={16} />
                            </button>
                          )}
                          {canSendInvoice && (
                            <button onClick={() => handleSend(inv)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Kirim Invoice Penjualan">
                              <Send size={16} />
                            </button>
                          )}
                          {canCancelInvoice && (
                            <button onClick={() => setCancelConfirm(inv)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title={inv.invoiceType === 'purchase' ? 'Batalkan Invoice Pembelian' : 'Batalkan Invoice Penjualan'}>
                              <Ban size={16} />
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
          pagination={invoicePagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="invoice"
        />
      </div>

      {/* Print Template — hidden on screen, visible on print */}
      <InvoicePrintTemplate invoice={printInvoice} />
      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleUploadDocument}
      />

      {/* Detail Modal */}
      {showDetail && <InvoiceDetailModal invoice={showDetail} onClose={() => setShowDetail(null)} onPrint={handlePrint} />}

      {/* Cancel Confirm */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Batalkan Invoice?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Invoice <strong>{cancelConfirm.invoiceNumber}</strong> akan dibatalkan.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Alasan pembatalan..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition resize-none mb-4"
            />
            <div className="flex justify-center gap-3">
              <button onClick={() => { setCancelConfirm(null); setCancelReason(''); }} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleCancel} className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">Batalkan Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════ */
function InvoiceDetailModal({ invoice, onClose, onPrint }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await (await import('../../services/financeService')).default.getInvoiceById(oid(invoice));
        if (!cancelled) setDetail(res.data);
      } catch { /* */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [invoice]);

  const d = detail || invoice;
  const st = STATUS_MAP[d.status] || STATUS_MAP.draft;
  const statusLabel = getInvoiceStatusLabel(d);
  const typeMeta = INVOICE_TYPE_MAP[d.invoiceType] || { label: d.invoiceType || 'Lainnya', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  const counterpartLabel = d.invoiceType === 'purchase' ? 'Supplier' : 'Pelanggan';
  const referenceLabel = d.invoiceType === 'purchase' ? 'No. PO' : 'No. SO';
  const deliveryLabel = d.invoiceType === 'purchase' ? 'No. Penerimaan' : 'No. Delivery';
  const referenceValue = d.invoiceType === 'purchase'
    ? (d.purchaseOrder?.poNumber || d.poNumber || d.purchaseOrderId || '-')
    : (d.salesOrder?.soNumber
      || d.soNumber
      || (Array.isArray(d.salesOrderNumbers) && d.salesOrderNumbers.length ? d.salesOrderNumbers.join(', ') : '')
      || (Array.isArray(d.salesOrderIds) && d.salesOrderIds.length ? d.salesOrderIds.join(', ') : '')
      || '-');
  const deliveryValue = d.invoiceType === 'purchase'
    ? (d.goodsReceiving?.receivingNumber || d.receiving?.receivingNumber || d.goodsReceivingId || '-')
    : (d.delivery?.deliveryNumber || d.deliveryNumber || '-');
  const documentUrl = getInvoiceDocumentUrl(d);
  const hasDocument = hasInvoiceDocument(d);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Invoice</h2>
            <p className="text-sm text-gray-500">{d.invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(d)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Cetak Invoice"
            >
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading && !detail ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${typeMeta.color}`}>
                  {typeMeta.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${st.color}`}>
                  <st.icon size={12} />
                  {statusLabel}
                </span>
                {d.invoiceType === 'purchase' && hasDocument && (
                  <button
                    onClick={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    title="Lihat Dokumen"
                  >
                    <FileText size={12} />
                    Lihat Dokumen
                  </button>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label={counterpartLabel} value={getCounterpartyName(d)} />
                <InfoRow label={referenceLabel} value={referenceValue} />
                <InfoRow label="Tanggal Invoice" value={formatDate(d.invoiceDate)} />
                <InfoRow label="Jatuh Tempo" value={formatDate(d.dueDate)} />
                <InfoRow label="Payment Terms" value={`${d.paymentTermDays || 30} hari`} />
                <InfoRow label={deliveryLabel} value={deliveryValue} />
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Item</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Harga</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(d.items || []).map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-gray-800">{item.productId?.name || item.productName || item.description || '-'}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{item.quantity} {item.satuan || item.unit || ''}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                      {(!d.items || d.items.length === 0) && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Tidak ada item</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(d.subtotal || d.totalAmount)}</span>
                </div>
                {d.ppnAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">PPN ({d.ppnRate || 11}%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(d.ppnAmount)}</span>
                  </div>
                )}
                {d.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="font-medium text-red-600">-{formatCurrency(d.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-gray-900 text-base">{formatCurrency(d.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Terbayar</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(d.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sisa</span>
                  <span className="font-bold text-amber-600">{formatCurrency(d.remainingAmount ?? d.totalAmount)}</span>
                </div>
              </div>

              {/* Payment History */}
              {d.payments?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Riwayat Pembayaran</h3>
                  <div className="space-y-2">
                    {d.payments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.paymentNumber}</p>
                          <p className="text-xs text-gray-400">{formatDate(p.paymentDate)} · {(p.paymentMethod || '').replace('_', ' ')}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
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

function getCounterpartyName(inv) {
  if (inv.invoiceType === 'purchase') {
    if (typeof inv.supplierId === 'object') return inv.supplierId?.name || '-';
    return inv.supplier?.name || inv.supplierName || inv.supplierCode || inv.supplierId || '-';
  }
  return inv.customer?.name || inv.customerName || '-';
}

function getPrimaryReference(inv) {
  if (inv.invoiceType === 'purchase') {
    return inv.purchaseOrder?.poNumber || inv.poNumber || inv.purchaseOrderId || '-';
  }
  return inv.salesOrder?.soNumber
    || inv.soNumber
    || (Array.isArray(inv.salesOrderNumbers) && inv.salesOrderNumbers.length ? inv.salesOrderNumbers.join(', ') : '')
    || (Array.isArray(inv.salesOrderIds) && inv.salesOrderIds.length ? inv.salesOrderIds.join(', ') : '')
    || '-';
}

function getSecondaryReference(inv) {
  if (inv.invoiceType === 'purchase') {
    return inv.goodsReceiving?.receivingNumber || inv.receiving?.receivingNumber || inv.goodsReceivingId || '-';
  }
  return inv.delivery?.deliveryNumber || inv.deliveryNumber || '-';
}

function getInvoiceStatusLabel(inv) {
  const status = inv?.status || 'draft';
  if (inv?.invoiceType === 'purchase') {
    const map = {
      draft: 'Draft Tagihan',
      sent: 'Tagihan Supplier',
      partially_paid: 'Dibayar Sebagian',
      paid: 'Lunas ke Supplier',
      overdue: 'Jatuh Tempo Bayar',
      cancelled: 'Dibatalkan',
    };
    return map[status] || status;
  }
  return STATUS_MAP[status]?.label || status;
}

function hasInvoiceDocument(inv) {
  return Boolean(inv?.documentFilePath || inv?.documentUrl || inv?.documentFileName);
}

function getInvoiceDocumentUrl(inv) {
  const raw = inv?.documentUrl || inv?.documentFilePath || '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = String(raw).replace(/\\/g, '/');
  const uploadsIndex = normalized.toLowerCase().indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    const uploadsPath = normalized.slice(uploadsIndex);
    const apiBase = env.API_BASE_URL || '';
    const origin = apiBase.replace(/\/api\/v\d+$/i, '');
    return `${origin}${uploadsPath}`;
  }
  return '';
}
