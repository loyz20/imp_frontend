import React, { useEffect, useState, useMemo, useCallback } from 'react';
import useDeliveryStore from '../../store/deliveryStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import deliveryService from '../../services/deliveryService';
import inventoryService from '../../services/inventoryService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  Truck, Package, FileText, Copy, Minus,
  Loader2, CheckCircle, Ban,
  ClipboardList, MapPin, User, Phone,
} from 'lucide-react';

/* ── Constants ── */
const DELIVERY_STATUS = [
  { value: 'packed', label: 'Dikemas', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package },
  { value: 'delivered', label: 'Terkirim', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'partial_delivered', label: 'Terkirim Sebagian', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck },
  { value: 'returned', label: 'Diretur', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Ban },
  { value: 'canceled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(DELIVERY_STATUS.map((s) => [s.value, s]));
STATUS_MAP.cancelled = STATUS_MAP.canceled;

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'gudang', 'sales'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function Delivery() {
  const {
    deliveries, stats, pagination, isLoading, filters,
    fetchDeliveries, fetchStats, setFilters, deleteDelivery, changeStatus,
  } = useDeliveryStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, [filters, fetchDeliveries, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingDelivery(null); setShowForm(true); };
  const openEdit = (delivery) => { setEditingDelivery(delivery); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingDelivery(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDelivery(oid(deleteConfirm));
      toast.success('Surat jalan berhasil dihapus');
      setDeleteConfirm(null);
      fetchDeliveries();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus surat jalan');
    }
  };

  const handleStatusChange = async (delivery, newStatus, label) => {
    try {
      await changeStatus(oid(delivery), newStatus);
      toast.success(`Status berhasil diubah ke "${label}"`);
      fetchDeliveries();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengiriman (Delivery)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola surat jalan dan pengiriman barang ke pelanggan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Buat Surat Jalan
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Pengiriman', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: ClipboardList },
            { label: 'Dikemas', value: stats.packed ?? 0, color: 'from-blue-500 to-blue-600', icon: Package },
            { label: 'Terkirim', value: stats.delivered ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { label: 'Terkirim Sebagian', value: stats.partialDelivered ?? 0, color: 'from-purple-500 to-purple-600', icon: Truck },
            { label: 'Diretur', value: stats.returned ?? 0, color: 'from-orange-500 to-orange-600', icon: Ban },
            { label: 'Dibatalkan', value: stats.canceled ?? stats.cancelled ?? 0, color: 'from-red-500 to-red-600', icon: Ban },
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
              placeholder="Cari nomor surat jalan, pelanggan..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {DELIVERY_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            placeholder="Dari tanggal"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            placeholder="Sampai tanggal"
          />
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ sort: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="-createdAt">Terbaru</option>
            <option value="createdAt">Terlama</option>
            <option value="-deliveryDate">Tgl Kirim Terbaru</option>
            <option value="deliveryDate">Tgl Kirim Terlama</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Surat Jalan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pelanggan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">No. SO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tgl Kirim</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Kurir / Driver</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada pengiriman ditemukan.</p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => {
                  const st = STATUS_MAP[delivery.status] || STATUS_MAP.packed;
                  return (
                    <tr key={oid(delivery)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{delivery.deliveryNumber}</p>
                        {delivery.notes && (
                          <p className="text-xs text-gray-400 truncate max-w-50">{delivery.notes}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="text-gray-800 truncate">{resolveCustomer(delivery)?.name || '-'}</p>
                          {resolveCustomer(delivery)?.code && (
                            <p className="text-xs text-gray-400">{resolveCustomer(delivery).code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        {resolveSO(delivery)?.soNumber || delivery.soNumber || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        {formatDate(delivery.deliveryDate)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden xl:table-cell">
                        {delivery.driver?.name || delivery.driverName || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          <st.icon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetail(delivery)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canCrud && delivery.status === 'packed' && (
                            <>
                              <button
                                onClick={() => openEdit(delivery)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <SquarePen size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'partial_delivered', 'Terkirim Sebagian')}
                                className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                                title="Terkirim Sebagian"
                              >
                                <Truck size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'delivered', 'Terkirim')}
                                className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Konfirmasi Terkirim"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'returned', 'Diretur')}
                                className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
                                title="Tandai Retur"
                              >
                                <Ban size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'canceled', 'Dibatalkan')}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Batalkan"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                          {canCrud && delivery.status === 'partial_delivered' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(delivery, 'delivered', 'Terkirim')}
                                className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Konfirmasi Terkirim"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'returned', 'Diretur')}
                                className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
                                title="Tandai Retur"
                              >
                                <Ban size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(delivery, 'canceled', 'Dibatalkan')}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Batalkan"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                          {canDelete && (delivery.status === 'packed' || delivery.status === 'canceled' || delivery.status === 'cancelled') && (
                            <button
                              onClick={() => setDeleteConfirm(delivery)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
          pagination={pagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="Pengiriman"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <DeliveryFormModal
          delivery={editingDelivery}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchDeliveries(); fetchStats(); }}
        />
      )}
      {showDetail && <DeliveryDetailModal delivery={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal delivery={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
    </div>
  );
}

/* ═══════════════════════════════════════
   DELIVERY FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function DeliveryFormModal({ delivery, onClose, onSaved }) {
  const { createDelivery, updateDelivery } = useDeliveryStore();
  const { isAutoNumber } = useSettings();
  const autoNum = isAutoNumber('delivery');
  const isEdit = !!delivery;
  const [loading, setLoading] = useState(false);
  const [batchMap, setBatchMap] = useState({}); // { productId: [{ batchNumber, expiryDate, availableQty }] }
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch FEFO batches for given product IDs
  const fetchBatchesForProducts = useCallback(async (productIds) => {
    if (!productIds.length) return;
    setBatchLoading(true);
    try {
      const results = {};
      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const res = await inventoryService.getProductBatches(pid, { sortBy: 'expiryDate', order: 'asc', availableOnly: true });
            results[pid] = normalizeAvailableBatches(res.data?.data || res.data || []);
          } catch {
            results[pid] = [];
          }
        })
      );
      setBatchMap((prev) => ({ ...prev, ...results }));
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const [form, setForm] = useState({
    deliveryNumber: delivery?.deliveryNumber || '',
    salesOrderId: resolveSalesOrderIdStr(delivery),
    soDisplayNumber: resolveSO(delivery)?.soNumber || delivery?.soNumber || '',
    customerName: resolveCustomer(delivery)?.name || '',
    deliveryDate: delivery?.deliveryDate ? delivery.deliveryDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    shippingAddress: delivery?.shippingAddress || '',
    driverName: delivery?.driver?.name || delivery?.driverName || '',
    driverPhone: delivery?.driver?.phone || delivery?.driverPhone || '',
    vehicleNumber: delivery?.vehicleNumber || '',
    notes: delivery?.notes || '',
    items: delivery?.items?.length
      ? delivery.items.map((item) => ({
          productId: resolveProductIdStr(item),
          productName: resolveProduct(item)?.name || item.productName || '',
          sku: resolveProduct(item)?.sku || item.sku || '',
          satuan: item.satuan || 'Box',
          quantityOrdered: item.quantityOrdered || item.quantity || 0,
          quantityShipped: item.quantityShipped || item.quantity || 0,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
          notes: item.notes || '',
        }))
      : [],
  });

  // On edit: fetch batches for existing items
  useEffect(() => {
    if (isEdit && form.items.length > 0) {
      const productIds = [...new Set(form.items.map((i) => i.productId).filter(Boolean))];
      fetchBatchesForProducts(productIds);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle batch selection from dropdown
  const applyAutoSplitForLine = useCallback((sourceItems, index) => {
    const items = sourceItems.map((it) => ({ ...it }));
    const item = items[index];
    if (!item) return { items, addedCount: 0, hasRemainder: false };

    const requestedQty = Number(item.quantityShipped) || 0;
    if (requestedQty <= 0 || !item.productId || !item.batchNumber) {
      return { items, addedCount: 0, hasRemainder: false };
    }

    const batches = batchMap[item.productId] || [];
    const selectedIdx = batches.findIndex((b) => b.batchNumber === item.batchNumber);
    if (selectedIdx < 0) return { items, addedCount: 0, hasRemainder: false };

    const siblingHasShipped = items.some(
      (it, i) => i !== index && it.productId === item.productId && Number(it.quantityShipped) > 0,
    );
    if (siblingHasShipped) return { items, addedCount: 0, hasRemainder: false };

    const selectedBatch = batches[selectedIdx];
    const selectedAvailable = Number(selectedBatch.availableQty) || 0;
    if (requestedQty <= selectedAvailable) return { items, addedCount: 0, hasRemainder: false };

    let remaining = requestedQty;
    items[index] = {
      ...items[index],
      quantityShipped: selectedAvailable,
      batchNumber: selectedBatch.batchNumber,
      expiryDate: selectedBatch.expiryDate,
    };
    remaining -= selectedAvailable;

    const usedBatches = new Set(
      items
        .filter((it, i) => i !== index && it.productId === item.productId && it.batchNumber)
        .map((it) => it.batchNumber),
    );

    const autoLines = [];
    for (let i = selectedIdx + 1; i < batches.length && remaining > 0; i += 1) {
      const b = batches[i];
      if (!b.batchNumber || usedBatches.has(b.batchNumber)) continue;
      const available = Number(b.availableQty) || 0;
      if (available <= 0) continue;
      const allocated = Math.min(available, remaining);
      autoLines.push({
        ...item,
        quantityShipped: allocated,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        notes: '',
        _splitFrom: item.productId,
      });
      usedBatches.add(b.batchNumber);
      remaining -= allocated;
    }

    if (autoLines.length > 0) {
      items.splice(index + 1, 0, ...autoLines);
    }

    if (remaining > 0) {
      items.splice(index + 1 + autoLines.length, 0, {
        ...item,
        quantityShipped: remaining,
        batchNumber: '',
        expiryDate: '',
        notes: '',
        _splitFrom: item.productId,
      });
    }

    return {
      items,
      addedCount: autoLines.length + (remaining > 0 ? 1 : 0),
      hasRemainder: remaining > 0,
    };
  }, [batchMap]);

  const handleBatchSelect = (index, batchNumber) => {
    const item = form.items[index];
    if (!item) return;
    const batches = batchMap[item.productId] || [];
    const selected = batches.find((b) => b.batchNumber === batchNumber);
    const items = [...form.items];
    items[index] = {
      ...items[index],
      batchNumber: selected ? selected.batchNumber : batchNumber,
      expiryDate: selected ? selected.expiryDate : '',
    };

    const splitResult = applyAutoSplitForLine(items, index);
    setForm((p) => ({ ...p, items: splitResult.items }));

    if (splitResult.addedCount > 0) {
      toast.success('Stok batch tidak cukup. Baris batch lain ditambahkan otomatis.');
      if (splitResult.hasRemainder) {
        toast('Sebagian qty masih belum punya batch. Pilih batch tambahan.', { icon: '!' });
      }
    }
  };

  // Tambah baris batch baru untuk produk yang sama (split batch)
  const handleAddBatchLine = (index) => {
    setForm((p) => {
      const items = [...p.items];
      const source = items[index];
      const newLine = {
        ...source,
        quantityShipped: 0,
        batchNumber: '',
        expiryDate: '',
        notes: '',
        _splitFrom: source.productId, // marker bahwa ini baris split
      };
      items.splice(index + 1, 0, newLine);
      return { ...p, items };
    });
  };

  // Hapus baris split (hanya bisa hapus baris ke-2+ dari produk yang sama)
  const handleRemoveBatchLine = (index) => {
    setForm((p) => {
      const items = [...p.items];
      items.splice(index, 1);
      return { ...p, items };
    });
  };

  // Cek apakah item adalah baris pertama dari produknya (tidak boleh dihapus)
  const isFirstLineOfProduct = (index) => {
    const item = form.items[index];
    for (let i = 0; i < index; i++) {
      if (form.items[i].productId === item.productId) return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };

    if (field === 'quantityShipped') {
      const splitResult = applyAutoSplitForLine(items, index);
      setForm((p) => ({ ...p, items: splitResult.items }));

      if (splitResult.addedCount > 0) {
        toast.success('Qty melebihi stok batch. Baris batch lain ditambahkan otomatis.');
        if (splitResult.hasRemainder) {
          toast('Sisa qty belum teralokasi batch. Pilih batch tambahan.', { icon: '!' });
        }
      }
      return;
    }

    setForm((p) => ({ ...p, items }));
  };

  const handleSOSelect = async (so) => {
    const customer = so.customer || so.customerId;
    const customerName = typeof customer === 'object' ? customer.name : '';
    const address = so.shippingAddress || '';

    const items = (so.items || []).map((item) => {
      const prod = item.product || item.productId;
      const quantityRemaining = Number(item.quantityRemaining ?? item.quantity ?? 0);
      return {
        productId: typeof prod === 'object' ? prod._id : (prod || ''),
        productName: typeof prod === 'object' ? prod.name : (item.productName || ''),
        sku: typeof prod === 'object' ? (prod.sku || '') : (item.sku || ''),
        satuan: item.satuan || 'Box',
        quantityOrdered: quantityRemaining,
        quantityShipped: quantityRemaining,
        batchNumber: '',
        expiryDate: '',
        notes: '',
      };
    });

    setForm((p) => ({
      ...p,
      salesOrderId: so._id,
      soDisplayNumber: so.soNumber,
      customerName,
      shippingAddress: p.shippingAddress || address,
      items,
    }));

    // FEFO: fetch available batches for all products and auto-fill earliest expiry
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    if (productIds.length) {
      setBatchLoading(true);
      try {
        const results = {};
        await Promise.all(
          productIds.map(async (pid) => {
            try {
              const res = await inventoryService.getProductBatches(pid, { sortBy: 'expiryDate', order: 'asc', availableOnly: true });
              results[pid] = normalizeAvailableBatches(res.data?.data || res.data || []);
            } catch {
              results[pid] = [];
            }
          })
        );
        setBatchMap((prev) => ({ ...prev, ...results }));

        // Auto-fill FEFO and split otomatis bila stok batch awal tidak cukup.
        let autoSplitCount = 0;
        let unresolvedCount = 0;
        setForm((prev) => {
          const expandedItems = prev.items.flatMap((item) => {
            const batches = results[item.productId] || [];
            if (!batches.length) return [item];

            let remaining = Number(item.quantityShipped) || 0;
            const lines = [];

            for (const b of batches) {
              if (remaining <= 0) break;
              const available = Number(b.availableQty) || 0;
              if (available <= 0) continue;
              const allocated = Math.min(available, remaining);
              lines.push({
                ...item,
                quantityShipped: allocated,
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate,
                notes: lines.length > 0 ? '' : item.notes,
                ...(lines.length > 0 ? { _splitFrom: item.productId } : {}),
              });
              remaining -= allocated;
            }

            if (!lines.length) {
              return [item];
            }

            if (lines.length > 1) {
              autoSplitCount += lines.length - 1;
            }

            if (remaining > 0) {
              unresolvedCount += 1;
              lines.push({
                ...item,
                quantityShipped: remaining,
                batchNumber: '',
                expiryDate: '',
                notes: '',
                _splitFrom: item.productId,
              });
            }

            return lines;
          });

          return {
            ...prev,
            items: expandedItems,
          };
        });

        if (autoSplitCount > 0) {
          toast.success(`Stok batch dibagi otomatis ke ${autoSplitCount} baris tambahan.`);
        }
        if (unresolvedCount > 0) {
          toast('Sebagian item belum teralokasi penuh ke batch. Pilih batch tambahan.', { icon: '!' });
        }
      } catch {
        // silently fail — user can still pick manually
      } finally {
        setBatchLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!autoNum && !isEdit && !form.deliveryNumber.trim()) {
      toast.error('Nomor surat jalan wajib diisi (auto-number nonaktif)');
      return;
    }
    if (!form.salesOrderId) {
      toast.error('Sales Order wajib dipilih');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Tidak ada item untuk dikirim');
      return;
    }
    const hasShipped = form.items.some((i) => i.quantityShipped > 0);
    if (!hasShipped) {
      toast.error('Minimal 1 item harus memiliki jumlah kirim > 0');
      return;
    }
    // Validasi stok batch — cegah pengiriman jika stok tidak cukup
    const insufficientItem = form.items.filter((i) => i.quantityShipped > 0).find((i) => {
      const batches = batchMap[i.productId] || [];
      const selected = batches.find((b) => b.batchNumber === i.batchNumber);
      return selected && selected.availableQty < i.quantityShipped;
    });
    if (insufficientItem) {
      const batches = batchMap[insufficientItem.productId] || [];
      const selected = batches.find((b) => b.batchNumber === insufficientItem.batchNumber);
      toast.error(`Stok batch ${insufficientItem.batchNumber} tidak cukup (tersedia: ${selected.availableQty}, dibutuhkan: ${insufficientItem.quantityShipped})`);
      return;
    }
    // Validasi: cek duplikat batch pada produk yang sama
    const batchDuplicates = {};
    for (const item of form.items.filter((i) => i.quantityShipped > 0 && i.batchNumber)) {
      const key = `${item.productId}|${item.batchNumber}`;
      batchDuplicates[key] = (batchDuplicates[key] || 0) + 1;
      if (batchDuplicates[key] > 1) {
        toast.error(`Batch ${item.batchNumber} dipilih lebih dari sekali untuk produk ${item.productName}. Gabungkan ke satu baris.`);
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        ...(!autoNum && !isEdit && { deliveryNumber: form.deliveryNumber.trim() }),
        salesOrderId: form.salesOrderId,
        deliveryDate: form.deliveryDate,
        shippingAddress: form.shippingAddress || undefined,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        notes: form.notes,
        items: form.items.filter((i) => i.quantityShipped > 0).map((i) => ({
          productId: i.productId,
          satuan: i.satuan,
          quantityShipped: Number(i.quantityShipped),
          batchNumber: i.batchNumber || undefined,
          expiryDate: i.expiryDate || undefined,
          notes: i.notes,
        })),
      };
      if (isEdit) {
        await updateDelivery(oid(delivery), payload);
        toast.success('Surat jalan berhasil diperbarui');
      } else {
        await createDelivery(payload);
        toast.success('Surat jalan berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} surat jalan`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Umum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {!autoNum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Surat Jalan *</label>
                <input
                  name="deliveryNumber"
                  value={form.deliveryNumber}
                  onChange={handleChange}
                  placeholder="Ketik nomor surat jalan..."
                  disabled={isEdit}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Order *</label>
              <AutocompleteInput
                value={form.soDisplayNumber}
                onChange={(text) => setForm((p) => ({ ...p, soDisplayNumber: text }))}
                onSelect={handleSOSelect}
                onClear={() => setForm((p) => ({ ...p, salesOrderId: '', soDisplayNumber: '', customerName: '', items: [] }))}
                fetchFn={(params) => deliveryService.getAvailableOrders(params)}
                getDisplayText={(item) => item.soNumber}
                renderItem={(item) => {
                  const cust = item.customer || item.customerId;
                  const custName = typeof cust === 'object' ? cust.name : '';
                  return (
                    <div>
                      <p className="font-medium text-gray-800">{item.soNumber}</p>
                      <p className="text-xs text-gray-400">{custName} &middot; {item.items?.length || 0} item</p>
                    </div>
                  );
                }}
                placeholder="Cari nomor SO..."
              />
              {form.salesOrderId && <p className="text-xs text-emerald-600 mt-1">SO terpilih: {form.soDisplayNumber}</p>}
              {form.customerName && <p className="text-xs text-gray-500 mt-0.5">Pelanggan: {form.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Kirim *</label>
              <input
                type="date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Pengiriman</label>
              <input
                name="shippingAddress"
                value={form.shippingAddress}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Alamat tujuan pengiriman..."
              />
            </div>
          </div>

          {/* Driver Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Informasi Kurir / Driver</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Driver</label>
                <input
                  name="driverName"
                  value={form.driverName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Nama kurir / driver..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon Driver</label>
                <input
                  name="driverPhone"
                  value={form.driverPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="No. telepon driver..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Kendaraan</label>
                <input
                  name="vehicleNumber"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Plat nomor kendaraan..."
                />
              </div>
            </div>
          </div>

          {/* Items from SO */}
          {form.items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Daftar Item Pengiriman
                  {batchLoading && <span className="ml-2 text-xs text-emerald-600 font-normal animate-pulse">Memuat batch FEFO...</span>}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                  <Package size={12} /> FEFO — First Expired First Out
                </span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-24">Satuan</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-24">Qty Order</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-28">Qty Kirim</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-44">Batch (FEFO)</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">Exp. Date</th>
                        <th className="text-center px-4 py-2.5 font-medium text-gray-600 w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.items.map((item, idx) => {
                        const batches = batchMap[item.productId] || [];
                        const isFefoRecommended = batches.length > 0 && item.batchNumber === batches[0].batchNumber;
                        const selectedBatch = batches.find((b) => b.batchNumber === item.batchNumber);
                        const isLowStock = selectedBatch && selectedBatch.availableQty < item.quantityShipped;
                        const isSplitLine = !isFirstLineOfProduct(idx);
                        return (
                        <tr key={idx} className={isSplitLine ? 'bg-gray-50/40' : ''}>
                          <td className="px-4 py-2.5 text-gray-400">{isSplitLine ? '' : form.items.slice(0, idx + 1).filter((_, i) => isFirstLineOfProduct(i)).length}</td>
                          <td className="px-4 py-2.5">
                            {isSplitLine ? (
                              <p className="text-xs text-gray-400 italic pl-3">↳ batch lain — {item.productName}</p>
                            ) : (
                              <>
                                <p className="font-medium text-gray-900">{item.productName || '-'}</p>
                                {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{isSplitLine ? '' : item.satuan}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{isSplitLine ? '' : item.quantityOrdered}</td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min="0"
                              max={item.quantityOrdered}
                              value={item.quantityShipped}
                              onChange={(e) => handleItemChange(idx, 'quantityShipped', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            {batches.length > 0 ? (
                              <div>
                                <select
                                  value={item.batchNumber}
                                  onChange={(e) => handleBatchSelect(idx, e.target.value)}
                                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isFefoRecommended ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-300'}`}
                                >
                                  <option value="">Pilih batch...</option>
                                  {batches.map((b, bi) => (
                                    <option key={b.batchNumber} value={b.batchNumber}>
                                      {b.batchNumber} — ED: {b.expiryDate} (Stok: {b.availableQty}){bi === 0 ? ' ★ FEFO' : ''}
                                    </option>
                                  ))}
                                </select>
                                {isFefoRecommended && (
                                  <span className="inline-flex items-center mt-1 text-[10px] text-emerald-600 font-medium">
                                    <CheckCircle size={10} className="mr-0.5" /> FEFO
                                  </span>
                                )}
                                {isLowStock && (
                                  <span className="inline-flex items-center mt-1 text-[10px] text-red-600 font-medium">
                                    <AlertTriangle size={10} className="mr-0.5" /> Stok tidak cukup (tersedia: {selectedBatch.availableQty}, dibutuhkan: {item.quantityShipped})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <input
                                value={item.batchNumber}
                                onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                placeholder="Batch..."
                              />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${item.batchNumber && batches.length > 0 ? 'bg-gray-50 text-gray-500' : 'border-gray-300'}`}
                              readOnly={!!item.batchNumber && batches.length > 0}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAddBatchLine(idx)}
                                title="Tambah batch lain untuk produk ini"
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition"
                              >
                                <Copy size={14} />
                              </button>
                              {!isFirstLineOfProduct(idx) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchLine(idx)}
                                  title="Hapus baris batch ini"
                                  className="p-1 rounded-md text-red-500 hover:bg-red-50 transition"
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
              placeholder="Catatan pengiriman (opsional)..."
            />
          </div>

          {/* CDOB Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Ketentuan CDOB &amp; FEFO</p>
                <p className="text-xs text-blue-700 mt-1">
                  Pengiriman obat harus memenuhi standar CDOB (Cara Distribusi Obat yang Baik).
                  Sistem secara otomatis merekomendasikan batch dengan tanggal kedaluwarsa terdekat (FEFO — First Expired First Out).
                  Pastikan suhu penyimpanan selama pengiriman sesuai dengan persyaratan produk.
                  Sertakan salinan Surat Pesanan untuk narkotika &amp; psikotropika.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Menyimpan...</span>
            ) : (
              <span className="flex items-center gap-2"><Check size={14} /> {isEdit ? 'Perbarui' : 'Simpan Surat Jalan'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELIVERY DETAIL MODAL
   ═══════════════════════════════════════ */
function DeliveryDetailModal({ delivery, onClose }) {
  const st = STATUS_MAP[delivery.status] || STATUS_MAP.packed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white">
                <Truck size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{delivery.deliveryNumber}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                    <st.icon size={10} />
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(delivery.deliveryDate)}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & SO Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pelanggan</p>
              <p className="text-sm font-medium text-gray-900">{resolveCustomer(delivery)?.name || '-'}</p>
              {resolveCustomer(delivery)?.code && <p className="text-xs text-gray-400 mt-0.5">Kode: {resolveCustomer(delivery).code}</p>}
              {resolveCustomer(delivery)?.phone && <p className="text-xs text-gray-500 mt-1">{resolveCustomer(delivery).phone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Referensi SO</p>
              <p className="text-sm font-medium text-gray-900">{resolveSO(delivery)?.soNumber || delivery.soNumber || '-'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          {delivery.shippingAddress && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Pengiriman</p>
              </div>
              <p className="text-sm text-gray-700">{delivery.shippingAddress}</p>
            </div>
          )}

          {/* Driver Info */}
          {(delivery.driverName || delivery.driver?.name || delivery.vehicleNumber) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kurir / Driver</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-700">{delivery.driver?.name || delivery.driverName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700">{delivery.driver?.phone || delivery.driverPhone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-gray-400" />
                  <span className="text-gray-700">{delivery.vehicleNumber || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Daftar Item ({delivery.items?.length || 0})</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Satuan</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty Kirim</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">No. Batch</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Exp. Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(delivery.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{resolveProduct(item)?.name || item.productName || '-'}</p>
                        {(resolveProduct(item)?.sku || item.sku) && (
                          <p className="text-xs text-gray-400">{resolveProduct(item)?.sku || item.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{item.satuan}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{item.quantityShipped || item.quantity || 0}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.batchNumber || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.expiryDate ? formatDate(item.expiryDate) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {delivery.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{delivery.notes}</p>
            </div>
          )}

          {/* Status History */}
          {delivery.statusHistory && delivery.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Riwayat Status</h3>
              <div className="space-y-2">
                {delivery.statusHistory.map((h, i) => {
                  const hst = STATUS_MAP[h.status];
                  return (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${h.status === 'delivered' ? 'bg-emerald-500' : (h.status === 'canceled' || h.status === 'cancelled') ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">{h.user?.name || 'System'}</span>
                          {' — '}
                          <span className="text-gray-600">{hst?.label || h.status}</span>
                        </p>
                        {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
            <p>Dibuat oleh: {delivery.createdBy?.name || '-'} — {formatDate(delivery.createdAt)}</p>
            <p>Terakhir diubah: {delivery.updatedBy?.name || '-'} — {formatDate(delivery.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ delivery, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Surat Jalan?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Surat jalan <strong>{delivery.deliveryNumber}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function oid(o) {
  return o._id || o.id;
}

function resolveCustomer(obj) {
  const c = obj?.customer && typeof obj.customer === 'object' ? obj.customer
    : obj?.customerId && typeof obj.customerId === 'object' ? obj.customerId
    : null;
  return c;
}

function resolveSO(delivery) {
  const so = delivery?.salesOrder && typeof delivery.salesOrder === 'object' ? delivery.salesOrder
    : delivery?.salesOrderId && typeof delivery.salesOrderId === 'object' ? delivery.salesOrderId
    : null;
  return so;
}

function resolveSalesOrderIdStr(delivery) {
  const so = resolveSO(delivery);
  if (so) return so._id || '';
  if (typeof delivery?.salesOrderId === 'string') return delivery.salesOrderId;
  return '';
}

function resolveProduct(item) {
  const p = item?.product && typeof item.product === 'object' ? item.product
    : item?.productId && typeof item.productId === 'object' ? item.productId
    : null;
  return p;
}

function resolveProductIdStr(item) {
  const p = resolveProduct(item);
  if (p) return p._id || '';
  if (typeof item?.productId === 'string') return item.productId;
  return '';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function normalizeAvailableBatches(rawBatches) {
  return (rawBatches || [])
    .map((b) => ({
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate ? b.expiryDate.slice(0, 10) : '',
      availableQty: b.availableQuantity ?? b.availableQty ?? b.quantity ?? 0,
    }))
    .filter((b) => b.batchNumber && Number(b.availableQty) > 0);
}
