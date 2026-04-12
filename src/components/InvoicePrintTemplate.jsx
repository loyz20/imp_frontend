import React from 'react';
import useSettings from '../hooks/useSettings';

export default function InvoicePrintTemplate({ invoice }) {
  const { company, tax } = useSettings();

  if (!invoice) return null;

  const officeAddress = company.officeAddress || {};
  const addressLine = [officeAddress.street, officeAddress.city, officeAddress.province, officeAddress.postalCode]
    .filter(Boolean)
    .join(', ');
  const companyName = company.name || 'PBF';
  const companyInitials = getInitials(companyName);
  const pbfNumber = company?.licenses?.pbf?.number || '-';
  const cdobNumber = company?.licenses?.cdob?.number || '-';
  const npwpNumber = tax?.npwp || company?.tax?.npwp || '-';
  const legacyPharmacist = company?.responsiblePharmacist || {};
  const pharmacistObat = company?.responsiblePharmacistObat || company?.pharmacistObat || legacyPharmacist;
  const pharmacistAlkes = company?.responsiblePharmacistAlkes || company?.pharmacistAlkes || legacyPharmacist;

  const customer = invoice.customer || invoice.customerId || {};
  const customerAddress = customer.address
    ? [customer.address.street, customer.address.city, customer.address.province, customer.address.postalCode].filter(Boolean).join(', ')
    : [invoice.customerAddress, customer.city, customer.province].filter(Boolean).join(', ');

  const items = buildInvoiceRows(invoice.items || []);
  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.grossAmount, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const dppAmount = subtotalBeforeDiscount - totalDiscount;
  const ppnRate = Number(invoice.ppnRate ?? 11);
  const ppnAmount = Number(invoice.ppnAmount ?? 0);
  const totalAmount = Number(invoice.totalAmount ?? (dppAmount + ppnAmount));
  const invoiceItemType = resolveInvoiceItemType(invoice, invoice.items || []);
  const pharmacist = invoiceItemType === 'alkes' ? pharmacistAlkes : pharmacistObat;
  const pharmacistName = pharmacist?.name || (invoiceItemType === 'alkes' ? 'Penanggung Jawab Alat Kesehatan' : 'Apoteker Penanggung Jawab');
  const pharmacistSipa = pharmacist?.sipaNumber || '-';
  const pharmacistTitle = invoiceItemType === 'alkes' ? 'Penanggung Jawab Alat Kesehatan' : 'Apoteker Penanggung Jawab';

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page" style={pageStyle}>
        <table style={headerTableStyle}>
          <tbody>
            <tr>
              <td style={{ ...headerCellPlainStyle, width: '66%', padding: 0 }}>
                <div style={companyBoxStyle}>
                  <div style={logoWrapStyle}>
                    {company?.logo ? (
                      <img src={company.logo} alt={companyName} style={logoImageStyle} />
                    ) : (
                      <div style={logoFallbackStyle}>{companyInitials}</div>
                    )}
                  </div>
                  <div style={companyInfoStyle}>
                    <div style={companyTitleStyle}>{companyName.toUpperCase()}</div>
                    <div style={companyDetailStyle}>{addressLine || '-'}</div>
                    <div style={companyDetailStyle}>Ijin PBF : {pbfNumber}</div>
                    <div style={companyDetailStyle}>Sertifikat CDOB : {cdobNumber}</div>
                    <div style={companyDetailStyle}>NPWP : {npwpNumber}  No Telp : {company.phone || '-'}</div>
                  </div>
                </div>
              </td>
              <td style={{ ...headerCellPlainStyle, width: '34%', verticalAlign: 'top' }}>
                <div style={recipientBoxStyle}>
                  <div><strong>Kepada :</strong> {customer.name || invoice.customerName || '-'}</div>
                  <div><strong>Alamat :</strong> {customerAddress || '-'}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...sheetTableStyle, marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, ...titleCellStyle, width: '46%' }} rowSpan={2}>FAKTUR PENJUALAN</td>
              <td style={{ ...cellStyle, ...metaHeaderStyle }}>Nomor Faktur</td>
              <td style={{ ...cellStyle, ...metaHeaderStyle }}>Nomor SP</td>
              <td style={{ ...cellStyle, ...metaHeaderStyle }}>Tanggal Faktur</td>
              <td style={{ ...cellStyle, ...metaHeaderStyle }}>Tanggal Jatuh Tempo</td>
            </tr>
            <tr>
              <td style={metaValueWrapStyle}>{invoice.invoiceNumber || '-'}</td>
              <td style={metaValueStyle}></td>
              <td style={metaValueStyle}>{fmtDateShort(invoice.invoiceDate)}</td>
              <td style={metaValueStyle}>{fmtDateShort(invoice.dueDate)}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...sheetTableStyle, marginTop: -1 }}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={itemHeaderCellStyle}>QTY</th>
              <th style={itemHeaderCellStyle}>NAMA BARANG</th>
              <th style={itemHeaderCellStyle}>SATUAN</th>
              <th style={itemHeaderCellStyle}>NO. BETS</th>
              <th style={itemHeaderCellStyle}>ED</th>
              <th style={itemHeaderCellStyle}>HARGA SATUAN</th>
              <th style={itemHeaderCellStyle}>DISC</th>
              <th style={itemHeaderCellStyle}>RP</th>
              <th style={itemHeaderCellStyle}>JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`row-${index}`}>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.quantity || ''}</td>
                <td style={itemBodyCellStyle}>{item.productName}</td>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.unit}</td>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.batchNumber}</td>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.expiryDate}</td>
                <td style={{ ...itemBodyCellStyle, ...itemRightCellStyle }}>{item.unitPriceText}</td>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.discountPercentText}</td>
                <td style={{ ...itemBodyCellStyle, ...itemCenterCellStyle }}>{item.productName ? 'Rp' : ''}</td>
                <td style={{ ...itemBodyCellStyle, ...itemRightCellStyle }}>{item.lineTotalText}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ ...sheetTableStyle, marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ ...summaryHeaderStyle, width: '19%' }}>Sub total Sebelum Diskon (Rp)</td>
              <td style={{ ...summaryHeaderStyle, width: '16%' }}>Diskon (Rp)</td>
              <td style={{ ...summaryHeaderStyle, width: '18%' }}>DPP (Rp)</td>
              <td style={{ ...summaryHeaderStyle, width: '24%' }}>PPN {ppnRate}% (Rp)</td>
              <td style={{ ...summaryHeaderStyle, width: '23%' }}>Total Tagihan (Rp)</td>
            </tr>
            <tr>
              <td style={summaryValueStyle}>{fmtNumber(subtotalBeforeDiscount)}</td>
              <td style={summaryValueStyle}>{fmtNumber(totalDiscount)}</td>
              <td style={summaryValueStyle}>{fmtNumber(dppAmount)}</td>
              <td style={summaryValueStyle}>{fmtNumber(ppnAmount)}</td>
              <td style={summaryValueStyle}>{fmtNumber(totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...sheetTableStyle, marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ ...labelCellStyle, width: '19%' }}>Terbilang</td>
              <td style={fullRowCellStyle}>{terbilang(totalAmount).toUpperCase()} RUPIAH</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Keterangan</td>
              <td style={notesCellStyle}>{invoice.notes || ''}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...sheetTableStyle, marginTop: -1 }}>
          <tbody>
            <tr>
              <td style={{ ...signaturePlainStyle, width: '33%' }}>Penerima,</td>
              <td style={{ ...signaturePlainStyle, width: '33%' }}>Pengirim,</td>
              <td style={{ ...signaturePlainStyle, width: '34%' }}>Hormat Kami,</td>
            </tr>
            <tr>
              <td style={signaturePlainStyle}>Tanggal :</td>
              <td style={signaturePlainStyle}></td>
              <td style={signaturePlainStyle}>{pharmacistTitle}</td>
            </tr>
            <tr>
              <td style={{ ...signaturePlainStyle, height: '82px', verticalAlign: 'bottom' }}>(................................)</td>
              <td style={{ ...signaturePlainStyle, height: '82px', verticalAlign: 'bottom' }}></td>
              <td style={{ ...signaturePlainStyle, height: '82px', verticalAlign: 'bottom', fontWeight: 700 }}>{pharmacistName}</td>
            </tr>
            <tr>
              <td style={signaturePlainStyle}>Nama Jelas, No SIPA/SIPTTK, Stempel</td>
              <td style={signaturePlainStyle}></td>
              <td style={signaturePlainStyle}>SIPA : {pharmacistSipa}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildInvoiceRows(items) {
  const normalizedItems = (items || []).map((item) => {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice || 0);
    const discountPercent = Number(item?.discount || 0);
    const grossAmount = quantity * unitPrice;
    const discountAmount = grossAmount * (discountPercent / 100);
    const lineTotal = Number(item?.subtotal ?? (grossAmount - discountAmount));

    return {
      quantity: quantity || '',
      productName: item?.productId?.name || item?.productName || item?.description || '',
      unit: item?.satuan || item?.unit || '',
      batchNumber: item?.batchNumber || '-',
      expiryDate: item?.expiryDate ? fmtDateShort(item.expiryDate) : '-',
      unitPriceText: unitPrice ? fmtNumber(unitPrice) : '',
      discountPercentText: discountPercent ? `${discountPercent}%` : '0%',
      lineTotalText: lineTotal ? fmtNumber(lineTotal) : '',
      grossAmount,
      discountAmount,
    };
  });
  return normalizedItems;
}

function resolveInvoiceItemType(invoice, items = []) {
  const invoiceCategory = String(invoice?.invoiceCategory || invoice?.category || invoice?.salesCategory || '').toLowerCase();
  if (invoiceCategory.includes('alkes') || invoiceCategory.includes('alat_kesehatan')) return 'alkes';
  if (invoiceCategory.includes('obat')) return 'obat';

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

  const hasAlkes = categories.some((category) => category.includes('alkes') || category.includes('alat_kesehatan'));
  const hasObat = categories.some((category) => category.includes('obat'));
  const hasAlkesGolongan = golonganValues.some((golongan) => golongan.includes('elektromedik') || golongan.includes('alkes'));

  if ((hasAlkes && !hasObat) || hasAlkesGolongan) return 'alkes';
  return 'obat';
}

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'IP';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function fmtNumber(amount) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function fmtDateShort(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function terbilang(n) {
  if (n == null || n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  const convert = (num) => {
    if (num < 12) return satuan[num];
    if (num < 20) return `${satuan[num - 10]} Belas`;
    if (num < 100) return `${satuan[Math.floor(num / 10)]} Puluh${num % 10 > 0 ? ` ${satuan[num % 10]}` : ''}`;
    if (num < 200) return `Seratus${num - 100 > 0 ? ` ${convert(num - 100)}` : ''}`;
    if (num < 1000) return `${satuan[Math.floor(num / 100)]} Ratus${num % 100 > 0 ? ` ${convert(num % 100)}` : ''}`;
    if (num < 2000) return `Seribu${num - 1000 > 0 ? ` ${convert(num - 1000)}` : ''}`;
    if (num < 1000000) return `${convert(Math.floor(num / 1000))} Ribu${num % 1000 > 0 ? ` ${convert(num % 1000)}` : ''}`;
    if (num < 1000000000) return `${convert(Math.floor(num / 1000000))} Juta${num % 1000000 > 0 ? ` ${convert(num % 1000000)}` : ''}`;
    if (num < 1000000000000) return `${convert(Math.floor(num / 1000000000))} Miliar${num % 1000000000 > 0 ? ` ${convert(num % 1000000000)}` : ''}`;
    return `${convert(Math.floor(num / 1000000000000))} Triliun${num % 1000000000000 > 0 ? ` ${convert(num % 1000000000000)}` : ''}`;
  };

  return convert(Math.floor(Math.abs(n)));
}

const pageStyle = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '10px',
  color: '#111827',
  paddingTop: '8mm',
};

const sheetTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
};

const headerTableStyle = {
  ...sheetTableStyle,
  borderBottom: '2px solid #111827',
  marginBottom: '12px',
};

const cellStyle = {
  border: '1px solid #111827',
  padding: '4px 6px',
  verticalAlign: 'top',
};

const companyBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px',
};

const logoWrapStyle = {
  width: '62px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const logoImageStyle = {
  width: '52px',
  height: '52px',
  objectFit: 'contain',
};

const logoFallbackStyle = {
  width: '52px',
  height: '52px',
  borderRadius: '999px',
  border: '2px solid #111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '20px',
};

const companyInfoStyle = { flex: 1, textAlign: 'center' };
const companyTitleStyle = { fontWeight: 700, fontSize: '20px', lineHeight: 1.1 };
const companyDetailStyle = { fontSize: '10px', lineHeight: 1.3 };
const recipientBoxStyle = { lineHeight: 1.5, minHeight: '76px' };
const titleCellStyle = { textAlign: 'center', fontWeight: 700, fontSize: '22px', verticalAlign: 'middle' };
const metaHeaderStyle = { textAlign: 'center', fontWeight: 700, background: '#f8fafc' };
const metaValueStyle = { ...cellStyle, textAlign: 'center' };
const metaValueWrapStyle = {
  ...metaValueStyle,
  fontSize: '9px',
  lineHeight: 1.2,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};
const headerCellStyle = { border: '1px solid #111827', padding: '4px 3px', textAlign: 'center', fontWeight: 700, background: '#f8fafc' };
const itemHeaderCellStyle = {
  ...headerCellStyle,
  border: '1px solid #333',
  background: '#f3f4f6',
  fontSize: '8pt',
  lineHeight: 1.2,
  padding: '3px 4px',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};
const itemBodyCellStyle = {
  border: '1px solid #333',
  padding: '3px 5px',
  minHeight: '22px',
  fontSize: '9pt',
  lineHeight: 1.2,
  verticalAlign: 'top',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};
const itemCenterCellStyle = { textAlign: 'center' };
const itemRightCellStyle = {
  textAlign: 'right',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};
const summaryHeaderStyle = { border: '1px solid #111827', padding: '5px 4px', textAlign: 'center', fontWeight: 700, background: '#f8fafc', fontSize: '9px' };
const summaryValueStyle = { border: '1px solid #111827', padding: '4px 5px', textAlign: 'center', fontWeight: 700, fontSize: '9px' };
const labelCellStyle = {
  border: '1px solid #111827',
  padding: '6px 8px',
  fontWeight: 700,
  fontSize: '9pt',
  background: '#f8fafc',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};
const fullRowCellStyle = {
  border: '1px solid #111827',
  padding: '6px 8px',
  fontSize: '9pt',
  lineHeight: 1.25,
  verticalAlign: 'middle',
};
const notesCellStyle = {
  ...fullRowCellStyle,
  minHeight: '28px',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};
const headerCellPlainStyle = { padding: '4px 6px', verticalAlign: 'top' };
const signaturePlainStyle = { padding: '4px 6px', verticalAlign: 'top', fontSize: '9pt' };
