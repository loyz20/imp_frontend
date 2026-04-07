import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Search, X } from 'lucide-react';

/**
 * Reusable autocomplete input with debounced API search.
 *
 * Props:
 *  - value          : display text (controlled)
 *  - onChange        : (displayText) => void — called on every keystroke
 *  - onSelect       : (item) => void — called when user picks from dropdown
 *  - onClear        : () => void — called when user clears selection
 *  - fetchFn        : (params) => Promise<{ data: { data: items[] } }> — API call
 *  - renderItem     : (item) => ReactNode — custom row renderer
 *  - getDisplayText : (item) => string — extract display text from item
 *  - placeholder    : string
 *  - disabled       : boolean
 *  - className      : string — extra classes for container
 *  - inputClassName : string — extra classes for <input>
 *  - debounceMs     : number (default 300)
 *  - minChars       : number (default 2)
 *  - searchParams   : object — extra params merged into fetch call
 */
export default function AutocompleteInput({
  value = '',
  onChange,
  onSelect,
  onClear,
  fetchFn,
  renderItem,
  getDisplayText,
  placeholder = 'Ketik untuk mencari...',
  disabled = false,
  className = '',
  inputClassName = '',
  debounceMs = 300,
  minChars = 2,
  searchParams = {},
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(
    async (query) => {
      if (!query || query.length < minChars) {
        setItems([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchFn({ search: query, limit: 10, ...searchParams });
        const list = res?.data?.data || res?.data || [];
        setItems(Array.isArray(list) ? list : []);
        setOpen(true);
        setHighlightIdx(-1);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, minChars, searchParams],
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange?.(text);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(text), debounceMs);
  };

  const handleSelect = (item) => {
    onChange?.(getDisplayText(item));
    onSelect?.(item);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.('');
    onClear?.();
    setItems([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((p) => (p < items.length - 1 ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((p) => (p > 0 ? p - 1 : items.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(items[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if (items.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${inputClassName}`}
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && items.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {items.map((item, idx) => (
            <button
              key={item._id || idx}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                idx === highlightIdx
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:bg-gray-50 text-gray-700'
              } ${idx > 0 ? 'border-t border-gray-100' : ''}`}
            >
              {renderItem ? renderItem(item) : getDisplayText(item)}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && items.length === 0 && !loading && value.length >= minChars && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
          Tidak ada hasil untuk &ldquo;{value}&rdquo;
        </div>
      )}
    </div>
  );
}
