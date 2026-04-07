import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useReportStore from '../../store/reportStore';
import Pagination from '../../components/Pagination';
import ReportExportBar from '../../components/ReportExportBar';
import PurchaseReportPrintTemplate from '../../components/PurchaseReportPrintTemplate';
import toast from 'react-hot-toast';
import { Loader2, Package, TrendingDown, Truck, CheckCircle } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  partial_received: 'bg-amber-50 text-amber-700',
  received: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function PurchaseReport() {
  const {
    purchaseData, purchaseStats, purchaseChart, purchasePagination, isLoading, isExporting,
    purchaseFilters: filters, setPurchaseFilters: setFilters,
    fetchPurchaseReport, fetchPurchaseStats, fetchPurchaseChart,
    exportPurchaseExcel, exportPurchasePdf,
  } = useReportStore();
  const [printPayload, setPrintPayload] = useState(null);

  useEffect(() => {
    fetchPurchaseReport();
    fetchPurchaseStats();
    fetchPurchaseChart();
  }, [filters, fetchPurchaseReport, fetchPurchaseStats, fetchPurchaseChart]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const handleExportExcel = async () => {
    try { await exportPurchaseExcel(); toast.success('File Excel berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh Excel'); }
  };

  const handleExportPdf = async () => {
    try { await exportPurchasePdf(); toast.success('File PDF berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh PDF'); }
  };

  const handlePrint = useCallback(() => {
    setPrintPayload({
      stats: purchaseStats,
      rows: purchaseData || [],
      filters,
      printedAt: new Date().toISOString(),
    });
    setTimeout(() => window.print(), 200);
  }, [purchaseStats, purchaseData, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Pembelian</h1>
        <p className="text-sm text-gray-500 mt-1">Analisis dan ringkasan data pembelian dari supplier.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: 'Total Pembelian', value: formatCurrency(purchaseStats?.totalPurchases ?? 0), color: 'from-blue-500 to-blue-600', icon: Package },
          { label: 'Jumlah PO', value: purchaseStats?.totalOrders ?? 0, color: 'from-emerald-500 to-emerald-600', icon: TrendingDown },
          { label: 'Rata-rata per PO', value: formatCurrency(purchaseStats?.avgOrderValue ?? 0), color: 'from-amber-500 to-amber-600', icon: Truck },
          { label: 'Diterima Bulan Ini', value: purchaseStats?.receivedThisMonth ?? 0, color: 'from-purple-500 to-purple-600', icon: CheckCircle },
        ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{s.value}</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Export Bar */}
      <ReportExportBar
        period={filters.period}
        onPeriodChange={(v) => setFilters({ period: v })}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onDateFromChange={(v) => setFilters({ dateFrom: v })}
        onDateToChange={(v) => setFilters({ dateTo: v })}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        isExporting={isExporting}
      >
        <input
          type="text"
          placeholder="Cari PO / supplier..."
          defaultValue={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-48"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Diajukan</option>
          <option value="approved">Disetujui</option>
          <option value="received">Diterima</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </ReportExportBar>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend Pembelian */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Trend Pembelian</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={purchaseChart?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Pembelian" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Supplier */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 10 Supplier</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(purchaseChart?.topSuppliers || []).slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} name="Total Beli" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per Kategori */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Pembelian per Kategori Obat</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={purchaseChart?.byCategory || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {(purchaseChart?.byCategory || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Produk */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 10 Produk Dibeli</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(purchaseChart?.topProducts || []).slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Qty Dibeli" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Detail Pembelian</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. PO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Supplier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Tanggal</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Total</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (purchaseData || []).length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada data pembelian.</p>
                </td></tr>
              ) : (
                purchaseData.map((row) => (
                  <tr key={oid(row)} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{row.poNumber}</td>
                    <td className="px-5 py-3.5 text-gray-600">{row.supplier?.name || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{formatDate(row.orderDate || row.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(row.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={purchasePagination}
          onPageChange={(p) => setFilters({ page: p })}
          onLimitChange={(l) => setFilters({ limit: l, page: 1 })}
          label="pembelian"
        />
      </div>

      <PurchaseReportPrintTemplate payload={printPayload} />
    </div>
  );
}

function oid(o) { return o._id || o.id; }
function formatCurrency(v) {
  if (v == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
function formatNumber(v) { return new Intl.NumberFormat('id-ID').format(v); }
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
