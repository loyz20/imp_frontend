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
  { value: 'packed', label: 'Dikemas', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package },
  { value: 'delivered', label: 'Terkirim', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'partial_delivered', label: 'Terkirim Sebagian', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck },
  { value: 'completed', label: 'Selesai', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  { value: 'returned', label: 'Diretur', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Ban },
  { value: 'canceled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(SO_STATUS.map((s) => [s.value, s]));
STATUS_MAP.cancelled = STATUS_MAP.canceled;

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'sales'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function SalesOrder() {
  const {
    orders, stats, pagination, isLoading, filters,
    fetchOrders, fetchStats, setFilters, deleteOrder, changeStatus,
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

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters, fetchOrders, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjualan (Sales Order)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola alur status SO: draft ke packed, packed ke delivered, delivered ke partial delivered, returned, atau completed.
            {soPrefix && <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Prefix: {soPrefix}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">Draft</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Packed</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            { label: 'Dikemas', value: stats.packed ?? 0, color: 'from-blue-500 to-blue-600', icon: Package },
            { label: 'Terkirim', value: stats.delivered ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
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
              placeholder="Cari nomor SO, pelanggan..."
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. SO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pelanggan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tgl Order</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Estimasi Kirim</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Total Item</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada SO ditemukan.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const normalizedStatus = normalizeSOStatus(order.status);
                  const st = STATUS_MAP[normalizedStatus] || STATUS_MAP.packed;
                  const allowedTransitions = canCrud ? getAllowedStatusTransitions(normalizedStatus) : [];
                  return (
                    <tr key={oid(order)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{getOrderInvoiceNumber(order)}</p>
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
                        {formatDate(order.expectedDeliveryDate)}
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
                                const actionStatus = STATUS_MAP[normalizeSOStatus(action.value)] || STATUS_MAP.packed;
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
                          {canDelete && (normalizedStatus === 'draft' || normalizedStatus === 'canceled') && (
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
      const batches = res.data?.data || res.data || [];
      const totalStock = batches.reduce((sum, b) => sum + (b.availableQuantity ?? b.availableQty ?? b.quantity ?? 0), 0);
      setStockMap((prev) => ({ ...prev, [productId]: { totalStock, batches } }));
    } catch {
      setStockMap((prev) => ({ ...prev, [productId]: { totalStock: 0, batches: [] } }));
    }
  }, [stockMap]);

  const [form, setForm] = useState({
    invoiceNumber: getOrderInvoiceNumber(order),
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
          margin: Number(item.margin ?? 0),
          discount: item.discount || 0,
          notes: item.notes || '',
        }))
      : [emptyItem()],
  });

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
      const items = prev.items.map((item) => {
        if (!item.productId) return item;
        const productStock = stockMap[item.productId];
        if (!productStock?.batches?.length) return item;

        const fefoBatches = getFefoSortedBatches(productStock.batches);
        const selected = findBatchByValue(fefoBatches, item.batchRef || item.batchNumber);

        if (selected) {
          const selectedRef = getBatchOptionValue(selected);
          if (item.batchRef !== selectedRef) {
            changed = true;
            return { ...item, batchRef: selectedRef };
          }
          return item;
        }

        if (!item.batchNumber && fefoBatches.length > 0) {
          const firstBatch = fefoBatches[0];
          const baseBatchPrice = getBatchBaseUnitPrice(firstBatch);
          changed = true;
          return {
            ...item,
            batchRef: getBatchOptionValue(firstBatch),
            batchNumber: firstBatch.batchNumber || '',
            expiryDate: toDateInputValue(firstBatch.expiryDate),
            unitPrice: applyPriceRounding(
              calculateSellingPriceFromMargin(baseBatchPrice, item.margin),
              prev.priceRoundingStep,
            ),
          };
        }

        return item;
      });

      return changed ? { ...prev, items } : prev;
    });
  }, [stockMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((p) => {
      const items = [...p.items];
      const nextItem = { ...items[index], [field]: value };

      if (field === 'margin') {
        const productStock = stockMap[nextItem.productId];
        const selectedBatch = findBatchByValue(productStock?.batches || [], nextItem.batchRef || nextItem.batchNumber);
        if (selectedBatch) {
          const baseBatchPrice = getBatchBaseUnitPrice(selectedBatch);
          nextItem.unitPrice = applyPriceRounding(
            calculateSellingPriceFromMargin(baseBatchPrice, value),
            p.priceRoundingStep,
          );
        }
      }

      items[index] = nextItem;
      return { ...p, items };
    });
  };

  const handleBatchSelect = (index, batchValue) => {
    setForm((p) => {
      const items = [...p.items];
      const current = items[index];
      const productStock = stockMap[current.productId];
      const selectedBatch = findBatchByValue(productStock?.batches || [], batchValue);

      if (!selectedBatch) {
        items[index] = {
          ...current,
          batchRef: batchValue,
          batchNumber: '',
          expiryDate: '',
        };
        return { ...p, items };
      }

      const baseBatchPrice = getBatchBaseUnitPrice(selectedBatch);
      items[index] = {
        ...current,
        batchRef: getBatchOptionValue(selectedBatch),
        batchNumber: selectedBatch.batchNumber || '',
        expiryDate: toDateInputValue(selectedBatch.expiryDate),
        unitPrice: applyPriceRounding(
          calculateSellingPriceFromMargin(baseBatchPrice, current.margin),
          p.priceRoundingStep,
        ),
      };
      return { ...p, items };
    });
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
    if (!form.invoiceNumber.trim()) {
      toast.error('Nomor SO/Invoice wajib diisi');
      return;
    }
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
        invoiceNumber: form.invoiceNumber.trim(),
        customerId: form.customerId,
        orderDate: form.orderDate,
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor SO/Invoice *</label>
              <input
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="SO-2026-0001"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">Harus unik sesuai kontrak API</p>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimasi Pengiriman</label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={form.expectedDeliveryDate}
                onChange={handleChange}
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
                SO ini berfungsi sebagai dokumen pengiriman utama. Saat disimpan, status awal mengikuti flow backend (draft), lalu diproses ke packed dan delivered sesuai alur operasional.
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
                    {form.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td className="px-4 py-2.5 text-gray-400 align-top">{idx + 1}</td>
                          <td className="px-4 py-2.5 align-top">
                            <AutocompleteInput
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
                                };
                                setForm((p) => ({ ...p, items }));
                                fetchProductStock(prod._id);
                              }}
                              onClear={() => {
                                handleItemChange(idx, 'productId', '');
                                handleItemChange(idx, 'productName', '');
                                handleItemChange(idx, 'sku', '');
                                handleItemChange(idx, 'batchRef', '');
                                handleItemChange(idx, 'batchNumber', '');
                                handleItemChange(idx, 'expiryDate', '');
                                handleItemChange(idx, 'unitPrice', 0);
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
                              disabled={!item.productId || !stockMap[item.productId]?.batches?.length}
                            >
                              <option value="">
                                {!item.productId
                                  ? 'Pilih produk dulu'
                                  : stockMap[item.productId]?.batches?.length
                                    ? 'Pilih batch (FEFO disarankan paling atas)'
                                    : 'Batch tidak tersedia'}
                              </option>
                              {getFefoSortedBatches(stockMap[item.productId]?.batches || []).map((batch) => (
                                <option key={getBatchOptionValue(batch)} value={getBatchOptionValue(batch)}>
                                  {batch.batchNumber || '-'} | ED {formatDate(batch.expiryDate)} | Stok {getBatchAvailableQty(batch).toLocaleString('id-ID')} | Modal {formatCurrency(getBatchBaseUnitPrice(batch))}
                                </option>
                              ))}
                            </select>
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50/50">
                      <td colSpan={7} className="px-4 py-2.5 text-right text-sm text-gray-600">Subtotal</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(subtotal)}</td>
                      <td></td>
                    </tr>
                    {isPkp && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={7} className="px-4 py-2.5 text-right text-sm text-gray-600">PPN ({ppnRate}%)</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(ppnAmount)}</td>
                        <td></td>
                      </tr>
                    )}
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
                  Perubahan status ke delivered akan memicu proses lanjutan ke modul finance sesuai business rules backend.
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
  const st = STATUS_MAP[normalizedStatus] || STATUS_MAP.packed;
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
                <h2 className="text-lg font-semibold text-gray-900">{getOrderInvoiceNumber(order)}</h2>
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
                <p className="text-gray-600">Nomor SO/Invoice: <span className="font-medium text-gray-800">{getOrderInvoiceNumber(order)}</span></p>
                {order.expectedDeliveryDate && (
                  <p className="text-gray-600">Estimasi kirim: <span className="font-medium text-gray-800">{formatDate(order.expectedDeliveryDate)}</span></p>
                )}
                {order.packedAt && (
                  <p className="text-gray-600">Packed at: <span className="font-medium text-gray-800">{formatDate(order.packedAt)}</span></p>
                )}
                {order.deliveredAt && (
                  <p className="text-gray-600">Delivered at: <span className="font-medium text-gray-800">{formatDate(order.deliveredAt)}</span></p>
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
                  const hst = STATUS_MAP[normalizeSOStatus(h.status)] || STATUS_MAP.packed;
                  const statusDotClass = ['delivered', 'completed'].includes(normalizeSOStatus(h.status))
                    ? 'bg-emerald-500'
                    : ['partial_delivered'].includes(normalizeSOStatus(h.status))
                      ? 'bg-purple-500'
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
                  {isPkp && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={8} className="px-4 py-2.5 text-right text-sm text-gray-600">PPN ({ppnRate}%)</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(ppnAmount)}</td>
                    </tr>
                  )}
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
          SO <strong>{getOrderInvoiceNumber(order)}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
    margin: 0,
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

function findBatchByValue(batches, value) {
  if (!value) return null;
  const key = String(value);
  return (batches || []).find((b) => (
    String(b?._id || '') === key || String(b?.batchNumber || '') === key
  )) || null;
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
    confirmed: 'packed',
    processing: 'packed',
    ready_to_ship: 'packed',
    partial_shipped: 'partial_delivered',
    partial_delivery: 'partial_delivered',
    partial_delivered: 'partial_delivered',
    shipped: 'delivered',
    done: 'completed',
    completed: 'completed',
    cancelled: 'canceled',
  };
  return map[normalized] || normalized || 'draft';
}

function getAllowedStatusTransitions(status) {
  const current = normalizeSOStatus(status);
  const transitions = {
    draft: [
      { value: 'packed', label: 'Dikemas' },
      { value: 'canceled', label: 'Dibatalkan' },
    ],
    packed: [
      { value: 'delivered', label: 'Terkirim' },
    ],
    delivered: [
      { value: 'partial_delivered', label: 'Terkirim Sebagian' },
      { value: 'returned', label: 'Diretur' },
      { value: 'completed', label: 'Selesai' },
    ],
    partial_delivered: [
      { value: 'delivered', label: 'Terkirim Penuh' },
      { value: 'returned', label: 'Diretur' },
      { value: 'completed', label: 'Selesai' },
    ],
    completed: [],
    returned: [],
    canceled: [],
  };
  return transitions[current] || [];
}

function getOrderInvoiceNumber(order) {
  return order?.invoiceNumber || order?.soNumber || order?.fakturNumber || order?.noFaktur || '-';
}
