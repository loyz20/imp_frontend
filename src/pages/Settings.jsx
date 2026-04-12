import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  ShieldCheck as ShieldIcon,
  Bell as BellIcon,
  Building2 as BuildingIcon,
  FileText as DocumentIcon,
  UserPlus as UserPlusIcon,
  Calculator as CalculatorIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as CartIcon,
  Truck as TruckIcon,
  Undo2 as ArrowReturnIcon,
  Archive as BoxIcon,
  ClipboardList as ClipboardIcon,
  Pill as PillIcon,
  Users as UsersIcon,
  CreditCard as CreditCardIcon,
  BarChart3 as ChartIcon,
  Settings as CogIcon,
  Trash2,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import authService from '../services/authService';
import settingsService from '../services/settingsService';
import { setTokens } from '../api/axios';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  apoteker: 'Apoteker',
  keuangan: 'Keuangan',
  gudang: 'Gudang',
  sales: 'Sales',
  user: 'User',
};

const ACCOUNT_TABS = [
  { id: 'profil', label: 'Profil', icon: UserIcon },
  { id: 'keamanan', label: 'Keamanan', icon: ShieldIcon },
  { id: 'notifikasi', label: 'Notifikasi', icon: BellIcon },
];

const APP_TAB_GROUPS = [
  {
    label: 'Perusahaan',
    items: [
      { id: 'company', label: 'Info Perusahaan', icon: BuildingIcon },
      { id: 'licenses', label: 'Lisensi & Izin', icon: DocumentIcon },
      { id: 'pharmacist', label: 'Apoteker PJ', icon: UserPlusIcon },
      { id: 'tax', label: 'Pajak', icon: CalculatorIcon },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'appNotification', label: 'Notifikasi Sistem', icon: BellIcon },
      { id: 'reporting', label: 'Laporan', icon: ChartIcon },
      { id: 'general', label: 'Umum', icon: CogIcon },
    ],
  },
];

/* ── Helper Components ── */
function InputField({ label, desc, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        {...props}
      />
      {desc && <p className="text-xs text-gray-400 mt-1">{desc}</p>}
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function SectionCard({ title, desc, children, onSubmit, loading, submitLabel = 'Simpan' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {title && <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>}
      {desc && <p className="text-sm text-gray-500 mb-6">{desc}</p>}
      {onSubmit ? (
        <form onSubmit={onSubmit} className="space-y-5">
          {children}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : submitLabel}
          </button>
        </form>
      ) : (
        children
      )}
    </div>
  );
}

function AddressFields({ prefix, form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <InputField label="Jalan" value={form?.street || ''} onChange={(e) => onChange(prefix, 'street', e.target.value)} />
      </div>
      <InputField label="Kota" value={form?.city || ''} onChange={(e) => onChange(prefix, 'city', e.target.value)} />
      <InputField label="Provinsi" value={form?.province || ''} onChange={(e) => onChange(prefix, 'province', e.target.value)} />
      <InputField label="Kode Pos" value={form?.postalCode || ''} onChange={(e) => onChange(prefix, 'postalCode', e.target.value)} />
      <InputField label="Negara" value={form?.country || ''} onChange={(e) => onChange(prefix, 'country', e.target.value)} />
    </div>
  );
}

/* ── Main Component ── */
export default function Settings() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const settings = useSettingsStore((s) => s.settings);
  const initializeSettings = useSettingsStore((s) => s.initializeSettings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const initialTab = searchParams.get('tab') || 'profil';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [initLoading, setInitLoading] = useState(false);
  const hasInitializedSettings = !!settings && Object.keys(settings).length > 0;

  const handleInitializeSettings = async () => {
    const proceed = window.confirm('Inisialisasi settings hanya dilakukan sekali. Lanjutkan?');
    if (!proceed) return;

    setInitLoading(true);
    try {
      await initializeSettings();
      await fetchSettings();
      toast.success('Settings berhasil diinisialisasi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal inisialisasi settings');
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola profil, keamanan, dan preferensi akun Anda.</p>
      </div>

      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">Inisialisasi Settings</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Endpoint: POST /settings/initialize. Gunakan saat setup awal aplikasi (sekali).
            </p>
          </div>
          <button
            type="button"
            onClick={handleInitializeSettings}
            disabled={hasInitializedSettings || initLoading}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-amber-600 text-white hover:bg-amber-700"
          >
            {hasInitializedSettings ? 'Sudah Diinisialisasi' : initLoading ? 'Memproses...' : 'Initialize Settings'}
          </button>
        </div>
      )}

      <div className="flex gap-6 min-h-150">
        {/* Sidebar Navigation */}
        <div className="w-56 shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-200 p-3 space-y-1 sticky top-6">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Akun</p>
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}

            {isAdmin && APP_TAB_GROUPS.map((group) => (
              <React.Fragment key={group.label}>
                <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3">{group.label}</p>
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon />
                      {tab.label}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profil' && <ProfilTab />}
          {activeTab === 'keamanan' && <KeamananTab />}
          {activeTab === 'notifikasi' && <NotifikasiTab />}

          {isAdmin && activeTab === 'company' && <CompanyTab />}
          {isAdmin && activeTab === 'licenses' && <LicensesTab />}
          {isAdmin && activeTab === 'pharmacist' && <PharmacistTab />}
          {isAdmin && activeTab === 'tax' && <TaxTab />}
          {isAdmin && activeTab === 'appNotification' && <AppNotificationTab />}
          {isAdmin && activeTab === 'reporting' && <ReportingTab />}
          {isAdmin && activeTab === 'general' && <GeneralTab />}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ACCOUNT TABS
   ════════════════════════════════════════ */

function ProfilTab() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      province: user?.address?.province || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'Indonesia',
    },
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [e.target.name]: e.target.value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.updateProfile(form);
      const updatedUser = res.data.data?.user ?? res.data.data;
      setUser(updatedUser);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.name || '-'}</h2>
            <p className="text-sm text-gray-500">{user?.email || '-'}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                {ROLE_LABELS[user?.role] || user?.role || '-'}
              </span>
              {user?.isEmailVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                  Email Terverifikasi
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${user?.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {user?.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SectionCard title="Informasi Profil" desc="Perbarui data profil Anda." onSubmit={handleSubmit} loading={loading}>
        <div className="max-w-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField label="Nama Lengkap" type="text" name="name" value={form.name} onChange={handleChange} required />
            <div>
              <InputField label="Email" type="email" value={user?.email || ''} disabled desc="Email tidak dapat diubah." />
            </div>
            <InputField label="Nomor Telepon" type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 mt-2">Alamat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <InputField label="Jalan" type="text" name="street" value={form.address.street} onChange={handleAddressChange} placeholder="Jl. Contoh No. 1" />
              </div>
              <InputField label="Kota" type="text" name="city" value={form.address.city} onChange={handleAddressChange} />
              <InputField label="Provinsi" type="text" name="province" value={form.address.province} onChange={handleAddressChange} />
              <InputField label="Kode Pos" type="text" name="postalCode" value={form.address.postalCode} onChange={handleAddressChange} />
              <InputField label="Negara" type="text" name="country" value={form.address.country} onChange={handleAddressChange} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function KeamananTab() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.changePassword(form);
      if (res.data?.data?.tokens) {
        setTokens(res.data.data.tokens);
      }
      toast.success('Password berhasil diubah');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Ubah Password" desc="Pastikan akun Anda menggunakan password yang kuat." onSubmit={handleSubmit} loading={loading} submitLabel="Ubah Password">
      <div className="max-w-lg space-y-5">
        <InputField label="Password Saat Ini" type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} required />
        <InputField label="Password Baru" type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required desc="Minimal 8 karakter, gunakan kombinasi huruf besar, kecil, dan angka." />
        <InputField label="Konfirmasi Password Baru" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
      </div>
    </SectionCard>
  );
}

function NotifikasiTab() {
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    stokRendah: true,
    transaksiMasuk: true,
    expired: true,
    laporanMingguan: false,
  });

  const toggle = (key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const notifOptions = [
    { key: 'emailNotif', label: 'Notifikasi Email', desc: 'Terima pemberitahuan penting melalui email.' },
    { key: 'stokRendah', label: 'Peringatan Stok Rendah', desc: 'Notifikasi saat stok produk di bawah batas minimum.' },
    { key: 'transaksiMasuk', label: 'Transaksi Masuk', desc: 'Pemberitahuan saat ada PO atau SO baru.' },
    { key: 'expired', label: 'Peringatan Kadaluarsa', desc: 'Notifikasi obat mendekati tanggal kadaluarsa.' },
    { key: 'laporanMingguan', label: 'Laporan Mingguan', desc: 'Kirim ringkasan laporan setiap minggu via email.' },
  ];

  return (
    <SectionCard title="Preferensi Notifikasi" desc="Atur jenis notifikasi yang ingin Anda terima.">
      <div className="max-w-lg space-y-1">
        {notifOptions.map((opt) => (
          <ToggleField key={opt.key} label={opt.label} desc={opt.desc} checked={prefs[opt.key]} onChange={() => toggle(opt.key)} />
        ))}
      </div>
      <button
        className="mt-6 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        onClick={() => toast.success('Preferensi notifikasi disimpan')}
      >
        Simpan Preferensi
      </button>
    </SectionCard>
  );
}

/* ════════════════════════════════════════
   APP SETTINGS TABS (Admin/Superadmin)
   ════════════════════════════════════════ */

function useAppSection(section) {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSection = useSettingsStore((s) => s.fetchSection);
  const fetchedRef = React.useRef(new Set());

  useEffect(() => {
    if (!fetchedRef.current.has(section)) {
      fetchedRef.current.add(section);
      fetchSection(section);
    }
  }, [section, fetchSection]);

  return settings?.[section] || {};
}

/* ── Company ── */
function CompanyTab() {
  const data = useAppSection('company');
  const fetchSection = useSettingsStore((s) => s.fetchSection);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logo: data.logo || null,
        officeAddress: data.officeAddress || { street: '', city: '', province: '', postalCode: '', country: 'Indonesia' },
        warehouseAddress: data.warehouseAddress || { street: '', city: '', province: '', postalCode: '', country: 'Indonesia' },
      });
    }
  }, [data]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleAddress = (field, key, val) => setForm((p) => ({ ...p, [field]: { ...p[field], [key]: val } }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (PNG, JPG, SVG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm((p) => ({ ...p, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateCompany(form);
      await fetchSection('company');
      toast.success('Info perusahaan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Info Perusahaan" desc="Data identitas perusahaan PBF." onSubmit={handleSubmit} loading={loading}>
        <div className="max-w-2xl space-y-5">

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Perusahaan</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <BuildingIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {form.logo ? 'Ganti Logo' : 'Upload Logo'}
                </button>
                {form.logo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="ml-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG, SVG, WebP. Maks 2 MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <InputField label="Nama Perusahaan" name="name" value={form.name || ''} onChange={handleChange} />
            </div>
            <InputField label="Telepon" name="phone" value={form.phone || ''} onChange={handleChange} />
            <InputField label="Email" name="email" type="email" value={form.email || ''} onChange={handleChange} />
            <div className="sm:col-span-2">
              <InputField label="Website" name="website" value={form.website || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Alamat Kantor</h3>
            <AddressFields prefix="officeAddress" form={form.officeAddress} onChange={handleAddress} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Alamat Gudang</h3>
            <AddressFields prefix="warehouseAddress" form={form.warehouseAddress} onChange={handleAddress} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Licenses ── */
function LicenseField({ label, license, onChange }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Nomor" value={license?.number || ''} onChange={(e) => onChange('number', e.target.value)} />
        <InputField label="Tanggal Terbit" type="date" value={license?.issuedDate?.slice(0, 10) || ''} onChange={(e) => onChange('issuedDate', e.target.value)} />
        <InputField label="Tanggal Expired" type="date" value={license?.expiryDate?.slice(0, 10) || ''} onChange={(e) => onChange('expiryDate', e.target.value)} />
      </div>
    </div>
  );
}

function LicensesTab() {
  const data = useAppSection('company');
  const warnings = useSettingsStore((s) => s.licenseWarnings);
  const fetchWarnings = useSettingsStore((s) => s.fetchLicenseWarnings);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ pbf: {}, siup: {}, tdp: {}, nib: {}, cdob: {} });

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);

  useEffect(() => {
    const lic = data?.licenses;
    if (lic) setForm({ pbf: lic.pbf || {}, siup: lic.siup || {}, tdp: lic.tdp || {}, nib: lic.nib || {}, cdob: lic.cdob || {} });
  }, [data]);

  const handleLicense = (type, key, val) => setForm((p) => ({ ...p, [type]: { ...p[type], [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateLicenses(form);
      toast.success('Lisensi berhasil disimpan');
      fetchWarnings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Peringatan Lisensi</h3>
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${w.status === 'expired' ? 'text-red-700' : 'text-amber-700'}`}>
                <span className={`w-2 h-2 rounded-full ${w.status === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="font-medium">{w.license}</span> — {w.status === 'expired' ? `Expired ${Math.abs(w.daysUntilExpiry)} hari lalu` : `Expired dalam ${w.daysUntilExpiry} hari`}
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionCard title="Lisensi & Izin" desc="Kelola izin operasional PBF." onSubmit={handleSubmit} loading={loading}>
        <div className="max-w-2xl space-y-4">
          <LicenseField label="Izin PBF" license={form.pbf} onChange={(k, v) => handleLicense('pbf', k, v)} />
          <LicenseField label="SIUP" license={form.siup} onChange={(k, v) => handleLicense('siup', k, v)} />
          <LicenseField label="TDP" license={form.tdp} onChange={(k, v) => handleLicense('tdp', k, v)} />
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">NIB</h4>
            <InputField label="Nomor" value={form.nib?.number || ''} onChange={(e) => handleLicense('nib', 'number', e.target.value)} />
          </div>
          <LicenseField label="Sertifikat CDOB" license={form.cdob} onChange={(k, v) => handleLicense('cdob', k, v)} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Pharmacist ── */
function PharmacistTab() {
  const data = useAppSection('company');
  const emptyPharmacist = { name: '', sipaNumber: '', straNumber: '', sipaExpiry: '', straExpiry: '', phone: '', email: '' };
  const [loadingObat, setLoadingObat] = useState(false);
  const [loadingAlkes, setLoadingAlkes] = useState(false);
  const [obatForm, setObatForm] = useState(emptyPharmacist);
  const [alkesForm, setAlkesForm] = useState(emptyPharmacist);

  const normalizePharmacist = (p = {}) => ({
    name: p?.name || '',
    sipaNumber: p?.sipaNumber || '',
    straNumber: p?.straNumber || '',
    sipaExpiry: p?.sipaExpiry?.slice(0, 10) || '',
    straExpiry: p?.straExpiry?.slice(0, 10) || '',
    phone: p?.phone || '',
    email: p?.email || '',
  });

  useEffect(() => {
    const legacy = data?.responsiblePharmacist || {};
    const pjObat = data?.responsiblePharmacistObat || data?.pharmacistObat || legacy;
    const pjAlkes = data?.responsiblePharmacistAlkes || data?.pharmacistAlkes || legacy;
    setObatForm(normalizePharmacist(pjObat));
    setAlkesForm(normalizePharmacist(pjAlkes));
  }, [data]);

  const handleObatChange = (e) => setObatForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleAlkesChange = (e) => setAlkesForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmitObat = async (e) => {
    e.preventDefault();
    setLoadingObat(true);
    try {
      if (settingsService.updatePharmacistObat) {
        await settingsService.updatePharmacistObat(obatForm);
      } else {
        await settingsService.updatePharmacist(obatForm);
      }
      toast.success('Data apoteker PJ Obat berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoadingObat(false);
    }
  };

  const handleSubmitAlkes = async (e) => {
    e.preventDefault();
    setLoadingAlkes(true);
    try {
      if (settingsService.updatePharmacistAlkes) {
        await settingsService.updatePharmacistAlkes(alkesForm);
      } else {
        await settingsService.updatePharmacist(alkesForm);
      }
      toast.success('Data apoteker PJ Alkes berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoadingAlkes(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Apoteker PJ Obat" desc="Data apoteker penanggung jawab untuk produk obat." onSubmit={handleSubmitObat} loading={loadingObat}>
        <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <InputField label="Nama Lengkap" name="name" value={obatForm.name} onChange={handleObatChange} />
          </div>
          <InputField label="Nomor SIPA" name="sipaNumber" value={obatForm.sipaNumber} onChange={handleObatChange} />
          <InputField label="Expired SIPA" name="sipaExpiry" type="date" value={obatForm.sipaExpiry} onChange={handleObatChange} />
          <InputField label="Nomor STRA" name="straNumber" value={obatForm.straNumber} onChange={handleObatChange} />
          <InputField label="Expired STRA" name="straExpiry" type="date" value={obatForm.straExpiry} onChange={handleObatChange} />
          <InputField label="Telepon" name="phone" value={obatForm.phone} onChange={handleObatChange} />
          <InputField label="Email" name="email" type="email" value={obatForm.email} onChange={handleObatChange} />
        </div>
      </SectionCard>

      <SectionCard title="Apoteker PJ Alkes" desc="Data apoteker penanggung jawab untuk alat kesehatan." onSubmit={handleSubmitAlkes} loading={loadingAlkes}>
        <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <InputField label="Nama Lengkap" name="name" value={alkesForm.name} onChange={handleAlkesChange} />
          </div>
          <InputField label="Nomor SIPA" name="sipaNumber" value={alkesForm.sipaNumber} onChange={handleAlkesChange} />
          <InputField label="Expired SIPA" name="sipaExpiry" type="date" value={alkesForm.sipaExpiry} onChange={handleAlkesChange} />
          <InputField label="Nomor STRA" name="straNumber" value={alkesForm.straNumber} onChange={handleAlkesChange} />
          <InputField label="Expired STRA" name="straExpiry" type="date" value={alkesForm.straExpiry} onChange={handleAlkesChange} />
          <InputField label="Telepon" name="phone" value={alkesForm.phone} onChange={handleAlkesChange} />
          <InputField label="Email" name="email" type="email" value={alkesForm.email} onChange={handleAlkesChange} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Tax ── */
function TaxTab() {
  const data = useAppSection('company');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ npwp: '', isPkp: false, defaultPpnRate: 11 });

  useEffect(() => {
    const t = data?.tax;
    if (t) setForm({ npwp: t.npwp || '', isPkp: t.isPkp ?? false, defaultPpnRate: t.defaultPpnRate ?? 11 });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateTax(form);
      toast.success('Pengaturan pajak berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Pajak" desc="Konfigurasi NPWP dan PPN." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <InputField label="NPWP" value={form.npwp} onChange={(e) => setForm((p) => ({ ...p, npwp: e.target.value }))} placeholder="01.234.567.8-901.234" />
        <ToggleField label="Status PKP" desc="Pengusaha Kena Pajak" checked={form.isPkp} onChange={() => setForm((p) => ({ ...p, isPkp: !p.isPkp }))} />
        <InputField label="Tarif PPN Default (%)" type="number" value={form.defaultPpnRate} onChange={(e) => setForm((p) => ({ ...p, defaultPpnRate: Number(e.target.value) }))} />
      </div>
    </SectionCard>
  );
}

/* ── Document Settings (Invoice, PO, DO, Return) ── */
function DocSettingsTab({ section, title, desc, serviceFn, extraFields }) {
  const data = useAppSection(section);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ prefix: '', autoNumber: true });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const base = { prefix: data.prefix || '', autoNumber: data.autoNumber ?? true };
      if (extraFields) {
        extraFields.forEach((f) => { base[f.name] = data[f.name] ?? f.defaultValue; });
      }
      setForm(base);
    }
  }, [data, extraFields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await serviceFn(form);
      toast.success(`${title} berhasil disimpan`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={title} desc={desc} onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <InputField label="Prefix" value={form.prefix} onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))} />
        <ToggleField label="Auto-generate Nomor" desc="Nomor dokumen otomatis berurutan." checked={form.autoNumber} onChange={() => setForm((p) => ({ ...p, autoNumber: !p.autoNumber }))} />
        {extraFields?.map((f) => (
          f.type === 'toggle' ? (
            <ToggleField key={f.name} label={f.label} desc={f.desc} checked={form[f.name] ?? f.defaultValue} onChange={() => setForm((p) => ({ ...p, [f.name]: !p[f.name] }))} />
          ) : (
            <InputField key={f.name} label={f.label} type={f.type || 'number'} value={form[f.name] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
          )
        ))}
      </div>
    </SectionCard>
  );
}

function InvoiceTab() {
  return (
    <DocSettingsTab
      section="invoice"
      title="Pengaturan Invoice"
      desc="Konfigurasi format dan penomoran invoice."
      serviceFn={settingsService.updateInvoice}
      extraFields={[{ name: 'defaultPaymentTermDays', label: 'Jatuh Tempo Default (hari)', type: 'number', defaultValue: 30 }]}
    />
  );
}

function PurchaseOrderTab() {
  return (
    <DocSettingsTab
      section="purchaseOrder"
      title="Pengaturan Purchase Order"
      desc="Konfigurasi format dan penomoran surat pesanan."
      serviceFn={settingsService.updatePurchaseOrder}
      extraFields={[
        { name: 'requireApproval', label: 'Butuh Approval', desc: 'PO memerlukan persetujuan sebelum diproses.', type: 'toggle', defaultValue: true },
        { name: 'approvalLevels', label: 'Jumlah Level Approval', type: 'number', defaultValue: 2 },
      ]}
    />
  );
}

function DeliveryOrderTab() {
  return (
    <DocSettingsTab
      section="deliveryOrder"
      title="Pengaturan Delivery Order"
      desc="Konfigurasi format dan penomoran surat jalan."
      serviceFn={settingsService.updateDeliveryOrder}
    />
  );
}

function ReturnOrderTab() {
  return (
    <DocSettingsTab
      section="returnOrder"
      title="Pengaturan Retur"
      desc="Konfigurasi format dan penomoran retur."
      serviceFn={settingsService.updateReturnOrder}
      extraFields={[{ name: 'maxReturnDays', label: 'Batas Hari Retur', type: 'number', defaultValue: 14 }]}
    />
  );
}

/* ── Inventory ── */
function InventoryTab() {
  const data = useAppSection('inventory');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    enableBatchTracking: true,
    enableExpiryDate: true,
    useFEFO: true,
    lowStockThreshold: 10,
    temperatureZones: [],
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      enableBatchTracking: data.enableBatchTracking ?? true,
      enableExpiryDate: data.enableExpiryDate ?? true,
      useFEFO: data.useFEFO ?? true,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      temperatureZones: data.temperatureZones || [],
    });
  }, [data]);

  const addZone = () => setForm((p) => ({ ...p, temperatureZones: [...p.temperatureZones, { name: '', minTemp: 0, maxTemp: 25 }] }));
  const removeZone = (i) => setForm((p) => ({ ...p, temperatureZones: p.temperatureZones.filter((_, idx) => idx !== i) }));
  const updateZone = (i, key, val) => setForm((p) => ({ ...p, temperatureZones: p.temperatureZones.map((z, idx) => idx === i ? { ...z, [key]: val } : z) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateInventory(form);
      toast.success('Pengaturan inventaris berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Inventaris" desc="Konfigurasi tracking batch, expired, dan stok." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-2xl space-y-5">
        <div className="space-y-1">
          <ToggleField label="Batch Tracking" desc="Aktifkan pelacakan nomor batch." checked={form.enableBatchTracking} onChange={() => setForm((p) => ({ ...p, enableBatchTracking: !p.enableBatchTracking }))} />
          <ToggleField label="Expiry Date Tracking" desc="Aktifkan pelacakan tanggal kadaluarsa." checked={form.enableExpiryDate} onChange={() => setForm((p) => ({ ...p, enableExpiryDate: !p.enableExpiryDate }))} />
          <ToggleField label="FEFO (First Expired First Out)" desc="Prioritaskan pengeluaran barang yang mendekati expired." checked={form.useFEFO} onChange={() => setForm((p) => ({ ...p, useFEFO: !p.useFEFO }))} />
        </div>
        <InputField label="Threshold Stok Rendah" type="number" value={form.lowStockThreshold} onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: Number(e.target.value) }))} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Zona Suhu Penyimpanan</h3>
            <button type="button" onClick={addZone} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Tambah Zona</button>
          </div>
          <div className="space-y-3">
            {form.temperatureZones.map((zone, i) => (
              <div key={i} className="flex items-end gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <InputField label="Nama" value={zone.name} onChange={(e) => updateZone(i, 'name', e.target.value)} />
                </div>
                <div className="w-24">
                  <InputField label="Min °C" type="number" value={zone.minTemp} onChange={(e) => updateZone(i, 'minTemp', Number(e.target.value))} />
                </div>
                <div className="w-24">
                  <InputField label="Max °C" type="number" value={zone.maxTemp} onChange={(e) => updateZone(i, 'maxTemp', Number(e.target.value))} />
                </div>
                <button type="button" onClick={() => removeZone(i)} className="pb-2.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ── CDOB ── */
function CdobTab() {
  const data = useAppSection('cdob');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    enableTemperatureLog: true,
    enableRecallManagement: true,
    enableComplaintTracking: true,
    selfInspectionSchedule: 'quarterly',
    documentRetentionYears: 5,
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      enableTemperatureLog: data.enableTemperatureLog ?? true,
      enableRecallManagement: data.enableRecallManagement ?? true,
      enableComplaintTracking: data.enableComplaintTracking ?? true,
      selfInspectionSchedule: data.selfInspectionSchedule || 'quarterly',
      documentRetentionYears: data.documentRetentionYears ?? 5,
    });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateCdob(form);
      toast.success('Pengaturan CDOB berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const scheduleOptions = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: 'Per 3 Bulan' },
    { value: 'biannually', label: 'Per 6 Bulan' },
    { value: 'annually', label: 'Tahunan' },
  ];

  return (
    <SectionCard title="Pengaturan CDOB" desc="Cara Distribusi Obat yang Baik." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <div className="space-y-1">
          <ToggleField label="Log Suhu" desc="Aktifkan pencatatan log suhu gudang." checked={form.enableTemperatureLog} onChange={() => setForm((p) => ({ ...p, enableTemperatureLog: !p.enableTemperatureLog }))} />
          <ToggleField label="Manajemen Recall" desc="Aktifkan manajemen penarikan obat." checked={form.enableRecallManagement} onChange={() => setForm((p) => ({ ...p, enableRecallManagement: !p.enableRecallManagement }))} />
          <ToggleField label="Tracking Keluhan" desc="Aktifkan pelacakan keluhan pelanggan." checked={form.enableComplaintTracking} onChange={() => setForm((p) => ({ ...p, enableComplaintTracking: !p.enableComplaintTracking }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jadwal Inspeksi Diri</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            value={form.selfInspectionSchedule}
            onChange={(e) => setForm((p) => ({ ...p, selfInspectionSchedule: e.target.value }))}
          >
            {scheduleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <InputField label="Retensi Dokumen (tahun)" type="number" value={form.documentRetentionYears} onChange={(e) => setForm((p) => ({ ...p, documentRetentionYears: Number(e.target.value) }))} />
      </div>
    </SectionCard>
  );
}

/* ── Medication ── */
function MedicationTab() {
  const data = useAppSection('medication');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    trackNarcotic: true,
    trackPsychotropic: true,
    trackPrecursor: true,
    trackOtc: false,
    requireSpecialSP: true,
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      trackNarcotic: data.trackNarcotic ?? true,
      trackPsychotropic: data.trackPsychotropic ?? true,
      trackPrecursor: data.trackPrecursor ?? true,
      trackOtc: data.trackOtc ?? false,
      requireSpecialSP: data.requireSpecialSP ?? true,
    });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateMedication(form);
      toast.success('Pengaturan obat berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Obat" desc="Konfigurasi tracking golongan obat." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-1">
        <ToggleField label="Tracking Narkotika" desc="Pelacakan khusus obat narkotika." checked={form.trackNarcotic} onChange={() => setForm((p) => ({ ...p, trackNarcotic: !p.trackNarcotic }))} />
        <ToggleField label="Tracking Psikotropika" desc="Pelacakan khusus obat psikotropika." checked={form.trackPsychotropic} onChange={() => setForm((p) => ({ ...p, trackPsychotropic: !p.trackPsychotropic }))} />
        <ToggleField label="Tracking Prekursor" desc="Pelacakan khusus bahan prekursor." checked={form.trackPrecursor} onChange={() => setForm((p) => ({ ...p, trackPrecursor: !p.trackPrecursor }))} />
        <ToggleField label="Tracking OTC" desc="Pelacakan obat bebas (OTC)." checked={form.trackOtc} onChange={() => setForm((p) => ({ ...p, trackOtc: !p.trackOtc }))} />
        <ToggleField label="Wajib SP Khusus" desc="Wajibkan Surat Pesanan khusus untuk NK/PS." checked={form.requireSpecialSP} onChange={() => setForm((p) => ({ ...p, requireSpecialSP: !p.requireSpecialSP }))} />
      </div>
    </SectionCard>
  );
}

/* ── Customer ── */
function CustomerTab() {
  const data = useAppSection('customer');
  const [loading, setLoading] = useState(false);
  const allTypes = ['apotek', 'rumah_sakit', 'klinik', 'puskesmas', 'toko_obat', 'pbf_lain'];
  const typeLabels = { apotek: 'Apotek', rumah_sakit: 'Rumah Sakit', klinik: 'Klinik', puskesmas: 'Puskesmas', toko_obat: 'Toko Obat', pbf_lain: 'PBF Lain' };
  const [form, setForm] = useState({
    requireSIA: true,
    customerTypes: ['apotek', 'rumah_sakit', 'klinik', 'puskesmas'],
    defaultCreditLimit: 50000000,
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      requireSIA: data.requireSIA ?? true,
      customerTypes: data.customerTypes || ['apotek', 'rumah_sakit', 'klinik', 'puskesmas'],
      defaultCreditLimit: data.defaultCreditLimit ?? 50000000,
    });
  }, [data]);

  const toggleType = (type) => {
    setForm((p) => ({
      ...p,
      customerTypes: p.customerTypes.includes(type)
        ? p.customerTypes.filter((t) => t !== type)
        : [...p.customerTypes, type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateCustomer(form);
      toast.success('Pengaturan pelanggan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Pelanggan" desc="Konfigurasi tipe dan validasi pelanggan." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <ToggleField label="Wajib Validasi SIA" desc="Pelanggan harus memiliki SIA yang valid." checked={form.requireSIA} onChange={() => setForm((p) => ({ ...p, requireSIA: !p.requireSIA }))} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pelanggan yang Diizinkan</label>
          <div className="flex flex-wrap gap-2">
            {allTypes.map((type) => (
              <button key={type} type="button" onClick={() => toggleType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.customerTypes.includes(type) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
        </div>
        <InputField label="Credit Limit Default (Rp)" type="number" value={form.defaultCreditLimit} onChange={(e) => setForm((p) => ({ ...p, defaultCreditLimit: Number(e.target.value) }))} />
      </div>
    </SectionCard>
  );
}

/* ── Payment ── */
function PaymentTab() {
  const data = useAppSection('payment');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bankAccounts: [],
    allowPartialPayment: true,
    allowCreditPayment: true,
    latePenaltyRate: 2,
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      bankAccounts: data.bankAccounts || [],
      allowPartialPayment: data.allowPartialPayment ?? true,
      allowCreditPayment: data.allowCreditPayment ?? true,
      latePenaltyRate: data.latePenaltyRate ?? 2,
    });
  }, [data]);

  const addBank = () => setForm((p) => ({ ...p, bankAccounts: [...p.bankAccounts, { bankName: '', accountNumber: '', accountName: '' }] }));
  const removeBank = (i) => setForm((p) => ({ ...p, bankAccounts: p.bankAccounts.filter((_, idx) => idx !== i) }));
  const updateBank = (i, key, val) => setForm((p) => ({ ...p, bankAccounts: p.bankAccounts.map((b, idx) => idx === i ? { ...b, [key]: val } : b) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updatePayment(form);
      toast.success('Pengaturan pembayaran berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Pembayaran" desc="Konfigurasi metode dan ketentuan pembayaran." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-2xl space-y-5">
        <div className="space-y-1">
          <ToggleField label="Pembayaran Parsial" desc="Izinkan pembayaran sebagian dari total." checked={form.allowPartialPayment} onChange={() => setForm((p) => ({ ...p, allowPartialPayment: !p.allowPartialPayment }))} />
          <ToggleField label="Pembayaran Kredit" desc="Izinkan pembayaran secara kredit." checked={form.allowCreditPayment} onChange={() => setForm((p) => ({ ...p, allowCreditPayment: !p.allowCreditPayment }))} />
        </div>
        <InputField label="Denda Keterlambatan (%/bulan)" type="number" value={form.latePenaltyRate} onChange={(e) => setForm((p) => ({ ...p, latePenaltyRate: Number(e.target.value) }))} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Rekening Bank</h3>
            <button type="button" onClick={addBank} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Tambah Rekening</button>
          </div>
          <div className="space-y-3">
            {form.bankAccounts.map((bank, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Rekening #{i + 1}</span>
                  <button type="button" onClick={() => removeBank(i)} className="text-red-400 hover:text-red-600 text-sm">Hapus</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField label="Nama Bank" value={bank.bankName} onChange={(e) => updateBank(i, 'bankName', e.target.value)} />
                  <InputField label="Nomor Rekening" value={bank.accountNumber} onChange={(e) => updateBank(i, 'accountNumber', e.target.value)} />
                  <InputField label="Nama Pemilik" value={bank.accountName} onChange={(e) => updateBank(i, 'accountName', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ── App Notification ── */
function AppNotificationTab() {
  const data = useAppSection('notification');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [form, setForm] = useState({
    enableEmail: true,
    enableSMS: false,
    enableWhatsApp: false,
    alerts: { lowStock: true, nearExpiry: true, overduePayment: true, recall: true, temperatureAlert: true },
    smtp: { host: '', port: 587, user: '', password: '', fromName: '', fromEmail: '' },
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      enableEmail: data.enableEmail ?? true,
      enableSMS: data.enableSMS ?? false,
      enableWhatsApp: data.enableWhatsApp ?? false,
      alerts: { lowStock: true, nearExpiry: true, overduePayment: true, recall: true, temperatureAlert: true, ...data.alerts },
      smtp: { host: '', port: 587, user: '', password: '', fromName: '', fromEmail: '', ...data.smtp },
    });
  }, [data]);

  const toggleAlert = (key) => setForm((p) => ({ ...p, alerts: { ...p.alerts, [key]: !p.alerts[key] } }));
  const handleSmtp = (key, val) => setForm((p) => ({ ...p, smtp: { ...p.smtp, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateNotification(form);
      toast.success('Pengaturan notifikasi sistem berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestLoading(true);
    try {
      await settingsService.testSmtp({ testEmail: form.smtp.fromEmail });
      toast.success('Email test berhasil dikirim!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Koneksi SMTP gagal');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Notifikasi Sistem" desc="Konfigurasi kanal dan jenis notifikasi." onSubmit={handleSubmit} loading={loading}>
        <div className="max-w-2xl space-y-5">
          <div className="space-y-1">
            <ToggleField label="Email" desc="Kirim notifikasi via email." checked={form.enableEmail} onChange={() => setForm((p) => ({ ...p, enableEmail: !p.enableEmail }))} />
            <ToggleField label="SMS" desc="Kirim notifikasi via SMS." checked={form.enableSMS} onChange={() => setForm((p) => ({ ...p, enableSMS: !p.enableSMS }))} />
            <ToggleField label="WhatsApp" desc="Kirim notifikasi via WhatsApp." checked={form.enableWhatsApp} onChange={() => setForm((p) => ({ ...p, enableWhatsApp: !p.enableWhatsApp }))} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Jenis Alert</h3>
            <div className="space-y-1">
              <ToggleField label="Stok Rendah" checked={form.alerts.lowStock} onChange={() => toggleAlert('lowStock')} />
              <ToggleField label="Mendekati Expired" checked={form.alerts.nearExpiry} onChange={() => toggleAlert('nearExpiry')} />
              <ToggleField label="Pembayaran Overdue" checked={form.alerts.overduePayment} onChange={() => toggleAlert('overduePayment')} />
              <ToggleField label="Recall Obat" checked={form.alerts.recall} onChange={() => toggleAlert('recall')} />
              <ToggleField label="Alert Suhu" checked={form.alerts.temperatureAlert} onChange={() => toggleAlert('temperatureAlert')} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Konfigurasi SMTP</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="SMTP Host" value={form.smtp.host} onChange={(e) => handleSmtp('host', e.target.value)} placeholder="smtp.gmail.com" />
              <InputField label="Port" type="number" value={form.smtp.port} onChange={(e) => handleSmtp('port', Number(e.target.value))} />
              <InputField label="User" value={form.smtp.user} onChange={(e) => handleSmtp('user', e.target.value)} />
              <InputField label="Password" type="password" value={form.smtp.password} onChange={(e) => handleSmtp('password', e.target.value)} />
              <InputField label="Nama Pengirim" value={form.smtp.fromName} onChange={(e) => handleSmtp('fromName', e.target.value)} />
              <InputField label="Email Pengirim" type="email" value={form.smtp.fromEmail} onChange={(e) => handleSmtp('fromEmail', e.target.value)} />
            </div>
            <button type="button" onClick={handleTestSmtp} disabled={testLoading} className="mt-3 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors">
              {testLoading ? 'Mengirim...' : 'Test SMTP'}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Reporting ── */
function ReportingTab() {
  const data = useAppSection('reporting');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bpom: { enableEReport: false, apiKey: '' },
    fiscalYearStart: 1,
    currency: 'IDR',
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      bpom: { enableEReport: data.bpom?.enableEReport ?? false, apiKey: data.bpom?.apiKey || '' },
      fiscalYearStart: data.fiscalYearStart ?? 1,
      currency: data.currency || 'IDR',
    });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateReporting(form);
      toast.success('Pengaturan laporan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <SectionCard title="Pengaturan Laporan" desc="Konfigurasi pelaporan dan integrasi BPOM." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <ToggleField label="e-Report BPOM" desc="Aktifkan integrasi pelaporan ke BPOM." checked={form.bpom.enableEReport} onChange={() => setForm((p) => ({ ...p, bpom: { ...p.bpom, enableEReport: !p.bpom.enableEReport } }))} />
        {form.bpom.enableEReport && (
          <InputField label="API Key BPOM" value={form.bpom.apiKey} onChange={(e) => setForm((p) => ({ ...p, bpom: { ...p.bpom, apiKey: e.target.value } }))} placeholder="bpom-api-key" />
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Awal Tahun Fiskal</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            value={form.fiscalYearStart}
            onChange={(e) => setForm((p) => ({ ...p, fiscalYearStart: Number(e.target.value) }))}
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <InputField label="Mata Uang" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
      </div>
    </SectionCard>
  );
}

/* ── General ── */
function GeneralTab() {
  const data = useAppSection('general');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    language: 'id',
    maintenanceMode: false,
    sessionTimeoutMinutes: 60,
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm({
      timezone: data.timezone || 'Asia/Jakarta',
      dateFormat: data.dateFormat || 'DD/MM/YYYY',
      language: data.language || 'id',
      maintenanceMode: data.maintenanceMode ?? false,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 60,
    });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.updateGeneral(form);
      toast.success('Pengaturan umum berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Pengaturan Umum" desc="Konfigurasi dasar aplikasi." onSubmit={handleSubmit} loading={loading}>
      <div className="max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
          >
            <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
            <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
            <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Format Tanggal</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            value={form.dateFormat}
            onChange={(e) => setForm((p) => ({ ...p, dateFormat: e.target.value }))}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bahasa</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            value={form.language}
            onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
        <ToggleField label="Mode Maintenance" desc="Aktifkan mode pemeliharaan. Hanya admin yang bisa mengakses." checked={form.maintenanceMode} onChange={() => setForm((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }))} />
        <InputField label="Session Timeout (menit)" type="number" value={form.sessionTimeoutMinutes} onChange={(e) => setForm((p) => ({ ...p, sessionTimeoutMinutes: Number(e.target.value) }))} />
      </div>
    </SectionCard>
  );
}
