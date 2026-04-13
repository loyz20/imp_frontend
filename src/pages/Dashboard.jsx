import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, FileWarning, ShieldAlert, Clock,
  Package, Users, FileText, TrendingUp, TrendingDown,
  ShoppingCart, Truck, Loader2, AlertCircle, Pill,
  Wallet, CreditCard, BarChart3,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettings from '../hooks/useSettings';
import useSettingsStore from '../store/settingsStore';
import useProductStore from '../store/productStore';
import useSalesOrderStore from '../store/salesOrderStore';
import usePurchaseOrderStore from '../store/purchaseOrderStore';
import useInventoryStore from '../store/inventoryStore';
import useFinanceStore from '../store/financeStore';
import useUserStore from '../store/userStore';
import { formatDate, formatCurrency } from '../utils/format';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { companyName, isBatchTrackingEnabled, requirePOApproval, activeAlerts, medication } = useSettings();

  // Settings & License
  const licenseWarnings = useSettingsStore((s) => s.licenseWarnings);
  const fetchLicenseWarnings = useSettingsStore((s) => s.fetchLicenseWarnings);

  // Stats from stores
  const productStats = useProductStore((s) => s.stats);
  const fetchProductStats = useProductStore((s) => s.fetchStats);
  const soStats = useSalesOrderStore((s) => s.stats);
  const fetchSOStats = useSalesOrderStore((s) => s.fetchStats);
  const poStats = usePurchaseOrderStore((s) => s.stats);
  const fetchPOStats = usePurchaseOrderStore((s) => s.fetchStats);
  const stockStats = useInventoryStore((s) => s.stockStats);
  const fetchStockStats = useInventoryStore((s) => s.fetchStockStats);
  const expiredStats = useInventoryStore((s) => s.expiredStats);
  const fetchExpiredStats = useInventoryStore((s) => s.fetchExpiredStats);
  const financeStats = useFinanceStore((s) => s.dashboardStats);
  const chartData = useFinanceStore((s) => s.chartData);
  const fetchFinanceStats = useFinanceStore((s) => s.fetchDashboardStats);
  const fetchFinanceChart = useFinanceStore((s) => s.fetchDashboardChart);
  const userStats = useUserStore((s) => s.stats);
  const fetchUserStats = useUserStore((s) => s.fetchStats);

  const role = user?.role;
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isFinance = role === 'keuangan' || isAdmin;
  const isWarehouse = role === 'gudang' || isAdmin;
  const isSales = role === 'sales' || isAdmin;

  useEffect(() => {
    // All roles see product & inventory overview
    fetchProductStats();
    fetchStockStats();
    fetchExpiredStats();

    if (isAdmin) {
      fetchLicenseWarnings();
      fetchUserStats();
    }
    if (isSales || isAdmin) fetchSOStats();
    if (isWarehouse || isAdmin) fetchPOStats();
    if (isFinance) {
      fetchFinanceStats();
      fetchFinanceChart({ period: 'monthly', months: 6 });
    }
  }, [
    role, isAdmin, isFinance, isWarehouse, isSales,
    fetchProductStats, fetchStockStats, fetchExpiredStats,
    fetchLicenseWarnings, fetchUserStats, fetchSOStats, fetchPOStats,
    fetchFinanceStats, fetchFinanceChart,
  ]);

  // Chart helpers
  const maxChartValue = useMemo(() => {
    if (!chartData?.length) return 1;
    return Math.max(...chartData.flatMap((d) => [(d.revenue || d.income) || 0, d.expense || 0]), 1);
  }, [chartData]);

  // Primary KPI cards
  const primaryStats = [
    { label: 'Total Produk', value: productStats?.total ?? productStats?.totalProducts ?? '-', icon: Package, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Sales Order', value: soStats?.total ?? soStats?.totalOrders ?? '-', icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', show: isSales },
    { label: 'Purchase Order', value: poStats?.total ?? poStats?.totalOrders ?? '-', icon: Truck, color: 'from-amber-500 to-amber-600', show: isWarehouse },
    { label: 'Near Expiry', value: expiredStats?.nearExpiry ?? expiredStats?.nearExpiryCount ?? '-', icon: AlertCircle, color: 'from-rose-500 to-rose-600' },
  ].filter((s) => s.show !== false);

  // Finance KPI cards (admin/keuangan only)
  const financeCards = isFinance && financeStats ? [
    { label: 'Total Pendapatan', value: financeStats.totalRevenue ?? 0, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', currency: true },
    { label: 'Total Pengeluaran', value: financeStats.totalExpense ?? 0, icon: TrendingDown, color: 'from-red-500 to-red-600', currency: true },
    { label: 'Laba Bersih', value: financeStats.netProfit ?? 0, icon: BarChart3, color: 'from-blue-500 to-blue-600', currency: true },
    { label: 'Margin Keuntungan', value: financeStats.margin ?? 0, icon: Wallet, color: 'from-purple-500 to-purple-600', isPercentage: true },
  ] : null;

  // Role-based quick actions
  const quickActions = (() => {
    const all = {
      po: { label: 'Buat Surat Pesanan', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', path: '/transaksi/pembelian' },
      so: { label: 'Buat Sales Order', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', path: '/transaksi/penjualan' },
      produk: { label: 'Kelola Produk', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100', path: '/master/produk' },
      stok: { label: 'Lihat Stok', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', path: '/inventori/stok' },
      laporan: { label: 'Lihat Laporan', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', path: '/laporan/penjualan' },
      invoice: { label: 'Kelola Invoice', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', path: '/keuangan/piutang' },
      pembayaran: { label: 'Pembayaran', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', path: '/keuangan/hutang' },
      settings: { label: 'Pengaturan', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100', path: '/settings' },
    };
    if (isAdmin) return [all.po, all.so, all.produk, all.stok, all.laporan, all.settings];
    if (role === 'sales') return [all.so, all.produk, all.laporan];
    if (role === 'gudang') return [all.stok, all.po, all.produk];
    if (role === 'keuangan') return [all.invoice, all.pembayaran, all.laporan];
    if (role === 'apoteker') return [all.produk, all.stok];
    return [all.produk, all.laporan];
  })();

  const statsLoading = productStats == null && soStats == null && poStats == null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.name || 'User'}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {companyName ? `${companyName} — ` : ''}Berikut ringkasan aktivitas terbaru Anda.
        </p>
      </div>

      {/* License Warnings (admin only) */}
      {isAdmin && licenseWarnings.length > 0 && (
        <div className="space-y-2">
          {licenseWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                w.status === 'expired'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {w.status === 'expired' ? (
                <ShieldAlert className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {w.status === 'expired' ? 'EXPIRED' : 'Segera Expired'}: {w.license} — {w.number || '-'}
                </p>
                <p className="text-xs mt-0.5 opacity-75">
                  {w.status === 'expired'
                    ? `Sudah expired ${Math.abs(w.daysUntilExpiry)} hari lalu`
                    : `Expired dalam ${w.daysUntilExpiry} hari (${formatDate(w.expiryDate)})`}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings?tab=licenses')}
                className="text-xs font-medium underline shrink-0 hover:opacity-80"
              >
                Kelola
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Settings Indicators */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          {isBatchTrackingEnabled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Package className="w-3 h-3" /> Batch Tracking Aktif
            </span>
          )}
          {requirePOApproval && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <FileWarning className="w-3 h-3" /> PO Butuh Approval
            </span>
          )}
          {medication?.requireSpecialSP && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3 h-3" /> SP Khusus NK/PS
            </span>
          )}
          {activeAlerts?.nearExpiry && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" /> Alert Near-Expiry
            </span>
          )}
        </div>
      )}

      {/* Primary KPI Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Finance KPI Cards (admin/keuangan) */}
      {financeCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {financeCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {s.isPercentage ? `${s.value.toFixed(1)}%` : s.currency ? formatCurrency(s.value) : s.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Income vs Expense Chart (admin/keuangan) */}
      {isFinance && (
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
                const incH = (((d.revenue || d.income) || 0) / maxChartValue) * 100;
                const expH = ((d.expense || 0) / maxChartValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-40 w-full justify-center">
                      <div
                        className="w-5 bg-emerald-500 rounded-t-md transition-all"
                        style={{ height: `${Math.max(incH, 2)}%` }}
                        title={`Pemasukan: ${formatCurrency((d.revenue || d.income) || 0)}`}
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
              {chartData === null ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Belum ada data chart'}
            </div>
          )}
        </div>
      )}

      {/* Bottom grid: Inventory Alerts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inventory Alerts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Peringatan Inventory</h2>

          {stockStats || expiredStats ? (
            <div className="space-y-3">
              {/* Stock overview */}
              {stockStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total SKU', value: stockStats.totalSKU ?? stockStats.totalSku ?? stockStats.total ?? '-', icon: Package, cls: 'text-gray-600' },
                    { label: 'Stok Rendah', value: stockStats.lowStock ?? stockStats.lowStockCount ?? 0, icon: AlertTriangle, cls: 'text-amber-600' },
                    { label: 'Stok Habis', value: stockStats.outOfStock ?? stockStats.outOfStockCount ?? 0, icon: AlertCircle, cls: 'text-red-600' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <Icon size={16} className={item.cls} />
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className={`text-lg font-bold ${item.cls}`}>{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expired overview */}
              {expiredStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {[
                    { label: 'Sudah Expired', value: expiredStats.expired ?? expiredStats.expiredCount ?? 0, icon: ShieldAlert, cls: 'text-red-600' },
                    { label: 'Near Expiry', value: expiredStats.nearExpiry ?? expiredStats.nearExpiryCount ?? 0, icon: Clock, cls: 'text-amber-600' },
                    { label: 'Aman', value: expiredStats.safe ?? expiredStats.safeCount ?? '-', icon: Pill, cls: 'text-emerald-600' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <Icon size={16} className={item.cls} />
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className={`text-lg font-bold ${item.cls}`}>{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Admin extra: user count */}
              {isAdmin && userStats && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 mt-2">
                  <Users size={16} className="text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Pengguna</p>
                    <p className="text-lg font-bold text-indigo-600">{userStats.total ?? userStats.totalUsers ?? '-'}</p>
                  </div>
                  {userStats.active != null && (
                    <span className="ml-auto text-xs text-gray-500">{userStats.active} aktif</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((btn) => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
