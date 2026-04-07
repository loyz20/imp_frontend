import React, { useEffect, useState, useMemo } from 'react';
import useInventoryStore from '../../store/inventoryStore';
import useAuthStore from '../../store/authStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Plus, Loader2, X, Calendar, CheckCircle,
  AlertTriangle, Clock, FileText, Eye, Play, Check, Ban, Search,
  BarChart3, Users, Diff, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── Constants ── */
const OPNAME_STATUS = {
  draft:       { label: 'Draft',           color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: FileText },
  in_progress: { label: 'Sedang Berjalan', color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  completed:   { label: 'Selesai',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  cancelled:   { label: 'Dibatalkan',      color: 'bg-red-50 text-red-600 border-red-200',         icon: Ban },
};

const SCOPE_LABEL = {
  all: 'Semua Produk',
  category: 'Per Kategori',
  location: 'Per Lokasi',
};

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function StockOpname() {
  const {
    opnames, opnameStats, opnamePagination, opnameLoading, opnameFilters,
    fetchOpnames, fetchOpnameStats, setOpnameFilters,
    fetchOpname, selectedOpname, createOpname, updateOpname, finalizeOpname,
  } = useInventoryStore();
  const { user } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const canCreate = ['superadmin', 'admin', 'gudang'].includes(user?.role);
  const canFinalize = ['superadmin', 'admin', 'apoteker'].includes(user?.role);

  useEffect(() => {
    fetchOpnames();
    fetchOpnameStats();
  }, [opnameFilters, fetchOpnames, fetchOpnameStats]);

  const handleSearch = useMemo(
    () => debounce((value) => setOpnameFilters({ search: value, page: 1 }), 400),
    [setOpnameFilters],
  );

  const handleCreate = async (data) => {
    try {
      await createOpname(data);
      toast.success('Sesi opname berhasil dibuat');
      setShowCreate(false);
      fetchOpnames();
      fetchOpnameStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal membuat opname');
    }
  };

  const openDetail = async (id) => {
    setDetailId(id);
    await fetchOpname(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Opname</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola sesi penghitungan fisik stok gudang.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-sm transition"
          >
            <Plus size={16} />
            Opname Baru
          </button>
        )}
      </div>

      {/* Stats */}
      {opnameStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Opname', value: opnameStats.total ?? 0, color: 'from-indigo-500 to-indigo-600', icon: ClipboardCheck },
            { label: 'Sedang Berjalan', value: opnameStats.inProgress ?? 0, color: 'from-amber-500 to-amber-600', icon: Clock },
            { label: 'Selesai (Bulan Ini)', value: opnameStats.completedThisMonth ?? 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { label: 'Total Selisih', value: opnameStats.totalDiscrepancies ?? 0, color: 'from-red-500 to-red-600', icon: Diff },
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

      {/* Last opname info */}
      {opnameStats?.lastOpnameDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-blue-500" />
          <span className="text-blue-700">Opname terakhir: <strong>{formatDate(opnameStats.lastOpnameDate)}</strong></span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nomor opname..."
              defaultValue={opnameFilters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={opnameFilters.status}
            onChange={(e) => setOpnameFilters({ status: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(OPNAME_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={opnameFilters.dateFrom}
            onChange={(e) => setOpnameFilters({ dateFrom: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
          <input
            type="date"
            value={opnameFilters.dateTo}
            onChange={(e) => setOpnameFilters({ dateTo: e.target.value, page: 1 })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Opname</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Scope</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Total Item</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Cocok</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Selisih</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Petugas</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opnameLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Memuat data opname...</p>
                  </td>
                </tr>
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Belum ada sesi opname.</p>
                  </td>
                </tr>
              ) : (
                opnames.map((opn) => {
                  const os = OPNAME_STATUS[opn.status] || OPNAME_STATUS.draft;
                  const StatusIcon = os.icon;
                  const assignee = opn.assignedTo && typeof opn.assignedTo === 'object' ? opn.assignedTo.name : '-';

                  return (
                    <tr key={opn._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs font-medium text-gray-700">{opn.opnameNumber || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-gray-700">{formatDate(opn.opnameDate)}</p>
                        {opn.completedAt && (
                          <p className="text-[11px] text-gray-400">Selesai: {formatDate(opn.completedAt)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${os.color}`}>
                          <StatusIcon size={11} />
                          {os.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-600">{SCOPE_LABEL[opn.scope] || opn.scope || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{opn.totalItems ?? 0}</td>
                      <td className="px-5 py-3.5 text-right text-emerald-600 font-medium hidden md:table-cell">{opn.matchedItems ?? 0}</td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        {(opn.discrepancyItems ?? 0) > 0 ? (
                          <span className="text-red-600 font-bold">{opn.discrepancyItems}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-600">{assignee}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(opn._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Lihat Detail"
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
          pagination={opnamePagination}
          onPageChange={(page) => setOpnameFilters({ page })}
          onLimitChange={(limit) => setOpnameFilters({ limit, page: 1 })}
          label="Opname"
        />
      </div>

      {/* Create Opname Modal */}
      {showCreate && (
        <CreateOpnameModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Detail Modal */}
      {detailId && selectedOpname && (
        <OpnameDetailModal
          opname={selectedOpname}
          canFinalize={canFinalize}
          onUpdate={async (data) => {
            try {
              await updateOpname(selectedOpname._id, data);
              toast.success('Opname berhasil diperbarui');
              await fetchOpname(selectedOpname._id);
              fetchOpnames();
              fetchOpnameStats();
            } catch (err) {
              toast.error(err?.response?.data?.message || 'Gagal memperbarui opname');
            }
          }}
          onFinalize={async (notes) => {
            try {
              await finalizeOpname(selectedOpname._id, notes);
              toast.success('Opname berhasil difinalisasi');
              setDetailId(null);
              fetchOpnames();
              fetchOpnameStats();
            } catch (err) {
              toast.error(err?.response?.data?.message || 'Gagal memfinalisasi opname');
            }
          }}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   CREATE OPNAME MODAL
   ═══════════════════════════════════════ */
function CreateOpnameModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    opnameDate: new Date().toISOString().slice(0, 10),
    scope: 'all',
    scopeFilter: '',
    assignedTo: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.opnameDate) {
      toast.error('Tanggal opname wajib diisi');
      return;
    }
    setSubmitting(true);
    const payload = {
      opnameDate: form.opnameDate,
      scope: form.scope,
      notes: form.notes || undefined,
      assignedTo: form.assignedTo || undefined,
    };
    if (form.scope === 'category' && form.scopeFilter) {
      payload.scopeFilter = { kategori: form.scopeFilter };
    }
    await onSubmit(payload);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                <ClipboardCheck size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Opname Baru</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Opname *</label>
            <input
              type="date"
              value={form.opnameDate}
              onChange={(e) => setForm((f) => ({ ...f, opnameDate: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope *</label>
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value, scopeFilter: '' }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              <option value="all">Semua Produk</option>
              <option value="category">Per Kategori</option>
            </select>
          </div>

          {form.scope === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.scopeFilter}
                onChange={(e) => setForm((f) => ({ ...f, scopeFilter: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                <option value="">Pilih kategori...</option>
                <option value="obat">Obat</option>
                <option value="alkes">Alkes</option>
                <option value="bhp">BHP</option>
                <option value="suplemen">Suplemen</option>
                <option value="kosmetik">Kosmetik</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
              placeholder="Catatan opname (opsional)..."
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {submitting ? 'Membuat...' : 'Buat Opname'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   OPNAME DETAIL MODAL
   ═══════════════════════════════════════ */
function OpnameDetailModal({ opname, canFinalize, onUpdate, onFinalize, onClose }) {
  const os = OPNAME_STATUS[opname.status] || OPNAME_STATUS.draft;
  const StatusIcon = os.icon;
  const isEditable = opname.status === 'draft' || opname.status === 'in_progress';

  const [items, setItems] = useState(opname.items || []);
  const [saving, setSaving] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState('');
  const [showFinalize, setShowFinalize] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(opname.items || []);
  }, [opname]);

  const handleActualQtyChange = (index, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        actualQty: value === '' ? null : Number(value),
        difference: value === '' ? null : Number(value) - (next[index].systemQty ?? 0),
      };
      return next;
    });
  };

  const handleItemNotesChange = (index, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes: value };
      return next;
    });
  };

  const buildPayload = () => ({
    status: 'in_progress',
    items: items.map((item) => ({
      productId: item.productId?.id || item.productId?._id || item.productId,
      batchId: item.batchId,
      actualQty: item.actualQty,
      notes: item.notes,
    })),
  });

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(buildPayload());
    setSaving(false);
  };

  const handleFinalize = async () => {
    const unfilled = items.filter((i) => i.actualQty == null).length;
    if (unfilled > 0) {
      toast.error(`Masih ada ${unfilled} item yang belum diisi qty aktual`);
      return;
    }
    // Save latest items first, then finalize
    setSaving(true);
    await onUpdate(buildPayload());
    setSaving(false);
    await onFinalize(finalizeNotes);
  };

  const discrepancyCount = items.filter((i) => i.difference != null && i.difference !== 0).length;
  const filledCount = items.filter((i) => i.actualQty != null).length;
  const allFilled = filledCount === items.length;
  const displayItems = expanded ? items : items.slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[93vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{opname.opnameNumber}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${os.color}`}>
                    <StatusIcon size={10} /> {os.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(opname.opnameDate)}</span>
                  <span className="text-xs text-gray-400">• {SCOPE_LABEL[opname.scope] || opname.scope}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-6 text-xs">
          <span className="text-gray-500">Total Item: <strong className="text-gray-900">{items.length}</strong></span>
          <span className="text-gray-500">Terisi: <strong className="text-blue-600">{filledCount}</strong> / {items.length}</span>
          <span className="text-gray-500">Cocok: <strong className="text-emerald-600">{opname.matchedItems ?? (filledCount - discrepancyCount)}</strong></span>
          <span className="text-gray-500">Selisih: <strong className={discrepancyCount > 0 ? 'text-red-600' : 'text-gray-400'}>{discrepancyCount}</strong></span>
          {opname.assignedTo && (
            <span className="text-gray-500">Petugas: <strong className="text-gray-700">{opname.assignedTo && typeof opname.assignedTo === 'object' ? opname.assignedTo.name : '-'}</strong></span>
          )}
          {opname.verifiedBy && (
            <span className="text-gray-500">Diverifikasi: <strong className="text-gray-700">{opname.verifiedBy && typeof opname.verifiedBy === 'object' ? opname.verifiedBy.name : '-'}</strong></span>
          )}
        </div>

        {/* Items table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-8">#</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Produk</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Batch</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">ED</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 w-24">Sistem</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 w-28">Aktual</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 w-20">Selisih</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell w-40">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayItems.map((item, idx) => {
                const prod = item.product || (typeof item.productId === 'object' ? item.productId : {});
                const diff = item.difference;
                return (
                  <tr key={idx} className={`${diff != null && diff !== 0 ? 'bg-red-50/30' : ''} hover:bg-gray-50/50`}>
                    <td className="px-5 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-gray-900 text-xs">{prod.name || '-'}</p>
                      <p className="text-[11px] text-gray-400">{prod.sku || '-'}</p>
                    </td>
                    <td className="px-5 py-2.5 hidden md:table-cell">
                      <span className="font-mono text-xs text-gray-600">{item.batchNumber || '-'}</span>
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell text-xs text-gray-600">
                      {formatDate(item.expiryDate)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700">{item.systemQty ?? 0}</td>
                    <td className="px-5 py-2.5 text-right">
                      {isEditable ? (
                        <input
                          type="number"
                          value={item.actualQty ?? ''}
                          onChange={(e) => handleActualQtyChange(idx, e.target.value)}
                          className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="—"
                          min={0}
                        />
                      ) : (
                        <span className="font-medium text-gray-700">{item.actualQty ?? '-'}</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {diff != null ? (
                        <span className={`font-bold text-xs ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell">
                      {isEditable ? (
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder="Catatan..."
                        />
                      ) : (
                        <span className="text-xs text-gray-500">{item.notes || '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length > 20 && (
            <div className="px-5 py-3 text-center border-t border-gray-100">
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                {expanded ? <><ChevronUp size={12} /> Tampilkan lebih sedikit</> : <><ChevronDown size={12} /> Tampilkan semua {items.length} item</>}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <div>
            {opname.notes && <p className="text-xs text-gray-400">Catatan: {opname.notes}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
              Tutup
            </button>
            {isEditable && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Menyimpan...' : 'Simpan Progress'}
              </button>
            )}
            {isEditable && canFinalize && (
              showFinalize ? (
                <div className="flex items-center gap-2">
                  {!allFilled && (
                    <span className="text-xs text-amber-600 mr-1">
                      {items.length - filledCount} item belum diisi
                    </span>
                  )}
                  <input
                    type="text"
                    value={finalizeNotes}
                    onChange={(e) => setFinalizeNotes(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-48"
                    placeholder="Catatan finalisasi..."
                  />
                  <button
                    onClick={handleFinalize}
                    disabled={saving || !allFilled}
                    className="flex items-center gap-1 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Finalisasi
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowFinalize(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition"
                >
                  <CheckCircle size={14} /> Finalisasi Opname
                </button>
              )
            )}
          </div>
        </div>
      </div>
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

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
