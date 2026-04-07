import React, { useEffect, useState } from 'react';
import {
  FileText, Shield, ShieldAlert, Clock, CheckCircle2, AlertTriangle,
  Upload, Eye, Loader2, Building2, Truck, Users, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useRegulationStore from '../../store/regulationStore';
import useAuthStore from '../../store/authStore';
import { formatDate, daysUntil } from '../../utils/format';

/* ── Constants ── */
const DOC_STATUS = {
  active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  expiring_soon: { label: 'Segera Expired', color: 'bg-amber-100 text-amber-700', icon: Clock },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: ShieldAlert },
};

const CUSTOMER_TYPE_LABELS = {
  apotek: 'Apotek', rumah_sakit: 'Rumah Sakit', klinik: 'Klinik',
  puskesmas: 'Puskesmas', toko_obat: 'Toko Obat', pemerintah: 'Pemerintah', pbf_lain: 'PBF Lain',
};

const TABS = [
  { key: 'company', label: 'Lisensi Perusahaan', icon: Building2 },
  { key: 'supplier', label: 'Lisensi Supplier', icon: Truck },
  { key: 'customer', label: 'Lisensi Customer', icon: Users },
];

const CAN_MANAGE = ['superadmin', 'admin'];

export default function DokumenPerizinan() {
  const user = useAuthStore((s) => s.user);
  const { documents, docStats, isLoading, fetchDocuments, fetchDocStats, uploadDocument } = useRegulationStore();
  const canManage = CAN_MANAGE.includes(user?.role);

  const [activeTab, setActiveTab] = useState('company');
  

  useEffect(() => { fetchDocuments(); fetchDocStats(); }, [fetchDocuments, fetchDocStats]);

  const handleUpload = async (docId) => {
    try {
      await uploadDocument(docId, { name: 'document.pdf' });
      toast.success('Dokumen berhasil diupload (mock)');
      fetchDocuments();
    } catch { toast.error('Gagal upload dokumen'); }
  };

  /* ── Reminder list: all docs sorted by urgency ── */
  const allDocs = [];
  if (documents) {
    (documents.company || []).forEach((d) => allDocs.push({ ...d, source: 'Perusahaan' }));
    (documents.supplier || []).forEach((d) => allDocs.push({ ...d, source: `Supplier: ${d.entityName}`, expiryDate: d.expiryDate }));
    (documents.customer || []).forEach((d) => allDocs.push({ ...d, source: `Customer: ${d.entityName}`, expiryDate: d.siaExpiry }));
  }
  const urgentDocs = allDocs
    .filter((d) => d.status === 'expired' || d.status === 'expiring_soon')
    .sort((a, b) => new Date(a.expiryDate || a.siaExpiry || '9999') - new Date(b.expiryDate || b.siaExpiry || '9999'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dokumen Perizinan</h1>
        <p className="text-sm text-gray-500 mt-1">Hub terpusat untuk semua lisensi perusahaan, supplier & customer</p>
      </div>

      {/* Stats */}
      {docStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Dokumen', value: docStats.total, icon: FileText, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Aktif', value: docStats.active, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Segera Expired', value: docStats.expiringSoon, icon: Clock, color: 'from-amber-500 to-amber-600' },
            { label: 'Sudah Expired', value: docStats.expired, icon: ShieldAlert, color: 'from-red-500 to-red-600' },
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

      {/* Urgent Reminders */}
      {urgentDocs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" /> Peringatan Lisensi
          </h2>
          <div className="space-y-2">
            {urgentDocs.slice(0, 6).map((doc, i) => {
              const expiry = doc.expiryDate || doc.siaExpiry;
              const days = daysUntil(expiry);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    doc.status === 'expired' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  {doc.status === 'expired' ? <ShieldAlert size={15} className="text-red-600 shrink-0" /> : <Clock size={15} className="text-amber-600 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{doc.type || 'SIA'} — {doc.number || doc.siaNumber}</p>
                    <p className="text-xs text-gray-500">{doc.source}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${days < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {days < 0 ? `${Math.abs(days)} hari lalu` : `${days} hari lagi`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {isLoading && !documents ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* ═══ Tab: Lisensi Perusahaan ═══ */}
              {activeTab === 'company' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(documents?.company || []).map((doc) => {
                    const st = DOC_STATUS[doc.status] || DOC_STATUS.active;
                    const StIcon = st.icon;
                    return (
                      <div key={doc._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-900">{doc.type}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${st.color}`}>
                            <StIcon size={12} /> {st.label}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Nomor</span>
                            <span className="text-gray-900 font-medium">{doc.number}</span>
                          </div>
                          {doc.issuedDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Terbit</span>
                              <span className="text-gray-700">{formatDate(doc.issuedDate)}</span>
                            </div>
                          )}
                          {doc.expiryDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Expired</span>
                              <span className={`font-medium ${doc.status === 'expired' ? 'text-red-600' : doc.status === 'expiring_soon' ? 'text-amber-600' : 'text-gray-700'}`}>
                                {formatDate(doc.expiryDate)}
                              </span>
                            </div>
                          )}
                          {doc.holder && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Pemegang</span>
                              <span className="text-gray-700">{doc.holder}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          {doc.fileName ? (
                            <button onClick={() => toast.success(`View ${doc.fileName} (mock)`)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                              <Eye size={13} /> Lihat File
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Belum ada file</span>
                          )}
                          {canManage && (
                            <button onClick={() => handleUpload(doc._id)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium ml-auto">
                              <Upload size={13} /> Upload
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ═══ Tab: Lisensi Supplier ═══ */}
              {activeTab === 'supplier' && (
                <div>
                  {(documents?.supplier || []).length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">Tidak ada data lisensi supplier</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe Lisensi</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Expired</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.supplier.map((doc) => {
                            const st = DOC_STATUS[doc.status] || DOC_STATUS.active;
                            return (
                              <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-medium text-gray-900">{doc.entityName}</td>
                                <td className="px-4 py-3 text-gray-600">{doc.type}</td>
                                <td className="px-4 py-3 text-gray-600">{doc.number}</td>
                                <td className="px-4 py-3 text-gray-600">{formatDate(doc.expiryDate)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${st.color}`}>{st.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ Tab: Lisensi Customer ═══ */}
              {activeTab === 'customer' && (
                <div>
                  {(documents?.customer || []).length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">Tidak ada data lisensi customer</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">No. SIA</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">SIA Expired</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.customer.map((doc) => {
                            const st = DOC_STATUS[doc.status] || DOC_STATUS.active;
                            return (
                              <tr key={doc._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-medium text-gray-900">{doc.entityName}</td>
                                <td className="px-4 py-3 text-gray-600">{CUSTOMER_TYPE_LABELS[doc.customerType] || doc.customerType}</td>
                                <td className="px-4 py-3 text-gray-600">{doc.siaNumber}</td>
                                <td className="px-4 py-3 text-gray-600">{formatDate(doc.siaExpiry)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${st.color}`}>{st.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
