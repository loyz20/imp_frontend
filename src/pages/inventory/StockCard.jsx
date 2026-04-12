import React, { useEffect, useState } from 'react';
import useInventoryStore from '../../store/inventoryStore';
import AutocompleteInput from '../../components/AutocompleteInput';
import Pagination from '../../components/Pagination';
import productService from '../../services/productService';
import {
  FileSpreadsheet, Loader2, Search, ArrowDownToLine, ArrowUpFromLine,
  Settings2, Trash2, RefreshCw, Undo2, Calendar, Package,
  TrendingUp, TrendingDown, BarChart3,
} from 'lucide-react';

/* ── Constants ── */
const MUTATION_TYPE = {
  in:         { label: 'Masuk',        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowDownToLine },
  out:        { label: 'Keluar',       color: 'bg-red-50 text-red-600 border-red-200',             icon: ArrowUpFromLine },
  adjustment: { label: 'Penyesuaian',  color: 'bg-blue-50 text-blue-700 border-blue-200',          icon: Settings2 },
  disposal:   { label: 'Pemusnahan',   color: 'bg-rose-50 text-rose-600 border-rose-200',          icon: Trash2 },
  transfer:   { label: 'Transfer',     color: 'bg-purple-50 text-purple-700 border-purple-200',    icon: RefreshCw },
  return:     { label: 'Retur',        color: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Undo2 },
};

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
/* normalize backend UPPERCASE types to lowercase for badge lookup */
const normalizeType = (type) => (type || '').toLowerCase();

export default function StockCard() {
  const {
    stockCard, stockCardLoading, stockCardFilters, stockCardPagination,
    fetchStockCard, setStockCardFilters,
  } = useInventoryStore();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');

  useEffect(() => {
    if (selectedProductId) {
      fetchStockCard(selectedProductId);
    }
  }, [selectedProductId, stockCardFilters, fetchStockCard]);

  const handleProductSelect = (product) => {
    setSelectedProductId(product._id);
    setProductName(product.name);
  };

  const handleProductClear = () => {
    setSelectedProductId('');
    setProductName('');
  };

  const product = stockCard?.product;
  const entries = (stockCard?.entries || stockCard?.mutations || []).map((entry) => {
    if (entry?.quantityIn != null || entry?.quantityOut != null) return entry;

    const qty = Number(entry?.quantity || 0);
    return {
      ...entry,
      _id: entry?._id || entry?.id,
      mutationNumber: entry?.mutationNumber || entry?.referenceNumber || '',
      description: entry?.description || entry?.notes || '',
      quantityIn: qty > 0 ? qty : 0,
      quantityOut: qty < 0 ? Math.abs(qty) : 0,
      balance: Number(entry?.balance ?? entry?.balanceAfter ?? 0),
    };
  });

  const summary = stockCard?.summary || {
    openingBalance: entries.length ? Number(entries[0]?.balanceBefore ?? 0) : 0,
    totalIn: entries.reduce((sum, e) => sum + Number(e?.quantityIn || 0), 0),
    totalOut: entries.reduce((sum, e) => sum + Number(e?.quantityOut || 0), 0),
    netChange: entries.reduce((sum, e) => sum + Number(e?.quantityIn || 0) - Number(e?.quantityOut || 0), 0),
    closingBalance: entries.length ? Number(entries[entries.length - 1]?.balance ?? entries[entries.length - 1]?.balanceAfter ?? 0) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kartu Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Riwayat kronologis mutasi stok per produk.</p>
      </div>

      {/* Product search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Produk</label>
        <div className="max-w-lg">
          <AutocompleteInput
            value={productName}
            onChange={(val) => setProductName(val)}
            onSelect={handleProductSelect}
            onClear={handleProductClear}
            fetchFn={(params) => productService.getAll(params)}
            renderItem={(item) => (
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">{item.sku} • {item.kategori} • {item.satuan}</p>
              </div>
            )}
            getDisplayText={(item) => item.name}
            placeholder="Cari nama produk atau SKU..."
            searchParams={{ isActive: true }}
          />
        </div>
      </div>

      {/* No product selected */}
      {!selectedProductId && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Pilih produk untuk melihat kartu stok.</p>
        </div>
      )}

      {/* Loading */}
      {selectedProductId && stockCardLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Memuat kartu stok...</p>
        </div>
      )}

      {/* Product info + Summary */}
      {selectedProductId && !stockCardLoading && product && (
        <>
          {/* Product card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Package size={20} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                <p className="text-sm text-gray-400">{product.sku}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {(product.kategori || product.category) && <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{product.kategori || product.category}</span>}
                  {product.golongan && <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{product.golongan?.replace(/_/g, ' ')}</span>}
                  {product.satuan && <span className="bg-gray-100 px-2 py-0.5 rounded">{product.satuan}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stok Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900">{product.totalStock?.toLocaleString('id-ID') ?? 0}</p>
                <p className="text-xs text-gray-400">{product.totalBatches ?? 0} batch</p>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Saldo Awal', value: summary.openingBalance ?? 0, color: 'from-gray-500 to-gray-600', icon: BarChart3 },
                { label: 'Total Masuk', value: summary.totalIn ?? 0, color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
                { label: 'Total Keluar', value: summary.totalOut ?? 0, color: 'from-red-500 to-red-600', icon: TrendingDown },
                { label: 'Perubahan Bersih', value: summary.netChange ?? 0, color: 'from-blue-500 to-blue-600', icon: BarChart3 },
                { label: 'Saldo Akhir', value: summary.closingBalance ?? 0, color: 'from-indigo-500 to-indigo-600', icon: Package },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                        <Icon size={16} className="text-white" strokeWidth={2} />
                      </div>
                      <span className="text-xl font-bold text-gray-900">{s.value.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={stockCardFilters.type}
                onChange={(e) => setStockCardFilters({ type: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="">Semua Tipe</option>
                {Object.entries(MUTATION_TYPE).map(([k, v]) => (
                  <option key={k} value={k.toUpperCase()}>{v.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={stockCardFilters.dateFrom}
                onChange={(e) => setStockCardFilters({ dateFrom: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              />
              <input
                type="date"
                value={stockCardFilters.dateTo}
                onChange={(e) => setStockCardFilters({ dateTo: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              />
            </div>
          </div>

          {/* Entries table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Mutasi</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Tipe</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Batch</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Referensi</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Keterangan</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-600 w-20">Masuk</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-600 w-20">Keluar</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-gray-600 w-24">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center">
                        <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm text-gray-400 mt-2">Belum ada riwayat mutasi untuk produk ini.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => {
                      const mt = MUTATION_TYPE[normalizeType(entry.type)] || MUTATION_TYPE.in;
                      const TypeIcon = mt.icon;
                      return (
                        <tr key={entry._id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <p className="text-xs text-gray-700">{formatDate(entry.mutationDate)}</p>
                            <p className="text-[11px] text-gray-400">{formatTime(entry.mutationDate)}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-mono text-xs text-gray-700">{entry.mutationNumber || '-'}</p>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${mt.color}`}>
                              <TypeIcon size={10} />
                              {mt.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <span className="font-mono text-xs text-gray-600">{entry.batchNumber || '-'}</span>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <p className="text-xs text-gray-700">{entry.referenceNumber || '-'}</p>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <p className="text-xs text-gray-500 truncate max-w-50">{entry.description || '-'}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {entry.quantityIn > 0 ? (
                              <span className="font-bold text-emerald-600">+{entry.quantityIn.toLocaleString('id-ID')}</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {entry.quantityOut > 0 ? (
                              <span className="font-bold text-red-600">-{entry.quantityOut.toLocaleString('id-ID')}</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-bold text-gray-900">{entry.balance?.toLocaleString('id-ID') ?? '-'}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={stockCardPagination}
              onPageChange={(page) => setStockCardFilters({ page })}
              onLimitChange={(limit) => setStockCardFilters({ limit, page: 1 })}
              label="Entri"
            />
          </div>
        </>
      )}

      {/* No data for product */}
      {selectedProductId && !stockCardLoading && !product && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Data kartu stok tidak ditemukan untuk produk ini.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
