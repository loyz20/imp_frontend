import React from 'react';
import useSettings from '../hooks/useSettings';

/* ── Per-type configuration ── */
const TYPE_CONFIG = {
  narkotika: {
    title: 'SURAT PESANAN NARKOTIKA',
    subjectLine: 'Mengajukan pesanan narkotika kepada :',
    usageLine: 'Narkotika tersebut akan digunakan untuk memenuhi kebutuhan :',
    isPrekursor: false,
  },
  psikotropika: {
    title: 'SURAT PESANAN PSIKOTROPIKA',
    subjectLine: 'Mengajukan pesanan psikotropika kepada :',
    usageLine: 'Psikotropika tersebut akan digunakan untuk memenuhi kebutuhan :',
    isPrekursor: false,
  },
  prekursor: {
    title: 'SURAT PESANAN OBAT MENGANDUNG PREKURSOR',
    subjectLine: 'Mengajukan pesanan obat yang mengandung prekursor kepada :',
    usageLine: 'Obat mengandung prekursor farmasi tersebut akan digunakan untuk memenuhi kebutuhan :',
    isPrekursor: true,
  },
};

export default function SuratPesananKhususPrintTemplate({ sp }) {
  const { company } = useSettings();

  if (!sp) return null;

  const type = sp.type || 'prekursor';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.prekursor;

  const officeAddress = company.officeAddress || {};
  const companyName = company.name || 'PBF';
  const companyInitials = getInitials(companyName);
  const addrLine1 = officeAddress.street || '';
  const addrLine2 = [officeAddress.city, officeAddress.province, officeAddress.postalCode].filter(Boolean).join(', ');
  const pbfNumber = company?.licenses?.pbf?.number || '-';
  const cdobNumber = company?.licenses?.cdob?.number || '-';

  const legacyPharmacist = company?.responsiblePharmacist || {};
  const pharmacist = company?.responsiblePharmacistObat || company?.pharmacistObat || legacyPharmacist;
  const pharmacistName = pharmacist?.name || 'Apoteker Penanggung Jawab';
  const pharmacistSipa = pharmacist?.sipaNumber || '-';
  const pharmacistTitle = pharmacist?.title || 'Apoteker Penanggung Jawab PBF';

  const supplier = sp.supplier || {};
  const supplierAddress = supplier.address
    ? [supplier.address.street, supplier.address.city, supplier.address.province].filter(Boolean).join(', ')
    : supplier.alamat || supplier.city || '-';

  const items = sp.items || [];
  const MIN_ROWS = 7;
  const rows = Array.from({ length: Math.max(items.length, MIN_ROWS) }, (_, i) => items[i] || null);

  const locationDate = `${officeAddress.city || '-'}, ${fmtDateLong(sp.date || new Date())}`;

  return (
    <div className="invoice-print-template hidden print:block!">
      <div className="invoice-page" style={pageStyle}>

        {/* ── Header: Logo + Company ── */}
        <table style={headerTableStyle}>
          <tbody>
            <tr>
              <td style={{ width: '12%', verticalAlign: 'middle', textAlign: 'center', padding: '6px 8px' }}>
                {company?.logo ? (
                  <img src={company.logo} alt={companyName} style={logoImageStyle} />
                ) : (
                  <div style={logoFallbackStyle}>{companyInitials}</div>
                )}
              </td>
              <td style={{ verticalAlign: 'middle', padding: '6px 8px' }}>
                <div style={companyTitleStyle}>{companyName.toUpperCase()}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={companyDetailStyle}>{addrLine1}</td>
                      <td style={{ ...companyDetailStyle, textAlign: 'right' }}>Email : {company.email || '-'}</td>
                    </tr>
                    <tr>
                      <td style={companyDetailStyle}>{addrLine2}</td>
                      <td style={{ ...companyDetailStyle, textAlign: 'right' }}>No Telp : {company.phone || '-'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={companyDetailStyle}>
                        Ijin PBF : {pbfNumber} &nbsp;&nbsp;&nbsp; Sertifikat CDOB : {cdobNumber}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Title ── */}
        <div style={titleWrapStyle}>
          <div style={titleStyle}>{config.title}</div>
          <div style={spNumberStyle}>Nomor : {sp.spNumber || '-'}</div>
        </div>

        {/* ── Signer info (pharmacist) ── */}
        <div style={sectionStyle}>
          <div style={sectionLineStyle}>Yang bertandatangan di bawah ini :</div>
          <table style={infoTableStyle}>
            <tbody>
              <tr>
                <td style={infoLabelStyle}>Nama</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{pharmacistName}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>Jabatan</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{pharmacistTitle}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>No. SIPA</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{pharmacistSipa}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Supplier info ── */}
        <div style={sectionStyle}>
          <div style={sectionLineStyle}>{config.subjectLine}</div>
          <table style={infoTableStyle}>
            <tbody>
              <tr>
                <td style={infoLabelStyle}>Nama</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{supplier.name || '-'}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>Alamat</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{supplierAddress}</td>
              </tr>
              <tr>
                <td style={infoLabelStyle}>No Telp</td>
                <td style={infoSepStyle}>:</td>
                <td style={infoValueStyle}>{supplier.phone || supplier.telepon || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Item Table ── */}
        <div style={{ marginTop: '10px', marginBottom: '4px', fontSize: '9pt' }}>Dengan rincian sebagai berikut</div>

        {config.isPrekursor ? (
          /* Prekursor table: 6 columns */
          <table style={itemTableStyle}>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Obat mengandung Prekursor</th>
                <th style={thStyle}>Nama Zat Aktif</th>
                <th style={thStyle}>Bentuk dan Kekuatan Sediaan</th>
                <th style={thStyle}>Satuan</th>
                <th style={thStyle}>Jumlah (Angka dan Huruf)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? idx + 1 : ''}</td>
                  <td style={tdStyle}>{item ? (item.product?.name || item.productName || '') : ''}</td>
                  <td style={tdStyle}>{item ? (item.product?.activeIngredient || item.activeIngredient || '') : ''}</td>
                  <td style={tdStyle}>{item ? (item.product?.strength || item.product?.kekuatan || item.strength || '') : ''}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? (item.unit || '') : ''}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? fmtQtyTerbilang(item.qty) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* Narkotika / Psikotropika table: 4 columns */
          <table style={itemTableStyle}>
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '44%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Obat / Bahan Baku {type === 'narkotika' ? 'Narkotika' : 'Psikotropika'}</th>
                <th style={thStyle}>Satuan</th>
                <th style={thStyle}>Jumlah (Angka dan Huruf)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? idx + 1 : ''}</td>
                  <td style={tdStyle}>{item ? (item.product?.name || item.productName || '') : ''}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? (item.unit || '') : ''}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{item ? fmtQtyTerbilang(item.qty) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Usage / Purpose ── */}
        <div style={{ marginTop: '10px', fontSize: '9pt' }}>{config.usageLine}</div>
        <table style={infoTableStyle}>
          <tbody>
            <tr>
              <td style={infoLabelStyle}>Nama PBF</td>
              <td style={infoSepStyle}>:</td>
              <td style={infoValueStyle}>{companyName}</td>
            </tr>
            <tr>
              <td style={infoLabelStyle}>Alamat</td>
              <td style={infoSepStyle}>:</td>
              <td style={infoValueStyle}>{[addrLine1, addrLine2].filter(Boolean).join(', ') || '-'}</td>
            </tr>
            <tr>
              <td style={infoLabelStyle}>Ijin PBF</td>
              <td style={infoSepStyle}>:</td>
              <td style={infoValueStyle}>{pbfNumber}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Signature ── */}
        <div style={{ marginTop: '16px', fontSize: '9pt' }}>{locationDate}</div>
        <div style={{ marginTop: '2px', fontSize: '9pt' }}>Apoteker Penanggung Jawab</div>
        <div style={{ height: '64px' }} />
        <div style={{ fontSize: '9pt', fontWeight: 700 }}>{pharmacistName}</div>
        <div style={{ fontSize: '9pt' }}>SIPA : {pharmacistSipa}</div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'IP';
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function fmtDateLong(dateStr) {
  if (!dateStr) return '-';
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtQtyTerbilang(qty) {
  const n = Number(qty) || 0;
  if (n === 0) return '';
  return `${n} (${terbilang(n)})`;
}

function terbilang(n) {
  if (!n || n === 0) return 'Nol';
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
    return `${convert(Math.floor(num / 1000000000))} Miliar${num % 1000000000 > 0 ? ` ${convert(num % 1000000000)}` : ''}`;
  };

  return convert(Math.floor(Math.abs(n)));
}

/* ── Styles ── */
const pageStyle = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '10px',
  color: '#111827',
  paddingTop: '6mm',
};

const headerTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  borderBottom: '2px solid #111827',
  marginBottom: '6px',
};

const logoImageStyle = {
  width: '56px',
  height: '56px',
  objectFit: 'contain',
};

const logoFallbackStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '999px',
  border: '2px solid #111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '18px',
};

const companyTitleStyle = {
  fontWeight: 700,
  fontSize: '14pt',
  marginBottom: '2px',
};

const companyDetailStyle = {
  fontSize: '8pt',
  lineHeight: 1.3,
  paddingBottom: '1px',
};

const titleWrapStyle = {
  textAlign: 'center',
  margin: '10px 0 8px',
};

const titleStyle = {
  fontWeight: 700,
  fontSize: '12pt',
  textTransform: 'uppercase',
  textDecoration: 'underline',
};

const spNumberStyle = {
  fontSize: '9pt',
  marginTop: '2px',
};

const sectionStyle = {
  marginTop: '8px',
};

const sectionLineStyle = {
  fontSize: '9pt',
  marginBottom: '3px',
};

const infoTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '2px',
};

const infoLabelStyle = {
  width: '12%',
  fontSize: '9pt',
  verticalAlign: 'top',
  paddingBottom: '2px',
};

const infoSepStyle = {
  width: '2%',
  fontSize: '9pt',
  verticalAlign: 'top',
  paddingBottom: '2px',
};

const infoValueStyle = {
  fontSize: '9pt',
  verticalAlign: 'top',
  paddingBottom: '2px',
};

const itemTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  marginTop: '4px',
};

const thStyle = {
  border: '1px solid #111827',
  padding: '4px 5px',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '8pt',
  background: '#f3f4f6',
  lineHeight: 1.2,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

const tdStyle = {
  border: '1px solid #111827',
  padding: '4px 5px',
  fontSize: '9pt',
  lineHeight: 1.3,
  verticalAlign: 'top',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  minHeight: '22px',
};
