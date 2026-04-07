# API Contract - Modul Delivery (Pengiriman Barang)

Modul: Delivery Management
Base URL: http://localhost:5000/api/v1
Prefix: /deliveries

Dokumen ini sudah diselaraskan dengan implementasi backend saat ini.

---

## Scope

Modul Delivery mengelola:
- pembuatan delivery dari Sales Order yang siap kirim
- mutasi stok keluar saat delivery dibuat
- perubahan status pengiriman
- side effects ke Sales Order, Inventory, dan Finance

---

## Enum Status Delivery

Status aktif:
- packed
- delivered
- partial_delivered
- returned
- canceled

Catatan kompatibilitas:
- Alias CANCELLED masih tersedia di konstanta internal dan nilainya tetap canceled.

---

## Endpoints

Semua endpoint wajib Bearer token.

| Method | Path | Roles | Deskripsi |
|---|---|---|---|
| GET | /deliveries | Superadmin, Admin, Gudang, Sales, Apoteker, Keuangan | List delivery (paginated) |
| GET | /deliveries/stats | Superadmin, Admin, Gudang, Sales, Apoteker, Keuangan | Statistik delivery |
| GET | /deliveries/available-orders | Superadmin, Admin, Gudang, Sales | SO yang siap dikirim |
| GET | /deliveries/:id | Superadmin, Admin, Gudang, Sales, Apoteker, Keuangan | Detail delivery |
| POST | /deliveries | Superadmin, Admin, Gudang, Sales | Buat delivery |
| PUT | /deliveries/:id | Superadmin, Admin, Gudang, Sales | Update delivery |
| DELETE | /deliveries/:id | Superadmin, Admin | Hapus delivery |
| PATCH | /deliveries/:id/status | Superadmin, Admin, Gudang, Sales | Ubah status delivery |

---

## Data Model Ringkas

Field utama:
- deliveryNumber (unik)
- status (enum DELIVERY_STATUS)
- salesOrderId
- customerId
- deliveryDate
- shippingAddress
- driverName, driverPhone, vehicleNumber
- items[]: productId, satuan, quantityOrdered, quantityShipped, batchNumber, expiryDate, notes
- notes
- pickedAt, packedAt, shippedAt, deliveredAt, returnedAt
- statusHistory[]
- createdBy, updatedBy, createdAt, updatedAt

Default status delivery baru: packed.

---

## Detail API

## 1) GET /deliveries

Query:
- page (optional, int >= 1)
- limit (optional, int 1-100)
- search (optional, max 200, cari deliveryNumber)
- status (optional, bisa comma-separated)
- salesOrderId (optional, mongo id)
- customerId (optional, mongo id)
- dateFrom (optional, ISO date)
- dateTo (optional, ISO date)
- sort (optional, max 50)

---

## 2) GET /deliveries/stats

Mengembalikan ringkasan total per status:
- packed
- delivered
- partialDelivered
- returned
- canceled

Dan metrik:
- deliveredThisMonth
- averageDeliveryTime (hari, dari packedAt ke deliveredAt)
- onTimeDeliveryRate (placeholder saat ini)

---

## 3) GET /deliveries/available-orders

SO yang eligible untuk dibuat delivery:
- status SO harus ready_to_ship atau partial_shipped
- item SO masih punya quantityRemaining > 0

Query:
- search (optional, max 200)
- limit (optional, int 1-100)

---

## 4) GET /deliveries/:id

Mengembalikan detail delivery by id.

---

## 5) POST /deliveries

Body:
- deliveryNumber (optional, max 50)
- salesOrderId (required, mongo id)
- deliveryDate (required, ISO date)
- shippingAddress (optional, max 500)
- driverName (optional, max 100)
- driverPhone (optional, max 20)
- vehicleNumber (optional, max 20)
- notes (optional, max 1000)
- items (required, array min 1)
  - items[].productId (required)
  - items[].satuan (required, enum SATUAN)
  - items[].quantityShipped (required, int 1-999999)
  - items[].batchNumber (optional, max 50)
  - items[].expiryDate (optional, ISO date)
  - items[].notes (optional, max 500)

Business rules:
- SO harus ready_to_ship atau partial_shipped
- quantityShipped tidak boleh melebihi quantityRemaining item SO
- quantityOrdered item delivery diisi otomatis dari SO
- customerId diisi otomatis dari SO
- shippingAddress diisi otomatis dari SO jika body kosong
- batch/expiry wajib untuk produk tertentu (narkotika/psikotropika/keras) atau sesuai setting
- status awal delivery = packed
- membuat mutasi stok OUT via inventory service
- update quantityShipped/quantityRemaining di SO
- recalculation status SO ke partial_shipped/shipped sesuai kondisi

---

## 6) PUT /deliveries/:id

Hanya bisa jika status delivery saat ini = packed.

Behavior saat update items:
- revert mutasi stok lama
- rollback quantity SO lama
- validasi items baru
- apply ulang mutasi stok baru
- update ulang quantity SO

---

## 7) DELETE /deliveries/:id

Hanya bisa jika status = packed atau canceled.

Behavior:
- jika packed: revert mutasi stok + rollback quantity SO
- jika canceled: langsung hapus (karena rollback sudah terjadi saat cancel)

---

## 8) PATCH /deliveries/:id/status

Body:
- status (required, salah satu DELIVERY_STATUS)
- notes (optional, max 1000)

Status transition yang valid:
- packed -> delivered
- packed -> partial_delivered
- packed -> returned
- packed -> canceled
- partial_delivered -> delivered
- partial_delivered -> returned
- partial_delivered -> canceled

Timestamp behavior:
- delivered dan partial_delivered akan mengisi shippedAt jika belum ada
- delivered mengisi deliveredAt
- returned mengisi returnedAt

Side effects:
- returned atau canceled:
  - revert mutasi inventory
  - rollback quantity SO dan recalculate status SO
- delivered:
  - recalculate SO status
  - auto create invoice finance (best effort)
  - auto create COGS journal finance (best effort)

---

## Integrasi Antar Modul

1) Inventory
- createDelivery: createDeliveryMutations
- updateDelivery: revertDeliveryMutations + createDeliveryMutations
- changeStatus returned/canceled: revertDeliveryMutations

2) Sales Order
- create/update/delete/status-change: recalculate quantityShipped dan quantityRemaining item SO
- status SO disesuaikan ke ready_to_ship / partial_shipped / shipped

3) Finance
- saat status delivered:
  - createInvoiceFromDelivery
  - createCOGSJournal

---

## Perubahan Penting dari Versi Lama

- Status pending, picking, in_transit sudah tidak dipakai pada flow aktif.
- Istilah canceled dipakai sebagai status utama (bukan cancelled).
- Create delivery langsung set status packed.
- Update delivery hanya saat packed.
- Delete delivery hanya saat packed atau canceled.
