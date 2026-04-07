import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useReportStore from '../../store/reportStore';
import Pagination from '../../components/Pagination';
import ReportExportBar from '../../components/ReportExportBar';
import StockReportPrintTemplate from '../../components/StockReportPrintTemplate';
import toast from 'react-hot-toast';
import { Loader2, Boxes, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STOCK_STATUS_COLORS = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-red-50 text-red-600',
};

const STOCK_STATUS_LABELS = {
  in_stock: 'Tersedia',
  low_stock: 'Stok Rendah',
  out_of_stock: 'Habis',
};

export default function StockReport() {
  const {
    stockData, stockStats, stockChart, stockPagination, isLoading, isExporting,
    stockFilters: filters, setStockFilters: setFilters,
    fetchStockReport, fetchStockStats, fetchStockChart,
    exportStockExcel, exportStockPdf,
  } = useReportStore();
  const [printPayload, setPrintPayload] = useState(null);

  useEffect(() => {
    fetchStockReport();
    fetchStockStats();
    fetchStockChart();
  }, [filters, fetchStockReport, fetchStockStats, fetchStockChart]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const handleExportExcel = async () => {
    try { await exportStockExcel(); toast.success('File Excel berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh Excel'); }
  };

  const handleExportPdf = async () => {
    try { await exportStockPdf(); toast.success('File PDF berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh PDF'); }
  };

  const handlePrint = useCallback(() => {
    setPrintPayload({
      stats: stockStats,
      rows: stockData || [],
      filters,
      printedAt: new Date().toISOString(),
    });
    setTimeout(() => window.print(), 200);
  }, [stockStats, stockData, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan stok barang, kategori, dan status ketersediaan.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: 'Total SKU', value: formatNumber(stockStats?.totalSku ?? 0), color: 'from-blue-500 to-blue-600', icon: Boxes },
          { label: 'Total Stok (Qty)', value: formatNumber(stockStats?.totalQty ?? 0), color: 'from-emerald-500 to-emerald-600', icon: BarChart3 },
          { label: 'Near Expiry', value: formatNumber(stockStats?.nearExpiry ?? 0), color: 'from-amber-500 to-amber-600', icon: AlertTriangle },
          { label: 'Out of Stock', value: formatNumber(stockStats?.outOfStock ?? 0), color: 'from-red-500 to-red-600', icon: XCircle },
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

      {/* Export Bar — no period selector for stock */}
      <ReportExportBar
        showPeriod={false}
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
          placeholder="Cari produk..."
          defaultValue={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-48"
        />
        <select
          value={filters.kategori}
          onChange={(e) => setFilters({ kategori: e.target.value })}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          <option value="">Semua Kategori</option>
          <option value="obat_keras">Obat Keras</option>
          <option value="obat_bebas">Obat Bebas</option>
          <option value="obat_bebas_terbatas">Obat Bebas Terbatas</option>
          <option value="narkotika">Narkotika</option>
          <option value="psikotropika">Psikotropika</option>
          <option value="alkes">Alkes</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <select
          value={filters.stockStatus}
          onChange={(e) => setFilters({ stockStatus: e.target.value })}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          <option value="">Semua Status</option>
          <option value="in_stock">Tersedia</option>
          <option value="low_stock">Stok Rendah</option>
          <option value="out_of_stock">Habis</option>
        </select>
      </ReportExportBar>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stok per Kategori */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Stok per Kategori</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChart?.byCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Produk by Stok */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 10 Produk (Stok Terbanyak)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(stockChart?.topProducts || []).slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} name="Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribusi Golongan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi Golongan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockChart?.byGolongan || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {(stockChart?.byGolongan || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatNumber(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Stok */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Ketersediaan Stok</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockChart?.byStatus || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => formatNumber(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Ringkasan Stok</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Kode</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Produk</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Stok</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Nilai Stok</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (stockData || []).length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Boxes className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada data stok.</p>
                </td></tr>
              ) : (
                stockData.map((row) => (
                  <tr key={oid(row)} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{row.code || row.sku}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{row.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{row.kategori || '-'}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatNumber(row.totalStock ?? row.stock ?? 0)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">{formatCurrency(row.stockValue ?? 0)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[row.stockStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {STOCK_STATUS_LABELS[row.stockStatus] || row.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={stockPagination}
          onPageChange={(p) => setFilters({ page: p })}
          onLimitChange={(l) => setFilters({ limit: l, page: 1 })}
          label="produk"
        />
      </div>

      <StockReportPrintTemplate payload={printPayload} />
    </div>
  );
}

function oid(o) { return o._id || o.id; }
function formatCurrency(v) {
  if (v == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
function formatNumber(v) { return new Intl.NumberFormat('id-ID').format(v); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
