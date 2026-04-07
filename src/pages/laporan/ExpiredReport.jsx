import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useReportStore from '../../store/reportStore';
import Pagination from '../../components/Pagination';
import ReportExportBar from '../../components/ReportExportBar';
import ExpiredReportPrintTemplate from '../../components/ExpiredReportPrintTemplate';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle, Clock, ShieldAlert, AlertOctagon } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const URGENCY_COLORS = {
  expired: 'bg-red-100 text-red-700',
  critical: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  caution: 'bg-yellow-50 text-yellow-700',
  safe: 'bg-emerald-50 text-emerald-700',
};

const URGENCY_LABELS = {
  expired: 'Kadaluarsa',
  critical: 'Kritis (≤30hr)',
  warning: 'Warning (≤90hr)',
  caution: 'Perhatian (≤180hr)',
  safe: 'Aman',
};

export default function ExpiredReport() {
  const {
    expiredData, expiredStats, expiredChart, expiredPagination, isLoading, isExporting,
    expiredFilters: filters, setExpiredFilters: setFilters,
    fetchExpiredReport, fetchExpiredStats, fetchExpiredChart,
    exportExpiredExcel, exportExpiredPdf,
  } = useReportStore();
  const [printPayload, setPrintPayload] = useState(null);

  useEffect(() => {
    fetchExpiredReport();
    fetchExpiredStats();
    fetchExpiredChart();
  }, [filters, fetchExpiredReport, fetchExpiredStats, fetchExpiredChart]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const handleExportExcel = async () => {
    try { await exportExpiredExcel(); toast.success('File Excel berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh Excel'); }
  };

  const handleExportPdf = async () => {
    try { await exportExpiredPdf(); toast.success('File PDF berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh PDF'); }
  };

  const handlePrint = useCallback(() => {
    setPrintPayload({
      stats: expiredStats,
      rows: expiredData || [],
      filters,
      printedAt: new Date().toISOString(),
    });
    setTimeout(() => window.print(), 200);
  }, [expiredStats, expiredData, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Obat Kadaluarsa</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoring obat mendekati atau sudah melewati tanggal kadaluarsa.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: 'Total Expired', value: expiredStats?.totalExpired ?? 0, color: 'from-red-500 to-red-600', icon: AlertOctagon },
          { label: 'Kritis (≤30 Hari)', value: expiredStats?.critical ?? 0, color: 'from-orange-500 to-orange-600', icon: ShieldAlert },
          { label: 'Warning (≤90 Hari)', value: expiredStats?.warning ?? 0, color: 'from-amber-500 to-amber-600', icon: AlertTriangle },
          { label: 'Perhatian (≤180 Hari)', value: expiredStats?.caution ?? 0, color: 'from-yellow-500 to-yellow-600', icon: Clock },
        ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(s.value)}</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Export Bar */}
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
          placeholder="Cari produk / batch..."
          defaultValue={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-48"
        />
        <select
          value={filters.expiryStatus}
          onChange={(e) => setFilters({ expiryStatus: e.target.value })}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          <option value="">Semua Status</option>
          <option value="expired">Kadaluarsa</option>
          <option value="critical">Kritis (≤30hr)</option>
          <option value="warning">Warning (≤90hr)</option>
          <option value="caution">Perhatian (≤180hr)</option>
        </select>
        <select
          value={filters.golongan}
          onChange={(e) => setFilters({ golongan: e.target.value })}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          <option value="">Semua Golongan</option>
          <option value="obat_keras">Obat Keras</option>
          <option value="obat_bebas">Obat Bebas</option>
          <option value="obat_bebas_terbatas">Obat Bebas Terbatas</option>
          <option value="narkotika">Narkotika</option>
          <option value="psikotropika">Psikotropika</option>
        </select>
      </ReportExportBar>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Urgency */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi per Tingkat Urgensi</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiredChart?.byUrgency || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Jumlah Batch">
                    {(expiredChart?.byUrgency || []).map((entry, i) => {
                      const colorMap = { expired: '#ef4444', critical: '#f97316', warning: '#f59e0b', caution: '#eab308', safe: '#10b981' };
                      return <Cell key={i} fill={colorMap[entry.key] || CHART_COLORS[i % CHART_COLORS.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Golongan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi per Golongan Obat</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expiredChart?.byGolongan || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {(expiredChart?.byGolongan || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
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
          <h3 className="text-sm font-semibold text-gray-700">Detail Obat Kadaluarsa / Mendekati Kadaluarsa</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Produk</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Batch</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Tanggal ED</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Sisa Hari</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Qty</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Nilai</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : (expiredData || []).length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada data obat kadaluarsa.</p>
                </td></tr>
              ) : (
                expiredData.map((row, idx) => (
                  <tr key={row._id || row.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{row.productName || row.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{row.batchNumber}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{formatDate(row.expiryDate)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-medium ${(row.daysRemaining ?? 0) <= 0 ? 'text-red-600' : (row.daysRemaining ?? 0) <= 30 ? 'text-orange-600' : (row.daysRemaining ?? 0) <= 90 ? 'text-amber-600' : 'text-yellow-600'}`}>
                        {row.daysRemaining ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatNumber(row.qty ?? 0)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">{formatCurrency(row.value ?? 0)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${URGENCY_COLORS[row.expiryStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {URGENCY_LABELS[row.expiryStatus] || row.expiryStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={expiredPagination}
          onPageChange={(p) => setFilters({ page: p })}
          onLimitChange={(l) => setFilters({ limit: l, page: 1 })}
          label="obat"
        />
      </div>

      <ExpiredReportPrintTemplate payload={printPayload} />
    </div>
  );
}

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
