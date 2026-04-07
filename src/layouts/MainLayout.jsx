import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SessionTimeout from '../components/SessionTimeout';
import useNotificationStore from '../store/notificationStore';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // On mobile, sidebar starts collapsed
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mq.matches) setSidebarCollapsed(true);

    const handler = (e) => {
      if (e.matches) setSidebarCollapsed(true);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  // Seed demo notifications on first load
  const addNotification = useNotificationStore((s) => s.addNotification);
  useEffect(() => {
    const seeded = sessionStorage.getItem('notif_seeded');
    if (!seeded) {
      addNotification({ title: 'Selamat datang!', message: 'Anda berhasil login ke aplikasi.', type: 'success' });
      addNotification({ title: 'Update sistem', message: 'Versi terbaru telah tersedia, silakan refresh.', type: 'info' });
      addNotification({ title: 'Perhatian keamanan', message: 'Password Anda belum diubah selama 90 hari.', type: 'warning' });
      sessionStorage.setItem('notif_seeded', '1');
    }
  }, [addNotification]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session timeout berdasarkan settings */}
      <SessionTimeout />

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content area — shifts right based on sidebar width */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Topbar */}
        <Topbar onMenuToggle={toggleSidebar} />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
