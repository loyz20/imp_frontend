import useAuth from '../hooks/useAuth';
import useSettingsStore from '../store/settingsStore';

/**
 * MaintenanceGuard — tampilkan halaman maintenance jika
 * settings general.maintenanceMode = true dan user bukan admin/superadmin.
 */
export default function MaintenanceGuard({ children }) {
  const { user } = useAuth();
  const settings = useSettingsStore((s) => s.settings);

  const isMaintenanceMode = settings?.general?.maintenanceMode === true;
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  // Admin/superadmin bisa tetap akses saat maintenance
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-1.2-7.19a1 1 0 011.98-.33l.3 1.76 2.12-2.12a1 1 0 011.41 1.41l-2.12 2.12 1.76.3a1 1 0 01-.33 1.98l-7.19-1.2a1 1 0 01-.82-.82z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12A9.75 9.75 0 1112 2.25 9.75 9.75 0 0121.75 12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sedang Dalam Pemeliharaan</h1>
          <p className="text-gray-500 mb-6">
            Sistem sedang dalam proses pemeliharaan untuk meningkatkan layanan. 
            Silakan coba lagi dalam beberapa saat.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Kami akan segera kembali
          </div>
        </div>
      </div>
    );
  }

  return children;
}
