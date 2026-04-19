import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Database, ArrowLeftRight, Archive, BarChart3,
  ShieldCheck, Settings, Users, ChevronDown, ChevronLeft, Building2, Wallet,
} from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import env from '../config/env';

/* -- Icon components (lucide-react for PBF domain) -- */

const Icons = {
  dashboard: <LayoutDashboard className="w-5 h-5" strokeWidth={1.8} />,
  masterData: <Database className="w-5 h-5" strokeWidth={1.8} />,
  transaction: <ArrowLeftRight className="w-5 h-5" strokeWidth={1.8} />,
  inventory: <Archive className="w-5 h-5" strokeWidth={1.8} />,
  report: <BarChart3 className="w-5 h-5" strokeWidth={1.8} />,
  finance: <Wallet className="w-5 h-5" strokeWidth={1.8} />,
  regulation: <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />,
  settings: <Settings className="w-5 h-5" strokeWidth={1.8} />,
  users: <Users className="w-5 h-5" strokeWidth={1.8} />,
  chevronDown: <ChevronDown className="w-4 h-4" strokeWidth={2} />,
  chevronLeft: <ChevronLeft className="w-5 h-5" strokeWidth={2} />,
  logo: (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M14 8h4v16h-4z" fill="white" opacity="0.95" />
      <path d="M8 14h16v4H8z" fill="white" opacity="0.95" />
    </svg>
  ),
};

/* -- Navigation config (PBF / Pedagang Besar Farmasi) -- */

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Icons.dashboard },
  {
    name: 'Master Data',
    icon: Icons.masterData,
    children: [
      { name: 'Produk / Obat', href: '/master/produk' },
      { name: 'Supplier', href: '/master/supplier' },
      { name: 'Pelanggan', href: '/master/pelanggan' },
    ],
  },
  {
    name: 'Transaksi',
    icon: Icons.transaction,
    children: [
      { name: 'Pembelian', href: '/transaksi/pembelian' },
      { name: 'Penerimaan Barang', href: '/transaksi/penerimaan' },
      { name: 'Penjualan', href: '/transaksi/penjualan' },
      { name: 'Retur', href: '/transaksi/retur' },
    ],
  },
  {
    name: 'Inventori',
    icon: Icons.inventory,
    children: [
      { name: 'Stok Gudang', href: '/inventori/stok' },
      { name: 'Mutasi Stok', href: '/inventori/mutasi' },
      { name: 'Stok Opname', href: '/inventori/opname' },
      { name: 'Kartu Stok', href: '/inventori/kartu' },
      { name: 'Expired / ED', href: '/inventori/expired' },
    ],
  },
  {
    name: 'Keuangan',
    icon: Icons.finance,
    children: [
      { name: 'General Ledger', href: '/keuangan/ledger?tab=accounts' },
      { name: 'Kas & Bank', href: '/keuangan/rekonsiliasi' },
      { name: 'Hutang (AP)', href: '/keuangan/hutang' },
      { name: 'Piutang (AR)', href: '/keuangan/piutang' },
      { name: 'Laporan Keuangan', href: '/laporan/keuangan' },
    ],
  },
  {
    name: 'Laporan',
    icon: Icons.report,
    children: [
      { name: 'Laporan Penjualan', href: '/laporan/penjualan' },
      { name: 'Laporan Pembelian', href: '/laporan/pembelian' },
      { name: 'Laporan Stok', href: '/laporan/stok' },
      { name: 'Obat Kadaluarsa', href: '/laporan/expired' },
    ],
  },
  {
    name: 'Regulasi',
    icon: Icons.regulation,
    children: [
      { name: 'Surat Pesanan', href: '/regulasi/surat-pesanan' },
      { name: 'e-Report BPOM', href: '/regulasi/e-report' },
      { name: 'Dokumen Perizinan', href: '/regulasi/perizinan' },
    ],
  },
  { name: 'Manajemen User', href: '/users', icon: Icons.users },
  { name: 'Pengaturan', href: '/settings', icon: Icons.settings },
];

/* -- Sidebar component -- */

export default function Sidebar({ collapsed, onToggle }) {
  const [openMenus, setOpenMenus] = useState({});
  const [logoLoadError, setLogoLoadError] = useState(false);
  const location = useLocation();
  const settings = useSettingsStore((s) => s.settings);
  const companyName = settings?.company?.name || 'PT. IKO Farma';
  const companyLogo = settings?.company?.logo || null;
  const companyPhone = settings?.company?.phone || null;
  const companyEmail = settings?.company?.email || null;
  const hasCdob = settings?.company?.licenses?.cdob?.number;

  const toggleMenu = (name) => {
    if (collapsed) {
      onToggle();
      setOpenMenus({ [name]: true });
    } else {
      setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    }
  };

  const isChildActive = (children) =>
    children?.some((child) => location.pathname.startsWith(child.href.split('?')[0]));

  const isChildLinkActive = (href) => {
    const [path, query] = href.split('?');
    if (!location.pathname.startsWith(path)) return false;
    if (!query) return true;
    const targetParams = new URLSearchParams(query);
    const currentParams = new URLSearchParams(location.search);
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  const normalizeCompanyLogoSrc = (rawLogo) => {
    if (!rawLogo) return null;
    if (rawLogo.startsWith('data:') || rawLogo.startsWith('blob:')) return rawLogo;
    if (/^(https?:)?\/\//i.test(rawLogo)) return rawLogo;

    const apiOrigin = new URL(env.API_BASE_URL).origin;
    if (rawLogo.startsWith('/uploads/')) return `${apiOrigin}${rawLogo}`;
    if (rawLogo.startsWith('uploads/')) return `${apiOrigin}/${rawLogo}`;
    return rawLogo;
  };

  const companyLogoSrc = logoLoadError ? null : normalizeCompanyLogoSrc(companyLogo);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-72 translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-emerald-600">{Icons.logo}</span>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                  SI-PBF
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">
                  Pedagang Besar Farmasi
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
              {Icons.chevronLeft}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isOpen = openMenus[item.name] || isChildActive(item.children);
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-colors duration-150
                      ${isChildActive(item.children)
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          {Icons.chevronDown}
                        </span>
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="mt-1 ml-6 pl-4 border-l-2 border-gray-100 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                            isChildLinkActive(child.href)
                              ? 'text-emerald-700 bg-emerald-50 font-medium'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}


                </div>
              );
            }

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer - Company Info */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50">
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt={companyName}
                  className="w-9 h-9 rounded-lg object-contain bg-white border border-emerald-100 shrink-0"
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-5 h-5" strokeWidth={1.8} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{companyName}</p>
                <p className="text-[10px] text-gray-500 truncate">{hasCdob ? 'CDOB Certified' : 'PBF'}</p>
                {companyPhone && <p className="text-[10px] text-gray-400 truncate">{companyPhone}</p>}
                {companyEmail && <p className="text-[10px] text-gray-400 truncate">{companyEmail}</p>}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
