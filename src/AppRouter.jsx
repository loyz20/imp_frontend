import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthRoutes } from "./routes";
import useAuthStore from "./store/authStore";
import AuthGuard from "./middlewares/AuthGuard";
import MaintenanceGuard from "./middlewares/MaintenanceGuard";
import SettingsProvider from "./providers/SettingsProvider";
import MainLayout from "./layouts/MainLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const ProductManagement = lazy(() => import("./pages/master/ProductManagement"));
const SupplierManagement = lazy(() => import("./pages/master/SupplierManagement"));
const CustomerManagement = lazy(() => import("./pages/master/CustomerManagement"));
const PurchaseOrder = lazy(() => import("./pages/transaksi/PurchaseOrder"));
const GoodsReceiving = lazy(() => import("./pages/transaksi/GoodsReceiving"));
const SalesOrder = lazy(() => import("./pages/transaksi/SalesOrder"));
const Return = lazy(() => import("./pages/transaksi/Return"));
const StockWarehouse = lazy(() => import("./pages/inventory/StockWarehouse"));
const StockMutation = lazy(() => import("./pages/inventory/StockMutation"));
const StockOpname = lazy(() => import("./pages/inventory/StockOpname"));
const StockCard = lazy(() => import("./pages/inventory/StockCard"));
const ExpiredTracking = lazy(() => import("./pages/inventory/ExpiredTracking"));
const AccountsReceivable = lazy(() => import("./pages/finance/AccountsReceivable"));
const AccountsPayable = lazy(() => import("./pages/finance/AccountsPayable"));
const GeneralLedger = lazy(() => import("./pages/finance/GeneralLedger"));
const CashBank = lazy(() => import("./pages/finance/CashBank"));
const SalesReport = lazy(() => import("./pages/laporan/SalesReport"));
const PurchaseReport = lazy(() => import("./pages/laporan/PurchaseReport"));
const StockReport = lazy(() => import("./pages/laporan/StockReport"));
const FinanceReport = lazy(() => import("./pages/laporan/FinanceReport"));
const ExpiredReport = lazy(() => import("./pages/laporan/ExpiredReport"));
const SuratPesananKhusus = lazy(() => import("./pages/regulasi/SuratPesananKhusus"));
const EReportBPOM = lazy(() => import("./pages/regulasi/EReportBPOM"));
const DokumenPerizinan = lazy(() => import("./pages/regulasi/DokumenPerizinan"));

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

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
            <Route path="/dashboard" element={withSuspense(<Dashboard />)} />
            <Route path="/settings" element={withSuspense(<Settings />)} />
            <Route path="/users" element={withSuspense(<UserManagement />)} />
            <Route path="/master/produk" element={withSuspense(<ProductManagement />)} />
            <Route path="/master/supplier" element={withSuspense(<SupplierManagement />)} />
            <Route path="/master/pelanggan" element={withSuspense(<CustomerManagement />)} />
            <Route path="/transaksi/pembelian" element={withSuspense(<PurchaseOrder />)} />
            <Route path="/transaksi/penerimaan" element={withSuspense(<GoodsReceiving />)} />
            <Route path="/transaksi/penjualan" element={withSuspense(<SalesOrder />)} />
            <Route path="/transaksi/pengiriman" element={<Navigate to="/transaksi/penjualan" replace />} />
            <Route path="/transaksi/retur" element={withSuspense(<Return />)} />
            <Route path="/inventori/stok" element={withSuspense(<StockWarehouse />)} />
            <Route path="/inventori/mutasi" element={withSuspense(<StockMutation />)} />
            <Route path="/inventori/opname" element={withSuspense(<StockOpname />)} />
            <Route path="/inventori/kartu" element={withSuspense(<StockCard />)} />
            <Route path="/inventori/expired" element={withSuspense(<ExpiredTracking />)} />
            <Route path="/keuangan/dashboard" element={<Navigate to="/keuangan/ledger?tab=accounts" replace />} />
            <Route path="/keuangan/invoice" element={<Navigate to="/keuangan/piutang" replace />} />
            <Route path="/keuangan/piutang" element={withSuspense(<AccountsReceivable />)} />
            <Route path="/keuangan/hutang" element={withSuspense(<AccountsPayable />)} />
            <Route path="/keuangan/pembayaran" element={<Navigate to="/keuangan/piutang" replace />} />
            <Route path="/keuangan/memo" element={<Navigate to="/keuangan/ledger?tab=journals" replace />} />
            <Route path="/keuangan/ledger" element={withSuspense(<GeneralLedger />)} />
            <Route path="/keuangan/rekonsiliasi" element={withSuspense(<CashBank />)} />
            <Route path="/laporan/penjualan" element={withSuspense(<SalesReport />)} />
            <Route path="/laporan/pembelian" element={withSuspense(<PurchaseReport />)} />
            <Route path="/laporan/stok" element={withSuspense(<StockReport />)} />
            <Route path="/laporan/keuangan" element={withSuspense(<FinanceReport />)} />
            <Route path="/laporan/expired" element={withSuspense(<ExpiredReport />)} />
            <Route path="/regulasi/surat-pesanan" element={withSuspense(<SuratPesananKhusus />)} />
            <Route path="/regulasi/e-report" element={withSuspense(<EReportBPOM />)} />
            <Route path="/regulasi/perizinan" element={withSuspense(<DokumenPerizinan />)} />
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