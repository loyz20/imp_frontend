import React, { useEffect, useState, useMemo, useCallback } from 'react';
import useSalesOrderStore from '../../store/salesOrderStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import inventoryService from '../../services/inventoryService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  ShoppingBag, Package, FileText,
  Loader2, CheckCircle, Ban, ClipboardList, Truck, MapPin,
} from 'lucide-react';

/* ── Constants ── */
const SO_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText },
  { value: 'shipped', label: 'Dikirim', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Truck },
  { value: 'awaiting_payment', label: 'Menunggu Pembayaran', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  { value: 'completed', label: 'Selesai', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  { value: 'returned', label: 'Diretur', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(SO_STATUS.map((s) => [s.value, s]));
STATUS_MAP.canceled = STATUS_MAP.returned;
STATUS_MAP.cancelled = STATUS_MAP.returned;

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'sales'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function SalesOrder() {
  const {
    orders, stats, pagination, isLoading, filters,
    fetchOrders, fetchStats, setFilters, deleteOrder, changeStatus, generateInvoice,
  } = useSalesOrderStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const { getDocPrefix } = useSettings();
  const soPrefix = getDocPrefix('salesOrder');

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters, fetchOrders, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const selectableOrders = useMemo(
    () => (orders || []).filter((o) => normalizeSOStatus(o.status) === 'shipped'),
    [orders],
  );

  const selectableOrderIdSet = useMemo(
    () => new Set(selectableOrders.map((o) => oid(o))),
    [selectableOrders],
  );

  const selectedOrders = useMemo(
    () => (orders || []).filter((o) => selectedOrderIds.includes(oid(o))),
    [orders, selectedOrderIds],
  );

  const openCreate = () => { setEditingOrder(null); setShowForm(true); };
  const openEdit = (order) => { setEditingOrder(order); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingOrder(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOrder(oid(deleteConfirm));
      toast.success('SO berhasil dihapus');
      setDeleteConfirm(null);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus SO');
    }
  };

  const handleStatusChange = async (order, newStatus, label) => {
    try {
      await changeStatus(oid(order), newStatus);
      toast.success(`Status berhasil diubah ke "${label}"`);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status SO');
    }
  };

  const toggleOrderSelection = (order) => {
    const orderId = oid(order);
    if (!selectableOrderIdSet.has(orderId)) return;

    setSelectedOrderIds((prev) => (
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    ));
  };

  const toggleSelectAllShipped = () => {
    const allIds = selectableOrders.map((o) => oid(o));
    if (allIds.length === 0) return;

    setSelectedOrderIds((prev) => {
      const allSelected = allIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !allIds.includes(id));
      }
      const merged = new Set([...prev, ...allIds]);
      return Array.from(merged);
    });
  };

  const handleGenerateInvoice = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Pilih minimal 1 surat jalan berstatus dikirim');
      return;
    }

    const allShipped = selectedOrders.every((o) => normalizeSOStatus(o.status) === 'shipped');
    if (!allShipped) {
      toast.error('Semua surat jalan yang dipilih harus berstatus dikirim');
      return;
    }

    const customerIds = Array.from(new Set(selectedOrders.map((o) => resolveCustomerIdStr(o)).filter(Boolean)));
    if (customerIds.length !== 1) {
      toast.error('Semua surat jalan harus dari customer yang sama');
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const payloadIds = selectedOrders.map((o) => oid(o));
      const res = await generateInvoice(payloadIds);
      const invoiceNumber = res?.data?.invoiceNumber || res?.invoiceNumber;
      toast.success(invoiceNumber
        ? `Invoice ${invoiceNumber} berhasil dibuat dari ${payloadIds.length} surat jalan`
        : `Invoice berhasil dibuat dari ${payloadIds.length} surat jalan`);
      setSelectedOrderIds([]);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate invoice dari surat jalan terpilih');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjualan (Sales Order)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola alur status SO: draft ke dikirim, generate invoice diproses backend (gabung beberapa surat jalan), lalu menunggu pembayaran dan selesai.
            {soPrefix && <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Prefix: {soPrefix}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">Draft</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Dikirim</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Menunggu Pembayaran</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCrud && (
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice || selectedOrders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Generate 1 invoice dari beberapa surat jalan berstatus dikirim"
            >
              {isGeneratingInvoice ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate Invoice ({selectedOrders.length})
            </button>
          )}
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Buat SO Baru
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total SO', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: ClipboardList },
            { label: 'Dikirim', value: stats.shipped ?? stats.delivered ?? stats.packed ?? 0, color: 'from-blue-500 to-blue-600', icon: Truck },
            { label: 'Menunggu Pembayaran', value: stats.awaitingPayment ?? stats.awaiting_payment ?? stats.invoiced ?? 0, color: 'from-amber-500 to-amber-600', icon: AlertTriangle },
            { label: 'Selesai', value: stats.completed ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
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
              placeholder="Cari no surat jalan, pelanggan..."
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
            {SO_STATUS.map((s) => (
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
            <option value="-totalAmount">Nilai Terbesar</option>
            <option value="totalAmount">Nilai Terkecil</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-center px-3 py-3.5 font-semibold text-gray-600 w-12">
                  <input
                    type="checkbox"
                    checked={selectableOrders.length > 0 && selectableOrders.every((o) => selectedOrderIds.includes(oid(o)))}
                    onChange={toggleSelectAllShipped}
                    disabled={!canCrud || selectableOrders.length === 0}
                    className="rounded border-gray-300"
                    title="Pilih semua SO berstatus dikirim"
                  />
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. SO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pelanggan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tgl Order</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">No Invoice</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Total Item</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada SO ditemukan.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const normalizedStatus = normalizeSOStatus(order.status);
                  const st = STATUS_MAP[normalizedStatus] || STATUS_MAP.shipped;
                  const allowedTransitions = canCrud ? getAllowedStatusTransitions(normalizedStatus) : [];
                  const orderId = oid(order);
                  const isSelectable = normalizedStatus === 'shipped';
                  const isSelected = selectedOrderIds.includes(orderId);
                  return (
                    <tr key={orderId} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrderSelection(order)}
                          disabled={!canCrud || !isSelectable}
                          className="rounded border-gray-300"
                          title={isSelectable ? 'Pilih untuk generate invoice gabungan' : 'Hanya status dikirim yang dapat dipilih'}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{getOrderSuratJalanNumber(order)}</p>
                        {order.notes && (
                          <p className="text-xs text-gray-400 truncate max-w-50">{order.notes}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="text-gray-800 truncate">{resolveCustomer(order)?.name || '-'}</p>
                          {resolveCustomer(order)?.code && (
                            <p className="text-xs text-gray-400">{resolveCustomer(order).code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden xl:table-cell">
                        {getOrderInvoiceFakturNumber(order)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">
                        {order.items?.length || 0} item
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          <st.icon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetail(order)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canCrud && normalizedStatus === 'draft' && (
                            <button
                              onClick={() => openEdit(order)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <SquarePen size={16} />
                            </button>
                          )}
                          {canCrud && allowedTransitions.length > 0 && (
                            <>
                              {allowedTransitions.map((action) => {
                                const actionStatus = STATUS_MAP[normalizeSOStatus(action.value)] || STATUS_MAP.shipped;
                                const ActionIcon = actionStatus.icon;
                                return (
                                  <button
                                    key={action.value}
                                    type="button"
                                    onClick={() => handleStatusChange(order, action.value, action.label)}
                                    className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                    title={`Ubah ke ${action.label}`}
                                  >
                                    <ActionIcon size={16} />
                                  </button>
                                );
                              })}
                            </>
                          )}
                          {canDelete && normalizedStatus === 'draft' && (
                            <button
                              onClick={() => setDeleteConfirm(order)}
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
          label="SO"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <SOFormModal
          order={editingOrder}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchOrders(); fetchStats(); }}
        />
      )}
      {showDetail && <SODetailModal order={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal order={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
    </div>
  );
}

/* ═══════════════════════════════════════
   SO FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function SOFormModal({ order, onClose, onSaved }) {
  const { createOrder, updateOrder } = useSalesOrderStore();
  const { defaultPaymentTermDays, isPkp, ppnRate, calculatePpn } = useSettings();
  const isEdit = !!order;
  const [loading, setLoading] = useState(false);
  const [stockMap, setStockMap] = useState({}); // { productId: { totalStock, batches } }

  // Fetch stock info for a product
  const fetchProductStock = useCallback(async (productId) => {
    if (!productId || stockMap[productId]) return;
    try {
      const res = await inventoryService.getProductBatches(productId, { sortBy: 'expiryDate', order: 'asc', availableOnly: true });
      const rawBatches = res.data?.data || res.data || [];
      const batches = getUsableFefoBatches(rawBatches);
      const totalStock = batches.reduce((sum, b) => sum + (b.availableQuantity ?? b.availableQty ?? b.quantity ?? 0), 0);
      setStockMap((prev) => ({ ...prev, [productId]: { totalStock, batches } }));
    } catch {
      setStockMap((prev) => ({ ...prev, [productId]: { totalStock: 0, batches: [] } }));
    }
  }, [stockMap]);

  const [form, setForm] = useState({
    customerId: resolveCustomerIdStr(order),
    customerName: resolveCustomer(order)?.name || '',
    orderDate: order?.orderDate ? order.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: order?.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : '',
    paymentTermDays: order?.paymentTermDays ?? defaultPaymentTermDays ?? 30,
    priceRoundingStep: 100,
    shippingAddress: order?.shippingAddress || '',
    notes: order?.notes || '',
    items: order?.items?.length
      ? order.items.map((item) => ({
          productId: resolveProductIdStr(item),
          productName: resolveProduct(item)?.name || item.productName || '',
          sku: resolveProduct(item)?.sku || item.sku || '',
          satuan: item.satuan || 'Box',
          quantity: item.quantity || 1,
          batchRef: '',
          batchNumber: item.batchNumber || '',
          expiryDate: toDateInputValue(item.expiryDate),
          unitPrice: item.unitPrice || 0,
          margin: Number(item.margin ?? 20),
          discount: item.discount || 0,
          notes: item.notes || '',
          _splitFrom: item._splitFrom || '',
          _batchLocked: Boolean(item._batchLocked),
        }))
      : [emptyItem()],
  });

  const applyAutoSplitForLine = useCallback((sourceItems, index) => {
    const items = sourceItems.map((entry) => ({ ...entry }));
    const item = items[index];
    if (!item) return { items, addedCount: 0, hasRemainder: false };

    const requestedQty = Number(item.quantity) || 0;
    if (requestedQty <= 0 || !item.productId || !(item.batchRef || item.batchNumber)) {
      return { items, addedCount: 0, hasRemainder: false };
    }

    const batches = getUsableFefoBatches(stockMap[item.productId]?.batches || []);
    const selectedIdx = batches.findIndex((batch) => (
      getBatchOptionValue(batch) === String(item.batchRef || '')
      || String(batch.batchNumber || '') === String(item.batchNumber || '')
    ));
    if (selectedIdx < 0) return { items, addedCount: 0, hasRemainder: false };

    const selectedBatch = batches[selectedIdx];
    const selectedAvailable = getBatchAvailableQty(selectedBatch);
    const selectedRef = getBatchOptionValue(selectedBatch);

    if (requestedQty <= selectedAvailable) {
      items[index] = {
        ...items[index],
        batchRef: selectedRef,
        batchNumber: selectedBatch.batchNumber || '',
        expiryDate: toDateInputValue(selectedBatch.expiryDate),
        _batchLocked: false,
      };
      return { items, addedCount: 0, hasRemainder: false };
    }

    let remaining = requestedQty;
    items[index] = {
      ...items[index],
      quantity: selectedAvailable,
      batchRef: selectedRef,
      batchNumber: selectedBatch.batchNumber || '',
      expiryDate: toDateInputValue(selectedBatch.expiryDate),
      _batchLocked: true,
    };
    remaining -= selectedAvailable;

    const usedBatches = new Set(
      items
        .filter((entry, entryIndex) => entryIndex !== index && entry.productId === item.productId)
        .map((entry) => String(entry.batchNumber || entry.batchRef || ''))
        .filter(Boolean),
    );
    usedBatches.add(String(selectedBatch.batchNumber || selectedRef));

    const autoLines = [];
    for (let batchIndex = selectedIdx + 1; batchIndex < batches.length && remaining > 0; batchIndex += 1) {
      const batch = batches[batchIndex];
      const batchKey = String(batch.batchNumber || getBatchOptionValue(batch));
      if (!batchKey || usedBatches.has(batchKey)) continue;

      const availableQty = getBatchAvailableQty(batch);
      if (availableQty <= 0) continue;

      const allocatedQty = Math.min(availableQty, remaining);
      autoLines.push({
        ...item,
        quantity: allocatedQty,
        batchRef: getBatchOptionValue(batch),
        batchNumber: batch.batchNumber || '',
        expiryDate: toDateInputValue(batch.expiryDate),
        notes: '',
        _splitFrom: item.productId,
        _batchLocked: true,
      });
      usedBatches.add(batchKey);
      remaining -= allocatedQty;
    }

    if (autoLines.length > 0) {
      items.splice(index + 1, 0, ...autoLines);
    }

    return {
      items,
      addedCount: autoLines.length,
      hasRemainder: remaining > 0,
    };
  }, [stockMap]);

  // On edit: fetch stock for existing items
  useEffect(() => {
    if (isEdit && form.items.length > 0) {
      form.items.forEach((item) => {
        if (item.productId) fetchProductStock(item.productId);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep batch selector in sync with fetched FEFO batches and auto-pick earliest batch when empty.
  useEffect(() => {
    setForm((prev) => {
      let changed = false;
      let items = prev.items.map((item) => ({ ...item }));

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (!item.productId) continue;

        const productStock = stockMap[item.productId];
        if (!productStock?.batches?.length) continue;

        const fefoBatches = getUsableFefoBatches(productStock.batches);
        const firstAvailableBatch = fefoBatches.find((batch) => getBatchAvailableQty(batch) > 0);
        const selected = findBatchByValue(fefoBatches, item.batchRef || item.batchNumber);

        if (selected) {
          let activeBatch = selected;
          const selectedRef = getBatchOptionValue(selected);

          // If the currently selected batch has no stock, auto-switch to the first available FEFO batch.
          if (getBatchAvailableQty(selected) <= 0 && firstAvailableBatch && getBatchOptionValue(firstAvailableBatch) !== selectedRef) {
            const baseBatchPrice = getBatchBaseUnitPrice(firstAvailableBatch);
            items[index] = {
              ...item,
              batchRef: getBatchOptionValue(firstAvailableBatch),
              batchNumber: firstAvailableBatch.batchNumber || '',
              expiryDate: toDateInputValue(firstAvailableBatch.expiryDate),
              unitPrice: applyPriceRounding(
                calculateSellingPriceFromMargin(baseBatchPrice, item.margin),
                prev.priceRoundingStep,
              ),
            };
            changed = true;
            activeBatch = firstAvailableBatch;
          }

          const activeRef = getBatchOptionValue(activeBatch);
          if (
            items[index].batchRef !== activeRef
            || items[index].batchNumber !== (activeBatch.batchNumber || '')
            || toDateInputValue(items[index].expiryDate) !== toDateInputValue(activeBatch.expiryDate)
          ) {
            items[index] = {
              ...items[index],
              batchRef: activeRef,
              batchNumber: activeBatch.batchNumber || '',
              expiryDate: toDateInputValue(activeBatch.expiryDate),
            };
            changed = true;
          }

          if (!items[index]._batchLocked && (Number(items[index].quantity) || 0) > getBatchAvailableQty(activeBatch)) {
            const splitResult = applyAutoSplitForLine(items, index);
            if (splitResult.addedCount > 0) {
              items = splitResult.items;
              changed = true;
              index += splitResult.addedCount;
            }
          }
          continue;
        }

        if (!item.batchNumber && firstAvailableBatch) {
          const baseBatchPrice = getBatchBaseUnitPrice(firstAvailableBatch);
          items[index] = {
            ...item,
            batchRef: getBatchOptionValue(firstAvailableBatch),
            batchNumber: firstAvailableBatch.batchNumber || '',
            expiryDate: toDateInputValue(firstAvailableBatch.expiryDate),
            unitPrice: applyPriceRounding(
              calculateSellingPriceFromMargin(baseBatchPrice, item.margin),
              prev.priceRoundingStep,
            ),
          };
          changed = true;

          if ((Number(item.quantity) || 0) > getBatchAvailableQty(firstAvailableBatch)) {
            const splitResult = applyAutoSplitForLine(items, index);
            if (splitResult.addedCount > 0) {
              items = splitResult.items;
              index += splitResult.addedCount;
            }
          }
        }
      }

      return changed ? { ...prev, items } : prev;
    });
  }, [applyAutoSplitForLine, stockMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    const nextItem = { ...items[index], [field]: value };
    const productStock = stockMap[nextItem.productId];
    const selectedBatch = findBatchByValue(productStock?.batches || [], nextItem.batchRef || nextItem.batchNumber);

    if (field === 'margin') {
      if (selectedBatch) {
        const baseBatchPrice = getBatchBaseUnitPrice(selectedBatch);
        nextItem.unitPrice = applyPriceRounding(
          calculateSellingPriceFromMargin(baseBatchPrice, value),
          form.priceRoundingStep,
        );
      }
    }

    if (field === 'unitPrice' && selectedBatch) {
      const baseBatchPrice = getBatchBaseUnitPrice(selectedBatch);
      nextItem.margin = calculateMarginFromSellingPrice(baseBatchPrice, value);
    }

    items[index] = nextItem;

    if (field === 'quantity' && (nextItem.batchRef || nextItem.batchNumber)) {
      const splitResult = applyAutoSplitForLine(items, index);
      setForm((p) => ({ ...p, items: splitResult.items }));

      if (splitResult.addedCount > 0) {
        toast.success('Qty melebihi stok batch terpilih. Batch lain ditambahkan otomatis.');
      }
      if (splitResult.hasRemainder) {
        toast.error('Qty melebihi total stok semua batch yang tersedia. Sisa qty tidak ditambahkan.');
      }
      return;
    }

    setForm((p) => ({ ...p, items }));
  };

  const handleBatchSelect = (index, batchValue) => {
    const items = [...form.items];
    const current = items[index];
    const productStock = stockMap[current.productId];
    const selectedBatch = findBatchByValue(productStock?.batches || [], batchValue);

    if (!selectedBatch) {
      items[index] = {
        ...current,
        batchRef: batchValue,
        batchNumber: '',
        expiryDate: '',
        _batchLocked: false,
      };
      setForm((p) => ({ ...p, items }));
      return;
    }

    const baseBatchPrice = getBatchBaseUnitPrice(selectedBatch);
    items[index] = {
      ...current,
      batchRef: getBatchOptionValue(selectedBatch),
      batchNumber: selectedBatch.batchNumber || '',
      expiryDate: toDateInputValue(selectedBatch.expiryDate),
      unitPrice: applyPriceRounding(
        calculateSellingPriceFromMargin(baseBatchPrice, current.margin),
        form.priceRoundingStep,
      ),
      _batchLocked: false,
    };

    const splitResult = applyAutoSplitForLine(items, index);
    setForm((p) => ({ ...p, items: splitResult.items }));

    if (splitResult.addedCount > 0) {
      toast.success('Qty melebihi stok batch terpilih. Batch lain ditambahkan otomatis.');
    }
    if (splitResult.hasRemainder) {
      toast.error('Qty melebihi total stok semua batch yang tersedia. Sisa qty tidak ditambahkan.');
    }
  };

  const roundItemUnitPrice = (index) => {
    setForm((p) => {
      const step = Number(p.priceRoundingStep || 0);
      if (!step) return p;

      const items = [...p.items];
      const item = items[index];
      if (!item) return p;

      items[index] = {
        ...item,
        unitPrice: applyPriceRounding(item.unitPrice, step),
      };

      return { ...p, items };
    });
  };

  const roundAllUnitPrices = () => {
    setForm((p) => {
      const step = Number(p.priceRoundingStep || 0);
      if (!step) return p;

      return {
        ...p,
        items: p.items.map((item) => ({
          ...item,
          unitPrice: applyPriceRounding(item.unitPrice, step),
        })),
      };
    });
  };

  const addItem = () => {
    setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  };

  const removeItem = (index) => {
    setForm((p) => {
      const items = p.items.filter((_, i) => i !== index);
      return { ...p, items: items.length ? items : [emptyItem()] };
    });
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal - (subtotal * item.discount / 100);
  };

  const subtotal = form.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const ppnAmount = isPkp ? calculatePpn(subtotal) : 0;
  const grandTotal = subtotal + ppnAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) {
      toast.error('Pelanggan wajib dipilih');
      return;
    }
    const validItems = form.items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Minimal 1 item produk harus diisi');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customerId: form.customerId,
        orderDate: form.orderDate,
        deliveryDate: form.expectedDeliveryDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        paymentTermDays: Number(form.paymentTermDays),
        shippingAddress: form.shippingAddress || undefined,
        notes: form.notes,
        items: validItems.map((i) => ({
          productId: i.productId,
          satuan: i.satuan,
          quantity: Number(i.quantity),
          batchNumber: i.batchNumber?.trim() || undefined,
          expiryDate: i.expiryDate || undefined,
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          notes: i.notes,
        })),
      };
      if (isEdit) {
        await updateOrder(oid(order), payload);
        toast.success('SO berhasil diperbarui');
      } else {
        await createOrder(payload);
        toast.success('SO berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} SO`);
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
            {isEdit ? 'Edit Sales Order Pengiriman' : 'Buat Sales Order Pengiriman'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Umum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pelanggan *</label>
              <AutocompleteInput
                value={form.customerName}
                onChange={(text) => setForm((p) => ({ ...p, customerName: text }))}
                onSelect={(item) => {
                  setForm((p) => ({
                    ...p,
                    customerId: item._id,
                    customerName: item.name,
                    shippingAddress: p.shippingAddress || [item.address?.street, item.address?.city, item.address?.province].filter(Boolean).join(', '),
                  }));
                }}
                onClear={() => setForm((p) => ({ ...p, customerId: '', customerName: '' }))}
                fetchFn={(params) => customerService.getAll({ ...params, isActive: true })}
                getDisplayText={(item) => item.name}
                renderItem={(item) => (
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.code} &middot; {item.type} &middot; {item.address?.city || '-'}</p>
                  </div>
                )}
                placeholder="Ketik nama pelanggan..."
              />
              {form.customerId && <p className="text-xs text-emerald-600 mt-1">Pelanggan terpilih</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal SO *</label>
              <input
                type="date"
                name="orderDate"
                value={form.orderDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Pembayaran</label>
              <select
                name="paymentTermDays"
                value={form.paymentTermDays}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                <option value="0">COD</option>
                <option value="7">Net 7 Hari</option>
                <option value="14">Net 14 Hari</option>
                <option value="30">Net 30 Hari</option>
                <option value="45">Net 45 Hari</option>
                <option value="60">Net 60 Hari</option>
                <option value="90">Net 90 Hari</option>
              </select>
            </div>
            <div />
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

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Daftar Item</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                <Package size={12} /> Mutasi stok OUT otomatis
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Pembulatan Harga Jual</label>
                <select
                  value={form.priceRoundingStep}
                  onChange={(e) => setForm((p) => ({ ...p, priceRoundingStep: Number(e.target.value) }))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                >
                  <option value={0}>Tanpa Pembulatan</option>
                  <option value={1}>Kelipatan 1</option>
                  <option value={10}>Kelipatan 10</option>
                  <option value={50}>Kelipatan 50</option>
                  <option value={100}>Kelipatan 100</option>
                  <option value={500}>Kelipatan 500</option>
                  <option value={1000}>Kelipatan 1000</option>
                </select>
              </div>
              <button
                type="button"
                onClick={roundAllUnitPrices}
                disabled={!form.priceRoundingStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Bulatkan Semua Harga
              </button>
            </div>
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 mb-3">
              <p className="text-xs text-cyan-800">
                Sales Order ini berfungsi sebagai dokumen pengiriman utama. Invoice dibuat terpisah melalui proses generate invoice, dan satu invoice dapat mencakup beberapa surat jalan.
              </p>
            </div>
            <div className="mb-3">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-24">Satuan</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-28">Qty</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-32">Margin %</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-32">Harga Jual</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-20">Disc %</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-32">Subtotal</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.items.map((item, idx) => {
                      const availableBatchOptions = getSelectableBatchesForItem(form.items, idx, stockMap[item.productId]?.batches || []);

                      return (
                      <React.Fragment key={idx}>
                        <tr className={item._splitFrom ? 'bg-gray-50/40' : ''}>
                          <td className="px-4 py-2.5 text-gray-400 align-top">{idx + 1}</td>
                          <td className="px-4 py-2.5 align-top">
                            {item._splitFrom ? (
                              <div className="pt-2">
                                <p className="text-xs text-gray-500 italic">↳ batch lanjutan</p>
                                <p className="font-medium text-gray-900">{item.productName || '-'}</p>
                              </div>
                            ) : (
                              <AutocompleteInput
                                disabled={Boolean(item._splitFrom)}
                                value={item.productName}
                                onChange={(text) => handleItemChange(idx, 'productName', text)}
                                onSelect={(prod) => {
                                  const items = [...form.items];
                                  items[idx] = {
                                    ...items[idx],
                                    productId: prod._id,
                                    productName: prod.name,
                                    sku: prod.sku || '',
                                    satuan: prod.satuan || items[idx].satuan,
                                    batchRef: '',
                                    batchNumber: '',
                                    expiryDate: '',
                                    unitPrice: 0,
                                    _splitFrom: '',
                                    _batchLocked: false,
                                  };
                                  setForm((p) => ({ ...p, items }));
                                  fetchProductStock(prod._id);
                                }}
                                onClear={() => {
                                  setForm((p) => {
                                    const items = [...p.items];
                                    items[idx] = {
                                      ...emptyItem(),
                                      _splitFrom: '',
                                      _batchLocked: false,
                                    };
                                    return { ...p, items };
                                  });
                                }}
                                fetchFn={(params) => productService.getAll({ ...params, isActive: true })}
                                getDisplayText={(prod) => prod.name}
                                renderItem={(prod) => (
                                  <div>
                                    <p className="font-medium text-gray-800">{prod.name}</p>
                                    <p className="text-xs text-gray-400">{prod.sku || '-'} &middot; {prod.satuan || '-'}</p>
                                  </div>
                                )}
                                placeholder="Cari produk..."
                                inputClassName="!rounded-lg !py-2"
                              />
                            )}
                            {item.sku && <p className="text-xs text-gray-400 mt-0.5">{item.sku}</p>}
                            {item.productId && stockMap[item.productId] && (
                              <div className="mt-1">
                                {stockMap[item.productId].totalStock > 0 ? (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                    stockMap[item.productId].totalStock < item.quantity
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    <Package size={10} />
                                    Stok: {stockMap[item.productId].totalStock.toLocaleString('id-ID')}
                                    {stockMap[item.productId].totalStock < item.quantity && ' (kurang)'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                    <AlertTriangle size={10} /> Stok habis
                                  </span>
                                )}
                              </div>
                            )}
                            {item.productId && !stockMap[item.productId] && (
                              <p className="text-[10px] text-gray-400 mt-1 animate-pulse">Mengecek stok...</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <input
                              value={item.satuan}
                              onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                              disabled={Boolean(item._splitFrom)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <input
                              type="number"
                              min="0"
                              value={item.margin ?? 0}
                              onChange={(e) => handleItemChange(idx, 'margin', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                              onBlur={() => roundItemUnitPrice(idx)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900 align-top">
                            {formatCurrency(calculateItemTotal(item))}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                        <tr className="bg-gray-50/40">
                          <td className="px-4 py-2 text-gray-300"> </td>
                          <td className="px-4 py-2" colSpan={4}>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Batch (FEFO)</label>
                            <select
                              value={item.batchRef || item.batchNumber || ''}
                              onChange={(e) => handleBatchSelect(idx, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                              disabled={item._batchLocked || !item.productId || availableBatchOptions.length === 0}
                            >
                              <option value="">
                                {!item.productId
                                  ? 'Pilih produk dulu'
                                  : availableBatchOptions.length
                                    ? 'Pilih batch (FEFO disarankan paling atas)'
                                    : 'Batch tidak tersedia'}
                              </option>
                              {availableBatchOptions.map((batch) => (
                                <option key={getBatchOptionValue(batch)} value={getBatchOptionValue(batch)}>
                                  {batch.batchNumber || '-'} | ED {formatDate(batch.expiryDate)} | Stok {getBatchAvailableQty(batch).toLocaleString('id-ID')} | Modal {formatCurrency(getBatchBaseUnitPrice(batch))}
                                </option>
                              ))}
                            </select>
                            {item._batchLocked && (
                              <p className="text-[10px] text-gray-400 mt-1">Batch terkunci karena stok batch sebelumnya sudah dialokasikan otomatis.</p>
                            )}
                          </td>
                          <td className="px-4 py-2" colSpan={4}>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Exp. Date</label>
                            <input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50/50">
                      <td colSpan={7} className="px-4 py-2.5 text-right text-sm text-gray-600">Subtotal</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(subtotal)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td colSpan={7} className="px-4 py-2.5 text-right text-sm text-gray-600">PPN ({isPkp ? ppnRate : 0}%)</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(ppnAmount)}</td>
                      <td></td>
                    </tr>
                    <tr className="border-t border-gray-300 bg-gray-50/50">
                      <td colSpan={7} className="px-4 py-3 text-right font-semibold text-gray-700">Grand Total</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">{formatCurrency(grandTotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* CDOB Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Ketentuan SO Pengiriman</p>
                <p className="text-xs text-blue-700 mt-1">
                  Karena modul Delivery terpisah sudah ditiadakan, Sales Order ini menjadi sumber utama alur pengiriman.
                  Perubahan status ke generate invoice dan menunggu pembayaran akan memicu proses lanjutan ke modul finance sesuai business rules backend.
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
              <span className="flex items-center gap-2"><Check size={14} /> {isEdit ? 'Perbarui SO' : 'Simpan SO'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SO DETAIL MODAL
   ═══════════════════════════════════════ */
function SODetailModal({ order, onClose }) {
  const normalizedStatus = normalizeSOStatus(order.status);
  const st = STATUS_MAP[normalizedStatus] || STATUS_MAP.shipped;
  const { isPkp, ppnRate, calculatePpn } = useSettings();

  const subtotal = (order.items || []).reduce((sum, item) => {
    const s = (item.quantity || 0) * (item.unitPrice || 0);
    return sum + s - (s * (item.discount || 0) / 100);
  }, 0);

  const ppnAmount = isPkp ? calculatePpn(subtotal) : 0;
  const total = order.totalAmount ?? (subtotal + ppnAmount);

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
                <h2 className="text-lg font-semibold text-gray-900">{getOrderSuratJalanNumber(order)}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                    <st.icon size={10} />
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(order.orderDate)}</span>
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
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pelanggan</p>
              <p className="text-sm font-medium text-gray-900">{resolveCustomer(order)?.name || '-'}</p>
              {resolveCustomer(order)?.code && <p className="text-xs text-gray-400 mt-0.5">Kode: {resolveCustomer(order).code}</p>}
              {resolveCustomer(order)?.type && <p className="text-xs text-gray-500 mt-0.5">Tipe: {resolveCustomer(order).type}</p>}
              {resolveCustomer(order)?.phone && <p className="text-xs text-gray-500 mt-1">{resolveCustomer(order).phone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Informasi Pengiriman</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Term: <span className="font-medium text-gray-800">{order.paymentTermDays ?? 30} hari</span></p>
                <p className="text-gray-600">No Surat Jalan: <span className="font-medium text-gray-800">{getOrderSuratJalanNumber(order)}</span></p>
                <p className="text-gray-600">No Invoice: <span className="font-medium text-gray-800">{getOrderInvoiceFakturNumber(order)}</span></p>
                {order.expectedDeliveryDate && (
                  <p className="text-gray-600">Estimasi kirim: <span className="font-medium text-gray-800">{formatDate(order.expectedDeliveryDate)}</span></p>
                )}
                {order.deliveryDate && (
                  <p className="text-gray-600">Tanggal kirim: <span className="font-medium text-gray-800">{formatDate(order.deliveryDate)}</span></p>
                )}
                {order.shippedAt && (
                  <p className="text-gray-600">Shipped at: <span className="font-medium text-gray-800">{formatDate(order.shippedAt)}</span></p>
                )}
                {order.invoicedAt && (
                  <p className="text-gray-600">Invoiced at: <span className="font-medium text-gray-800">{formatDate(order.invoicedAt)}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Pengiriman</p>
              </div>
              <p className="text-sm text-gray-700">{order.shippingAddress}</p>
            </div>
          )}

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Riwayat Status</h3>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => {
                  const hst = STATUS_MAP[normalizeSOStatus(h.status)] || STATUS_MAP.shipped;
                  const statusDotClass = ['completed'].includes(normalizeSOStatus(h.status))
                    ? 'bg-emerald-500'
                    : ['awaiting_payment'].includes(normalizeSOStatus(h.status))
                      ? 'bg-amber-500'
                    : ['returned', 'canceled', 'cancelled'].includes(normalizeSOStatus(h.status))
                      ? 'bg-red-500'
                      : 'bg-blue-500';
                  return (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${statusDotClass}`} />
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">{h.user?.name || 'System'}</span>
                          {' — '}
                          <span className="text-gray-600">{hst.label}</span>
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

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Daftar Item ({order.items?.length || 0})</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Satuan</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Batch</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Exp. Date</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Harga</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Disc</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.items || []).map((item, idx) => {
                    const sub = (item.quantity || 0) * (item.unitPrice || 0);
                    const itemTotal = sub - (sub * (item.discount || 0) / 100);
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">{resolveProduct(item)?.name || item.productName || '-'}</p>
                          {(resolveProduct(item)?.sku || item.sku) && (
                            <p className="text-xs text-gray-400">{resolveProduct(item)?.sku || item.sku}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{item.satuan}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.batchNumber || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.expiryDate ? formatDate(item.expiryDate) : '-'}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50/50">
                    <td colSpan={8} className="px-4 py-2.5 text-right text-sm text-gray-600">Subtotal</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(subtotal)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td colSpan={8} className="px-4 py-2.5 text-right text-sm text-gray-600">PPN ({isPkp ? ppnRate : 0}%)</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(ppnAmount)}</td>
                  </tr>
                  <tr className="border-t border-gray-300 bg-gray-50/50">
                    <td colSpan={8} className="px-4 py-3 text-right font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
            <p>Dibuat oleh: {order.createdBy?.name || '-'} — {formatDate(order.createdAt)}</p>
            <p>Terakhir diubah: {order.updatedBy?.name || '-'} — {formatDate(order.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ order, onClose, onConfirm }) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Sales Order?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Surat Jalan <strong>{getOrderSuratJalanNumber(order)}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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

function resolveCustomer(order) {
  const c = order?.customer && typeof order.customer === 'object' ? order.customer
    : order?.customerId && typeof order.customerId === 'object' ? order.customerId
    : null;
  return c;
}

function resolveCustomerIdStr(order) {
  const c = resolveCustomer(order);
  if (c) return c._id || '';
  if (typeof order?.customerId === 'string') return order.customerId;
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

function emptyItem() {
  return {
    productId: '',
    productName: '',
    sku: '',
    satuan: 'Box',
    quantity: 1,
    batchRef: '',
    batchNumber: '',
    expiryDate: '',
    unitPrice: 0,
    margin: 20,
    discount: 0,
    notes: '',
  };
}

function getBatchOptionValue(batch) {
  return String(batch?._id || batch?.batchNumber || '');
}

function getBatchAvailableQty(batch) {
  return Number(batch?.availableQuantity ?? batch?.availableQty ?? batch?.quantity ?? 0);
}

function getBatchBaseUnitPrice(batch) {
  return Number(batch?.unitPrice ?? batch?.purchasePrice ?? batch?.costPrice ?? batch?.hargaBeli ?? 0);
}

function calculateSellingPriceFromMargin(basePrice, marginPercent) {
  const base = Number(basePrice || 0);
  const margin = Number(marginPercent || 0);
  return Math.max(0, base * (1 + (margin / 100)));
}

function calculateMarginFromSellingPrice(basePrice, sellingPrice) {
  const base = Number(basePrice || 0);
  const selling = Number(sellingPrice || 0);
  if (base <= 0) return 0;
  return Number((((selling - base) / base) * 100).toFixed(2));
}

function applyPriceRounding(price, step) {
  const value = Number(price || 0);
  const roundingStep = Number(step || 0);
  if (!roundingStep) return value;
  return Math.round(value / roundingStep) * roundingStep;
}

function getFefoSortedBatches(batches) {
  return [...(batches || [])].sort((a, b) => {
    const da = new Date(a?.expiryDate || '9999-12-31').getTime();
    const db = new Date(b?.expiryDate || '9999-12-31').getTime();
    return da - db;
  });
}

function isBatchExpired(batch, now = new Date()) {
  const expiryRaw = batch?.expiryDate;
  if (!expiryRaw) return false;

  const expiry = new Date(expiryRaw);
  if (Number.isNaN(expiry.getTime())) return false;

  const endOfExpiryDay = new Date(expiry);
  endOfExpiryDay.setHours(23, 59, 59, 999);
  return endOfExpiryDay < now;
}

function getUsableFefoBatches(batches) {
  return getFefoSortedBatches(batches).filter((batch) => !isBatchExpired(batch));
}

function findBatchByValue(batches, value) {
  if (!value) return null;
  const key = String(value);
  return (batches || []).find((b) => (
    String(b?._id || '') === key || String(b?.batchNumber || '') === key
  )) || null;
}

function getSelectableBatchesForItem(items, index, batches) {
  const currentItem = items[index];
  if (!currentItem?.productId) return [];

  const currentValue = String(currentItem.batchRef || currentItem.batchNumber || '');
  const usedBySiblings = new Set(
    (items || [])
      .filter((entry, entryIndex) => entryIndex !== index && entry.productId === currentItem.productId)
      .map((entry) => String(entry.batchRef || entry.batchNumber || ''))
      .filter(Boolean),
  );

  return getUsableFefoBatches(batches).filter((batch) => {
    const optionValue = String(getBatchOptionValue(batch));
    const batchNumber = String(batch?.batchNumber || '');
    const availableQty = getBatchAvailableQty(batch);

    if (currentValue && (currentValue === optionValue || currentValue === batchNumber)) {
      return true;
    }

    if (availableQty <= 0) return false;

    return !usedBySiblings.has(optionValue) && !usedBySiblings.has(batchNumber);
  });
}

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr);
  return str.length >= 10 ? str.slice(0, 10) : '';
}

function formatCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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

function normalizeSOStatus(status) {
  const normalized = String(status || '').toLowerCase();
  const map = {
    draft: 'draft',
    confirmed: 'shipped',
    processing: 'shipped',
    ready_to_ship: 'shipped',
    packed: 'shipped',
    partial_shipped: 'shipped',
    delivered: 'awaiting_payment',
    partial_delivery: 'awaiting_payment',
    partial_delivered: 'awaiting_payment',
    invoiced: 'awaiting_payment',
    shipped: 'shipped',
    waiting_payment: 'awaiting_payment',
    pending_payment: 'awaiting_payment',
    awaiting_payment: 'awaiting_payment',
    paid: 'completed',
    lunas: 'completed',
    done: 'completed',
    completed: 'completed',
    returned: 'returned',
    canceled: 'returned',
    cancelled: 'returned',
  };
  return map[normalized] || normalized || 'draft';
}

function getAllowedStatusTransitions(status) {
  const current = normalizeSOStatus(status);
  const transitions = {
    draft: [
      { value: 'shipped', label: 'Dikirim' },
    ],
    shipped: [
      { value: 'returned', label: 'Diretur' },
    ],
    awaiting_payment: [],
    completed: [],
    returned: [],
    canceled: [],
  };
  return transitions[current] || [];
}

function getOrderSuratJalanNumber(order) {
  return order?.suratJalanNumber
    || order?.noSuratJalan
    || order?.deliveryNoteNumber
    || order?.invoiceNumber
    || order?.soNumber
    || order?.fakturNumber
    || order?.noFaktur
    || '-';
}

function getOrderInvoiceFakturNumber(order) {
  const firstInvoice = Array.isArray(order?.invoices) ? order.invoices[0] : null;

  return order?.invoiceNumber
    || order?.noInvoice
    || order?.fakturNumber
    || order?.noFaktur
    || order?.invoice?.invoiceNumber
    || order?.invoice?.fakturNumber
    || firstInvoice?.invoiceNumber
    || firstInvoice?.fakturNumber
    || 'Belum dibuat';
}
