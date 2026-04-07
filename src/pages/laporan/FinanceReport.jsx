import React, { useEffect, useState, useCallback } from 'react';
import useReportStore from '../../store/reportStore';
import ReportExportBar from '../../components/ReportExportBar';
import FinanceReportPrintTemplate from '../../components/FinanceReportPrintTemplate';
import toast from 'react-hot-toast';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export default function FinanceReport() {
  const {
    financeData, financeStats, financeChart, isLoading, isExporting,
    financeFilters: filters, setFinanceFilters: setFilters,
    fetchFinanceReport, fetchFinanceStats, fetchFinanceChart,
    exportFinanceExcel, exportFinancePdf,
  } = useReportStore();
  const [printPayload, setPrintPayload] = useState(null);

  useEffect(() => {
    fetchFinanceReport();
    fetchFinanceStats();
    fetchFinanceChart();
  }, [filters, fetchFinanceReport, fetchFinanceStats, fetchFinanceChart]);

  const handleExportExcel = async () => {
    try { await exportFinanceExcel(); toast.success('File Excel berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh Excel'); }
  };

  const handleExportPdf = async () => {
    try { await exportFinancePdf(); toast.success('File PDF berhasil diunduh'); }
    catch { toast.error('Gagal mengunduh PDF'); }
  };

  const handlePrint = useCallback(() => {
    setPrintPayload({
      stats: financeStats,
      data: financeData,
      filters,
      printedAt: new Date().toISOString(),
    });
    setTimeout(() => window.print(), 200);
  }, [financeStats, financeData, filters]);

  const pl = financeData?.profitLoss;
  const cashflow = financeData?.cashFlow;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan laba rugi dan arus kas perusahaan.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: 'Total Pendapatan', value: formatCurrency(financeStats?.totalRevenue ?? 0), color: 'from-blue-500 to-blue-600', icon: DollarSign },
          { label: 'Total Pengeluaran', value: formatCurrency(financeStats?.totalExpense ?? 0), color: 'from-red-500 to-red-600', icon: TrendingDown },
          { label: 'Laba Bersih', value: formatCurrency(financeStats?.netProfit ?? 0), color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
          { label: 'Margin', value: `${(financeStats?.margin ?? 0).toFixed(1)}%`, color: 'from-purple-500 to-purple-600', icon: Percent },
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
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue vs Expense Trend */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Pendapatan vs Pengeluaran</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financeChart?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Pendapatan" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Pengeluaran" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Trend */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Trend Laba Bersih</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeChart?.profitTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Laba Bersih" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Laba Rugi Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Ringkasan Laba Rugi</h3>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
          </div>
        ) : pl ? (
          <div className="divide-y divide-gray-100 text-sm">
            <PLRow label="Pendapatan Penjualan" value={pl.salesRevenue} bold />
            <PLRow label="Diskon & Retur" value={-(pl.discountReturn ?? 0)} indent />
            <PLRow label="Pendapatan Bersih" value={pl.netRevenue} bold highlight="blue" />
            <PLRow label="Harga Pokok Penjualan (HPP)" value={-(pl.cogs ?? 0)} />
            <PLRow label="Laba Kotor" value={pl.grossProfit} bold highlight="emerald" />
            <PLRow label="Beban Operasional" value={-(pl.operatingExpense ?? 0)} />
            <PLRow label="Beban Lain-lain" value={-(pl.otherExpense ?? 0)} indent />
            <PLRow label="Laba Bersih" value={pl.netProfit} bold highlight={pl.netProfit >= 0 ? 'emerald' : 'red'} />
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Tidak ada data laba rugi.</p>
          </div>
        )}
      </div>

      {/* Arus Kas */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Ringkasan Arus Kas</h3>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : cashflow ? (
          <div className="divide-y divide-gray-100 text-sm">
            <CashRow label="Arus Kas Operasi" inflow={cashflow.operatingIn} outflow={cashflow.operatingOut} net={cashflow.operatingNet} />
            <CashRow label="Arus Kas Investasi" inflow={cashflow.investingIn} outflow={cashflow.investingOut} net={cashflow.investingNet} />
            <CashRow label="Arus Kas Pendanaan" inflow={cashflow.financingIn} outflow={cashflow.financingOut} net={cashflow.financingNet} />
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50/80">
              <span className="font-bold text-gray-900">Total Arus Kas Bersih</span>
              <span className={`font-bold ${(cashflow.totalNet ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(cashflow.totalNet ?? 0)}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Tidak ada data arus kas.</p>
          </div>
        )}
      </div>

      <FinanceReportPrintTemplate payload={printPayload} />
    </div>
  );
}

/* ── Sub-components ── */
function PLRow({ label, value, bold, indent, highlight }) {
  const highlightMap = {
    blue: 'bg-blue-50/50',
    emerald: 'bg-emerald-50/50',
    red: 'bg-red-50/50',
  };
  return (
    <div className={`flex items-center justify-between px-5 py-3 ${highlight ? highlightMap[highlight] || '' : ''}`}>
      <span className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-600'} ${indent ? 'pl-4' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-semibold' : ''} ${(value ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {formatCurrency(value ?? 0)}
      </span>
    </div>
  );
}

function CashRow({ label, inflow, outflow, net }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className={`font-semibold ${(net ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(net ?? 0)}</span>
      </div>
      <div className="flex gap-6 mt-1 text-xs text-gray-500">
        <span>Masuk: {formatCurrency(inflow ?? 0)}</span>
        <span>Keluar: {formatCurrency(outflow ?? 0)}</span>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatCurrency(v) {
  if (v == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
