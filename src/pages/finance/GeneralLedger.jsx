import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useFinanceStore from '../../store/financeStore';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import {
  Loader2,
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  Plus,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';

const CATEGORY_META = {
  asset: { label: 'Aset', color: 'text-blue-600 bg-blue-50', prefix: '1' },
  liability: { label: 'Kewajiban', color: 'text-red-600 bg-red-50', prefix: '2' },
  equity: { label: 'Ekuitas', color: 'text-purple-600 bg-purple-50', prefix: '3' },
  revenue: { label: 'Pendapatan', color: 'text-emerald-600 bg-emerald-50', prefix: '4' },
  expense: { label: 'Beban', color: 'text-amber-600 bg-amber-50', prefix: '5' },
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'asset', label: '1xxx — Aset' },
  { value: 'liability', label: '2xxx — Kewajiban' },
  { value: 'equity', label: '3xxx — Ekuitas' },
  { value: 'revenue', label: '4xxx — Pendapatan' },
  { value: 'expense', label: '5xxx — Beban' },
];

const SOURCE_LABELS = {
  invoice: 'Invoice',
  payment: 'Pembayaran',
  delivery: 'Pengiriman',
  purchase_order: 'Purchase Order',
  goods_receiving: 'Penerimaan Barang',
  return: 'Retur',
  adjustment: 'Penyesuaian',
  manual: 'Manual',
};

const TABS = [
  { id: 'accounts', label: 'Chart of Accounts', icon: Folder },
  { id: 'journals', label: 'Jurnal Umum', icon: FileText },
];

export default function GeneralLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'accounts';

  const handleTabChange = (tabId) => {
    if (searchParams.get('tab') === tabId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">Chart of Accounts dan Jurnal Umum sesuai endpoint finance terbaru.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'accounts' && <ChartOfAccountsTab />}
      {activeTab === 'journals' && <JournalEntriesTab />}
    </div>
  );
}

function ChartOfAccountsTab() {
  const {
    accounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useFinanceStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const accountNodes = useMemo(() => normalizeAccountNodes(accounts), [accounts]);

  useEffect(() => {
    (async () => {
      await fetchAccounts();
      setLoading(false);
    })();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!accountNodes.length) return;
    const ids = new Set();
    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((n) => {
        if (n.children?.length) {
          ids.add(n._id);
          walk(n.children);
        }
      });
    };
    walk(accountNodes);
    setExpandedIds(ids);
  }, [accountNodes]);

  const toggleNode = (id) => setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allAccountsFlat = useMemo(() => flattenAccounts(accountNodes), [accountNodes]);

  const flatRows = useMemo(() => {
    const rows = [];
    const walk = (nodes, depth) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((node) => {
        rows.push({ ...node, depth });
        if (expandedIds.has(node._id) && node.children?.length) {
          walk(node.children, depth + 1);
        }
      });
    };
    walk(accountNodes, 0);
    return rows;
  }, [accountNodes, expandedIds]);

  const handleSaveAccount = async (id, payload) => {
    setSaving(true);
    try {
      if (id) {
        await updateAccount(id, payload);
        toast.success('Akun berhasil diperbarui');
      } else {
        await createAccount(payload);
        toast.success('Akun berhasil dibuat');
      }
      setShowForm(false);
      setEditingAccount(null);
      await fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan akun');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    const hasChildren = (account.children || []).length > 0;
    const hasHistory = Boolean(
      account.hasJournalEntries
      || account.journalCount > 0
      || account.transactionCount > 0,
    );

    if (hasChildren) {
      toast.error('Akun tidak bisa dihapus karena memiliki child account');
      return;
    }

    if (hasHistory) {
      toast.error('Akun tidak bisa dihapus karena sudah memiliki histori jurnal');
      return;
    }

    if (!window.confirm(`Hapus akun ${account.code} - ${account.name}?`)) return;

    try {
      await deleteAccount(account._id);
      toast.success('Akun berhasil dihapus');
      await fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Manajemen Chart of Accounts</h3>
            <p className="text-xs text-gray-500 mt-0.5">Operasi aktif: GET/POST/PUT/DELETE akun COA.</p>
          </div>
          <button onClick={() => { setEditingAccount(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
            <Plus size={13} /> Tambah Akun
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Kode</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama Akun</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                <th className="text-center px-5 py-3.5 font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Saldo</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flatRows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Folder className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada chart of accounts.</p>
                </td></tr>
              ) : (
                flatRows.map((acc) => {
                  const hasChildren = acc.children?.length > 0;
                  const isOpen = expandedIds.has(acc._id);
                  const catMeta = CATEGORY_META[acc.category];
                  const indent = acc.depth * 24;
                  const hasHistory = Boolean(acc.hasJournalEntries || acc.journalCount > 0 || acc.transactionCount > 0);
                  const canDelete = !hasChildren && !hasHistory;

                  return (
                    <tr key={acc._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center" style={{ paddingLeft: indent }}>
                          {hasChildren ? (
                            <button onClick={() => toggleNode(acc._id)} className="mr-1.5 p-0.5 rounded hover:bg-gray-200/50 text-gray-400 transition-colors">
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="mr-1.5 w-5" />
                          )}
                          <span className="font-mono text-gray-700">{acc.code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-gray-800">{acc.name}</td>
                      <td className="px-5 py-2.5 hidden md:table-cell">
                        {catMeta && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${acc.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {acc.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-gray-900">{formatCurrency(acc.balance)}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingAccount(acc); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit akun">
                            <SquarePen size={14} />
                          </button>
                          <button onClick={() => handleDelete(acc)} disabled={!canDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={canDelete ? 'Hapus akun' : 'Tidak dapat dihapus (masih punya histori/child)'}>
                            <Trash2 size={14} />
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
      </div>

      {showForm && (
        <AccountFormModal
          account={editingAccount}
          allAccounts={allAccountsFlat}
          loading={saving}
          onClose={() => { setShowForm(false); setEditingAccount(null); }}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
}

function JournalEntriesTab() {
  const {
    journalEntries,
    journalPagination,
    isLoading,
    glFilters: filters,
    fetchJournalEntries,
    setGlFilters: setFilters,
  } = useFinanceStore();

  const [expandedId, setExpandedId] = useState(null);

  const normalizedJournals = useMemo(() => {
    return (journalEntries || []).map((journal) => {
      const normalizedEntries = (journal.entries || []).map((entry) => ({
        ...entry,
        account: entry.account || entry.accountId || null,
      }));

      const fallbackDebit = normalizedEntries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
      const fallbackCredit = normalizedEntries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);

      return {
        ...journal,
        entries: normalizedEntries,
        totalDebit: Number(journal.totalDebit ?? fallbackDebit),
        totalCredit: Number(journal.totalCredit ?? fallbackCredit),
      };
    });
  }, [journalEntries]);

  useEffect(() => {
    fetchJournalEntries();
  }, [filters, fetchJournalEntries]);

  const handleSearch = useMemo(
    () => debounce((v) => setFilters({ search: v }), 400),
    [setFilters],
  );

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari referensi, keterangan..."
              defaultValue={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>
          <select
            value={filters.accountCategory}
            onChange={(e) => setFilters({ accountCategory: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 w-8"></th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">No. Jurnal</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Keterangan</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Sumber</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Debit</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Memuat data...</p>
                </td></tr>
              ) : normalizedJournals.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Tidak ada journal entry ditemukan.</p>
                </td></tr>
              ) : (
                normalizedJournals.map((j) => {
                  const isExpanded = expandedId === j._id;
                  return (
                    <React.Fragment key={j._id}>
                      <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => toggleExpand(j._id)}>
                        <td className="px-5 py-3.5 text-gray-400">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{formatDate(j.date)}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{j.journalNumber || j.reference || '-'}</p>
                          {j.sourceNumber && <p className="text-xs text-gray-400">{j.sourceNumber}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{j.description || '-'}</td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-gray-50 text-gray-600 border-gray-200">
                            {SOURCE_LABELS[j.source] || j.source || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(j.totalDebit)}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(j.totalCredit)}</td>
                      </tr>
                      {isExpanded && (j.entries || []).length > 0 && (
                        <tr>
                          <td colSpan={7} className="px-0 py-0">
                            <div className="bg-gray-50/70 border-t border-b border-gray-100">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200/70">
                                    <th className="text-left px-8 py-2 font-medium text-gray-500">Kode</th>
                                    <th className="text-left px-4 py-2 font-medium text-gray-500">Akun</th>
                                    <th className="text-left px-4 py-2 font-medium text-gray-500 hidden md:table-cell">Keterangan</th>
                                    <th className="text-right px-4 py-2 font-medium text-gray-500">Debit</th>
                                    <th className="text-right px-8 py-2 font-medium text-gray-500">Kredit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/70">
                                  {j.entries.map((entry, ei) => (
                                    <tr key={entry._id || ei}>
                                      <td className="px-8 py-2 font-mono text-gray-500">{entry.account?.code || '-'}</td>
                                      <td className="px-4 py-2 text-gray-700">{entry.account?.name || '-'}</td>
                                      <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{entry.description || '-'}</td>
                                      <td className="px-4 py-2 text-right text-gray-700">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                      <td className="px-8 py-2 text-right text-gray-700">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={journalPagination}
          onPageChange={(page) => setFilters({ page })}
          onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          label="journal"
        />
      </div>
    </div>
  );
}

function AccountFormModal({ account, allAccounts, loading, onClose, onSave }) {
  const isEdit = Boolean(account);

  const [form, setForm] = useState({
    code: account?.code || '',
    name: account?.name || '',
    category: account?.category || 'asset',
    parentId: account?.parentId || '',
    description: account?.description || '',
    isActive: account?.isActive ?? true,
  });

  const descendantIds = useMemo(() => {
    if (!account?._id) return new Set();
    return buildDescendantIdSet(account, new Set());
  }, [account]);

  const parentOptions = useMemo(
    () => allAccounts.filter((a) => a._id !== account?._id && !descendantIds.has(a._id)),
    [allAccounts, account, descendantIds],
  );

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = form.code.trim();
    const name = form.name.trim();

    if (!code || !name) {
      toast.error('Kode dan nama akun wajib diisi');
      return;
    }

    const duplicated = allAccounts.some((a) => a.code === code && a._id !== account?._id);
    if (duplicated) {
      toast.error('Kode akun sudah digunakan');
      return;
    }

    await onSave(isEdit ? account._id : null, {
      code,
      name,
      category: form.category,
      parentId: form.parentId || null,
      description: form.description?.trim() || '',
      isActive: Boolean(form.isActive),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Akun COA' : 'Tambah Akun COA'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
            <input
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Contoh: 1110"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun *</label>
            <input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Contoh: Bank BCA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              {Object.entries(CATEGORY_META).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Account</label>
            <select
              value={form.parentId}
              onChange={(e) => setField('parentId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
            >
              <option value="">Tanpa Parent</option>
              {parentOptions.map((acc) => (
                <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="rounded border-gray-300" />
              Active
            </label>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />} {isEdit ? 'Simpan Perubahan' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
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
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function flattenAccounts(nodes = []) {
  const out = [];
  const walk = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      out.push(item);
      if (Array.isArray(item.children) && item.children.length) walk(item.children);
    });
  };
  walk(nodes);
  return out;
}

function normalizeAccountNodes(accounts) {
  const raw = Array.isArray(accounts)
    ? accounts
    : Array.isArray(accounts?.docs)
      ? accounts.docs
      : [];

  if (raw.length === 0) return [];

  const hasNestedChildren = raw.some((a) => Array.isArray(a?.children) && a.children.length > 0);
  if (hasNestedChildren) {
    const nested = raw.map((a) => ({ ...a, children: Array.isArray(a.children) ? a.children : [] }));
    sortAccountTree(nested);
    return nested;
  }

  // Backend now returns flat docs with parentId/level. Build tree structure for table rendering.
  const map = new Map();
  raw.forEach((a) => {
    const key = getAccountId(a);
    if (!key) return;
    map.set(key, { ...a, children: [] });
  });

  const roots = [];
  map.forEach((node) => {
    const parentKey = getParentId(node);
    if (parentKey && map.has(parentKey) && parentKey !== getAccountId(node)) {
      map.get(parentKey).children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortAccountTree(roots);
  return roots;
}

function getAccountId(account) {
  return account?._id || account?.id || '';
}

function getParentId(account) {
  const p = account?.parentId;
  if (!p) return '';
  if (typeof p === 'string') return p;
  if (typeof p === 'object') return p._id || p.id || '';
  return '';
}

function sortAccountTree(nodes) {
  nodes.sort((a, b) => String(a?.code || '').localeCompare(String(b?.code || ''), undefined, { numeric: true }));
  nodes.forEach((node) => {
    if (Array.isArray(node.children) && node.children.length) {
      sortAccountTree(node.children);
    }
  });
}

function buildDescendantIdSet(node, set = new Set()) {
  (node.children || []).forEach((child) => {
    set.add(child._id);
    buildDescendantIdSet(child, set);
  });
  return set;
}
