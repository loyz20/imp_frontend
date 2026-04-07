# API Contract — Modul Dashboard (Halaman Utama)

**Modul:** Main Dashboard
**Base URL:** `http://localhost:5000/api/v1`

> Halaman utama aplikasi yang menampilkan ringkasan data dari berbagai modul. Dashboard bersifat **role-aware** — setiap role hanya melihat data yang relevan.

---

## Daftar Isi

- [Overview](#overview)
- [Role-Based Access](#role-based-access)
- [Endpoints yang Digunakan](#endpoints-yang-digunakan)
- [1. Product Stats](#1-product-stats)
- [2. Sales Order Stats](#2-sales-order-stats)
- [3. Purchase Order Stats](#3-purchase-order-stats)
- [4. Inventory — Stock Stats](#4-inventory--stock-stats)
- [5. Inventory — Expired Stats](#5-inventory--expired-stats)
- [6. Finance — Dashboard Stats](#6-finance--dashboard-stats)
- [7. Finance — Dashboard Chart](#7-finance--dashboard-chart)
- [8. User Stats](#8-user-stats)
- [9. License Warnings](#9-license-warnings)
- [Frontend Mapping](#frontend-mapping)

---

## Overview

Dashboard **tidak memiliki endpoint sendiri**. Halaman ini mengkonsumsi endpoint `/stats` dari modul-modul yang sudah ada. Data di-fetch secara paralel saat halaman dimuat, disesuaikan dengan role user yang login.

### Bagian Dashboard

| Bagian | Deskripsi | Roles |
|--------|-----------|-------|
| **Primary KPI Cards** | Total Produk, Sales Order, Purchase Order, Near Expiry | Semua role (card tertentu tersembunyi per role) |
| **Finance KPI Cards** | Total Piutang, Total Hutang, Invoice Outstanding, Kas & Bank | SA, Admin, Keuangan |
| **Income vs Expense Chart** | Bar chart pemasukan vs pengeluaran (6 bulan) | SA, Admin, Keuangan |
| **Inventory Alerts** | Stok rendah, stok habis, expired, near-expiry | Semua role |
| **User Stats** | Total pengguna & pengguna aktif | SA, Admin |
| **License Warnings** | Lisensi yang akan/sudah expired | SA, Admin |
| **Settings Indicators** | Badge batch tracking, PO approval, medication settings | SA, Admin |
| **Quick Actions** | Navigation shortcuts (role-aware) | Semua role |

---

## Role-Based Access

Data yang di-fetch berdasarkan role user:

| Endpoint | superadmin | admin | keuangan | sales | gudang | apoteker | user |
|----------|:----------:|:-----:|:--------:|:-----:|:------:|:--------:|:----:|
| `GET /products/stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /inventory/stock/stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /inventory/expired/stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /sales-orders/stats` | ✅ | ✅ | — | ✅ | — | — | — |
| `GET /purchase-orders/stats` | ✅ | ✅ | — | — | ✅ | — | — |
| `GET /finance/dashboard/stats` | ✅ | ✅ | ✅ | — | — | — | — |
| `GET /finance/dashboard/chart` | ✅ | ✅ | ✅ | — | — | — | — |
| `GET /users/stats` | ✅ | ✅ | — | — | — | — | — |
| `GET /settings/license-warnings` | ✅ | ✅ | — | — | — | — | — |

---

## Endpoints yang Digunakan

> Semua endpoint sudah didokumentasikan di modul masing-masing. Bagian ini merangkum response yang relevan untuk dashboard.

---

## 1. Product Stats

> **Dokumentasi lengkap:** [product-module.md](product-module.md) — Section 6.2

```
GET /products/stats
```

**Roles:** SA, Admin, Apoteker, Gudang

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 130,
    "inactive": 20,
    "byCategory": {
      "obat": 80,
      "alkes": 30,
      "bhp": 20,
      "suplemen": 10,
      "lainnya": 10
    },
    "byGolongan": {
      "obat_keras": 50,
      "obat_bebas": 30,
      "narkotika": 5,
      "psikotropika": 10,
      "non_obat": 55
    },
    "bySuhuPenyimpanan": {
      "ruangan": 100,
      "sejuk": 20,
      "dingin": 25,
      "beku": 5
    }
  }
}
```

**Digunakan di Dashboard:**

| Field | Kartu | Keterangan |
|-------|-------|------------|
| `data.total` | Primary KPI — "Total Produk" | Jumlah seluruh produk |

---

## 2. Sales Order Stats

> **Dokumentasi lengkap:** [sales-order-module.md](sales-order-module.md) — Section 11.2

```
GET /sales-orders/stats
```

**Roles:** All 6 roles (except `user`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "total": 300,
    "byStatus": {
      "draft": 5,
      "confirmed": 10,
      "processing": 15,
      "ready_to_ship": 8,
      "partial_shipped": 3,
      "shipped": 20,
      "completed": 230,
      "cancelled": 9
    },
    "totalValue": 8000000000,
    "totalValueThisMonth": 800000000,
    "averageOrderValue": 26666667,
    "topCustomers": [
      {
        "customer": { "name": "Apotek Sehat" },
        "count": 30,
        "totalValue": 500000000
      }
    ]
  }
}
```

**Digunakan di Dashboard:**

| Field | Kartu | Keterangan |
|-------|-------|------------|
| `data.total` | Primary KPI — "Sales Order" | Total SO. Hanya tampil untuk role `sales`, `admin`, `superadmin` |

---

## 3. Purchase Order Stats

> **Dokumentasi lengkap:** [purchase-order-module.md](purchase-order-module.md) — Section 8.2

```
GET /purchase-orders/stats
```

**Roles:** All 6 roles (except `user`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "total": 200,
    "byStatus": {
      "draft": 10,
      "pending_approval": 5,
      "approved": 8,
      "sent": 20,
      "partial_received": 15,
      "received": 130,
      "cancelled": 12
    },
    "totalValue": 5000000000,
    "totalValueThisMonth": 500000000,
    "avgOrderValue": 25000000,
    "topSuppliers": [
      {
        "supplier": { "name": "PT Kimia Farma" },
        "count": 50,
        "totalValue": 1500000000
      }
    ]
  }
}
```

**Digunakan di Dashboard:**

| Field | Kartu | Keterangan |
|-------|-------|------------|
| `data.total` | Primary KPI — "Purchase Order" | Total PO. Hanya tampil untuk role `gudang`, `admin`, `superadmin` |

---

## 4. Inventory — Stock Stats

> **Dokumentasi lengkap:** [inventory-module.md](inventory-module.md) — Section 1.2

```
GET /inventory/stock/stats
```

**Roles:** All roles

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "totalSKU": 150,
    "totalStock": 15000,
    "totalStockValue": 450000000,
    "lowStock": 12,
    "outOfStock": 3,
    "nearExpiry": 8,
    "expired": 2,
    "byCategory": { "obat": 80, "alkes": 30, "bhp": 20 },
    "bySuhuPenyimpanan": { "ruangan": 100, "dingin": 25 }
  }
}
```

> `lowStock` dihitung berdasarkan per-product `stokMinimum`.

**Digunakan di Dashboard:**

| Field | Bagian | Keterangan |
|-------|--------|------------|
| `data.totalSKU` | Inventory Alerts — "Total SKU" | Jumlah SKU yang memiliki stok |
| `data.lowStock` | Inventory Alerts — "Stok Rendah" | Produk di bawah stok minimum |
| `data.outOfStock` | Inventory Alerts — "Stok Habis" | Produk dengan stok 0 |

---

## 5. Inventory — Expired Stats

> **Dokumentasi lengkap:** [inventory-module.md](inventory-module.md) — Section 5.2

```
GET /inventory/expired/stats
```

**Roles:** All roles

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "expired": { "count": 5, "value": 2500000 },
    "critical": { "count": 8, "value": 4000000 },
    "warning": { "count": 15, "value": 7500000 },
    "caution": { "count": 20, "value": 10000000 },
    "safe": { "count": 200, "value": 100000000 }
  }
}
```

**Kategori kadaluarsa:**

| Kategori | Deskripsi |
|----------|-----------|
| `expired` | Sudah kadaluarsa |
| `critical` | ≤ 30 hari lagi |
| `warning` | 31-90 hari lagi |
| `caution` | 91-180 hari lagi |
| `safe` | > 180 hari lagi |

**Digunakan di Dashboard:**

| Field | Bagian | Keterangan |
|-------|--------|------------|
| `data.expired.count` | Inventory Alerts — "Sudah Expired" | Batch yang sudah kadaluarsa |
| `data.critical.count` + `data.warning.count` | Primary KPI — "Near Expiry" dan Inventory Alerts — "Near Expiry" | Batch mendekati kadaluarsa (≤ 90 hari) |
| `data.safe.count` | Inventory Alerts — "Aman" | Batch masih aman (> 180 hari) |

---

## 6. Finance — Dashboard Stats

> **Dokumentasi lengkap:** [finance-module.md](finance-module.md) — Section 1.1

```
GET /finance/dashboard/stats
```

**Roles:** SA, Admin, Keuangan

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "totalReceivable": 500000000,
    "totalPayable": 300000000,
    "invoiceOutstanding": 200000000,
    "paymentsThisMonth": 150000000,
    "overdueInvoices": 15,
    "pendingPayments": 8
  }
}
```

> `totalPayable` dihitung dari `PurchaseOrder.remainingAmount` (PO status `partial_received`/`received`).

**Digunakan di Dashboard:**

| Field | Kartu | Keterangan |
|-------|-------|------------|
| `data.totalReceivable` | Finance KPI — "Total Piutang" | Total piutang dari customer |
| `data.totalPayable` | Finance KPI — "Total Hutang" | Total hutang ke supplier |
| `data.invoiceOutstanding` | Finance KPI — "Invoice Outstanding" | Jumlah invoice belum lunas |
| `data.cashBalance` | Finance KPI — "Kas & Bank" | Saldo kas dan bank |

---

## 7. Finance — Dashboard Chart

> **Dokumentasi lengkap:** [finance-module.md](finance-module.md) — Section 1.2

```
GET /finance/dashboard/chart
```

**Query Parameters:**

| Param | Type | Default | Deskripsi |
|-------|------|---------|-----------|
| `period` | `string` | `monthly` | Granularity: `daily`, `weekly`, `monthly` |
| `months` | `integer` | `6` | Range: 1-24 bulan |

**Roles:** SA, Admin, Keuangan

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    { "label": "Nov 2025", "income": 850000000, "expense": 620000000 },
    { "label": "Des 2025", "income": 920000000, "expense": 700000000 },
    { "label": "Jan 2026", "income": 780000000, "expense": 550000000 },
    { "label": "Feb 2026", "income": 890000000, "expense": 640000000 },
    { "label": "Mar 2026", "income": 1050000000, "expense": 780000000 },
    { "label": "Apr 2026", "income": 430000000, "expense": 310000000 }
  ]
}
```

**Digunakan di Dashboard:**

| Field | Bagian | Keterangan |
|-------|--------|------------|
| `data[].label` | Chart X-axis | Label bulan |
| `data[].income` | Chart bar hijau | Pemasukan (emerald) |
| `data[].expense` | Chart bar merah | Pengeluaran (red) |

**Dashboard memanggil dengan parameter:** `{ period: 'monthly', months: 6 }`

---

## 8. User Stats

> **Dokumentasi lengkap:** [api-contract.md](api-contract.md) — Section 2.2

```
GET /users/stats
```

**Roles:** SA, Admin

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 130,
    "inactive": 20,
    "byRole": {
      "superadmin": 1,
      "admin": 2,
      "apoteker": 3,
      "keuangan": 2,
      "gudang": 4,
      "sales": 8,
      "user": 130
    }
  }
}
```

**Digunakan di Dashboard:**

| Field | Bagian | Keterangan |
|-------|--------|------------|
| `data.total` | Inventory Alerts — "Total Pengguna" | Jumlah user terdaftar. Hanya tampil untuk admin. |
| `data.active` | Inventory Alerts — badge "X aktif" | Jumlah user yang status `active` |

---

## 9. License Warnings

> **Dokumentasi lengkap:** [setting-module.md](setting-module.md) — Section 1.2

```
GET /settings/license-warnings
```

**Roles:** SA, Admin

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "license": "PBF",
      "number": "PBF-1234",
      "expiryDate": "2026-02-15",
      "status": "expiring_soon",
      "daysUntilExpiry": 12
    },
    {
      "license": "CDOB Certificate",
      "number": "CDOB-5678",
      "expiryDate": "2025-12-01",
      "status": "expired",
      "daysUntilExpiry": -44
    }
  ]
}
```

**License yang dicek:** PBF, SIUP, TDP, CDOB, SIPA (Apoteker), STRA (Apoteker)

**Digunakan di Dashboard:**

| Field | Bagian | Keterangan |
|-------|--------|------------|
| `data[].license` | License Warning banner | Tipe lisensi |
| `data[].number` | License Warning banner | Nomor lisensi |
| `data[].status` | License Warning banner | `expired` (merah) atau `expiring_soon` (kuning) |
| `data[].daysUntilExpiry` | License Warning banner | Hari tersisa (negatif = sudah lewat) |
| `data[].expiryDate` | License Warning banner | Tanggal expired |

---

## Frontend Mapping

### Pemetaan Store → Dashboard Section

| Store | Action | State | Dashboard Section |
|-------|--------|-------|-------------------|
| `useProductStore` | `fetchStats()` | `stats` | Primary KPI — "Total Produk" |
| `useSalesOrderStore` | `fetchStats()` | `stats` | Primary KPI — "Sales Order" |
| `usePurchaseOrderStore` | `fetchStats()` | `stats` | Primary KPI — "Purchase Order" |
| `useInventoryStore` | `fetchStockStats()` | `stockStats` | Inventory Alerts (Total SKU, Stok Rendah, Stok Habis) |
| `useInventoryStore` | `fetchExpiredStats()` | `expiredStats` | Primary KPI — "Near Expiry" + Inventory Alerts (Expired, Near Expiry, Aman) |
| `useFinanceStore` | `fetchDashboardStats()` | `dashboardStats` | Finance KPI Cards (4 kartu) |
| `useFinanceStore` | `fetchDashboardChart({ period: 'monthly', months: 6 })` | `chartData` | Income vs Expense Chart |
| `useUserStore` | `fetchStats()` | `stats` | Inventory Alerts — "Total Pengguna" (admin only) |
| `useSettingsStore` | `fetchLicenseWarnings()` | `licenseWarnings` | License Warning banners (admin only) |

### Fetch Strategy

```
Mount Dashboard
  ├── Semua role:
  │     ├── fetchProductStats()        → productStore.stats
  │     ├── fetchStockStats()          → inventoryStore.stockStats
  │     └── fetchExpiredStats()        → inventoryStore.expiredStats
  │
  ├── sales / admin / superadmin:
  │     └── fetchSOStats()             → salesOrderStore.stats
  │
  ├── gudang / admin / superadmin:
  │     └── fetchPOStats()             → purchaseOrderStore.stats
  │
  ├── keuangan / admin / superadmin:
  │     ├── fetchFinanceStats()        → financeStore.dashboardStats
  │     └── fetchFinanceChart()        → financeStore.chartData
  │
  └── admin / superadmin:
        ├── fetchUserStats()           → userStore.stats
        └── fetchLicenseWarnings()     → settingsStore.licenseWarnings
```

### Quick Actions per Role

| Role | Actions |
|------|---------|
| `superadmin`, `admin` | Buat Surat Pesanan, Buat Sales Order, Kelola Produk, Lihat Stok, Lihat Laporan, Pengaturan |
| `sales` | Buat Sales Order, Kelola Produk, Lihat Laporan |
| `gudang` | Lihat Stok, Buat Surat Pesanan, Kelola Produk |
| `keuangan` | Kelola Invoice, Pembayaran, Lihat Laporan |
| `apoteker` | Kelola Produk, Lihat Stok |
| `user` | Kelola Produk, Lihat Laporan |
