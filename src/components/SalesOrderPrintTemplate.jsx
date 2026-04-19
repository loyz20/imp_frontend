import React from 'react';
import useSettings from '../hooks/useSettings';
import env from '../config/env';

export default function SalesOrderPrintTemplate({ order }) {
  const { company } = useSettings();

  if (!order) return null;

  const addr = company.officeAddress || {};
  const addrLine1 = addr.street || '';
  const addrLine2 = [addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ');
  const licenses = company.licenses || {};
  const legacyPharmacist = company.responsiblePharmacist || {};
  const pharmacistObat = company.responsiblePharmacistObat || company.pharmacistObat || legacyPharmacist;
  const pharmacistAlkes = company.responsiblePharmacistAlkes || company.pharmacistAlkes || legacyPharmacist;

  const logoSrc = normalizeLogoSrc(company.logo);
  const customer = resolveCustomer(order);
  const customerName = customer?.name || order.customerName || '-';
  const customerAddress = resolveCustomerAddress(order, customer);
  const customerPhone = customer?.phone || '-';

  const items = order.items || [];
  const orderItemType = resolveOrderItemType(order, items);
  const pharmacist = orderItemType === 'alkes' ? pharmacistAlkes : pharmacistObat;
  const rows = Array.from({ length: Math.max(items.length, 12) }, (_, i) => items[i] || null);
  const locationDate = `${addr.city || '-'}, ${fmtDate(order.orderDate || new Date())}`;

  const orderNumber = order.suratJalanNumber || order.soNumber || order.deliveryNumber || '-';
  const pesananNumber = order.fakturNumber || order.invoiceNumber || order.poNumber || '-';

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page po-letter-page so-letter-page">
        <div className="po-letter-head so-letter-head">
          {logoSrc && (
            <img src={logoSrc} alt={company.name || 'PBF'} className="po-letter-logo-img so-letter-logo-img" />
          )}
          <div className="po-letter-head-info so-letter-head-info">
            <h1 className="po-letter-company so-letter-company">{company.name || 'PBF'}</h1>
            <div className="po-letter-head-row so-letter-head-row">
              <span>{addrLine1}</span>
              <span>NPWP : {company.tax?.npwp || '-'}</span>
            </div>
            <div className="po-letter-head-row so-letter-head-row">
              <span>{addrLine2}</span>
              <span>Email : {company.email || '-'}</span>
            </div>
            <p className="po-letter-head-line so-letter-head-line">
              Ijin PBF : {licenses.pbf?.number || '-'} &nbsp;&nbsp;&nbsp; Sertifikat CDOB : {licenses.cdob?.number || '-'}
            </p>
            <p className="po-letter-head-line so-letter-head-line">
              No Telp : {company.phone || '-'}
            </p>
          </div>
        </div>

        <div className="po-letter-title-wrap so-letter-title-wrap">
          <h2 className="po-letter-title so-letter-title">SURAT PENYERAHAN BARANG</h2>
        </div>

        <div className="so-letter-top-meta">
          <div className="so-letter-recipient">
            <p className="po-letter-line so-letter-line">
              <span className="po-letter-label so-letter-label">Kepada Yth</span>
              <span className="po-letter-value so-letter-value">{customerName}</span>
            </p>
            <p className="po-letter-line so-letter-line">
              <span className="po-letter-label so-letter-label">Alamat</span>
              <span className="po-letter-value so-letter-value">{customerAddress || '-'}</span>
            </p>
            <p className="po-letter-line so-letter-line">
              <span className="po-letter-label so-letter-label">Telepon</span>
              <span className="po-letter-value so-letter-value">{customerPhone || '-'}</span>
            </p>
          </div>
          <div className="so-letter-doc-meta">
            <p><span className="so-letter-meta-label">Tanggal</span><span className="so-letter-meta-sep">:</span><span>{fmtDate(order.orderDate)}</span></p>
            <p><span className="so-letter-meta-label">Nomor SPB</span><span className="so-letter-meta-sep">:</span><span>{orderNumber}</span></p>
            <p><span className="so-letter-meta-label">No. Surat Pesanan</span><span className="so-letter-meta-sep">:</span><span>{pesananNumber}</span></p>
          </div>
        </div>

        <p className="po-letter-open so-letter-open">Dengan ini diserahkan barang sebagai berikut :</p>

        <table className="po-letter-table so-letter-table">
          <thead>
            <tr>
              <th className="so-col-no">No</th>
              <th className="so-col-name">Nama Barang</th>
              <th className="so-col-qty">Kuantitas</th>
              <th className="so-col-unit">Satuan</th>
              <th className="so-col-batch">No. Bats</th>
              <th className="so-col-expiry">Expired Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => {
              const qty = Number(item?.quantity) || 0;
              return (
                <tr key={idx}>
                  <td className="po-cell-center">{item ? idx + 1 : ''}</td>
                  <td>{item ? (item.product?.name || item.productId?.name || item.productName || '-') : ''}</td>
                  <td className="po-cell-center">{item ? qty : ''}</td>
                  <td className="po-cell-center">{item ? (item.satuan || item.unit || 'PCS') : ''}</td>
                  <td className="po-cell-center">{item ? (item.batchNumber || '-') : ''}</td>
                  <td className="po-cell-center">{item ? (item.expiryDate ? fmtDate(item.expiryDate) : '-') : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="po-letter-notes so-letter-notes">
          <p className="po-letter-notes-title">Catatan :</p>
          <p>{order.notes || '-'}</p>
        </div>

        <div className="so-letter-signatures">
          <div className="so-sign-block">
            <p>Yang Menerima,</p>
            <div className="so-sign-line" />
            <p className="so-sign-name">{order.customerName || customerName}</p>
            <p className="so-sign-desc">Nama Jelas, Stempel</p>
          </div>
          <div className="so-sign-block">
            <p>Pengirim,</p>
            <div className="so-sign-line" />
            <p className="so-sign-name">&nbsp;</p>
            <p className="so-sign-desc">&nbsp;</p>
          </div>
          <div className="so-sign-block so-sign-block-right">
            <p>Yang Menyerahkan,</p>
            <p>Apoteker Penanggung Jawab</p>
            <div className="so-sign-line" />
            <p className="so-sign-name">{pharmacist.name || '-'}</p>
            <p className="so-sign-desc">SIPA : {pharmacist.sipaNumber || '-'}</p>
          </div>
        </div>

        <div className="so-letter-location-date">{locationDate}</div>
      </div>
    </div>
  );
}

function normalizeLogoSrc(rawLogo) {
  if (!rawLogo) return null;
  if (rawLogo.startsWith('data:') || rawLogo.startsWith('blob:')) return rawLogo;
  if (/^(https?:)?\/\//i.test(rawLogo)) return rawLogo;

  const apiOrigin = new URL(env.API_BASE_URL).origin;
  if (rawLogo.startsWith('/uploads/')) return `${apiOrigin}${rawLogo}`;
  if (rawLogo.startsWith('uploads/')) return `${apiOrigin}/${rawLogo}`;
  if (rawLogo.startsWith('/api/v1/uploads/')) return `${apiOrigin}${rawLogo.replace('/api/v1', '')}`;
  if (rawLogo.startsWith('api/v1/uploads/')) return `${apiOrigin}/${rawLogo.replace('api/v1/', '')}`;
  return rawLogo;
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function resolveCustomer(order) {
  const c = order?.customer && typeof order.customer === 'object' ? order.customer
    : order?.customerId && typeof order.customerId === 'object' ? order.customerId
    : null;
  return c;
}

function resolveCustomerAddress(order, customer) {
  if (typeof order?.shippingAddress === 'string' && order.shippingAddress.trim()) return order.shippingAddress.trim();

  const addr = customer?.address || order?.customerAddress || {};
  const street = addr.street || addr.line1 || addr.addressLine1 || '';
  const city = addr.city || '';
  const province = addr.province || '';
  const postalCode = addr.postalCode || '';
  return [street, city, province, postalCode].filter(Boolean).join(', ');
}

function resolveOrderItemType(order, items = []) {
  const soCategory = String(order?.soCategory || order?.category || '').toLowerCase();
  if (soCategory.includes('alkes') || soCategory.includes('alat_kesehatan')) return 'alkes';
  if (soCategory.includes('obat')) return 'obat';

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
