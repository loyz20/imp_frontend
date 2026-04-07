import React from 'react';
import { Download, FileText, Printer, Loader2, Calendar } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
  { value: 'custom', label: 'Kustom' },
];

export default function ReportExportBar({
  period,
  onPeriodChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onExportExcel,
  onExportPdf,
  onPrint,
  isExporting = false,
  showPeriod = true,
  children,
}) {
  const showDateRange = period === 'custom' || !showPeriod;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 print:hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Period selector */}
        {showPeriod && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => onPeriodChange?.(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date range */}
        {(showDateRange || showPeriod) && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom || ''}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={dateTo || ''}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            />
          </div>
        )}

        {/* Extra filters (slot) */}
        {children}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Export Excel"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Excel
          </button>
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Export PDF"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            PDF
          </button>
          <button
            onClick={onPrint || (() => window.print())}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            title="Print"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
