import React from 'react';
import useSettings from '../hooks/useSettings';

export default function PurchaseOrderPrintTemplate({ order }) {
  const { company, tax } = useSettings();

  if (!order) return null;

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

  const supplier = order.supplier || order.supplierId || {};
  const supplierAddressObj = supplier.address || {};
  const supplierAddress = [
    supplierAddressObj.street,
    supplierAddressObj.city,
    supplierAddressObj.province,
    supplierAddressObj.postalCode,
  ].filter(Boolean).join(', ');

  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const itemSubtotal = qty * unitPrice;
    return sum + (itemSubtotal - (itemSubtotal * discount / 100));
  }, 0);

  const totalAmount = Number(order.totalAmount) || subtotal;

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page">
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-company-name">{co.name}</h1>
            <p className="invoice-company-tagline">{co.tagline}</p>
            <p className="invoice-company-detail">{co.address}</p>
            <p className="invoice-company-detail">Telp: {co.phone} · Email: {co.email}</p>
            <p className="invoice-company-detail">NPWP: {co.npwp}</p>
          </div>
          <div className="invoice-header-right">
            <h2 className="invoice-title">PURCHASE ORDER</h2>
            <p className="invoice-title-sub">SURAT PESANAN PEMBELIAN</p>
          </div>
        </div>

        <div className="invoice-divider-bold" />

        <div className="invoice-meta">
          <div className="invoice-meta-left">
            <p className="invoice-meta-label">Kepada Yth:</p>
            <p className="invoice-meta-value font-semibold">{supplier.name || '-'}</p>
            {supplierAddress && <p className="invoice-meta-value">{supplierAddress}</p>}
            {supplier.phone && <p className="invoice-meta-value">Telp: {supplier.phone}</p>}
            {supplier.picName && <p className="invoice-meta-value">PIC: {supplier.picName}</p>}
          </div>
          <div className="invoice-meta-right">
            <table className="invoice-meta-table">
              <tbody>
                <tr>
                  <td className="invoice-meta-td-label">No. PO</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value font-semibold">{order.poNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Tanggal PO</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtDate(order.orderDate)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Estimasi Kirim</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{fmtDate(order.expectedDeliveryDate)}</td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Term Bayar</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">
                    {Number(order.paymentTermDays) === 0 ? 'COD' : `Net ${order.paymentTermDays || 30} hari`}
                  </td>
                </tr>
                <tr>
                  <td className="invoice-meta-td-label">Status</td>
                  <td className="invoice-meta-td-sep">:</td>
                  <td className="invoice-meta-td-value">{formatStatus(order.status)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-th invoice-th-no">No</th>
              <th className="invoice-th invoice-th-product">Nama Produk</th>
              <th className="invoice-th invoice-th-unit">Satuan</th>
              <th className="invoice-th invoice-th-qty">Qty</th>
              <th className="invoice-th invoice-th-price">Harga Satuan</th>
              <th className="invoice-th invoice-th-qty">Disc %</th>
              <th className="invoice-th invoice-th-subtotal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, i) => {
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const discount = Number(item.discount) || 0;
              const itemSubtotal = qty * unitPrice;
              const itemTotal = itemSubtotal - (itemSubtotal * discount / 100);
              return (
                <tr key={i} className="invoice-tr">
                  <td className="invoice-td invoice-td-center">{i + 1}</td>
                  <td className="invoice-td">{item.product?.name || item.productId?.name || item.productName || '-'}</td>
                  <td className="invoice-td invoice-td-center">{item.satuan || 'pcs'}</td>
                  <td className="invoice-td invoice-td-right">{qty}</td>
                  <td className="invoice-td invoice-td-right">{fmtCurrency(unitPrice)}</td>
                  <td className="invoice-td invoice-td-right">{discount > 0 ? `${discount}%` : '-'}</td>
                  <td className="invoice-td invoice-td-right">{fmtCurrency(itemTotal)}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="invoice-td invoice-td-center" style={{ padding: '16px' }}>
                  Tidak ada item
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="invoice-totals-row">
          <div className="invoice-totals-note">
            <p className="invoice-note-label">Terbilang:</p>
            <p className="invoice-note-value"><em>{terbilang(totalAmount)} Rupiah</em></p>
          </div>
          <table className="invoice-totals-table">
            <tbody>
              <tr className="invoice-totals-grand">
                <td className="invoice-totals-label font-bold">TOTAL PO</td>
                <td className="invoice-totals-value font-bold">{fmtCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {order.notes && (
          <div className="invoice-payment-info">
            <p className="invoice-payment-title">Catatan PO:</p>
            <p className="invoice-payment-detail">{order.notes}</p>
          </div>
        )}

        <div className="invoice-signatures">
          <div className="invoice-sig-box">
            <p className="invoice-sig-title">Dibuat oleh,</p>
            <div className="invoice-sig-space" />
            <p className="invoice-sig-line" />
            <p className="invoice-sig-role">Purchasing</p>
          </div>
          <div className="invoice-sig-box">
            <p className="invoice-sig-title">Disetujui oleh,</p>
            <div className="invoice-sig-space" />
            <p className="invoice-sig-line" />
            <p className="invoice-sig-role">Manajer / Apoteker</p>
          </div>
          <div className="invoice-sig-box">
            <p className="invoice-sig-title">Diterima supplier,</p>
            <div className="invoice-sig-space" />
            <p className="invoice-sig-line" />
            <p className="invoice-sig-role">Supplier</p>
          </div>
        </div>

        <div className="invoice-footer">
          <p>Dokumen ini sah dan diproses secara elektronik.</p>
          <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}

function fmtCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatStatus(status) {
  const map = {
    draft: 'Draft',
    pending_approval: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    sent: 'Dikirim ke Supplier',
    partial_received: 'Diterima Sebagian',
    received: 'Diterima Lengkap',
    cancelled: 'Dibatalkan',
  };
  return map[status] || status || '-';
}

function terbilang(n) {
  if (n == null || n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  const convert = (num) => {
    if (num < 12) return satuan[num];
    if (num < 20) return satuan[num - 10] + ' Belas';
    if (num < 100) return satuan[Math.floor(num / 10)] + ' Puluh' + (num % 10 > 0 ? ` ${satuan[num % 10]}` : '');
    if (num < 200) return 'Seratus' + (num - 100 > 0 ? ` ${convert(num - 100)}` : '');
    if (num < 1000) return satuan[Math.floor(num / 100)] + ' Ratus' + (num % 100 > 0 ? ` ${convert(num % 100)}` : '');
    if (num < 2000) return 'Seribu' + (num - 1000 > 0 ? ` ${convert(num - 1000)}` : '');
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 > 0 ? ` ${convert(num % 1000)}` : '');
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 > 0 ? ` ${convert(num % 1000000)}` : '');
    if (num < 1000000000000) return convert(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 > 0 ? ` ${convert(num % 1000000000)}` : '');
    return convert(Math.floor(num / 1000000000000)) + ' Triliun' + (num % 1000000000000 > 0 ? ` ${convert(num % 1000000000000)}` : '');
  };

  return convert(Math.floor(Math.abs(n)));
}
