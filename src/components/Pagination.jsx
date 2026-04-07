import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LIMIT_OPTIONS = [10, 25, 50, 100];

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/**
 * Reusable pagination component.
 *
 * @param {object}   pagination        – { page, limit, totalDocs, totalPages, hasPrevPage, hasNextPage }
 * @param {function} onPageChange      – (page: number) => void
 * @param {function} [onLimitChange]   – (limit: number) => void  (shows rows-per-page selector when provided)
 * @param {string}   [label]           – item label, e.g. "produk", "supplier" (default "data")
 */
export default function Pagination({ pagination, onPageChange, onLimitChange, label = 'data' }) {
  if (!pagination || pagination.totalPages <= 0) return null;

  const { page, limit, totalDocs, totalPages, hasPrevPage, hasNextPage } = pagination;
  const start = ((page - 1) * limit) + 1;
  const end = Math.min(page * limit, totalDocs);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
      {/* Left: info + rows-per-page */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-gray-500">
          Menampilkan {start}–{end} dari {totalDocs} {label}
        </p>
        {onLimitChange && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>baris</span>
          </div>
        )}
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {generatePageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
