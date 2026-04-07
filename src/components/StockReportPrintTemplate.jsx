import React from 'react';
import useSettings from '../hooks/useSettings';

const STATUS_LABELS = {
  in_stock: 'Tersedia',
  low_stock: 'Stok Rendah',
  out_of_stock: 'Habis',
};

export default function StockReportPrintTemplate({ payload }) {
  const { company } = useSettings();

  if (!payload) return null;

  const addr = company.officeAddress || {};
  const companyAddress = [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');
  const rows = payload.rows || [];
  const stats = payload.stats || {};
  const filters = payload.filters || {};

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page">
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-company-name">{company.name || 'PBF'}</h1>
            <p className="invoice-company-tagline">Laporan Persediaan Barang</p>
            <p className="invoice-company-detail">{companyAddress || '-'}</p>
            <p className="invoice-company-detail">Dicetak: {fmtDateTime(payload.printedAt)}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">LAPORAN STOK</h2>
            <p className="invoice-title-sub">STOCK REPORT</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        <div className="invoice-meta" style={{ marginBottom: '10px' }}>
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Filter Aktif:</p>
            <p className="invoice-meta-value">Periode: {fmtDate(filters.dateFrom)} s/d {fmtDate(filters.dateTo)}</p>
            <p className="invoice-meta-value">Kategori: {filters.kategori || 'Semua Kategori'}</p>
            <p className="invoice-meta-value">Status: {STATUS_LABELS[filters.stockStatus] || 'Semua Status'}</p>
            <p className="invoice-meta-value">Pencarian: {filters.search || '-'}</p>
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="invoice-meta-td-label">Total SKU</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtNumber(stats.totalSku || 0)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Total Qty</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtNumber(stats.totalQty || 0)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Near Expiry</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtNumber(stats.nearExpiry || 0)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Out of Stock</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtNumber(stats.outOfStock || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th invoice-th-no">No</th>
              <th className="invoice-th">Kode</th>
              <th className="invoice-th">Nama Produk</th>
              <th className="invoice-th">Kategori</th>
              <th className="invoice-th invoice-th-qty">Stok</th>
              <th className="invoice-th invoice-th-price">Nilai Stok</th>
              <th className="invoice-th invoice-th-unit">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, idx) => (
              <tr key={row._id || row.id || `${row.code || row.sku}-${idx}`} className="invoice-tr">
                <td className="invoice-td invoice-td-center">{idx + 1}</td>
                <td className="invoice-td">{row.code || row.sku || '-'}</td>
                <td className="invoice-td">{row.name || '-'}</td>
                <td className="invoice-td">{row.kategori || '-'}</td>
                <td className="invoice-td invoice-td-right">{fmtNumber(row.totalStock ?? row.stock ?? 0)}</td>
                <td className="invoice-td invoice-td-right">{fmtCurrency(row.stockValue ?? 0)}</td>
                <td className="invoice-td invoice-td-center">{STATUS_LABELS[row.stockStatus] || row.stockStatus || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="invoice-td invoice-td-center" style={{ padding: '14px' }}>
                  Tidak ada data untuk dicetak
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="invoice-footer" style={{ marginTop: '10px' }}>
          <p>Dokumen ini dihasilkan oleh sistem laporan secara otomatis.</p>
          <p>Halaman ini menampilkan data sesuai filter aktif dan halaman tabel yang sedang dibuka.</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtCurrency(v) {
  if (v == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtNumber(v) {
  return new Intl.NumberFormat('id-ID').format(v || 0);
}
