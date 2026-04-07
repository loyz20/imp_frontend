import React from 'react';
import useSettings from '../hooks/useSettings';

export default function FinanceReportPrintTemplate({ payload }) {
  const { company } = useSettings();
  if (!payload) return null;

  const stats = payload.stats || {};
  const data = payload.data || {};
  const pl = data.profitLoss || {};
  const cash = data.cashFlow || {};
  const filters = payload.filters || {};

  const addr = company.officeAddress || {};
  const companyAddress = [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page">
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-company-name">{company.name || 'PBF'}</h1>
            <p className="invoice-company-tagline">Laporan Keuangan</p>
            <p className="invoice-company-detail">{companyAddress || '-'}</p>
            <p className="invoice-company-detail">Dicetak: {fmtDateTime(payload.printedAt)}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">LAPORAN KEUANGAN</h2>
            <p className="invoice-title-sub">FINANCIAL REPORT</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        <div className="invoice-meta" style={{ marginBottom: '10px' }}>
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Filter Aktif:</p>
            <p className="invoice-meta-value">Periode: {filters.period || '-'}</p>
            <p className="invoice-meta-value">Tanggal: {fmtDate(filters.dateFrom)} s/d {fmtDate(filters.dateTo)}</p>
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr><td className="invoice-meta-td-label">Total Pendapatan</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtCurrency(stats.totalRevenue || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Total Pengeluaran</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtCurrency(stats.totalExpense || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Laba Bersih</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{fmtCurrency(stats.netProfit || 0)}</td></tr>
                <tr><td className="invoice-meta-td-label">Margin</td><td className="invoice-meta-td-sep">:</td><td className="invoice-meta-td-value">{Number(stats.margin || 0).toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-table" style={{ marginBottom: '10px' }}>
          <thead>
            <tr>
              <th className="invoice-th">Ringkasan Laba Rugi</th>
              <th className="invoice-th invoice-th-price">Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr className="invoice-tr"><td className="invoice-td">Pendapatan Penjualan</td><td className="invoice-td invoice-td-right">{fmtCurrency(pl.salesRevenue || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Diskon dan Retur</td><td className="invoice-td invoice-td-right">-{fmtCurrency(pl.discountReturn || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td"><strong>Pendapatan Bersih</strong></td><td className="invoice-td invoice-td-right"><strong>{fmtCurrency(pl.netRevenue || 0)}</strong></td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Harga Pokok Penjualan (HPP)</td><td className="invoice-td invoice-td-right">-{fmtCurrency(pl.cogs || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td"><strong>Laba Kotor</strong></td><td className="invoice-td invoice-td-right"><strong>{fmtCurrency(pl.grossProfit || 0)}</strong></td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Beban Operasional</td><td className="invoice-td invoice-td-right">-{fmtCurrency(pl.operatingExpense || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Beban Lain-lain</td><td className="invoice-td invoice-td-right">-{fmtCurrency(pl.otherExpense || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td"><strong>Laba Bersih</strong></td><td className="invoice-td invoice-td-right"><strong>{fmtCurrency(pl.netProfit || 0)}</strong></td></tr>
          </tbody>
        </table>

        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th">Ringkasan Arus Kas</th>
              <th className="invoice-th invoice-th-price">Masuk</th>
              <th className="invoice-th invoice-th-price">Keluar</th>
              <th className="invoice-th invoice-th-price">Net</th>
            </tr>
          </thead>
          <tbody>
            <tr className="invoice-tr"><td className="invoice-td">Operasional</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.operatingIn || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.operatingOut || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.operatingNet || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Investasi</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.investingIn || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.investingOut || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.investingNet || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td">Pendanaan</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.financingIn || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.financingOut || 0)}</td><td className="invoice-td invoice-td-right">{fmtCurrency(cash.financingNet || 0)}</td></tr>
            <tr className="invoice-tr"><td className="invoice-td"><strong>Total Arus Kas Bersih</strong></td><td className="invoice-td" /><td className="invoice-td" /><td className="invoice-td invoice-td-right"><strong>{fmtCurrency(cash.totalNet || 0)}</strong></td></tr>
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
