import useSettingsStore from '../store/settingsStore';
import { DEFAULT_SETTINGS } from '../constants/settings';

/* ──────────────────────────────────────
   Date & Time Formatting
   ────────────────────────────────────── */

/**
 * Format tanggal berdasarkan settings aplikasi.
 * @param {string|Date} date - Tanggal yang akan diformat
 * @param {object}      opts
 * @param {string}      opts.format   - Override format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * @param {string}      opts.timezone - Override timezone (IANA)
 * @param {boolean}     opts.withTime - Sertakan jam
 */
export function formatDate(date, opts = {}) {
  if (!date) return '-';

  const settings = useSettingsStore.getState().settings;
  const general = settings?.general ?? DEFAULT_SETTINGS.general;

  const fmt = opts.format ?? general.dateFormat ?? 'DD/MM/YYYY';
  const tz = opts.timezone ?? general.timezone ?? 'Asia/Jakarta';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  // Konversi ke timezone yang sesuai
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(opts.withTime && { hour: '2-digit', minute: '2-digit', hour12: false }),
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');

  let result;
  switch (fmt) {
    case 'MM/DD/YYYY':
      result = `${month}/${day}/${year}`;
      break;
    case 'YYYY-MM-DD':
      result = `${year}-${month}-${day}`;
      break;
    default: // DD/MM/YYYY
      result = `${day}/${month}/${year}`;
  }

  if (opts.withTime && hour) {
    result += ` ${hour}:${minute}`;
  }

  return result;
}

/**
 * Format tanggal relatif (contoh: "2 jam lalu", "3 hari lagi").
 */
export function formatRelativeDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari lagi`;
  if (diffDays < -1 && diffDays >= -30) return `${Math.abs(diffDays)} hari lalu`;
  if (diffDays > 30) return `${Math.round(diffDays / 30)} bulan lagi`;
  return `${Math.round(Math.abs(diffDays) / 30)} bulan lalu`;
}

/**
 * Hitung selisih hari antara tanggal dan hari ini.
 * Positif = di masa depan, Negatif = sudah lewat.
 */
export function daysUntil(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

/* ──────────────────────────────────────
   Currency & Number Formatting
   ────────────────────────────────────── */

/**
 * Format angka ke mata uang berdasarkan settings.
 * @param {number} amount  - Jumlah yang akan diformat
 * @param {object} opts
 * @param {string} opts.currency - Override kode mata uang (default dari settings)
 */
export function formatCurrency(amount, opts = {}) {
  if (amount == null || isNaN(amount)) return '-';

  const settings = useSettingsStore.getState().settings;
  const currency = opts.currency ?? settings?.reporting?.currency ?? 'IDR';

  const locale = currency === 'IDR' ? 'id-ID' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(amount);
}

/**
 * Format angka dengan separator ribuan.
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

/* ──────────────────────────────────────
   PPN (Tax) Helpers
   ────────────────────────────────────── */

/**
 * Hitung PPN dari amount berdasarkan settings.
 * Return 0 jika perusahaan bukan PKP.
 */
export function calculatePpn(amount) {
  const settings = useSettingsStore.getState().settings;
  const tax = settings?.company?.tax ?? DEFAULT_SETTINGS.company.tax;
  if (!tax.isPkp) return 0;
  return Math.round((amount * (tax.defaultPpnRate ?? 11)) / 100);
}

/**
 * Hitung total + PPN.
 */
export function calculateWithPpn(amount) {
  const ppn = calculatePpn(amount);
  return { subtotal: amount, ppn, total: amount + ppn };
}

/* ──────────────────────────────────────
   Document Number Helpers
   ────────────────────────────────────── */

/**
 * Generate format preview nomor dokumen berdasarkan settings.
 * (Preview saja, bukan nomor resmi — gunakan API untuk generate nomor resmi)
 */
export function getDocNumberPreview(type) {
  const settings = useSettingsStore.getState().settings;
  const section = settings?.[type] ?? DEFAULT_SETTINGS[type];
  const prefix = section?.prefix ?? '???';
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}/${period}/XXXXXX`;
}

/* ──────────────────────────────────────
   License Expiry Helpers
   ────────────────────────────────────── */

/**
 * Cek status lisensi: 'valid' | 'expiring_soon' | 'expired'
 * @param {string|Date} expiryDate
 * @param {number}      warnDays - Threshold hari peringatan (default: 30)
 */
export function getLicenseStatus(expiryDate, warnDays = 30) {
  if (!expiryDate) return 'unknown';
  const days = daysUntil(expiryDate);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= warnDays) return 'expiring_soon';
  return 'valid';
}

/**
 * Cek apakah retur masih dalam batas waktu.
 * @param {string|Date} transactionDate - Tanggal transaksi asli
 */
export function isReturnAllowed(transactionDate) {
  if (!transactionDate) return false;
  const settings = useSettingsStore.getState().settings;
  const maxDays = settings?.returnOrder?.maxReturnDays ?? DEFAULT_SETTINGS.returnOrder.maxReturnDays;
  const days = daysUntil(transactionDate);
  if (days === null) return false;
  return Math.abs(days) <= maxDays;
}

/**
 * Hitung tanggal jatuh tempo invoice.
 * @param {string|Date} invoiceDate - Tanggal invoice
 */
export function getPaymentDueDate(invoiceDate) {
  if (!invoiceDate) return null;
  const settings = useSettingsStore.getState().settings;
  const days = settings?.invoice?.defaultPaymentTermDays ?? DEFAULT_SETTINGS.invoice.defaultPaymentTermDays;
  const d = new Date(invoiceDate);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Hitung denda keterlambatan pembayaran.
 * @param {number}      amount   - Jumlah tagihan
 * @param {number}      daysLate - Jumlah hari terlambat
 */
export function calculateLatePenalty(amount, daysLate) {
  if (!amount || daysLate <= 0) return 0;
  const settings = useSettingsStore.getState().settings;
  const monthlyRate = settings?.payment?.latePenaltyRate ?? DEFAULT_SETTINGS.payment.latePenaltyRate;
  // Hitung per bulan (30 hari)
  const months = Math.ceil(daysLate / 30);
  return Math.round(amount * (monthlyRate / 100) * months);
}
