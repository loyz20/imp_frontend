import React, { useEffect, useState, useMemo, useCallback } from 'react';
import usePurchaseOrderStore from '../../store/purchaseOrderStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import PurchaseOrderPrintTemplate from '../../components/PurchaseOrderPrintTemplate';
import supplierService from '../../services/supplierService';
import productService from '../../services/productService';
import purchaseOrderService from '../../services/purchaseOrderService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  ShoppingCart, Building2, Package, FileText, Calendar,
  Loader2, CheckCircle, Clock, Ban, Send, ThumbsUp, ThumbsDown,
  CircleDollarSign, TrendingUp, ClipboardList, Printer,
} from 'lucide-react';

/* ── Constants ── */
const PO_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  { value: 'pending_approval', label: 'Menunggu Persetujuan', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  { value: 'approved', label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ThumbsUp },
  { value: 'sent', label: 'Dikirim ke Supplier', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Send },
  { value: 'partial_received', label: 'Diterima Sebagian', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
  { value: 'received', label: 'Diterima Lengkap', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(PO_STATUS.map((s) => [s.value, s]));

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'apoteker'];
const CAN_APPROVE_ROLES = ['superadmin', 'admin'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function PurchaseOrder() {
  const {
    orders, stats, pagination, isLoading, filters,
    fetchOrders, fetchStats, setFilters, deleteOrder, changeStatus,
  } = usePurchaseOrderStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';
  const { requirePOApproval, getDocPrefix } = useSettings();
  const poPrefix = getDocPrefix('purchaseOrder');

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canApprove = CAN_APPROVE_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);

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
      toast.success('PO berhasil dihapus');
      setDeleteConfirm(null);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus PO');
    }
  };

  const handleSubmitForApproval = async (order) => {
    try {
      if (requirePOApproval) {
        await changeStatus(oid(order), 'pending_approval');
        toast.success('PO berhasil diajukan untuk persetujuan');
      } else {
        // Tanpa approval — langsung approved
        await changeStatus(oid(order), 'approved');
        toast.success('PO berhasil disetujui (approval tidak diperlukan)');
      }
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses PO');
    }
  };

  const handleSendToSupplier = async (order) => {
    try {
      await changeStatus(oid(order), 'sent');
      toast.success('PO berhasil dikirim ke supplier');
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim PO');
    }
  };

  const handlePrint = useCallback(async (order) => {
    try {
      const { data } = await purchaseOrderService.getById(oid(order));
      setPrintOrder(data.data);
      setTimeout(() => window.print(), 300);
    } catch {
      setPrintOrder(order);
      setTimeout(() => window.print(), 300);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembelian (Purchase Order)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola surat pesanan pembelian obat dan alkes ke supplier.
            {poPrefix && <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Prefix: {poPrefix}</span>}
            {!requirePOApproval && <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Tanpa Approval</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Buat PO Baru
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total PO', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: ClipboardList },
            { label: 'Menunggu Persetujuan', value: stats.pendingApproval ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock },
            { label: 'Dikirim', value: stats.sent ?? 0, color: 'from-blue-500 to-blue-600', icon: Send },
            { label: 'Total Nilai', value: formatCurrency(stats.totalValue ?? 0), color: 'from-emerald-500 to-emerald-600', icon: CircleDollarSign, isText: true },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <span className={`${s.isText ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{s.value}</span>
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
              placeholder="Cari nomor PO, supplier..."
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
            {PO_STATUS.map((s) => (
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. PO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Supplier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tanggal</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Total Item</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Total Nilai</th>
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
                    <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada PO ditemukan.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.draft;
                  return (
                    <tr key={oid(order)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{order.poNumber}</p>
                        {order.notes && (
                          <p className="text-xs text-gray-400 truncate max-w-50">{order.notes}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="text-gray-800 truncate">{resolveSupplier(order)?.name || '-'}</p>
                          {resolveSupplier(order)?.code && (
                            <p className="text-xs text-gray-400">{resolveSupplier(order).code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">
                        {order.items?.length || 0} item
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900 hidden xl:table-cell">
                        {formatCurrency(order.totalAmount)}
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
                            onClick={() => setShowDetail(order)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrint(order)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Cetak / PDF"
                          >
                            <Printer size={16} />
                          </button>
                          {canCrud && order.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEdit(order)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <SquarePen size={16} />
                              </button>
                              <button
                                onClick={() => handleSubmitForApproval(order)}
                                className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                title={requirePOApproval ? 'Ajukan Persetujuan' : 'Setujui Langsung'}
                              >
                                {requirePOApproval ? <Send size={16} /> : <Check size={16} />}
                              </button>
                            </>
                          )}
                          {requirePOApproval && canApprove && order.status === 'pending_approval' && (
                            (() => {
                              const creatorId = typeof order.createdBy === 'object' ? order.createdBy?._id : order.createdBy;
                              const isSelfCreated = creatorId && creatorId === currentUser?._id;
                              return isSelfCreated ? (
                                <span className="p-2 text-gray-300 cursor-not-allowed" title="Tidak dapat menyetujui PO yang dibuat sendiri">
                                  <ThumbsUp size={16} />
                                </span>
                              ) : (
                                <button
                                  onClick={() => setApprovalModal(order)}
                                  className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                  title="Setujui / Tolak"
                                >
                                  <ThumbsUp size={16} />
                                </button>
                              );
                            })()
                          )}
                          {canCrud && order.status === 'approved' && (
                            <button
                              onClick={() => handleSendToSupplier(order)}
                              className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Kirim ke Supplier"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {canDelete && (order.status === 'draft' || order.status === 'cancelled') && (
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
          label="PO"
        />
      </div>

      {/* Print Template — hidden on screen, visible on print */}
      <PurchaseOrderPrintTemplate order={printOrder} />

      {/* Modals */}
      {showForm && (
        <POFormModal
          order={editingOrder}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchOrders(); fetchStats(); }}
        />
      )}
      {showDetail && <PODetailModal order={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal order={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
      {approvalModal && (
        <ApprovalModal
          order={approvalModal}
          onClose={() => setApprovalModal(null)}
          onApproved={() => { setApprovalModal(null); fetchOrders(); fetchStats(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PO FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function POFormModal({ order, onClose, onSaved }) {
  const { createOrder, updateOrder } = usePurchaseOrderStore();
  const { defaultPaymentTermDays, isAutoNumber } = useSettings();
  const autoNum = isAutoNumber('purchaseOrder');
  const isEdit = !!order;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    poNumber: order?.poNumber || '',
    supplierId: resolveSupplierIdStr(order),
    supplierName: resolveSupplier(order)?.name || '',
    orderDate: order?.orderDate ? order.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: order?.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : '',
    paymentTermDays: order?.paymentTermDays ?? defaultPaymentTermDays ?? 30,
    notes: order?.notes || '',
    items: order?.items?.length
      ? order.items.map((item) => ({
          productId: resolveProductIdStr(item),
          productName: resolveProduct(item)?.name || item.productName || '',
          sku: resolveProduct(item)?.sku || item.sku || '',
          satuan: item.satuan || 'Box',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discount: item.discount || 0,
          notes: item.notes || '',
        }))
      : [emptyItem()],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((p) => {
      const items = [...p.items];
      items[index] = { ...items[index], [field]: value };
      return { ...p, items };
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

  const grandTotal = form.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!autoNum && !isEdit && !form.poNumber.trim()) {
      toast.error('Nomor PO wajib diisi (auto-number nonaktif)');
      return;
    }
    if (!form.supplierId) {
      toast.error('Supplier wajib dipilih');
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
        ...(!autoNum && !isEdit && { poNumber: form.poNumber.trim() }),
        supplierId: form.supplierId,
        orderDate: form.orderDate,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        paymentTermDays: Number(form.paymentTermDays),
        notes: form.notes,
        items: validItems.map((i) => ({
          productId: i.productId,
          satuan: i.satuan,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          notes: i.notes,
        })),
      };
      if (isEdit) {
        await updateOrder(oid(order), payload);
        toast.success('PO berhasil diperbarui');
      } else {
        await createOrder(payload);
        toast.success('PO berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} PO`);
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
            {isEdit ? 'Edit Purchase Order' : 'Buat Purchase Order Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Umum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Nomor PO — manual jika auto-number nonaktif */}
            {!autoNum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor PO *</label>
                <input
                  name="poNumber"
                  value={form.poNumber}
                  onChange={handleChange}
                  placeholder="Ketik nomor PO..."
                  disabled={isEdit}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <p className="text-xs text-gray-400 mt-1">Masukkan nomor PO secara manual</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier *</label>
              <AutocompleteInput
                value={form.supplierName}
                onChange={(text) => setForm((p) => ({ ...p, supplierName: text }))}
                onSelect={(item) => setForm((p) => ({ ...p, supplierId: item._id, supplierName: item.name }))}
                onClear={() => setForm((p) => ({ ...p, supplierId: '', supplierName: '' }))}
                fetchFn={(params) => supplierService.getAll({ ...params, isActive: true })}
                getDisplayText={(item) => item.name}
                renderItem={(item) => (
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.code} &middot; {item.phone || '-'}</p>
                  </div>
                )}
                placeholder="Ketik nama supplier..."
              />
              {form.supplierId && <p className="text-xs text-emerald-600 mt-1">Supplier terpilih</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal PO *</label>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Catatan PO (opsional)"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Daftar Item</h3>
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
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-32">Harga Satuan</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-20">Disc %</th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-32">Subtotal</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2.5">
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
                                unitPrice: prod.hargaBeli || prod.purchasePrice || items[idx].unitPrice,
                              };
                              setForm((p) => ({ ...p, items }));
                            }}
                            onClear={() => {
                              handleItemChange(idx, 'productId', '');
                              handleItemChange(idx, 'productName', '');
                              handleItemChange(idx, 'sku', '');
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
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            value={item.satuan}
                            onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
                        <td className="px-4 py-2.5">
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50/50">
                      <td colSpan={6} className="px-4 py-3 text-right font-semibold text-gray-700">
                        Grand Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">
                        {formatCurrency(grandTotal)}
                      </td>
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
                <p className="text-sm font-medium text-blue-800">Surat Pesanan (SP)</p>
                <p className="text-xs text-blue-700 mt-1">
                  Untuk Narkotika & Psikotropika, surat pesanan khusus akan dicetak terpisah sesuai regulasi BPOM.
                  SP wajib ditandatangani oleh Apoteker Penanggung Jawab.
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
              <span className="flex items-center gap-2"><Check size={14} /> {isEdit ? 'Perbarui PO' : 'Simpan PO'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PO DETAIL MODAL
   ═══════════════════════════════════════ */
function PODetailModal({ order, onClose }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.draft;

  const subtotal = (order.items || []).reduce((sum, item) => {
    const s = (item.quantity || 0) * (item.unitPrice || 0);
    return sum + s - (s * (item.discount || 0) / 100);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{order.poNumber}</h2>
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
          {/* Supplier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supplier</p>
              <p className="text-sm font-medium text-gray-900">{resolveSupplier(order)?.name || '-'}</p>
              {resolveSupplier(order)?.code && <p className="text-xs text-gray-400 mt-0.5">Kode: {resolveSupplier(order).code}</p>}
              {resolveSupplier(order)?.phone && <p className="text-xs text-gray-500 mt-1">{resolveSupplier(order).phone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Informasi PO</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Term: <span className="font-medium text-gray-800">{order.paymentTermDays ?? 30} hari</span></p>
                {order.expectedDeliveryDate && (
                  <p className="text-gray-600">Estimasi kirim: <span className="font-medium text-gray-800">{formatDate(order.expectedDeliveryDate)}</span></p>
                )}
              </div>
            </div>
          </div>

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
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Harga</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Disc</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.items || []).map((item, idx) => {
                    const sub = (item.quantity || 0) * (item.unitPrice || 0);
                    const total = sub - (sub * (item.discount || 0) / 100);
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
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50/50">
                    <td colSpan={6} className="px-4 py-3 text-right font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(order.totalAmount ?? subtotal)}</td>
                  </tr>
                  {(order.paidAmount > 0 || order.remainingAmount > 0) && (
                    <>
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-600">Terbayar</td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatCurrency(order.paidAmount || 0)}</td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-600">Sisa Hutang</td>
                        <td className="px-4 py-2 text-right font-bold text-amber-600">{formatCurrency(order.remainingAmount ?? order.totalAmount)}</td>
                      </tr>
                    </>
                  )}
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

          {/* Approval History */}
          {order.approvalHistory && order.approvalHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Riwayat Persetujuan</h3>
              <div className="space-y-2">
                {order.approvalHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${h.action === 'approved' ? 'bg-emerald-500' : h.action === 'rejected' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{h.user?.name || 'System'}</span>
                        {' — '}
                        <span className={h.action === 'approved' ? 'text-emerald-600' : h.action === 'rejected' ? 'text-red-600' : 'text-gray-600'}>
                          {h.action === 'approved' ? 'Disetujui' : h.action === 'rejected' ? 'Ditolak' : h.action}
                        </span>
                      </p>
                      {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
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
   APPROVAL MODAL
   ═══════════════════════════════════════ */
function ApprovalModal({ order, onClose, onApproved }) {
  const { approveOrder, rejectOrder } = usePurchaseOrderStore();
  const currentUser = useAuthStore((s) => s.user);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Separation of duties — pembuat PO tidak boleh approve
  const creatorId = typeof order.createdBy === 'object' ? order.createdBy?._id : order.createdBy;
  const isSelfCreated = creatorId && creatorId === currentUser?._id;

  const handleApprove = async () => {
    if (isSelfCreated) {
      toast.error('Tidak dapat menyetujui PO yang Anda buat sendiri');
      return;
    }
    setLoading(true);
    try {
      await approveOrder(oid(order), notes);
      toast.success('PO berhasil disetujui');
      onApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui PO');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await rejectOrder(oid(order), notes);
      toast.success('PO ditolak');
      onApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Persetujuan PO</h3>
        <p className="text-sm text-gray-500 mb-4">
          PO <strong>{order.poNumber}</strong> — {resolveSupplier(order)?.name || '-'}
        </p>

        {isSelfCreated && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Anda tidak dapat menyetujui PO yang Anda buat sendiri (separation of duties).</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
          <p className="text-gray-600">Total: <span className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span></p>
          <p className="text-gray-600">Item: <span className="font-medium">{order.items?.length || 0} produk</span></p>
          <p className="text-gray-600">Dibuat oleh: <span className="font-medium">{order.createdBy?.name || '-'}</span></p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
            placeholder="Catatan persetujuan / alasan penolakan..."
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <span className="flex items-center gap-2"><ThumbsDown size={14} /> Tolak</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || isSelfCreated}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2"><ThumbsUp size={14} /> Setujui</span>
          </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Purchase Order?</h3>
        <p className="text-sm text-gray-500 mb-6">
          PO <strong>{order.poNumber}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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

/** Resolve supplier from either `supplier` (populated) or `supplierId` (populated ObjectId) */
function resolveSupplier(order) {
  const s = order?.supplier && typeof order.supplier === 'object' ? order.supplier
    : order?.supplierId && typeof order.supplierId === 'object' ? order.supplierId
    : null;
  return s;
}

function resolveSupplierIdStr(order) {
  const s = resolveSupplier(order);
  if (s) return s._id || '';
  if (typeof order?.supplierId === 'string') return order.supplierId;
  return '';
}

/** Resolve product from item's `product` or `productId` (populated ObjectId) */
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
  return { productId: '', productName: '', sku: '', satuan: 'Box', quantity: 1, unitPrice: 0, discount: 0, notes: '' };
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
