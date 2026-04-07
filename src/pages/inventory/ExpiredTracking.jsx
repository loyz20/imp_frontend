import React, { useEffect, useState, useMemo } from 'react';
import useInventoryStore from '../../store/inventoryStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Calendar, Clock, Loader2, X, Trash2, Search,
  ShieldAlert, FlaskConical, Package, TrendingDown, CheckCircle,
  Eye, Ban, ThermometerSun,
} from 'lucide-react';

/* ── Constants ── */
const EXPIRY_STATUS = {
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldAlert },
  critical: { label: 'Kritis (≤30 hr)', color: 'bg-red-50 text-red-600 border-red-200', icon: AlertTriangle },
  warning: { label: 'Warning (≤90 hr)', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  caution: { label: 'Caution (≤180 hr)', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  safe: { label: 'Aman', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
};

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function ExpiredTracking() {
  const {
    expiredItems, expiredStats, expiredPagination, expiredLoading, expiredFilters,
    fetchExpired, fetchExpiredStats, setExpiredFilters,
    createMutation,
  } = useInventoryStore();
  const { user } = useAuthStore();
  const { isFEFOEnabled } = useSettings();

  const [disposalModal, setDisposalModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  const canDispose = ['superadmin', 'admin', 'gudang', 'apoteker'].includes(user?.role);

  useEffect(() => {
    fetchExpired();
    fetchExpiredStats();
  }, [expiredFilters, fetchExpired, fetchExpiredStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setExpiredFilters({ search: value, page: 1 }), 400),
    [setExpiredFilters],
  );

  const handleDisposal = async (batch, notes) => {
    try {
      const prod = batch.productId || batch.product || {};
      const productId = prod?.id || prod?._id || batch.productId;
      await createMutation({
        type: 'disposal',
        productId,
        batchId: batch._id,
        quantity: -(batch.quantity || 0),
        reason: `Pemusnahan batch ${batch.batchNumber} - expired`,
        notes: notes || undefined,
      });
      toast.success('Pemusnahan batch berhasil dicatat');
      setDisposalModal(null);
      fetchExpired();
      fetchExpiredStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mencatat pemusnahan');
    }
  };

  // check if there are undisposed expired items
  const undisposedExpired = expiredStats?.expired ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Expired</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring batch mendekati atau melewati tanggal kedaluwarsa.
            {isFEFOEnabled && <span className="ml-1 text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">FEFO</span>}
          </p>
        </div>
      </div>

      {/* Alert banner */}
      {undisposedExpired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {undisposedExpired} batch sudah expired dan belum dimusnahkan!
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Sesuai CDOB Bab 5, produk expired harus segera dipisahkan dan dimusnahkan sesuai prosedur.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {expiredStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Batch', value: expiredStats.totalBatches ?? 0, color: 'from-indigo-500 to-indigo-600', icon: FlaskConical },
            { label: 'Expired', value: expiredStats.expired ?? 0, color: 'from-red-500 to-red-600', icon: ShieldAlert },
            { label: 'Kritis (≤3 bln)', value: expiredStats.nearExpiry3Months ?? 0, color: 'from-amber-500 to-amber-600', icon: AlertTriangle },
            { label: 'Warning (≤6 bln)', value: expiredStats.nearExpiry6Months ?? 0, color: 'from-yellow-500 to-yellow-600', icon: Clock },
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama produk, SKU, batch..."
              defaultValue={expiredFilters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
            />
          </div>
          <select
            value={expiredFilters.expiryStatus}
            onChange={(e) => setExpiredFilters({ expiryStatus: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(EXPIRY_STATUS).filter(([k]) => k !== 'safe').map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={expiredFilters.sort}
            onChange={(e) => setExpiredFilters({ sort: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-white"
          >
            <option value="expiryDate:asc">ED Terdekat Dulu</option>
            <option value="expiryDate:desc">ED Terjauh Dulu</option>
            <option value="quantity:desc">Qty Terbanyak</option>
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Batch</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Qty</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal ED</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Sisa Hari</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Penyimpanan</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiredLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : expiredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada batch expired / mendekati expired.</p>
                  </td>
                </tr>
              ) : (
                expiredItems.map((batch) => {
                  const days = daysUntil(batch.expiryDate);
                  const status = getExpiryStatus(days);
                  const es = EXPIRY_STATUS[status];
                  const prod = batch.productId || batch.product || {};
                  const StatusIcon = es.icon;

                  return (
                    <tr key={batch._id} className={`hover:bg-gray-50/50 transition-colors ${status === 'expired' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{prod.name || '-'}</p>
                        <p className="text-xs text-gray-400">{prod.sku || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs font-medium text-gray-700">{batch.batchNumber}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-gray-900">{batch.quantity?.toLocaleString('id-ID') ?? 0}</span>
                        <p className="text-xs text-gray-400">{prod.satuan || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-700 text-xs">{formatDate(batch.expiryDate)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          days <= 0 ? 'bg-red-100 text-red-700' :
                          days <= 30 ? 'bg-red-50 text-red-600' :
                          days <= 90 ? 'bg-amber-50 text-amber-700' :
                          days <= 180 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {days <= 0 ? `${Math.abs(days)} hr lewat` : `${days} hari`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-600 text-xs">{batch.storageCondition || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${es.color}`}>
                          <StatusIcon size={10} />
                          {es.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailModal(batch)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {batch.status === 'disposed' || batch.status === 'DISPOSED' ? (
                            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Dimusnahkan</span>
                          ) : canDispose && (status === 'expired' || status === 'critical') ? (
                            <button
                              onClick={() => setDisposalModal(batch)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Catat Pemusnahan"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}
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
          pagination={expiredPagination}
          onPageChange={(page) => setExpiredFilters({ page })}
          onLimitChange={(limit) => setExpiredFilters({ limit, page: 1 })}
          label="Batch"
        />
      </div>

      {/* Disposal Modal */}
      {disposalModal && (
        <DisposalModal
          batch={disposalModal}
          onConfirm={handleDisposal}
          onClose={() => setDisposalModal(null)}
        />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <BatchDetailModal
          batch={detailModal}
          canDispose={canDispose}
          onDispose={(batch) => { setDetailModal(null); setDisposalModal(batch); }}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   BATCH DETAIL MODAL
   ═══════════════════════════════════════ */
function BatchDetailModal({ batch, canDispose, onDispose, onClose }) {
  const prod = batch.productId || batch.product || {};
  const days = daysUntil(batch.expiryDate);
  const status = getExpiryStatus(days);
  const es = EXPIRY_STATUS[status];
  const StatusIcon = es.icon;
  const isDisposed = batch.status === 'disposed' || batch.status === 'DISPOSED';
  const canAct = canDispose && !isDisposed && (status === 'expired' || status === 'critical');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${es.color}`}>
                <StatusIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detail Batch</h2>
                <p className="text-xs font-mono text-gray-400">{batch.batchNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${es.color}`}>
              <StatusIcon size={12} /> {es.label}
            </span>
            {days != null && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                days <= 0 ? 'bg-red-100 text-red-700' :
                days <= 30 ? 'bg-red-50 text-red-600' :
                days <= 90 ? 'bg-amber-50 text-amber-700' :
                'bg-yellow-50 text-yellow-700'
              }`}>
                <Calendar size={10} />
                {days <= 0 ? `${Math.abs(days)} hari lewat` : `${days} hari lagi`}
              </span>
            )}
            {isDisposed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                <Ban size={10} /> Dimusnahkan
              </span>
            )}
          </div>

          {/* Product info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailRow label="Produk" value={prod.name || '-'} />
              <DetailRow label="SKU" value={prod.sku || '-'} />
              <DetailRow label="Kategori" value={prod.kategori || prod.category || '-'} />
              <DetailRow label="Golongan" value={(prod.golongan || '-').replace(/_/g, ' ')} />
              <DetailRow label="Satuan" value={prod.satuan || '-'} />
              <DetailRow label="Batch" value={batch.batchNumber || '-'} />
            </div>
          </div>

          {/* Batch details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailRow label="Qty Saat Ini">
              <span className={`font-bold ${batch.quantity === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                {batch.quantity?.toLocaleString('id-ID') ?? 0}
              </span>
            </DetailRow>
            {batch.initialQuantity != null && (
              <DetailRow label="Qty Awal" value={batch.initialQuantity?.toLocaleString('id-ID')} />
            )}
            <DetailRow label="Tanggal ED">
              <span className={days <= 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                {formatDate(batch.expiryDate)}
              </span>
            </DetailRow>
            {batch.manufacturingDate && (
              <DetailRow label="Tanggal Produksi" value={formatDate(batch.manufacturingDate)} />
            )}
            {batch.receivedDate && (
              <DetailRow label="Tanggal Diterima" value={formatDate(batch.receivedDate)} />
            )}
            <DetailRow label="Penyimpanan">
              <span className="inline-flex items-center gap-1 text-gray-700">
                <ThermometerSun size={12} className="text-gray-400" />
                {batch.storageCondition || '-'}
              </span>
            </DetailRow>
          </div>

          {/* Supplier */}
          {(batch.supplierId?.name || batch.supplier?.name) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Supplier</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{batch.supplierId?.name || batch.supplier?.name}</p>
            </div>
          )}

          {/* Unit price */}
          {batch.unitPrice != null && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Harga per Unit</p>
                <p className="font-medium text-gray-700">{formatCurrency(batch.unitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Nilai Total</p>
                <p className="font-bold text-gray-900">{formatCurrency(batch.quantity * batch.unitPrice)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            Tutup
          </button>
          {canAct && (
            <button
              onClick={() => onDispose(batch)}
              className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-red-600 to-red-500 text-white font-medium text-sm rounded-xl hover:from-red-700 hover:to-red-600 transition"
            >
              <Trash2 size={14} /> Catat Pemusnahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, children }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      {children || <p className="text-sm font-medium text-gray-700 mt-0.5 capitalize">{value}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════
   DISPOSAL MODAL
   ═══════════════════════════════════════ */
function DisposalModal({ batch, onConfirm, onClose }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const prod = batch.productId || batch.product || {};

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm(batch, notes);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <Trash2 size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Catat Pemusnahan</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Info batch */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-red-700">Batch yang akan dimusnahkan:</p>
            <div className="text-xs text-red-600 space-y-1">
              <p>Produk: <strong>{prod.name || '-'}</strong></p>
              <p>Batch: <strong>{batch.batchNumber}</strong></p>
              <p>Qty: <strong>{batch.quantity?.toLocaleString('id-ID') ?? 0}</strong> {prod.satuan || ''}</p>
              <p>ED: <strong>{formatDate(batch.expiryDate)}</strong></p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alasan pemusnahan, nomor BA pemusnahan..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-red-600 to-red-500 text-white font-medium text-sm rounded-xl hover:from-red-700 hover:to-red-600 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Memproses...' : 'Konfirmasi Pemusnahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function getExpiryStatus(days) {
  if (days == null) return 'safe';
  if (days <= 0) return 'expired';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  if (days <= 180) return 'caution';
  return 'safe';
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

function formatCurrency(val) {
  if (val == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
