import React, { useEffect, useState, useMemo } from 'react';
import useInventoryStore from '../../store/inventoryStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import {
  Package, Boxes, AlertTriangle, X, Eye, Calendar, Search,
  Loader2, ThermometerSun, TrendingDown, Archive, FlaskConical,
  CircleDollarSign, BarChart3, ShieldCheck, ArrowUpDown,
} from 'lucide-react';

/* ── Constants ── */
const KATEGORI_OPTIONS = [
  { value: 'obat', label: 'Obat' },
  { value: 'alkes', label: 'Alkes' },
  { value: 'bhp', label: 'BHP' },
  { value: 'suplemen', label: 'Suplemen' },
  { value: 'kosmetik', label: 'Kosmetik' },
  { value: 'lainnya', label: 'Lainnya' },
];

const GOLONGAN_MAP = {
  narkotika: { label: 'Narkotika', color: 'bg-red-100 text-red-700 border-red-200' },
  psikotropika: { label: 'Psikotropika', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  obat_keras: { label: 'Obat Keras', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  obat_keras_terbatas: { label: 'Obat Keras Terbatas', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  obat_bebas_terbatas: { label: 'Obat Bebas Terbatas', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  obat_bebas: { label: 'Obat Bebas', color: 'bg-green-50 text-green-700 border-green-200' },
  obat_herbal: { label: 'Obat Herbal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  fitofarmaka: { label: 'Fitofarmaka', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  suplemen: { label: 'Suplemen', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  alkes: { label: 'Alkes', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const STOCK_STATUS = {
  normal: { label: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low: { label: 'Stok Rendah', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  out_of_stock: { label: 'Habis', color: 'bg-red-50 text-red-600 border-red-200' },
  overstock: { label: 'Overstock', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const SUHU_OPTIONS = [
  { value: 'Suhu Kamar', label: 'Suhu Kamar (25-30°C)' },
  { value: 'Sejuk', label: 'Sejuk (15-25°C)' },
  { value: 'Dingin', label: 'Dingin (2-8°C)' },
  { value: 'Beku', label: 'Beku (≤0°C)' },
];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function StockWarehouse() {
  const {
    stocks, stockStats, stockPagination, stockLoading, stockFilters,
    fetchStocks, fetchStockStats, setStockFilters,
    fetchBatches, batches, batchProduct, batchLoading,
  } = useInventoryStore();
  const { lowStockThreshold, isBatchTrackingEnabled, isFEFOEnabled } = useSettings();

  const [batchModal, setBatchModal] = useState(null); // productId to show batches

  useEffect(() => {
    fetchStocks();
    fetchStockStats();
  }, [stockFilters, fetchStocks, fetchStockStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setStockFilters({ search: value, page: 1 }), 400),
    [setStockFilters],
  );

  const openBatchDetail = (productId) => {
    setBatchModal(productId);
    fetchBatches(productId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Gudang</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring stok produk di gudang.
            {isFEFOEnabled && <span className="ml-1 text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">FEFO</span>}
            {isBatchTrackingEnabled && <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Batch Tracking</span>}
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Low ≤ {lowStockThreshold}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      {stockStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total SKU', value: stockStats.totalSKU ?? 0, color: 'from-indigo-500 to-indigo-600', icon: Package },
            { label: 'Stok Rendah', value: stockStats.lowStock ?? 0, color: 'from-amber-500 to-amber-600', icon: TrendingDown },
            { label: 'Stok Habis', value: stockStats.outOfStock ?? 0, color: 'from-red-500 to-red-600', icon: Archive },
            { label: 'Near Expiry', value: stockStats.nearExpiry ?? 0, color: 'from-orange-500 to-orange-600', icon: AlertTriangle },
            { label: 'Expired', value: stockStats.expired ?? 0, color: 'from-rose-500 to-rose-600', icon: Calendar },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{s.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Value summary */}
      {stockStats?.totalStockValue != null && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <CircleDollarSign size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Nilai Stok</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stockStats.totalStockValue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <FlaskConical size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Batch Aktif</p>
              <p className="text-lg font-bold text-gray-900">{stockStats.activeBatches ?? stockStats.totalBatches ?? 0}</p>
            </div>
          </div>
          {stockStats.totalStock != null && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Boxes size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Unit Stok</p>
                <p className="text-lg font-bold text-gray-900">{stockStats.totalStock.toLocaleString('id-ID')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama produk, SKU..."
              defaultValue={stockFilters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={stockFilters.kategori}
            onChange={(e) => setStockFilters({ kategori: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <select
            value={stockFilters.golongan}
            onChange={(e) => setStockFilters({ golongan: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Golongan</option>
            {Object.entries(GOLONGAN_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={stockFilters.stockStatus}
            onChange={(e) => setStockFilters({ stockStatus: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status Stok</option>
            {Object.entries(STOCK_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={stockFilters.suhuPenyimpanan}
            onChange={(e) => setStockFilters({ suhuPenyimpanan: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Suhu</option>
            {SUHU_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Produk</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Golongan</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Stok</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Batch</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">ED Terdekat</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data stok...</p>
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Boxes className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada data stok ditemukan.</p>
                  </td>
                </tr>
              ) : (
                stocks.map((item) => {
                  const prod = item.product || {};
                  const gol = GOLONGAN_MAP[prod.golongan];
                  const ss = STOCK_STATUS[item.stockStatus] || STOCK_STATUS.normal;
                  const nearExpiry = item.nearestExpiry ? daysUntil(item.nearestExpiry) : null;

                  return (
                    <tr key={item.productId || prod._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{prod.name || '-'}</p>
                        <p className="text-xs text-gray-400">{prod.sku || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-700 capitalize">{prod.kategori || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {gol ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${gol.color}`}>
                            {gol.label}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-bold ${item.stockStatus === 'out_of_stock' ? 'text-red-600' : item.stockStatus === 'low' ? 'text-amber-600' : 'text-gray-900'}`}>
                          {item.totalStock?.toLocaleString('id-ID') ?? 0}
                        </span>
                        <p className="text-xs text-gray-400">{prod.satuan || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 hidden md:table-cell">
                        {item.totalBatches ?? 0}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {item.nearestExpiry ? (
                          <div>
                            <p className="text-gray-700 text-xs">{formatDate(item.nearestExpiry)}</p>
                            <p className={`text-[11px] font-medium ${
                              nearExpiry <= 0 ? 'text-red-600' :
                              nearExpiry <= 90 ? 'text-amber-600' :
                              'text-gray-400'
                            }`}>
                              {nearExpiry <= 0 ? 'Expired!' : `${nearExpiry} hari`}
                            </p>
                          </div>
                        ) : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${ss.color}`}>
                          {ss.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openBatchDetail(item.productId || prod._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Lihat Detail Batch"
                          >
                            <Eye size={16} />
                          </button>
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
          pagination={stockPagination}
          onPageChange={(page) => setStockFilters({ page })}
          onLimitChange={(limit) => setStockFilters({ limit, page: 1 })}
          label="Produk"
        />
      </div>

      {/* Batch Detail Modal */}
      {batchModal && (
        <BatchDetailModal
          productId={batchModal}
          batches={batches}
          product={batchProduct}
          loading={batchLoading}
          onClose={() => setBatchModal(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   BATCH DETAIL MODAL
   ═══════════════════════════════════════ */
function BatchDetailModal({ batches, product, loading, onClose }) {
  const BATCH_STATUS = {
    active: { label: 'Aktif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    expired: { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200' },
    depleted: { label: 'Habis', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    disposed: { label: 'Dimusnahkan', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <FlaskConical size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{product?.name || 'Detail Batch'}</h2>
                <p className="text-xs text-gray-400">
                  {product?.sku || '-'} • Total Stok: <strong>{product?.totalStock ?? 0}</strong> • {product?.totalBatches ?? 0} batch
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">Memuat batch...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400 mt-2">Tidak ada batch ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const bs = BATCH_STATUS[batch.status] || BATCH_STATUS.active;
                const days = daysUntil(batch.expiryDate);
                return (
                  <div key={batch._id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Batch: {batch.batchNumber}</p>
                        <p className="text-xs text-gray-400">
                          Diterima: {formatDate(batch.receivedDate)} • Supplier: {batch.supplierId?.name || '-'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${bs.color}`}>
                        {bs.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400">Qty:</span>
                        <span className="ml-1 font-bold text-gray-900">{batch.quantity?.toLocaleString('id-ID') ?? 0}</span>
                        {batch.initialQuantity != null && (
                          <span className="text-gray-400"> / {batch.initialQuantity}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400">ED:</span>
                        <span className={`ml-1 font-medium ${days <= 0 ? 'text-red-600' : days <= 90 ? 'text-amber-600' : 'text-gray-800'}`}>
                          {formatDate(batch.expiryDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Produksi:</span>
                        <span className="ml-1 font-medium text-gray-800">{formatDate(batch.manufacturingDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThermometerSun size={12} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{batch.storageCondition || '-'}</span>
                      </div>
                    </div>
                    {batch.unitPrice != null && (
                      <p className="text-xs text-gray-400 mt-2">
                        Harga: {formatCurrency(batch.unitPrice)} / unit • Nilai: {formatCurrency(batch.quantity * batch.unitPrice)}
                      </p>
                    )}
                    {/* Expiry badge */}
                    {days != null && (
                      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        days <= 0 ? 'bg-red-100 text-red-700' :
                        days <= 30 ? 'bg-red-50 text-red-600' :
                        days <= 90 ? 'bg-amber-50 text-amber-600' :
                        days <= 180 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Calendar size={10} />
                        {days <= 0 ? 'Expired!' : `${days} hari lagi`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function formatCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
