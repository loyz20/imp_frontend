import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Send, Loader2, CheckCircle2, XCircle, Eye,
  BarChart3, RefreshCw, AlertCircle, Settings, ExternalLink,
  FileDown, ChevronDown, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useRegulationStore from '../../store/regulationStore';
import useAuthStore from '../../store/authStore';
import useSettings from '../../hooks/useSettings';
import { formatDate } from '../../utils/format';

/* ── Constants ── */
const REPORT_TYPES = {
  narkotika: { label: 'Laporan Narkotika Bulanan', color: 'bg-red-100 text-red-700' },
  psikotropika: { label: 'Laporan Psikotropika Bulanan', color: 'bg-amber-100 text-amber-700' },
  prekursor: { label: 'Laporan Prekursor', color: 'bg-purple-100 text-purple-700' },
};

const REPORT_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Terkirim', color: 'bg-blue-100 text-blue-700' },
  received: { label: 'Diterima BPOM', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
};

const TABS = [
  { key: 'generate', label: 'Generate Report', icon: BarChart3 },
  { key: 'history', label: 'Riwayat Pengiriman', icon: Clock },
  { key: 'config', label: 'Konfigurasi', icon: Settings },
];

const CAN_SUBMIT = ['superadmin', 'admin', 'apoteker'];

export default function EReportBPOM() {
  const user = useAuthStore((s) => s.user);
  const { medication } = useSettings();
  const {
    eReports, eReportStats, isLoading, generatedReport,
    fetchEReports, fetchEReportStats, generateEReport, submitEReport, clearGeneratedReport, exportEReportPdf,
  } = useRegulationStore();

  const canSubmit = CAN_SUBMIT.includes(user?.role);
  const [activeTab, setActiveTab] = useState('generate');
  const [detailReport, setDetailReport] = useState(null);

  /* Generate form state */
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [genPeriod, setGenPeriod] = useState(currentMonth);
  const [genType, setGenType] = useState('narkotika');

  useEffect(() => { fetchEReports(); fetchEReportStats(); }, [fetchEReports, fetchEReportStats]);

  const handleGenerate = async () => {
    if (!genPeriod || !genType) { toast.error('Pilih periode dan tipe laporan'); return; }
    await generateEReport({ period: genPeriod, type: genType });
    toast.success('Report berhasil di-generate');
  };

  const handleSubmit = async (id) => {
    try {
      await submitEReport(id);
      toast.success('Report berhasil dikirim ke BPOM (mock)');
      fetchEReports();
      fetchEReportStats();
    } catch { toast.error('Gagal mengirim report'); }
  };

  /* ── History filter ── */
  const [histType, setHistType] = useState('');
  const [histStatus, setHistStatus] = useState('');
  const filteredReports = useMemo(() => {
    let list = eReports;
    if (histType) list = list.filter((r) => r.type === histType);
    if (histStatus) list = list.filter((r) => r.status === histStatus);
    return list;
  }, [eReports, histType, histStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">e-Report BPOM</h1>
        <p className="text-sm text-gray-500 mt-1">Generate & kirim laporan Narkotika/Psikotropika/Prekursor ke BPOM</p>
      </div>

      {/* Stats */}
      {eReportStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Report', value: eReportStats.total, icon: FileText, color: 'from-indigo-500 to-indigo-600' },
            { label: 'Terkirim', value: eReportStats.submitted + (eReportStats.received || 0), icon: Send, color: 'from-blue-500 to-blue-600' },
            { label: 'Diterima BPOM', value: eReportStats.received, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Ditolak', value: eReportStats.rejected, icon: XCircle, color: 'from-red-500 to-red-600' },
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
          {/* ═══ Tab: Generate Report ═══ */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periode *</label>
                  <input
                    type="month"
                    value={genPeriod}
                    onChange={(e) => setGenPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Laporan *</label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    {Object.entries(REPORT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <BarChart3 size={15} />}
                    Generate
                  </button>
                </div>
              </div>

              {/* Generated preview */}
              {generatedReport && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Preview: {REPORT_TYPES[generatedReport.type]?.label}
                      </h3>
                      <p className="text-xs text-gray-500">Periode: {generatedReport.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => { try { await exportEReportPdf(generatedReport.period, generatedReport.type); toast.success('PDF berhasil diunduh'); } catch { toast.error('Gagal mengunduh PDF'); } }} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <FileDown size={13} /> PDF
                      </button>
                      {canSubmit && (
                        <button onClick={() => { toast.success('Report dikirim ke BPOM (mock)'); clearGeneratedReport(); fetchEReports(); fetchEReportStats(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">
                          <Send size={13} /> Kirim ke BPOM
                        </button>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Nama Produk</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty Masuk</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty Keluar</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600">Stok Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(generatedReport.items || []).map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-4 py-2.5 text-gray-900">{item.product}</td>
                          <td className="px-4 py-2.5 text-right text-gray-700">{item.qtyIn}</td>
                          <td className="px-4 py-2.5 text-right text-gray-700">{item.qtyOut}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{item.stockEnd}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700">Total</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{generatedReport.items?.reduce((s, i) => s + i.qtyIn, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{generatedReport.items?.reduce((s, i) => s + i.qtyOut, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{generatedReport.items?.reduce((s, i) => s + i.stockEnd, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {!generatedReport && !isLoading && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Pilih periode dan tipe laporan, kemudian klik Generate untuk membuat preview laporan.
                </div>
              )}
            </div>
          )}

          {/* ═══ Tab: Submission History ═══ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select value={histType} onChange={(e) => setHistType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Semua Tipe</option>
                  {Object.entries(REPORT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={histStatus} onChange={(e) => setHistStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Semua Status</option>
                  {Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">Tidak ada data report</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">No. Report</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Periode</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal Kirim</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Pengirim</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((r) => (
                        <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.reportNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{r.period}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${REPORT_TYPES[r.type]?.color || 'bg-gray-100'}`}>
                              {REPORT_TYPES[r.type]?.label || r.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(r.submittedAt)}</td>
                          <td className="px-4 py-3 text-gray-600">{r.submittedBy?.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${REPORT_STATUS[r.status]?.color || 'bg-gray-100'}`}>
                              {REPORT_STATUS[r.status]?.label || r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setDetailReport(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Detail">
                                <Eye size={15} />
                              </button>
                              {canSubmit && r.status === 'rejected' && (
                                <button onClick={() => handleSubmit(r._id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Kirim Ulang">
                                  <RefreshCw size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ Tab: Config ═══ */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Konfigurasi e-Report BPOM dikelola melalui halaman Pengaturan.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">e-Report BPOM</p>
                  <p className="text-sm font-semibold text-gray-900">Aktif</p>
                  <p className="text-xs text-gray-400 mt-1">Pengaturan → Pelaporan</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">BPOM API Key</p>
                  <p className="text-sm font-semibold text-gray-900">••••••••</p>
                  <p className="text-xs text-gray-400 mt-1">Tersimpan di Pengaturan</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Track Narkotika</p>
                  <p className="text-sm font-semibold text-gray-900">{medication?.trackNarcotic ? 'Aktif' : 'Tidak Aktif'}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Track Psikotropika</p>
                  <p className="text-sm font-semibold text-gray-900">{medication?.trackPsychotropic ? 'Aktif' : 'Tidak Aktif'}</p>
                </div>
              </div>

              <a href="/settings?tab=reporting" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <ExternalLink size={14} /> Buka Pengaturan e-Report
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Detail Modal ═══ */}
      {detailReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Detail Report</h2>
              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${REPORT_STATUS[detailReport.status]?.color}`}>
                {REPORT_STATUS[detailReport.status]?.label}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Nomor Report</p><p className="text-sm font-medium text-gray-900">{detailReport.reportNumber}</p></div>
                <div><p className="text-xs text-gray-500">Periode</p><p className="text-sm font-medium text-gray-900">{detailReport.period}</p></div>
                <div><p className="text-xs text-gray-500">Tipe</p><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${REPORT_TYPES[detailReport.type]?.color}`}>{REPORT_TYPES[detailReport.type]?.label}</span></div>
                <div><p className="text-xs text-gray-500">Pengirim</p><p className="text-sm font-medium text-gray-900">{detailReport.submittedBy?.name}</p></div>
                <div><p className="text-xs text-gray-500">Tanggal Kirim</p><p className="text-sm font-medium text-gray-900">{formatDate(detailReport.submittedAt)}</p></div>
                {detailReport.receivedAt && (
                  <div><p className="text-xs text-gray-500">Diterima BPOM</p><p className="text-sm font-medium text-gray-900">{formatDate(detailReport.receivedAt)}</p></div>
                )}
              </div>
              {detailReport.rejectReason && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs font-medium text-red-700">Alasan Penolakan</p>
                  <p className="text-sm text-red-600 mt-0.5">{detailReport.rejectReason}</p>
                </div>
              )}
              {/* Items */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Data Laporan</p>
                <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Produk</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Masuk</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Keluar</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Stok Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailReport.items || []).map((item, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-2 text-gray-900">{item.product}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.qtyIn}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.qtyOut}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">{item.stockEnd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Timeline */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-gray-400" /><span className="text-gray-600">Dibuat — {formatDate(detailReport.createdAt)}</span></div>
                  {detailReport.submittedAt && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-600">Dikirim — {formatDate(detailReport.submittedAt)}</span></div>}
                  {detailReport.receivedAt && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-gray-600">Diterima BPOM — {formatDate(detailReport.receivedAt)}</span></div>}
                  {detailReport.status === 'rejected' && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-gray-600">Ditolak — {detailReport.rejectReason}</span></div>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={() => setDetailReport(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
