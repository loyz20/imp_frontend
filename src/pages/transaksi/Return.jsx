import React, { useEffect, useState, useMemo } from 'react';
import useReturnStore from '../../store/returnStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import deliveryService from '../../services/deliveryService';
import toast from 'react-hot-toast';
import {
  Plus, Eye, SquarePen, Trash2, X, Check, AlertTriangle,
  RotateCcw, Package, FileText, Calendar,
  Loader2, CheckCircle, Clock, Ban,
  CircleDollarSign, ClipboardList, MapPin, User, Truck,
  ArrowDownLeft, ArrowUpRight, Search, Filter,
} from 'lucide-react';

/* ── Constants ── */
const RETURN_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  { value: 'pending_review', label: 'Menunggu Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  { value: 'approved', label: 'Disetujui', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  { value: 'picking', label: 'Pengambilan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
  { value: 'in_transit', label: 'Dalam Perjalanan', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck },
  { value: 'received', label: 'Diterima', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: ArrowDownLeft },
  { value: 'inspected', label: 'Diinspeksi', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Search },
  { value: 'completed', label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'rejected', label: 'Ditolak', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200', icon: Ban },
];

const STATUS_MAP = Object.fromEntries(RETURN_STATUS.map((s) => [s.value, s]));

const RETURN_TYPES = [
  { value: 'customer_return', label: 'Retur dari Pelanggan', icon: ArrowDownLeft, color: 'text-blue-600' },
  { value: 'supplier_return', label: 'Retur ke Supplier', icon: ArrowUpRight, color: 'text-orange-600' },
];

const RETURN_TYPE_MAP = Object.fromEntries(RETURN_TYPES.map((t) => [t.value, t]));

const RETURN_REASONS = [
  'Produk rusak',
  'Produk kadaluarsa',
  'Salah kirim produk',
  'Salah kirim jumlah',
  'Produk tidak sesuai pesanan',
  'Kualitas tidak memenuhi standar',
  'Recall produk',
  'Lainnya',
];

/* ── Role helpers ── */
const CAN_CRUD_ROLES = ['superadmin', 'admin', 'gudang', 'sales'];
const CAN_DELETE_ROLES = ['superadmin', 'admin'];
const CAN_APPROVE_ROLES = ['superadmin', 'admin', 'apoteker'];

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function Return() {
  const {
    returns: returnList, stats, pagination, isLoading, filters,
    fetchReturns, fetchStats, setFilters, deleteReturn, changeStatus,
  } = useReturnStore();
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.role || '';

  const canCrud = CAN_CRUD_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);
  const canApprove = CAN_APPROVE_ROLES.includes(userRole);

  const [showForm, setShowForm] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, [filters, fetchReturns, fetchStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setFilters({ search: value }), 400),
    [setFilters],
  );

  const openCreate = () => { setEditingReturn(null); setShowForm(true); };
  const openEdit = (ret) => { setEditingReturn(ret); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingReturn(null); };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteReturn(oid(deleteConfirm));
      toast.success('Retur berhasil dihapus');
      setDeleteConfirm(null);
      fetchReturns();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus retur');
    }
  };

  const handleStatusChange = async (ret, newStatus) => {
    const labels = {
      pending_review: 'diajukan untuk review',
      approved: 'disetujui',
      picking: 'proses pengambilan',
      in_transit: 'dalam perjalanan',
      received: 'diterima',
      inspected: 'selesai diinspeksi',
      completed: 'diselesaikan',
      rejected: 'ditolak',
      cancelled: 'dibatalkan',
    };
    try {
      await changeStatus(oid(ret), newStatus);
      toast.success(`Retur berhasil ${labels[newStatus] || 'diubah'}`);
      fetchReturns();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status retur');
    }
  };

  /* ── Stats Cards ── */
  const statCards = [
    { label: 'Total Retur', value: stats?.total ?? 0, icon: RotateCcw, color: 'from-violet-500 to-violet-600' },
    { label: 'Menunggu Review', value: stats?.pendingReview ?? 0, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: 'Disetujui', value: stats?.approved ?? 0, icon: CheckCircle, color: 'from-blue-500 to-blue-600' },
    { label: 'Selesai', value: stats?.completed ?? 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Retur</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola retur barang dari pelanggan dan ke supplier</p>
        </div>
        {canCrud && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-violet-700 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
          >
            <Plus size={16} /> Buat Retur
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Cari nomor retur, pelanggan, supplier..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
            />
          </div>
          <select
            value={filters.returnType}
            onChange={(e) => setFilters({ returnType: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white min-w-40"
          >
            <option value="">Semua Tipe</option>
            {RETURN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white min-w-40"
          >
            <option value="">Semua Status</option>
            {RETURN_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-violet-500" />
            <span className="ml-3 text-sm text-gray-500">Memuat data retur...</span>
          </div>
        ) : !returnList?.length ? (
          <div className="text-center py-20">
            <RotateCcw size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Belum ada data retur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">No. Retur</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipe</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Pelanggan / Supplier</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Ref. Delivery</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-600">Item</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returnList.map((ret) => {
                  const st = STATUS_MAP[ret.status] || STATUS_MAP.draft;
                  const typeMeta = RETURN_TYPE_MAP[ret.returnType] || RETURN_TYPE_MAP.customer_return;
                  const TypeIcon = typeMeta.icon;
                  const party = ret.returnType === 'supplier_return'
                    ? (resolveSupplier(ret)?.name || ret.supplierName || '-')
                    : (resolveCustomer(ret)?.name || ret.customerName || '-');
                  const deliveryNum = resolveDelivery(ret)?.deliveryNumber || ret.deliveryNumber || '-';

                  return (
                    <tr key={oid(ret)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{ret.returnNumber}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${typeMeta.color}`}>
                          <TypeIcon size={12} /> {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{party}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{deliveryNum}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(ret.returnDate)}</td>
                      <td className="px-5 py-3 text-center text-gray-600">{ret.items?.length || 0}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${st.color}`}>
                          <st.icon size={10} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setShowDetail(ret)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Lihat detail"
                          >
                            <Eye size={15} />
                          </button>

                          {canCrud && ret.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEdit(ret)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <SquarePen size={15} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(ret, 'pending_review')}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                title="Ajukan Review"
                              >
                                <ClipboardList size={15} />
                              </button>
                            </>
                          )}

                          {canApprove && ret.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(ret, 'approved')}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Setujui"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(ret, 'rejected')}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="Tolak"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}

                          {canCrud && ret.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(ret, 'picking')}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Proses Pengambilan"
                            >
                              <Package size={15} />
                            </button>
                          )}

                          {canCrud && ret.status === 'picking' && (
                            <button
                              onClick={() => handleStatusChange(ret, 'in_transit')}
                              className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                              title="Kirim Retur"
                            >
                              <Truck size={15} />
                            </button>
                          )}

                          {canCrud && ret.status === 'in_transit' && (
                            <button
                              onClick={() => handleStatusChange(ret, 'received')}
                              className="p-1.5 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                              title="Terima Retur"
                            >
                              <ArrowDownLeft size={15} />
                            </button>
                          )}

                          {canCrud && ret.status === 'received' && (
                            <button
                              onClick={() => handleStatusChange(ret, 'inspected')}
                              className="p-1.5 rounded-lg hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 transition-colors"
                              title="Selesai Inspeksi"
                            >
                              <Search size={15} />
                            </button>
                          )}

                          {canCrud && ret.status === 'inspected' && (
                            <button
                              onClick={() => handleStatusChange(ret, 'completed')}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Selesaikan"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {canDelete && ['draft', 'cancelled'].includes(ret.status) && (
                            <button
                              onClick={() => setDeleteConfirm(ret)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
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
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-end">
        <Pagination
          currentPage={pagination?.page || 1}
          totalPages={pagination?.totalPages || 1}
          onPageChange={(page) => setFilters({ page })}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <ReturnFormModal
          returnData={editingReturn}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchReturns(); fetchStats(); }}
        />
      )}
      {showDetail && <ReturnDetailModal returnData={showDetail} onClose={() => setShowDetail(null)} />}
      {deleteConfirm && <DeleteConfirmModal returnData={deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} />}
    </div>
  );
}

/* ═══════════════════════════════════════
   RETURN FORM MODAL (Create / Edit)
   ═══════════════════════════════════════ */
function ReturnFormModal({ returnData, onClose, onSaved }) {
  const { createReturn, updateReturn } = useReturnStore();
  const { isAutoNumber } = useSettings();
  const autoNum = isAutoNumber('return');
  const isEdit = !!returnData;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    returnNumber: returnData?.returnNumber || '',
    returnType: returnData?.returnType || 'customer_return',
    deliveryId: resolveDeliveryIdStr(returnData),
    deliveryNumber: resolveDelivery(returnData)?.deliveryNumber || returnData?.deliveryNumber || '',
    customerId: resolveCustomerIdStr(returnData),
    customerName: resolveCustomer(returnData)?.name || returnData?.customerName || '',
    supplierId: resolveSupplierIdStr(returnData),
    supplierName: resolveSupplier(returnData)?.name || returnData?.supplierName || '',
    returnDate: returnData?.returnDate ? returnData.returnDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    reason: returnData?.reason || '',
    notes: returnData?.notes || '',
    items: returnData?.items?.length
      ? returnData.items.map((item) => ({
          productId: resolveProductIdStr(item),
          productName: resolveProduct(item)?.name || item.productName || '',
          sku: resolveProduct(item)?.sku || item.sku || '',
          satuan: item.satuan || 'Box',
          quantityDelivered: item.quantityDelivered || item.quantityShipped || 0,
          quantityReturned: item.quantityReturned || 0,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
          returnReason: item.returnReason || '',
          condition: item.condition || 'damaged',
          disposition: item.disposition || '',
          notes: item.notes || '',
        }))
      : [],
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

  const handleDeliverySelect = (dlv) => {
    const customer = dlv.customer || dlv.customerId;
    const customerName = typeof customer === 'object' ? customer.name : '';
    const customerId = typeof customer === 'object' ? customer._id : (customer || '');

    const items = (dlv.items || []).map((item) => {
      const prod = item.product || item.productId;
      return {
        productId: typeof prod === 'object' ? prod._id : (prod || ''),
        productName: typeof prod === 'object' ? prod.name : (item.productName || ''),
        sku: typeof prod === 'object' ? (prod.sku || '') : (item.sku || ''),
        satuan: item.satuan || 'Box',
        quantityDelivered: item.quantityShipped || item.quantity || 0,
        quantityReturned: 0,
        batchNumber: item.batchNumber || '',
        expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
        returnReason: '',
        condition: 'damaged',
        disposition: '',
        notes: '',
      };
    });

    setForm((p) => ({
      ...p,
      deliveryId: dlv._id,
      deliveryNumber: dlv.deliveryNumber,
      customerId,
      customerName,
      items,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!autoNum && !isEdit && !form.returnNumber.trim()) {
      toast.error('Nomor retur wajib diisi (auto-number nonaktif)');
      return;
    }
    if (form.returnType === 'customer_return' && !form.deliveryId) {
      toast.error('Surat jalan wajib dipilih untuk retur pelanggan');
      return;
    }
    const hasReturned = form.items.some((i) => i.quantityReturned > 0);
    if (!hasReturned) {
      toast.error('Minimal 1 item harus memiliki jumlah retur > 0');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(!autoNum && !isEdit && { returnNumber: form.returnNumber.trim() }),
        returnType: form.returnType,
        ...(form.deliveryId && { deliveryId: form.deliveryId }),
        ...(form.customerId && { customerId: form.customerId }),
        ...(form.supplierId && { supplierId: form.supplierId }),
        returnDate: form.returnDate,
        reason: form.reason || undefined,
        notes: form.notes,
        items: form.items.filter((i) => i.quantityReturned > 0).map((i) => ({
          productId: i.productId,
          satuan: i.satuan,
          quantityReturned: Number(i.quantityReturned),
          batchNumber: i.batchNumber || undefined,
          expiryDate: i.expiryDate || undefined,
          returnReason: i.returnReason || undefined,
          condition: i.condition,
          disposition: i.disposition || undefined,
          notes: i.notes,
        })),
      };
      if (isEdit) {
        await updateReturn(oid(returnData), payload);
        toast.success('Retur berhasil diperbarui');
      } else {
        await createReturn(payload);
        toast.success('Retur berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${isEdit ? 'memperbarui' : 'membuat'} retur`);
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
            {isEdit ? 'Edit Retur' : 'Buat Retur Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tipe & Info Umum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {!autoNum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Retur *</label>
                <input
                  name="returnNumber"
                  value={form.returnNumber}
                  onChange={handleChange}
                  placeholder="Ketik nomor retur..."
                  disabled={isEdit}
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Retur *</label>
              <select
                name="returnType"
                value={form.returnType}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    returnType: e.target.value,
                    deliveryId: '',
                    deliveryNumber: '',
                    customerId: '',
                    customerName: '',
                    supplierId: '',
                    supplierName: '',
                    items: [],
                  }));
                }}
                disabled={isEdit}
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                {RETURN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Retur *</label>
              <input
                type="date"
                name="returnDate"
                value={form.returnDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              />
            </div>

            {/* Delivery Selection (customer_return) */}
            {form.returnType === 'customer_return' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Surat Jalan (Delivery) *</label>
                <AutocompleteInput
                  value={form.deliveryNumber}
                  onChange={(text) => setForm((p) => ({ ...p, deliveryNumber: text }))}
                  onSelect={handleDeliverySelect}
                  onClear={() => setForm((p) => ({ ...p, deliveryId: '', deliveryNumber: '', customerId: '', customerName: '', items: [] }))}
                  fetchFn={(params) => deliveryService.getAll({ ...params, status: 'delivered' })}
                  getDisplayText={(item) => item.deliveryNumber}
                  renderItem={(item) => {
                    const cust = item.customer || item.customerId;
                    const custName = typeof cust === 'object' ? cust.name : '';
                    return (
                      <div>
                        <p className="font-medium text-gray-800">{item.deliveryNumber}</p>
                        <p className="text-xs text-gray-400">{custName} &middot; {item.items?.length || 0} item &middot; {formatDate(item.deliveryDate)}</p>
                      </div>
                    );
                  }}
                  placeholder="Cari nomor surat jalan..."
                />
                {form.deliveryId && <p className="text-xs text-violet-600 mt-1">Delivery terpilih: {form.deliveryNumber}</p>}
                {form.customerName && <p className="text-xs text-gray-500 mt-0.5">Pelanggan: {form.customerName}</p>}
              </div>
            )}

            {/* Supplier manual input (supplier_return) */}
            {form.returnType === 'supplier_return' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                <input
                  name="supplierName"
                  value={form.supplierName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                  placeholder="Nama supplier..."
                />
                <p className="text-xs text-gray-400 mt-1">Untuk retur ke supplier, item diisi manual</p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alasan Retur</label>
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white"
            >
              <option value="">Pilih alasan...</option>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          {form.items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Daftar Item Retur</h3>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-24">Satuan</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-24">Qty Kirim</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-28">Qty Retur</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">Batch</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">Exp. Date</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-36">Kondisi</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-36">Disposisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900">{item.productName || '-'}</p>
                            {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{item.satuan}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{item.quantityDelivered}</td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min="0"
                              max={item.quantityDelivered}
                              value={item.quantityReturned}
                              onChange={(e) => handleItemChange(idx, 'quantityReturned', Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{item.batchNumber || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{item.expiryDate || '-'}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={item.condition}
                              onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                              className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white"
                            >
                              <option value="damaged">Rusak</option>
                              <option value="expired">Kadaluarsa</option>
                              <option value="wrong_item">Salah Produk</option>
                              <option value="wrong_qty">Salah Jumlah</option>
                              <option value="quality_issue">Masalah Kualitas</option>
                              <option value="good">Baik (Salah Kirim)</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={item.disposition || ''}
                              onChange={(e) => handleItemChange(idx, 'disposition', e.target.value)}
                              className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white"
                            >
                              <option value="">Pilih...</option>
                              <option value="restock">Restock</option>
                              <option value="destroy">Musnahkan</option>
                              <option value="return_to_supplier">Retur ke Supplier</option>
                              <option value="quarantine">Karantina</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Supplier return — manual item add */}
          {form.returnType === 'supplier_return' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Item Retur Supplier</h3>
                <button
                  type="button"
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      items: [...p.items, {
                        productId: '', productName: '', sku: '', satuan: 'Box',
                        quantityDelivered: 0, quantityReturned: 0,
                        batchNumber: '', expiryDate: '', returnReason: '', condition: 'damaged', disposition: '', notes: '',
                      }],
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>
              {form.items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-24">Satuan</th>
                          <th className="text-right px-4 py-2.5 font-medium text-gray-600 w-28">Qty Retur</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">Batch</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-32">Exp. Date</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-36">Kondisi</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-36">Disposisi</th>
                          <th className="px-4 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-2.5">
                              <input
                                value={item.productName}
                                onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                                placeholder="Nama produk..."
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                value={item.satuan}
                                onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                min="0"
                                value={item.quantityReturned}
                                onChange={(e) => handleItemChange(idx, 'quantityReturned', Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                value={item.batchNumber}
                                onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                                placeholder="Batch..."
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <select
                                value={item.condition}
                                onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                                className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white"
                              >
                                <option value="damaged">Rusak</option>
                                <option value="expired">Kadaluarsa</option>
                                <option value="wrong_item">Salah Produk</option>
                                <option value="wrong_qty">Salah Jumlah</option>
                                <option value="quality_issue">Masalah Kualitas</option>
                                <option value="good">Baik</option>
                              </select>
                            </td>
                            <td className="px-4 py-2.5">
                              <select
                                value={item.disposition || ''}
                                onChange={(e) => handleItemChange(idx, 'disposition', e.target.value)}
                                className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-white"
                              >
                                <option value="">Pilih...</option>
                                <option value="restock">Restock</option>
                                <option value="destroy">Musnahkan</option>
                                <option value="return_to_supplier">Retur ke Supplier</option>
                                <option value="quarantine">Karantina</option>
                              </select>
                            </td>
                            <td className="px-4 py-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((p) => ({
                                    ...p,
                                    items: p.items.filter((_, i) => i !== idx),
                                  }));
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition resize-none"
              placeholder="Catatan retur (opsional)..."
            />
          </div>

          {/* CDOB Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Ketentuan CDOB — Retur</p>
                <p className="text-xs text-blue-700 mt-1">
                  Retur produk farmasi harus dilakukan sesuai prosedur CDOB. Produk retur disimpan terpisah di area karantina
                  sampai keputusan disposisi diambil. Produk kadaluarsa atau rusak harus dimusnahkan sesuai ketentuan.
                  Dokumentasi retur wajib disimpan minimal 5 tahun.
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
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-violet-700 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isEdit ? 'Perbarui' : 'Simpan'} Retur
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   RETURN DETAIL MODAL
   ═══════════════════════════════════════ */
function ReturnDetailModal({ returnData, onClose }) {
  const st = STATUS_MAP[returnData.status] || STATUS_MAP.draft;
  const typeMeta = RETURN_TYPE_MAP[returnData.returnType] || RETURN_TYPE_MAP.customer_return;

  const CONDITION_LABELS = {
    damaged: 'Rusak',
    expired: 'Kadaluarsa',
    wrong_item: 'Salah Produk',
    wrong_qty: 'Salah Jumlah',
    quality_issue: 'Masalah Kualitas',
    good: 'Baik',
  };

  const DISPOSITION_LABELS = {
    restock: 'Restock',
    destroy: 'Musnahkan',
    return_to_supplier: 'Retur ke Supplier',
    quarantine: 'Karantina',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white">
                <RotateCcw size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{returnData.returnNumber}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                    <st.icon size={10} />
                    {st.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${typeMeta.color}`}>
                    <typeMeta.icon size={10} /> {typeMeta.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(returnData.returnDate)}</span>
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
          {/* Party & Reference Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {returnData.returnType === 'supplier_return' ? 'Supplier' : 'Pelanggan'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {returnData.returnType === 'supplier_return'
                  ? (resolveSupplier(returnData)?.name || returnData.supplierName || '-')
                  : (resolveCustomer(returnData)?.name || returnData.customerName || '-')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Referensi Delivery</p>
              <p className="text-sm font-medium text-gray-900">{resolveDelivery(returnData)?.deliveryNumber || returnData.deliveryNumber || '-'}</p>
            </div>
          </div>

          {/* Reason */}
          {returnData.reason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Alasan Retur</p>
              <p className="text-sm text-amber-800">{returnData.reason}</p>
            </div>
          )}

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Daftar Item Retur ({returnData.items?.length || 0})</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Produk</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Satuan</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty Retur</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Batch</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Exp. Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Kondisi</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Disposisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(returnData.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{resolveProduct(item)?.name || item.productName || '-'}</p>
                        {(resolveProduct(item)?.sku || item.sku) && (
                          <p className="text-xs text-gray-400">{resolveProduct(item)?.sku || item.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{item.satuan}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{item.quantityReturned || 0}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.batchNumber || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.expiryDate ? formatDate(item.expiryDate) : '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          item.condition === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.condition === 'expired' ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {CONDITION_LABELS[item.condition] || item.condition}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {item.disposition ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            item.disposition === 'restock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.disposition === 'destroy' ? 'bg-red-50 text-red-600 border-red-200'
                            : item.disposition === 'quarantine' ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {DISPOSITION_LABELS[item.disposition] || item.disposition}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {returnData.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{returnData.notes}</p>
            </div>
          )}

          {/* Status History */}
          {returnData.statusHistory && returnData.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Riwayat Status</h3>
              <div className="space-y-2">
                {returnData.statusHistory.map((h, i) => {
                  const hst = STATUS_MAP[h.status];
                  return (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${h.status === 'completed' ? 'bg-emerald-500' : h.status === 'rejected' || h.status === 'cancelled' ? 'bg-red-500' : 'bg-violet-500'}`} />
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
            <p>Dibuat oleh: {returnData.createdBy?.name || '-'} — {formatDate(returnData.createdAt)}</p>
            <p>Terakhir diubah: {returnData.updatedBy?.name || '-'} — {formatDate(returnData.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════ */
function DeleteConfirmModal({ returnData, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Hapus Retur</h3>
            <p className="text-sm text-gray-500 mt-1">
              Apakah Anda yakin ingin menghapus retur <strong>{returnData.returnNumber}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Hapus
              </button>
            </div>
          </div>
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

function resolveCustomerIdStr(obj) {
  const c = resolveCustomer(obj);
  if (c) return c._id || '';
  if (typeof obj?.customerId === 'string') return obj.customerId;
  return '';
}

function resolveSupplier(obj) {
  const s = obj?.supplier && typeof obj.supplier === 'object' ? obj.supplier
    : obj?.supplierId && typeof obj.supplierId === 'object' ? obj.supplierId
    : null;
  return s;
}

function resolveSupplierIdStr(obj) {
  const s = resolveSupplier(obj);
  if (s) return s._id || '';
  if (typeof obj?.supplierId === 'string') return obj.supplierId;
  return '';
}

function resolveDelivery(obj) {
  const d = obj?.delivery && typeof obj.delivery === 'object' ? obj.delivery
    : obj?.deliveryId && typeof obj.deliveryId === 'object' ? obj.deliveryId
    : null;
  return d;
}

function resolveDeliveryIdStr(obj) {
  const d = resolveDelivery(obj);
  if (d) return d._id || '';
  if (typeof obj?.deliveryId === 'string') return obj.deliveryId;
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
