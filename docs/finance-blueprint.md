# Finance Module Blueprint

Dokumen ini merangkum struktur modul finance target (core module, skema data high-level, flow transaksi, API, dan struktur halaman frontend).

## 1. Core Module

- Chart of Accounts (COA)
- Journal (Jurnal Umum)
- Ledger (Buku Besar)
- Cash and Bank
- Account Payable (Hutang)
- Account Receivable (Piutang)
- Expense Management
- Revenue Management
- Financial Report

---

## 2. Struktur Database (High Level)

### 2.1 Accounts (COA)

```json
{
  "_id": "uuid",
  "code": "101",
  "name": "Kas",
  "type": "ASSET",
  "parent_id": null,
  "is_active": true,
  "created_at": "",
  "updated_at": ""
}
```

### 2.2 Journals

```json
{
  "_id": "uuid",
  "date": "2026-04-05",
  "reference": "INV-001",
  "description": "Penjualan obat",
  "entries": [
    {
      "account_id": "101",
      "debit": 1000000,
      "credit": 0
    },
    {
      "account_id": "401",
      "debit": 0,
      "credit": 1000000
    }
  ],
  "created_by": "user_id"
}
```

### 2.3 Transactions (Cash and Bank)

```json
{
  "_id": "uuid",
  "type": "CASH_IN",
  "amount": 500000,
  "account_id": "101",
  "date": "",
  "description": "",
  "reference": ""
}
```

### 2.4 Payables (Hutang)

```json
{
  "_id": "uuid",
  "supplier_id": "",
  "invoice_number": "",
  "amount": 2000000,
  "paid": 500000,
  "due_date": "",
  "status": "PARTIAL"
}
```

### 2.5 Receivables (Piutang)

```json
{
  "_id": "uuid",
  "customer_id": "",
  "invoice_number": "",
  "amount": 1500000,
  "paid": 1000000,
  "due_date": "",
  "status": "PARTIAL"
}
```

---

## 3. Flow Sistem Finance

### 3.1 Penjualan

1. Input penjualan
2. Generate invoice
3. Masuk ke:
   - Piutang (jika kredit)
   - Kas (jika tunai)
4. Auto jurnal:
   - Debit Kas/Piutang
   - Kredit Pendapatan

### 3.2 Pembelian

1. Input pembelian
2. Masuk ke hutang
3. Auto jurnal:
   - Debit Persediaan
   - Kredit Hutang

### 3.3 Pembayaran Hutang

- Debit Hutang
- Kredit Kas

### 3.4 Penerimaan Piutang

- Debit Kas
- Kredit Piutang

---

## 4. Laporan Keuangan

Laporan wajib tersedia:

- Neraca (Balance Sheet)
- Laba Rugi (Profit and Loss)
- Arus Kas (Cash Flow)
- Buku Besar
- Jurnal Umum

---

## 5. Struktur API (Express + MongoDB)

Base path:

```text
/api/finance
```

### 5.1 COA

```text
GET    /accounts
POST   /accounts
PUT    /accounts/:id
DELETE /accounts/:id
```

### 5.2 Journal

```text
GET    /journals
POST   /journals
GET    /journals/:id
```

### 5.3 Cash Flow

```text
GET    /cash
POST   /cash
```

### 5.4 Payables

```text
GET    /payables
POST   /payables
POST   /payables/:id/pay
```

### 5.5 Receivables

```text
GET    /receivables
POST   /receivables
POST   /receivables/:id/pay
```

### 5.6 Reports

```text
GET /reports/balance-sheet
GET /reports/profit-loss
GET /reports/cash-flow
GET /reports/ledger
```

---

## 6. Struktur Halaman Frontend

### 6.1 Sidebar Menu

- Dashboard Finance
- Chart of Accounts
- Jurnal Umum
- Kas and Bank
- Hutang
- Piutang
- Laporan

### 6.2 Detail Halaman

#### Dashboard

- Total Kas
- Total Piutang
- Total Hutang
- Grafik pemasukan vs pengeluaran

#### Jurnal

- Table + filter tanggal
- Add jurnal manual

#### Kas and Bank

- Transaksi masuk/keluar
- Saldo realtime

#### Hutang dan Piutang

- List invoice
- Status: PAID / PARTIAL / UNPAID

#### Laporan

- Export PDF / Excel
- Filter tanggal

---

## 7. Mapping ke Frontend Saat Ini

Agar target struktur ini langsung bisa dipakai di aplikasi saat ini, menu berikut sudah dipetakan:

- Dashboard Finance: `/keuangan/dashboard`
- Chart of Accounts: `/keuangan/ledger?tab=accounts`
- Jurnal Umum: `/keuangan/ledger?tab=journals`
- Kas and Bank: `/keuangan/rekonsiliasi`
- Hutang: `/keuangan/hutang`
- Piutang: `/keuangan/piutang`
- Laporan Keuangan: `/laporan/keuangan`

Catatan: halaman ledger saat ini sudah mendukung tab COA, Journal Entries, dan Trial Balance.
