import React from 'react';
import useSettings from '../hooks/useSettings';

export default function PurchaseOrderPrintTemplate({ order }) {
  const { company } = useSettings();

  if (!order) return null;

  const addr = company.officeAddress || {};
  const addrLine1 = addr.street || '';
  const addrLine2 = [addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');
  const companyAddress = [addrLine1, addrLine2].filter(Boolean).join(', ');
  const licenses = company.licenses || {};
  const legacyPharmacist = company.responsiblePharmacist || {};
  const pharmacistObat = company.responsiblePharmacistObat || company.pharmacistObat || legacyPharmacist;
  const pharmacistAlkes = company.responsiblePharmacistAlkes || company.pharmacistAlkes || legacyPharmacist;

  const co = {
    name: company.name || 'PBF',
    logo: company.logo || null,
    addrLine1,
    addrLine2,
    address: companyAddress || '-',
    phone: company.phone || '-',
    email: company.email || '-',
    pbfLicense: licenses.pbf?.number || '-',
    cdobCertificate: licenses.cdob?.number || '-',
  };

  const supplier = resolveSupplier(order);
  const supplierName = supplier?.name || order.supplierName || '-';
  const supplierAddress = resolveSupplierAddress(order, supplier);

  const items = order.items || [];
  const orderItemType = resolveOrderItemType(order, items);
  const pharmacist = orderItemType === 'alkes' ? pharmacistAlkes : pharmacistObat;
  const showPriceColumns = items.some((item) => (Number(item?.unitPrice) || 0) > 0);
  const minRows = 14;
  const rows = Array.from({ length: Math.max(items.length, minRows) }, (_, i) => items[i] || null);
  const locationDate = `${addr.city || '-'}, ${fmtDate(order.orderDate || new Date())}`;

  const orderSubtotal = Number(order.subtotal) || items.reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const up = Number(item?.unitPrice) || 0;
    const disc = Number(item?.discount) || 0;
    const sub = qty * up;
    return sum + (sub - (sub * disc / 100));
  }, 0);
  const ppnAmount = Number(order.ppnAmount) || 0;
  const ppnRate = Number(order.ppnRate) || 0;
  const grandTotal = Number(order.totalAmount) || (orderSubtotal + ppnAmount);

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page po-letter-page">
        <div className="po-letter-head">
          {co.logo && (
            <img src={co.logo} alt={co.name} className="po-letter-logo-img" />
          )}
          <div className="po-letter-head-info">
            <h1 className="po-letter-company">{co.name}</h1>
            <div className="po-letter-head-row">
              <span>{co.addrLine1}</span>
              <span>Email : {co.email}</span>
            </div>
            <div className="po-letter-head-row">
              <span>{co.addrLine2}</span>
              <span>No Telp : {co.phone}</span>
            </div>
            <p className="po-letter-head-line">Ijin PBF : {co.pbfLicense} &nbsp;&nbsp;&nbsp; Sertifikat CDOB : {co.cdobCertificate}</p>
          </div>
        </div>

        <div className="po-letter-title-wrap">
          <h2 className="po-letter-title">SURAT PESANAN</h2>
          <p className="po-letter-number">Nomor : {order.poNumber || '-'}</p>
        </div>

        <div className="po-letter-recipient">
          <p className="po-letter-line">
            <span className="po-letter-label">Kepada Yth.</span>
            <span className="po-letter-value">{supplierName}</span>
          </p>
          <p className="po-letter-line">
            <span className="po-letter-label">Alamat</span>
            <span className="po-letter-value">{supplierAddress || '-'}</span>
          </p>
        </div>

        <p className="po-letter-open">Dengan ini mengajukan pesanan barang sebagai berikut :</p>

        <table className={`po-letter-table ${showPriceColumns ? 'po-letter-table-pricing' : ''}`}>
          <thead>
            <tr>
              <th className="po-col-no">No</th>
              <th className="po-col-name">Nama Barang</th>
              <th className="po-col-qty">Jumlah</th>
              <th className="po-col-unit">Satuan</th>
              {showPriceColumns && <th className="po-col-price">Harga</th>}
              {showPriceColumns && <th className="po-col-disc">Diskon</th>}
              {showPriceColumns && <th className="po-col-subtotal">Subtotal</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => {
              const qty = Number(item?.quantity) || 0;
              const unitPrice = Number(item?.unitPrice) || 0;
              const discount = Number(item?.discount) || 0;
              const itemSubtotal = qty * unitPrice;
              const itemTotal = itemSubtotal - (itemSubtotal * discount / 100);

              return (
                <tr key={idx}>
                  <td className="po-cell-center">{item ? idx + 1 : ''}</td>
                  <td>{item ? (item.product?.name || item.productId?.name || item.productName || '-') : ''}</td>
                  <td className="po-cell-center">{item ? qty : ''}</td>
                  <td className="po-cell-center">{item ? (item.satuan || item.unit || 'PCS') : ''}</td>
                  {showPriceColumns && <td className="po-cell-right">{item ? (unitPrice > 0 ? fmtCurrency(unitPrice) : '-') : ''}</td>}
                  {showPriceColumns && <td className="po-cell-center">{item ? (discount > 0 ? `${discount}%` : '-') : ''}</td>}
                  {showPriceColumns && <td className="po-cell-right">{item ? (itemTotal > 0 ? fmtCurrency(itemTotal) : '-') : ''}</td>}
                </tr>
              );
            })}
          </tbody>
          {showPriceColumns && (
            <tfoot>
              <tr>
                <td colSpan={6} className="po-cell-foot-label">Total</td>
                <td className="po-cell-right">{fmtCurrency(orderSubtotal)}</td>
              </tr>
              {ppnAmount > 0 && (
                <tr>
                  <td colSpan={6} className="po-cell-foot-label">PPN{ppnRate > 0 ? ` (${ppnRate}%)` : ''}</td>
                  <td className="po-cell-right">{fmtCurrency(ppnAmount)}</td>
                </tr>
              )}
              <tr className="po-row-grand-total">
                <td colSpan={6} className="po-cell-foot-label">Grand Total</td>
                <td className="po-cell-right">{fmtCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        <div className="po-letter-notes">
          <p className="po-letter-notes-title">Catatan :</p>
          <p>{order.notes || '-'}</p>
        </div>

        <div className="po-letter-signature">
          <p>{locationDate}</p>
          <p>{orderItemType === 'alkes' ? 'Penanggung Jawab Alat Kesehatan' : 'Apoteker Penanggung Jawab'}</p>
          <div className="po-letter-sign-space" />
          <p className="po-letter-signer-name">{pharmacist.name || '-'}</p>
          <p>SIPA : {pharmacist.sipaNumber || '-'}</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtCurrency(amount) {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function resolveSupplier(order) {
  if (order?.supplier && typeof order.supplier === 'object') return order.supplier;
  if (order?.supplierId && typeof order.supplierId === 'object') return order.supplierId;
  return null;
}

function resolveSupplierAddress(order, supplier) {
  if (typeof order?.supplierAddress === 'string' && order.supplierAddress.trim()) {
    return order.supplierAddress.trim();
  }

  const rawAddress =
    (supplier?.address && typeof supplier.address === 'object' && supplier.address) ||
    (order?.supplierAddress && typeof order.supplierAddress === 'object' && order.supplierAddress) ||
    {};

  const street =
    rawAddress.street ||
    rawAddress.line1 ||
    rawAddress.addressLine1 ||
    supplier?.street ||
    supplier?.addressLine1 ||
    '';

  const city = rawAddress.city || supplier?.city || '';
  const province = rawAddress.province || supplier?.province || '';
  const postalCode = rawAddress.postalCode || supplier?.postalCode || '';

  return [street, city, province, postalCode].filter(Boolean).join(', ');
}

function resolveOrderItemType(order, items = []) {
  const poCategory = String(order?.poCategory || order?.category || '').toLowerCase();
  if (poCategory.includes('alkes') || poCategory.includes('alat_kesehatan')) return 'alkes';
  if (poCategory.includes('obat')) return 'obat';

  const categories = items
    .map((item) => {
      const product = item?.product || item?.productId || {};
      return String(product?.category || product?.kategori || item?.category || item?.kategori || '').toLowerCase();
    })
    .filter(Boolean);

  const golonganValues = items
    .map((item) => {
      const product = item?.product || item?.productId || {};
      return String(product?.golongan || item?.golongan || '').toLowerCase();
    })
    .filter(Boolean);

  const hasAlkes = categories.some((c) => c.includes('alkes') || c.includes('alat_kesehatan'));
  const hasObat = categories.some((c) => c.includes('obat'));
  const hasAlkesGolongan = golonganValues.some((g) => g.includes('elektromedik') || g.includes('alkes'));

  if ((hasAlkes && !hasObat) || hasAlkesGolongan) return 'alkes';
  return 'obat';
}
