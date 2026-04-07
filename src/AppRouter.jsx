import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthRoutes } from "./routes";
import useAuthStore from "./store/authStore";
import AuthGuard from "./middlewares/AuthGuard";
import MaintenanceGuard from "./middlewares/MaintenanceGuard";
import SettingsProvider from "./providers/SettingsProvider";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ProductManagement from "./pages/master/ProductManagement";
import SupplierManagement from "./pages/master/SupplierManagement";
import CustomerManagement from "./pages/master/CustomerManagement";
import PurchaseOrder from "./pages/transaksi/PurchaseOrder";
import GoodsReceiving from "./pages/transaksi/GoodsReceiving";
import SalesOrder from "./pages/transaksi/SalesOrder";
import Return from "./pages/transaksi/Return";
import StockWarehouse from "./pages/inventory/StockWarehouse";
import StockMutation from "./pages/inventory/StockMutation";
import StockOpname from "./pages/inventory/StockOpname";
import StockCard from "./pages/inventory/StockCard";
import ExpiredTracking from "./pages/inventory/ExpiredTracking";
import AccountsReceivable from "./pages/finance/AccountsReceivable";
import AccountsPayable from "./pages/finance/AccountsPayable";
import GeneralLedger from "./pages/finance/GeneralLedger";
import CashBank from "./pages/finance/CashBank";
import SalesReport from "./pages/laporan/SalesReport";
import PurchaseReport from "./pages/laporan/PurchaseReport";
import StockReport from "./pages/laporan/StockReport";
import FinanceReport from "./pages/laporan/FinanceReport";
import ExpiredReport from "./pages/laporan/ExpiredReport";
import SuratPesananKhusus from "./pages/regulasi/SuratPesananKhusus";
import EReportBPOM from "./pages/regulasi/EReportBPOM";
import DokumenPerizinan from "./pages/regulasi/DokumenPerizinan";

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/auth/login" replace />
  );
}

function AppRouter() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: "12px", padding: "12px 16px", fontSize: "14px" },
        }}
      />
      <SettingsProvider>
        <Routes>
          {/* Root redirect - if logged in go to dashboard, otherwise go to login */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth module routes (guest only) */}
          <Route path="/auth/*" element={<AuthRoutes />} />

          {/* Direct login route for backward compatibility */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />

          {/* Protected routes wrapped in MainLayout */}
          <Route
            element={
              <AuthGuard>
                <MaintenanceGuard>
                  <MainLayout />
                </MaintenanceGuard>
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/master/produk" element={<ProductManagement />} />
            <Route path="/master/supplier" element={<SupplierManagement />} />
            <Route path="/master/pelanggan" element={<CustomerManagement />} />
            <Route path="/transaksi/pembelian" element={<PurchaseOrder />} />
            <Route path="/transaksi/penerimaan" element={<GoodsReceiving />} />
            <Route path="/transaksi/penjualan" element={<SalesOrder />} />
            <Route path="/transaksi/pengiriman" element={<Navigate to="/transaksi/penjualan" replace />} />
            <Route path="/transaksi/retur" element={<Return />} />
            <Route path="/inventori/stok" element={<StockWarehouse />} />
            <Route path="/inventori/mutasi" element={<StockMutation />} />
            <Route path="/inventori/opname" element={<StockOpname />} />
            <Route path="/inventori/kartu" element={<StockCard />} />
            <Route path="/inventori/expired" element={<ExpiredTracking />} />
            <Route path="/keuangan/dashboard" element={<Navigate to="/keuangan/ledger?tab=accounts" replace />} />
            <Route path="/keuangan/invoice" element={<Navigate to="/keuangan/piutang" replace />} />
            <Route path="/keuangan/piutang" element={<AccountsReceivable />} />
            <Route path="/keuangan/hutang" element={<AccountsPayable />} />
            <Route path="/keuangan/pembayaran" element={<Navigate to="/keuangan/piutang" replace />} />
            <Route path="/keuangan/memo" element={<Navigate to="/keuangan/ledger?tab=journals" replace />} />
            <Route path="/keuangan/ledger" element={<GeneralLedger />} />
            <Route path="/keuangan/rekonsiliasi" element={<CashBank />} />
            <Route path="/laporan/penjualan" element={<SalesReport />} />
            <Route path="/laporan/pembelian" element={<PurchaseReport />} />
            <Route path="/laporan/stok" element={<StockReport />} />
            <Route path="/laporan/keuangan" element={<FinanceReport />} />
            <Route path="/laporan/expired" element={<ExpiredReport />} />
            <Route path="/regulasi/surat-pesanan" element={<SuratPesananKhusus />} />
            <Route path="/regulasi/e-report" element={<EReportBPOM />} />
            <Route path="/regulasi/perizinan" element={<DokumenPerizinan />} />
            {/* Add more protected routes here:
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/reports/overview" element={<ReportsOverview />} />
            <Route path="/reports/analytics" element={<ReportsAnalytics />} />
            <Route path="/profile" element={<Profile />} />
            */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default AppRouter;