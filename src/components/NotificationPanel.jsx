import React, { useRef, useEffect } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, Bell, X } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

/* ── Notification type config ── */
const typeStyles = {
  info: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    icon: <Info className="w-4 h-4 text-blue-600" strokeWidth={2} />,
  },
  success: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />,
  },
  warning: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2} />,
  },
  error: {
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    icon: <XCircle className="w-4 h-4 text-red-600" strokeWidth={2} />,
  },
};

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function NotificationPanel() {
  const { notifications, isOpen, closePanel, markAsRead, markAllAsRead, removeNotification, clearAll, unreadCount } =
    useNotificationStore();
  const panelRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') closePanel();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-128 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Tandai semua dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
            >
              Hapus semua
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="w-12 h-12 text-gray-300 mb-3" strokeWidth={1.2} />
            <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => {
              const style = typeStyles[notif.type] || typeStyles.info;
              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-indigo-50/30' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center mt-0.5`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    {notif.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <span className={`shrink-0 w-2 h-2 rounded-full ${style.dot} mt-2`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3">
          <button className="w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Lihat semua notifikasi
          </button>
        </div>
      )}
    </div>
  );
}
