import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText, Plus, Search, Filter, Eye, CheckCircle2, XCircle,
  Send, Loader2, Printer, ChevronDown, AlertTriangle, Shield, Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import AutocompleteInput from '../../components/AutocompleteInput';
import useRegulationStore from '../../store/regulationStore';
import useAuthStore from '../../store/authStore';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import { formatDate } from '../../utils/format';

/* ── Constants ── */
const GOLONGAN = {
  narkotika: { label: 'Narkotika', color: 'bg-red-100 text-red-700', prefix: 'NK' },
  psikotropika: { label: 'Psikotropika', color: 'bg-amber-100 text-amber-700', prefix: 'PS' },
  prekursor: { label: 'Prekursor', color: 'bg-purple-100 text-purple-700', prefix: 'PK' },
};

const STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Diajukan', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-500' },
};

const CAN_MANAGE = ['superadmin', 'admin', 'apoteker'];

export default function SuratPesananKhusus() {
  const user = useAuthStore((s) => s.user);
  const {
    spList, spStats, spPagination, isLoading,
    setSPFilters, fetchSPList, fetchSPStats, createSP, updateSPStatus, exportSPPdf,
  } = useRegulationStore();

  const canManage = CAN_MANAGE.includes(user?.role);

  const [showForm, setShowForm] = useState(false);
  const [detailSP, setDetailSP] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Form state ── */
  const emptyForm = { type: 'narkotika', supplierId: '', supplierName: '', items: [{ productId: '', productName: '', sku: '', qty: '', unit: 'tablet' }], validUntil: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchSPList(); fetchSPStats(); }, [fetchSPList, fetchSPStats]);

  const handleSearch = useCallback(() => {
    setSPFilters({ search: searchTerm, type: filterType, status: filterStatus });
    setTimeout(() => fetchSPList(), 0);
  }, [searchTerm, filterType, filterStatus, setSPFilters, fetchSPList]);

  useEffect(() => { handleSearch(); }, [filterType, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitForm = async () => {
    if (!form.type || !form.supplierName) { toast.error('Lengkapi field wajib'); return; }
    try {
      await createSP({
        spNumber: `SP-${GOLONGAN[form.type].prefix}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(Date.now()).slice(-3)}`,
        date: new Date().toISOString().slice(0, 10),
        type: form.type,
        supplier: form.supplierId || form.supplierName,
        items: form.items.filter((i) => i.productName).map((i) => ({ product: i.productId || i.productName, productName: i.productName, sku: i.sku, qty: Number(i.qty) || 0, unit: i.unit })),
        validUntil: form.validUntil,
        notes: form.notes,
        createdBy: { name: user?.name },
      });
      toast.success('SP Khusus berhasil dibuat');
      setShowForm(false);
      setForm(emptyForm);
      fetchSPList();
      fetchSPStats();
    } catch { toast.error('Gagal membuat SP'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateSPStatus(id, status);
      toast.success(`SP ${status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : 'diajukan'}`);
      fetchSPList();
      fetchSPStats();
    } catch { toast.error('Gagal mengubah status'); }
  };

  /* ── Add / Remove item rows in form ── */
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { productId: '', productName: '', sku: '', qty: '', unit: 'tablet' }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => setForm((f) => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [field]: val };
    return { ...f, items };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surat Pesanan Khusus</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola SP untuk Narkotika, Psikotropika & Prekursor</p>
        </div>
        {canManage && (
          <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Buat SP Khusus
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {spStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total SP Khusus', value: spStats.total, icon: FileText, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Narkotika', value: spStats.narkotika, icon: Shield, color: 'from-red-500 to-red-600' },
            { label: 'Psikotropika', value: spStats.psikotropika, icon: Pill, color: 'from-amber-500 to-amber-600' },
            { label: 'Prekursor', value: spStats.prekursor, icon: AlertTriangle, color: 'from-purple-500 to-purple-600' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor SP atau supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">Semua Golongan</option>
            {Object.entries(GOLONGAN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">Semua Status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : spList.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Tidak ada data SP Khusus</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">No. SP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Golongan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produk</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Berlaku s/d</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {spList.map((sp) => (
                  <tr key={sp._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{sp.spNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(sp.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${GOLONGAN[sp.type]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {GOLONGAN[sp.type]?.label || sp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sp.supplier?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{sp.items?.length || 0} item</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(sp.validUntil)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS[sp.status]?.color || 'bg-gray-100'}`}>
                        {STATUS[sp.status]?.label || sp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailSP(sp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Detail">
                          <Eye size={15} />
                        </button>
                        {canManage && sp.status === 'draft' && (
                          <button onClick={() => handleStatusChange(sp._id, 'submitted')} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Ajukan">
                            <Send size={15} />
                          </button>
                        )}
                        {canManage && sp.status === 'submitted' && (
                          <>
                            <button onClick={() => handleStatusChange(sp._id, 'approved')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Setujui">
                              <CheckCircle2 size={15} />
                            </button>
                            <button onClick={() => handleStatusChange(sp._id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Tolak">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {spPagination && spPagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination pagination={spPagination} onPageChange={(p) => { setSPFilters({ page: p }); fetchSPList(); }} />
          </div>
        )}
      </div>

      {/* ═══ Create Form Modal ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Buat SP Khusus Baru</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Golongan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Golongan Obat *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                  {Object.entries(GOLONGAN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>
                <AutocompleteInput
                  value={form.supplierName}
                  onChange={(text) => setForm((f) => ({ ...f, supplierName: text }))}
                  onSelect={(item) => setForm((f) => ({ ...f, supplierId: item._id, supplierName: item.name }))}
                  onClear={() => setForm((f) => ({ ...f, supplierId: '', supplierName: '' }))}
                  fetchFn={(params) => supplierService.getAll({ ...params, isActive: true })}
                  getDisplayText={(item) => item.name}
                  renderItem={(item) => (
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.code || '-'} &middot; {item.phone || '-'}</p>
                    </div>
                  )}
                  placeholder="Cari supplier..."
                  inputClassName="!rounded-xl !py-2"
                />
                {form.supplierId && <p className="text-xs text-emerald-600 mt-1">Supplier terpilih</p>}
              </div>
              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produk</label>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <AutocompleteInput
                          value={item.productName}
                          onChange={(text) => updateItem(idx, 'productName', text)}
                          onSelect={(prod) => {
                            const items = [...form.items];
                            items[idx] = { ...items[idx], productId: prod._id, productName: prod.name, sku: prod.sku || '', unit: prod.satuan || items[idx].unit };
                            setForm((f) => ({ ...f, items }));
                          }}
                          onClear={() => {
                            updateItem(idx, 'productId', '');
                            updateItem(idx, 'productName', '');
                            updateItem(idx, 'sku', '');
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
                          inputClassName="!rounded-xl !py-2"
                        />
                        {item.sku && <p className="text-xs text-gray-400 mt-0.5">{item.sku}</p>}
                      </div>
                      <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <input type="text" placeholder="Satuan" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><XCircle size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ Tambah Produk</button>
              </div>
              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sampai</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleSubmitForm} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Simpan Draft</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Detail Modal ═══ */}
      {detailSP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Detail SP Khusus</h2>
              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS[detailSP.status]?.color}`}>
                {STATUS[detailSP.status]?.label}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Nomor SP</p><p className="text-sm font-medium text-gray-900">{detailSP.spNumber}</p></div>
                <div><p className="text-xs text-gray-500">Tanggal</p><p className="text-sm font-medium text-gray-900">{formatDate(detailSP.date)}</p></div>
                <div><p className="text-xs text-gray-500">Golongan</p><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${GOLONGAN[detailSP.type]?.color}`}>{GOLONGAN[detailSP.type]?.label}</span></div>
                <div><p className="text-xs text-gray-500">Supplier</p><p className="text-sm font-medium text-gray-900">{detailSP.supplier?.name}</p></div>
                <div><p className="text-xs text-gray-500">Berlaku Sampai</p><p className="text-sm font-medium text-gray-900">{formatDate(detailSP.validUntil)}</p></div>
                <div><p className="text-xs text-gray-500">Dibuat Oleh</p><p className="text-sm font-medium text-gray-900">{detailSP.createdBy?.name}</p></div>
              </div>
              {detailSP.approvedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Disetujui Oleh</p><p className="text-sm font-medium text-gray-900">{detailSP.approvedBy.name}</p></div>
                  <div><p className="text-xs text-gray-500">Tanggal Disetujui</p><p className="text-sm font-medium text-gray-900">{formatDate(detailSP.approvedAt)}</p></div>
                </div>
              )}
              {detailSP.notes && (
                <div><p className="text-xs text-gray-500">Catatan</p><p className="text-sm text-gray-700 mt-0.5">{detailSP.notes}</p></div>
              )}
              {/* Items table */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Daftar Produk</p>
                <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Produk</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailSP.items || []).map((item, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-900">{item.product?.name || '-'}</td>
                        <td className="px-3 py-2 text-gray-900 text-right">{item.qty}</td>
                        <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Timeline */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Dibuat — {formatDate(detailSP.createdAt)}</span>
                  </div>
                  {detailSP.status !== 'draft' && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Diajukan</span>
                    </div>
                  )}
                  {detailSP.status === 'approved' && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-600">Disetujui — {formatDate(detailSP.approvedAt)}</span>
                    </div>
                  )}
                  {detailSP.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-600">Ditolak</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between">
              <button onClick={async () => { try { await exportSPPdf(detailSP._id, detailSP.spNumber); toast.success('PDF berhasil diunduh'); } catch { toast.error('Gagal mengunduh PDF'); } }} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Printer size={15} /> Cetak
              </button>
              <button onClick={() => setDetailSP(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
