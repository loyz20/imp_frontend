import React, { useEffect, useMemo } from 'react';
import useFinanceStore from '../../store/financeStore';
import {
  Wallet, TrendingUp, TrendingDown, CircleDollarSign,
  FileText, CreditCard, ArrowUpRight, ArrowDownRight,
  Loader2, BarChart3,
} from 'lucide-react';

export default function FinanceDashboard() {
  const { dashboardStats, chartData, fetchDashboardStats, fetchDashboardChart } = useFinanceStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchDashboardChart({ period: 'monthly', months: 6 });
  }, [fetchDashboardStats, fetchDashboardChart]);

  const maxChartValue = useMemo(() => {
    if (!chartData?.length) return 1;
    return Math.max(...chartData.flatMap((d) => [d.income || 0, d.expense || 0]), 1);
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan keuangan perusahaan secara real-time.</p>
      </div>

      {/* Stats Cards */}
      {dashboardStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Piutang', value: dashboardStats.totalReceivable ?? 0, color: 'from-blue-500 to-blue-600', icon: TrendingUp },
            { label: 'Total Hutang', value: dashboardStats.totalPayable ?? 0, color: 'from-red-500 to-red-600', icon: TrendingDown },
            { label: 'Invoice Outstanding', value: dashboardStats.invoiceOutstanding ?? 0, color: 'from-amber-500 to-amber-600', icon: FileText },
            { label: 'Pembayaran Bulan Ini', value: dashboardStats.paymentsThisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CreditCard },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(s.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Additional Stats Row */}
      {dashboardStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Invoice Overdue', value: dashboardStats.invoiceOverdue ?? 0, color: 'text-red-600', icon: ArrowDownRight, isCount: true },
            { label: 'Memo Pending', value: dashboardStats.memoPending ?? 0, color: 'text-amber-600', icon: FileText, isCount: true },
            { label: 'Unreconciled', value: dashboardStats.unreconciledCount ?? 0, color: 'text-orange-600', icon: BarChart3, isCount: true },
            { label: 'Kas & Bank', value: dashboardStats.cashBalance ?? 0, color: 'text-emerald-600', icon: Wallet },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{s.label}</p>
                  <Icon size={14} className={s.color} />
                </div>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>
                  {s.isCount ? s.value : formatCurrency(s.value)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart — Income vs Expense */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Pemasukan vs Pengeluaran</h2>
            <p className="text-xs text-gray-500">6 bulan terakhir</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-400" />
              Pengeluaran
            </span>
          </div>
        </div>

        {chartData?.length ? (
          <div className="flex items-end gap-3 h-48">
            {chartData.map((d, i) => {
              const incH = ((d.income || 0) / maxChartValue) * 100;
              const expH = ((d.expense || 0) / maxChartValue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 h-40 w-full justify-center">
                    <div
                      className="w-5 bg-emerald-500 rounded-t-md transition-all"
                      style={{ height: `${Math.max(incH, 2)}%` }}
                      title={`Pemasukan: ${formatCurrency(d.income || 0)}`}
                    />
                    <div
                      className="w-5 bg-red-400 rounded-t-md transition-all"
                      style={{ height: `${Math.max(expH, 2)}%` }}
                      title={`Pengeluaran: ${formatCurrency(d.expense || 0)}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{d.label || d.month}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Belum ada data chart
          </div>
        )}
      </div>

      {/* Quick Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Receivables */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Top 5 Piutang Terbesar</h2>
          <div className="space-y-2">
            {(dashboardStats?.topReceivables || []).length > 0 ? (
              dashboardStats.topReceivables.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.customerName || r.name}</p>
                    <p className="text-xs text-gray-400">{r.invoiceCount || 0} invoice</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{formatCurrency(r.amount || r.totalOutstanding)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Tidak ada data</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Pembayaran Terakhir</h2>
          <div className="space-y-2">
            {(dashboardStats?.recentPayments || []).length > 0 ? (
              dashboardStats.recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {p.type === 'incoming' ? (
                      <ArrowUpRight size={14} className="text-emerald-500" />
                    ) : (
                      <ArrowDownRight size={14} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.reference || p.paymentNumber}</p>
                      <p className="text-xs text-gray-400">{formatDateShort(p.date || p.paymentDate)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${p.type === 'incoming' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.type === 'incoming' ? '+' : '-'}{formatCurrency(p.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Tidak ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
