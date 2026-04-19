import React from 'react';
import useSettings from '../hooks/useSettings';

const STATUS_LABELS = {
  packed: 'Dikemas',
  partial_delivered: 'Terkirim Sebagian',
  delivered: 'Terkirim',
  awaiting_payment: 'Menunggu Pembayaran',
  paid: 'Lunas',
  returned: 'Diretur',
  canceled: 'Dibatalkan',
  cancelled: 'Dibatalkan',
};

export default function SalesReportPrintTemplate({ payload }) {
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
            <p className="invoice-company-tagline">Laporan Penjualan</p>
            <p className="invoice-company-detail">{companyAddress || '-'}</p>
            <p className="invoice-company-detail">Dicetak: {fmtDateTime(payload.printedAt)}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">LAPORAN PENJUALAN</h2>
            <p className="invoice-title-sub">SALES REPORT</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        <div className="invoice-meta" style={{ marginBottom: '10px' }}>
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Filter Aktif:</p>
            <p className="invoice-meta-value">Periode: {filters.period || '-'}</p>
            <p className="invoice-meta-value">Tanggal: {fmtDate(filters.dateFrom)} s/d {fmtDate(filters.dateTo)}</p>
            <p className="invoice-meta-value">Status: {formatSOStatusLabel(filters.status, 'Semua Status')}</p>
            <p className="invoice-meta-value">Pencarian: {filters.search || '-'}</p>
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr><td className="invoice-meta-td-label">Total Penjualan</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtCurrency(stats.totalValue || stats.totalSales || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Jumlah SO</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.total || stats.totalOrders || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Rata-rata SO</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtCurrency(stats.averageOrderValue || stats.avgOrderValue || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">SO Terkirim</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtNumber(stats.delivered || stats.completedThisMonth || 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th invoice-th-no">No</th>
              <th className="invoice-th">No. Surat Jalan</th>
              <th className="invoice-th">Pelanggan</th>
              <th className="invoice-th">Tanggal</th>
              <th className="invoice-th invoice-th-price">Total</th>
              <th className="invoice-th invoice-th-unit">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, idx) => (
              <tr key={row._id || row.id || idx} className="invoice-tr">
                <td className="invoice-td invoice-td-center">{idx + 1}</td>
                <td className="invoice-td">{row.deliveryNumber || row.invoiceNumber || row.soNumber || '-'}</td>
                <td className="invoice-td">{row.customer?.name || '-'}</td>
                <td className="invoice-td">{fmtDate(row.orderDate || row.createdAt)}</td>
                <td className="invoice-td invoice-td-right">{fmtCurrency(row.totalAmount || 0)}</td>
                <td className="invoice-td invoice-td-center">{formatSOStatusLabel(row.status)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="invoice-td invoice-td-center" style={{ padding: '14px' }}>Tidak ada data untuk dicetak</td></tr>
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

function normalizeSOStatus(status) {
  const normalized = String(status || '').toLowerCase();
  const map = {
    draft: 'packed',
    confirmed: 'packed',
    processing: 'packed',
    ready_to_ship: 'packed',
    partial_delivery: 'partial_delivered',
    partial_shipped: 'partial_delivered',
    invoiced: 'awaiting_payment',
    waiting_payment: 'awaiting_payment',
    pending_payment: 'awaiting_payment',
    awaiting_payment: 'awaiting_payment',
    shipped: 'delivered',
    paid: 'paid',
    completed: 'delivered',
    cancelled: 'canceled',
  };
  return map[normalized] || normalized || '';
}

function formatSOStatusLabel(status, emptyLabel = '-') {
  if (!status) return emptyLabel;
  const normalized = normalizeSOStatus(status);
  return STATUS_LABELS[normalized] || normalized || emptyLabel;
}
