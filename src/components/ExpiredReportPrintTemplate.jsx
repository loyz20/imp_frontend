import React from 'react';
import useSettings from '../hooks/useSettings';

const URGENCY_LABELS = {
  expired: 'Kadaluarsa',
  critical: 'Kritis (<=30hr)',
  warning: 'Warning (<=90hr)',
  caution: 'Perhatian (<=180hr)',
  safe: 'Aman',
};

export default function ExpiredReportPrintTemplate({ payload }) {
  const { company } = useSettings();
  if (!payload) return null;

  const rows = payload.rows || [];
  const stats = payload.stats || {};
  const filters = payload.filters || {};
  const addr = company.officeAddress || {};
  const companyAddress = [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page">
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-company-name">{company.name || 'PBF'}</h1>
            <p className="invoice-company-tagline">Laporan Obat Kadaluarsa</p>
            <p className="invoice-company-detail">{companyAddress || '-'}</p>
            <p className="invoice-company-detail">Dicetak: {fmtDateTime(payload.printedAt)}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">LAPORAN EXPIRED</h2>
            <p className="invoice-title-sub">EXPIRY MONITORING</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        <div className="invoice-meta" style={{ marginBottom: '10px' }}>
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Filter Aktif:</p>
            <p className="invoice-meta-value">Tanggal: {fmtDate(filters.dateFrom)} s/d {fmtDate(filters.dateTo)}</p>
            <p className="invoice-meta-value">Status ED: {URGENCY_LABELS[filters.expiryStatus] || 'Semua Status'}</p>
            <p className="invoice-meta-value">Golongan: {filters.golongan || 'Semua Golongan'}</p>
            <p className="invoice-meta-value">Pencarian: {filters.search || '-'}</p>
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr><td className="invoice-meta-td-label">Total Expired</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.totalExpired || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Kritis &lt;=30 Hari</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.critical || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Warning &lt;=90 Hari</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.warning || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Perhatian &lt;=180 Hari</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.caution || 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th invoice-th-no">No</th>
              <th className="invoice-th">Produk</th>
              <th className="invoice-th">Batch</th>
              <th className="invoice-th">Tanggal ED</th>
              <th className="invoice-th invoice-th-qty">Sisa Hari</th>
              <th className="invoice-th invoice-th-qty">Qty</th>
              <th className="invoice-th invoice-th-price">Nilai</th>
              <th className="invoice-th invoice-th-unit">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, idx) => (
              <tr key={row._id || row.id || idx} className="invoice-tr">
                <td className="invoice-td invoice-td-center">{idx + 1}</td>
                <td className="invoice-td">{row.productName || row.name || '-'}</td>
                <td className="invoice-td">{row.batchNumber || '-'}</td>
                <td className="invoice-td">{fmtDate(row.expiryDate)}</td>
                <td className="invoice-td invoice-td-right">{fmtNumber(row.daysRemaining ?? 0)}</td>
                <td className="invoice-td invoice-td-right">{fmtNumber(row.qty ?? 0)}</td>
                <td className="invoice-td invoice-td-right">{fmtCurrency(row.value ?? 0)}</td>
                <td className="invoice-td invoice-td-center">{URGENCY_LABELS[row.expiryStatus] || row.expiryStatus || '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="invoice-td invoice-td-center" style={{ padding: '14px' }}>Tidak ada data untuk dicetak</td></tr>
            )}
          </tbody>
        </table>

        <div className="invoice-footer" style={{ marginTop: '10px' }}>
          <p>Dokumen ini dihasilkan otomatis oleh sistem laporan.</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(v) {
  if (v == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtNumber(v) {
  return new Intl.NumberFormat('id-ID').format(v || 0);
}
