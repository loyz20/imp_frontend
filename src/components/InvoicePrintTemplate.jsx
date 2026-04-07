import React from 'react';
import useSettings from '../hooks/useSettings';

/**
 * Template cetak Invoice / Faktur Penjualan
 * Digunakan oleh InvoiceManagement untuk mencetak invoice via window.print()
 *
 * Props:
 *  - invoice: object data invoice (dari detail API atau list)
 */

export default function InvoicePrintTemplate({ invoice }) {
  const { company, tax, bankAccounts } = useSettings();

  if (!invoice) return null;

  const addr = company.officeAddress || {};
  const companyAddress = [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');
  const co = {
    name: company.name || 'PBF',
    tagline: 'Pedagang Besar Farmasi',
    address: companyAddress || '-',
    phone: company.phone || '-',
    email: company.email || '-',
    npwp: tax.npwp || '-',
  };

  // Bank account utama untuk info pembayaran
  const primaryBank = (bankAccounts || [])[0];

  const items = invoice.items || [];
  const subtotal = invoice.subtotal || invoice.totalAmount || 0;
  const ppnRate = invoice.ppnRate || 11;
  const ppnAmount = invoice.ppnAmount || 0;
  const discount = invoice.discount || 0;
  const totalAmount = invoice.totalAmount || 0;
  const paidAmount = invoice.paidAmount || 0;
  const remaining = invoice.remainingAmount ?? totalAmount;

  const customer = invoice.customer || {};
  const customerName = customer.name || invoice.customerName || '-';
  const customerAddress = customer.address
    ? [customer.address.street, customer.address.city, customer.address.province, customer.address.postalCode].filter(Boolean).join(', ')
    : invoice.customerAddress || '';
  const customerPhone = customer.phone || invoice.customerPhone || '';
  const customerNpwp = customer.npwp || invoice.customerNpwp || '';

  return (
    <div className="invoice-print-template hidden print:block print:!block">
      {/* ─── Page wrapper ─── */}
      <div className="invoice-page">
        {/* ═══ HEADER ═══ */}
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-company-name">{co.name}</h1>
            <p className="invoice-company-tagline">{co.tagline}</p>
            <p className="invoice-company-detail">{co.address}</p>
            <p className="invoice-company-detail">Telp: {co.phone} · Email: {co.email}</p>
            <p className="invoice-company-detail">NPWP: {co.npwp}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">FAKTUR PENJUALAN</h2>
            <p className="invoice-title-sub">INVOICE</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        {/* ═══ META INFO ═══ */}
        <div className="invoice-meta">
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Kepada Yth:</p>
            <p className="invoice-meta-value font-semibold">{customerName}</p>
            {customerAddress && <p className="invoice-meta-value">{customerAddress}</p>}
            {customerPhone && <p className="invoice-meta-value">Telp: {customerPhone}</p>}
            {customerNpwp && <p className="invoice-meta-value">NPWP: {customerNpwp}</p>}
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="invoice-meta-td-label">No. Invoice</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value font-semibold">{invoice.invoiceNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Tanggal</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtDate(invoice.invoiceDate)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Jatuh Tempo</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtDate(invoice.dueDate)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">No. SO</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{invoice.salesOrder?.soNumber || invoice.soNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">No. Surat Jalan</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{invoice.delivery?.deliveryNumber || invoice.deliveryNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Syarat Bayar</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">
                    {invoice.paymentTermDays === 0 ? 'COD' : `Net ${invoice.paymentTermDays || 30} hari`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ ITEM TABLE ═══ */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th invoice-th-no">No</th>
              <th className="invoice-th invoice-th-product">Nama Produk</th>
              <th className="invoice-th invoice-th-batch">Batch</th>
              <th className="invoice-th invoice-th-exp">Exp. Date</th>
              <th className="invoice-th invoice-th-qty">Qty</th>
              <th className="invoice-th invoice-th-unit">Satuan</th>
              <th className="invoice-th invoice-th-price">Harga Satuan</th>
              <th className="invoice-th invoice-th-subtotal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, i) => (
              <tr key={i} className="invoice-tr">
                <td className="invoice-td invoice-td-center">{i + 1}</td>
                <td className="invoice-td">{item.productId?.name || item.productName || item.description || '-'}</td>
                <td className="invoice-td invoice-td-center">{item.batchNumber || '-'}</td>
                <td className="invoice-td invoice-td-center">{item.expiryDate ? fmtDate(item.expiryDate) : '-'}</td>
                <td className="invoice-td invoice-td-right">{item.quantity}</td>
                <td className="invoice-td invoice-td-center">{item.satuan || item.unit || 'pcs'}</td>
                <td className="invoice-td invoice-td-right">{fmtCurrency(item.unitPrice)}</td>
                <td className="invoice-td invoice-td-right">{fmtCurrency(item.subtotal)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="invoice-td invoice-td-center" style={{ padding: '16px' }}>
                  Tidak ada item
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ═══ TOTALS ═══ */}
        <div className="invoice-totals-row">
          <div className="invoice-totals-note">
            <p className="invoice-note-label">Terbilang:</p>
            <p className="invoice-note-value"><em>{terbilang(totalAmount)} Rupiah</em></p>
          </div>
          <table className="invoice-totals-table">
            <tbody>
              <tr>
                <td className="invoice-totals-label">Subtotal</td>
                <td className="invoice-totals-value">{fmtCurrency(subtotal)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="invoice-totals-label">Diskon</td>
                  <td className="invoice-totals-value invoice-text-red">-{fmtCurrency(discount)}</td>
                </tr>
              )}
              {ppnAmount > 0 && (
                <tr>
                  <td className="invoice-totals-label">PPN ({ppnRate}%)</td>
                  <td className="invoice-totals-value">{fmtCurrency(ppnAmount)}</td>
                </tr>
              )}
              <tr className="invoice-totals-grand">
                <td className="invoice-totals-label font-bold">TOTAL</td>
                <td className="invoice-totals-value font-bold">{fmtCurrency(totalAmount)}</td>
              </tr>
              {paidAmount > 0 && (
                <>
                  <tr>
                    <td className="invoice-totals-label">Terbayar</td>
                    <td className="invoice-totals-value" style={{ color: '#059669' }}>{fmtCurrency(paidAmount)}</td>
                  </tr>
                  <tr>
                    <td className="invoice-totals-label font-semibold">Sisa Tagihan</td>
                    <td className="invoice-totals-value font-semibold" style={{ color: '#d97706' }}>{fmtCurrency(remaining)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ PAYMENT INFO ═══ */}
        <div className="invoice-payment-info">
          <p className="invoice-payment-title">Pembayaran dapat ditransfer ke:</p>
          {primaryBank ? (
            <p className="invoice-payment-detail">
              {primaryBank.bankName} · No. Rek: <strong>{primaryBank.accountNumber}</strong> · a/n <strong>{primaryBank.accountName}</strong>
            </p>
          ) : (
            <p className="invoice-payment-detail">
              <em>Info rekening bank belum dikonfigurasi di Pengaturan &gt; Pembayaran</em>
            </p>
          )}
        </div>

        {/* ═══ SIGNATURES ═══ */}
        <div className="invoice-signatures">
          <div className="invoice-sig-box">
            <p className="invoice-sig-title">Diterbitkan oleh,</p>
            <div className="invoice-sig-space" />
            <p className="invoice-sig-line" />
            <p className="invoice-sig-role">Finance / Keuangan</p>
          </div>
          <div className="invoice-sig-box">
            <p className="invoice-sig-title">Diterima oleh,</p>
            <div className="invoice-sig-space" />
            <p className="invoice-sig-line" />
            <p className="invoice-sig-role">Pelanggan</p>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="invoice-footer">
          <p>Dokumen ini sah dan diproses secara elektronik.</p>
          <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function fmtCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Convert number to Indonesian words (terbilang) — simplified
 */
function terbilang(n) {
  if (n == null || n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  const convert = (num) => {
    if (num < 12) return satuan[num];
    if (num < 20) return satuan[num - 10] + ' Belas';
    if (num < 100) return satuan[Math.floor(num / 10)] + ' Puluh' + (num % 10 > 0 ? ' ' + satuan[num % 10] : '');
    if (num < 200) return 'Seratus' + (num - 100 > 0 ? ' ' + convert(num - 100) : '');
    if (num < 1000) return satuan[Math.floor(num / 100)] + ' Ratus' + (num % 100 > 0 ? ' ' + convert(num % 100) : '');
    if (num < 2000) return 'Seribu' + (num - 1000 > 0 ? ' ' + convert(num - 1000) : '');
    if (num < 1_000_000) return convert(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 > 0 ? ' ' + convert(num % 1000) : '');
    if (num < 1_000_000_000) return convert(Math.floor(num / 1_000_000)) + ' Juta' + (num % 1_000_000 > 0 ? ' ' + convert(num % 1_000_000) : '');
    if (num < 1_000_000_000_000) return convert(Math.floor(num / 1_000_000_000)) + ' Miliar' + (num % 1_000_000_000 > 0 ? ' ' + convert(num % 1_000_000_000) : '');
    return convert(Math.floor(num / 1_000_000_000_000)) + ' Triliun' + (num % 1_000_000_000_000 > 0 ? ' ' + convert(num % 1_000_000_000_000) : '');
  };

  return convert(Math.floor(Math.abs(n)));
}
