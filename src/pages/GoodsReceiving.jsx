import React, { useEffect, useState, useMemo } from 'react';
import useGoodsReceivingStore from '../store/goodsReceivingStore';
import useAuthStore from '../store/authStore';
import Pagination from '../components/Pagination';
import AutocompleteInput from '../components/AutocompleteInput';
import purchaseOrderService from '../services/purchaseOrderService';
import productService from '../services/productService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  Package, FileText, Calendar, Loader2, CheckCircle, Clock,
  ClipboardCheck, TruckIcon, Boxes, ShieldCheck, FlaskConical,
  ThermometerSun,
} from 'lucide-react';

/* ── Constants ── */
const GR_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  { value: 'checked', label: 'Diperiksa', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClipboardCheck },
  { value: 'verified', label: 'Terverifikasi', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck },
  { value: 'completed', label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
];

const STATUS_MAP = Object.fromEntries(GR_STATUS.map((s) => [s.value, s]));

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'gudang'];
const CAN_VERIFY_ROLES = ['superadmin', 'admin', 'apoteker'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function GoodsReceiving() {
  const {
    receivings, stats, pagination, isLoading, filters,
    fetchReceivings, fetchStats, setFilters, deleteReceiving,
  } = useGoodsReceivingStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canVerify = CAN_VERIFY_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingReceiving, setEditingReceiving] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);

  useEffect(() => {
    fetchReceivings();
    fetchStats();
  }, [filters, fetchReceivings, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingReceiving(null); setShowForm(true); };
  const openEdit = (rec) => { setEditingReceiving(rec); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingReceiving(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteReceiving(oid(deleteConfirm));
      toast.success('Penerimaan berhasil dihapus');
      setDeleteConfirm(null);
      fetchReceivings();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus penerimaan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penerimaan Barang</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola penerimaan barang dari supplier berdasarkan Purchase Order.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCrud && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Terima Barang
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Penerimaan', value: stats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: Boxes },
            { label: 'Menunggu Verifikasi', value: stats.pendingVerification ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock },
            { label: 'Terverifikasi', value: stats.verified ?? 0, color: 'from-blue-500 to-blue-600', icon: ShieldCheck },
            { label: 'Bulan Ini', value: stats.thisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: Calendar },
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
              placeholder="Cari nomor penerimaan, PO, supplier..."
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
            {GR_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ sort: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="-createdAt">Terbaru</option>
            <option value="createdAt">Terlama</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Penerimaan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">No. PO</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Supplier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Tgl Terima</th>
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
              ) : receivings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Tidak ada penerimaan barang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                receivings.map((rec) => {
                  const st = STATUS_MAP[rec.status] || STATUS_MAP.draft;
                  return (
                    <tr key={oid(rec)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{rec.receivingNumber}</p>
                        {rec.deliveryNote && (
                          <p className="text-xs text-gray-400 truncate max-w-45">SJ: {rec.deliveryNote}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-blue-600 font-medium">{resolveRef(rec, 'purchaseOrder', 'purchaseOrderId')?.poNumber || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-gray-800 truncate">{resolveRef(rec, 'supplier', 'supplierId')?.name || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">
                        {formatDate(rec.receivingDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 hidden lg:table-cell">
                        {rec.items?.length || 0} item
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
                            onClick={() => setShowDetail(rec)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canCrud && rec.status === 'draft' && (
                            <button
                              onClick={() => openEdit(rec)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <SquarePen size={16} />
                            </button>
                          )}
                          {canVerify && (rec.status === 'draft' || rec.status === 'checked') && (
                            <button
                              onClick={() => setVerifyModal(rec)}
                              className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Verifikasi"
                            >
                              <ShieldCheck size={16} />
                            </button>
                          )}
                          {canDelete && rec.status === 'draft' && (
                            <button
                              onClick={() => setDeleteConfirm(rec)}
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
          label="Penerimaan"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <GRFormModal
          receiving={editingReceiving}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchReceivings(); fetchStats(); }}
        />
      )}
      {showDetail && <GRDetailModal receiving={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal receiving={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
      {verifyModal && (
        <VerifyModal
          receiving={verifyModal}
          onClose={() => setVerifyModal(null)}
          onVerified={() => { setVerifyModal(null); fetchReceivings(); fetchStats(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   GR FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function GRFormModal({ receiving, onClose, onSaved }) {
  const { createReceiving, updateReceiving } = useGoodsReceivingStore();
  const isEdit = !!receiving;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    purchaseOrderId: resolveIdStr(receiving, 'purchaseOrder', 'purchaseOrderId'),
    poNumber: resolveRef(receiving, 'purchaseOrder', 'purchaseOrderId')?.poNumber || '',
    supplierName: resolveRef(receiving, 'supplier', 'supplierId')?.name || resolveRef(receiving?.purchaseOrder, 'supplier', 'supplierId')?.name || '',
    receivingDate: receiving?.receivingDate ? receiving.receivingDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    deliveryNote: receiving?.deliveryNote || '',
    notes: receiving?.notes || '',
    items: receiving?.items?.length
      ? receiving.items.map((item) => ({
          productId: resolveIdStr(item, 'product', 'productId'),
          productName: resolveRef(item, 'product', 'productId')?.name || item.productName || '',
          sku: resolveRef(item, 'product', 'productId')?.sku || item.sku || '',
          satuan: item.satuan || 'Box',
          orderedQty: item.orderedQty || 0,
          receivedQty: item.receivedQty || 0,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
          manufacturingDate: item.manufacturingDate ? item.manufacturingDate.slice(0, 10) : '',
          storageCondition: item.storageCondition || 'Suhu Kamar',
          conditionStatus: item.conditionStatus || 'baik',
          notes: item.notes || '',
        }))
      : [emptyGRItem()],
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
    setForm((p) => ({ ...p, items: [...p.items, emptyGRItem()] }));
  };

  const removeItem = (index) => {
    setForm((p) => {
      const items = p.items.filter((_, i) => i !== index);
      return { ...p, items: items.length ? items : [emptyGRItem()] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = form.items.filter((i) => i.productId && i.receivedQty > 0);
    if (validItems.length === 0) {
      toast.error('Minimal 1 item harus memiliki qty diterima > 0');
      return;
    }
    const missingBatch = validItems.find((i) => !i.batchNumber);
    if (missingBatch) {
      toast.error('Nomor batch wajib diisi untuk setiap item (CDOB)');
      return;
    }
    const missingExpiry = validItems.find((i) => !i.expiryDate);
    if (missingExpiry) {
      toast.error('Tanggal kedaluwarsa wajib diisi untuk setiap item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        purchaseOrderId: form.purchaseOrderId || undefined,
        receivingDate: form.receivingDate,
        deliveryNote: form.deliveryNote,
        notes: form.notes,
        items: validItems.map((i) => ({
          productId: i.productId,
          satuan: i.satuan,
          orderedQty: Number(i.orderedQty),
          receivedQty: Number(i.receivedQty),
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
          manufacturingDate: i.manufacturingDate || undefined,
          storageCondition: i.storageCondition,
          conditionStatus: i.conditionStatus,
          notes: i.notes,
        })),
      };
      if (isEdit) {
        await updateReceiving(oid(receiving), payload);
        toast.success('Penerimaan berhasil diperbarui');
      } else {
        await createReceiving(payload);
        toast.success('Penerimaan berhasil disimpan');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'menyimpan'} penerimaan`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Penerimaan Barang' : 'Penerimaan Barang Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Referensi PO</label>
              <AutocompleteInput
                value={form.poNumber}
                onChange={(text) => setForm((p) => ({ ...p, poNumber: text }))}
                onSelect={(po) => {
                  const supplier = po.supplier || po.supplierId;
                  const supplierName = typeof supplier === 'object' ? supplier?.name : '';
                  setForm((p) => ({
                    ...p,
                    purchaseOrderId: po._id,
                    poNumber: po.poNumber,
                    supplierName,
                    items: po.items?.length
                      ? po.items.map((item) => {
                          const prod = item.product || item.productId;
                          return {
                            productId: typeof prod === 'object' ? prod?._id : prod || '',
                            productName: typeof prod === 'object' ? prod?.name : item.productName || '',
                            sku: typeof prod === 'object' ? prod?.sku : item.sku || '',
                            satuan: item.satuan || 'Box',
                            orderedQty: item.quantity || item.orderedQty || 0,
                            receivedQty: 0,
                            batchNumber: '',
                            expiryDate: '',
                            manufacturingDate: '',
                            storageCondition: 'Suhu Kamar',
                            conditionStatus: 'baik',
                            notes: '',
                          };
                        })
                      : p.items,
                  }));
                }}
                onClear={() => setForm((p) => ({ ...p, purchaseOrderId: '', poNumber: '', supplierName: '' }))}
                fetchFn={(params) => purchaseOrderService.getAll({ ...params, status: 'approved,sent' })}
                getDisplayText={(po) => po.poNumber}
                renderItem={(po) => (
                  <div>
                    <p className="font-medium text-gray-800">{po.poNumber}</p>
                    <p className="text-xs text-gray-400">
                      {typeof po.supplierId === 'object' ? po.supplierId?.name : ''}
                      {po.orderDate ? ` · ${new Date(po.orderDate).toLocaleDateString('id-ID')}` : ''}
                    </p>
                  </div>
                )}
                placeholder="Cari no PO..."
              />
              {form.supplierName && <p className="text-xs text-gray-400 mt-1">Supplier: {form.supplierName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Penerimaan *</label>
              <input
                type="date"
                name="receivingDate"
                value={form.receivingDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Surat Jalan</label>
              <input
                name="deliveryNote"
                value={form.deliveryNote}
                onChange={handleChange}
                placeholder="Nomor surat jalan supplier"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Catatan penerimaan (opsional)"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Detail Penerimaan</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            <div className="space-y-4">
              {form.items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">Item #{idx + 1}</span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Produk */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Produk</label>
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
                    </div>
                    {/* Satuan */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Satuan</label>
                      <input
                        value={item.satuan}
                        onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    {/* Ordered / Received */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Qty Pesan</label>
                      <input
                        type="number"
                        min="0"
                        value={item.orderedQty}
                        onChange={(e) => handleItemChange(idx, 'orderedQty', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Qty Diterima *</label>
                      <input
                        type="number"
                        min="0"
                        value={item.receivedQty}
                        onChange={(e) => handleItemChange(idx, 'receivedQty', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                      />
                    </div>
                    {/* Batch */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <FlaskConical size={12} /> No. Batch *
                      </label>
                      <input
                        value={item.batchNumber}
                        onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                        placeholder="Batch..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    {/* Expiry */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Calendar size={12} /> Exp. Date *
                      </label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    {/* Manufacturing Date */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Tgl Produksi</label>
                      <input
                        type="date"
                        value={item.manufacturingDate}
                        onChange={(e) => handleItemChange(idx, 'manufacturingDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                    {/* Storage Condition */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <ThermometerSun size={12} /> Penyimpanan
                      </label>
                      <select
                        value={item.storageCondition}
                        onChange={(e) => handleItemChange(idx, 'storageCondition', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                      >
                        <option value="Suhu Kamar">Suhu Kamar (25-30°C)</option>
                        <option value="Sejuk">Sejuk (15-25°C)</option>
                        <option value="Dingin">Dingin (2-8°C)</option>
                        <option value="Beku">Beku (≤0°C)</option>
                      </select>
                    </div>
                    {/* Condition Status */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Kondisi</label>
                      <select
                        value={item.conditionStatus}
                        onChange={(e) => handleItemChange(idx, 'conditionStatus', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                      >
                        <option value="baik">Baik</option>
                        <option value="rusak">Rusak</option>
                        <option value="cacat">Cacat Kemasan</option>
                      </select>
                    </div>
                    {/* Notes */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Catatan Item</label>
                      <input
                        value={item.notes}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        placeholder="Catatan (opsional)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                  </div>
                  {/* Qty mismatch warning */}
                  {item.orderedQty > 0 && item.receivedQty > 0 && item.receivedQty !== item.orderedQty && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <AlertTriangle size={12} />
                      Qty diterima ({item.receivedQty}) berbeda dengan qty pesanan ({item.orderedQty})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CDOB Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Kepatuhan CDOB</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Setiap item wajib memiliki nomor batch dan tanggal kedaluwarsa. Pastikan kondisi penyimpanan
                  sesuai persyaratan produk. Sistem menggunakan FEFO (First Expired First Out) untuk manajemen stok.
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
              <span className="flex items-center gap-2"><Check size={14} /> {isEdit ? 'Perbarui' : 'Simpan Penerimaan'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   GR DETAIL MODAL
   ═══════════════════════════════════════ */
function GRDetailModal({ receiving, onClose }) {
  const st = STATUS_MAP[receiving.status] || STATUS_MAP.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                <Package size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{receiving.receivingNumber}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                    <st.icon size={10} />
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(receiving.receivingDate)}</span>
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
          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Referensi PO</p>
              <p className="text-sm font-medium text-blue-600">{resolveRef(receiving, 'purchaseOrder', 'purchaseOrderId')?.poNumber || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supplier</p>
              <p className="text-sm font-medium text-gray-900">{resolveRef(receiving, 'supplier', 'supplierId')?.name || resolveRef(receiving?.purchaseOrder, 'supplier', 'supplierId')?.name || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">No. Surat Jalan</p>
              <p className="text-sm font-medium text-gray-900">{receiving.deliveryNote || '-'}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Detail Item ({receiving.items?.length || 0})</h3>
            <div className="space-y-3">
              {(receiving.items || []).map((item, idx) => {
                const qtyMismatch = item.orderedQty > 0 && item.receivedQty !== item.orderedQty;
                return (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{resolveRef(item, 'product', 'productId')?.name || item.productName || '-'}</p>
                        {(resolveRef(item, 'product', 'productId')?.sku || item.sku) && <p className="text-xs text-gray-400">{resolveRef(item, 'product', 'productId')?.sku || item.sku}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.conditionStatus === 'baik'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {item.conditionStatus === 'baik' ? 'Baik' : item.conditionStatus === 'rusak' ? 'Rusak' : 'Cacat'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400">Qty Pesan:</span>
                        <span className="ml-1 font-medium text-gray-800">{item.orderedQty} {item.satuan}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Qty Diterima:</span>
                        <span className={`ml-1 font-medium ${qtyMismatch ? 'text-amber-600' : 'text-gray-800'}`}>
                          {item.receivedQty} {item.satuan}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Batch:</span>
                        <span className="ml-1 font-medium text-gray-800">{item.batchNumber || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Exp:</span>
                        <span className="ml-1 font-medium text-gray-800">{formatDate(item.expiryDate)}</span>
                      </div>
                      {item.manufacturingDate && (
                        <div>
                          <span className="text-gray-400">Produksi:</span>
                          <span className="ml-1 font-medium text-gray-800">{formatDate(item.manufacturingDate)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Penyimpanan:</span>
                        <span className="ml-1 font-medium text-gray-800">{item.storageCondition || '-'}</span>
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">{item.notes}</p>
                    )}
                    {qtyMismatch && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle size={12} />
                        Selisih qty: {item.receivedQty - item.orderedQty > 0 ? '+' : ''}{item.receivedQty - item.orderedQty}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {receiving.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{receiving.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
            <p>Diterima oleh: {receiving.receivedBy?.name || receiving.createdBy?.name || '-'} — {formatDate(receiving.receivingDate)}</p>
            {receiving.verifiedBy && <p>Diverifikasi oleh: {receiving.verifiedBy.name} — {formatDate(receiving.verifiedAt)}</p>}
            <p>Dibuat: {formatDate(receiving.createdAt)} — Diubah: {formatDate(receiving.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   VERIFY MODAL
   ═══════════════════════════════════════ */
function VerifyModal({ receiving, onClose, onVerified }) {
  const { verifyReceiving } = useGoodsReceivingStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyReceiving(oid(receiving), notes);
      toast.success('Penerimaan berhasil diverifikasi');
      onVerified();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Verifikasi Penerimaan</h3>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{receiving.receivingNumber}</strong> — {receiving.items?.length || 0} item
        </p>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
          <p className="text-gray-600">PO: <span className="font-medium text-blue-600">{resolveRef(receiving, 'purchaseOrder', 'purchaseOrderId')?.poNumber || '-'}</span></p>
          <p className="text-gray-600">Supplier: <span className="font-medium">{resolveRef(receiving, 'supplier', 'supplierId')?.name || '-'}</span></p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Verifikasi</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
            placeholder="Catatan verifikasi (opsional)..."
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
            onClick={handleVerify}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Memverifikasi...</span>
            ) : (
              <span className="flex items-center gap-2"><ShieldCheck size={14} /> Verifikasi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ receiving, onClose, onConfirm }) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Penerimaan?</h3>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{receiving.receivingNumber}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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

/** Safely resolve a populated ref (could be on `supplier` or `supplierId`) */
function resolveRef(obj, populatedKey, idKey) {
  const v = obj?.[populatedKey];
  if (v && typeof v === 'object' && v._id) return v;
  const v2 = obj?.[idKey];
  if (v2 && typeof v2 === 'object' && v2._id) return v2;
  return null;
}

function resolveIdStr(obj, populatedKey, idKey) {
  const r = resolveRef(obj, populatedKey, idKey);
  if (r) return r._id || '';
  const raw = obj?.[idKey];
  if (typeof raw === 'string') return raw;
  return '';
}

function emptyGRItem() {
  return {
    productId: '', productName: '', sku: '', satuan: 'Box',
    orderedQty: 0, receivedQty: 0,
    batchNumber: '', expiryDate: '', manufacturingDate: '',
    storageCondition: 'Suhu Kamar', conditionStatus: 'baik', notes: '',
  };
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
