/* ── Settings Constants & Defaults ── */

export const SELF_INSPECTION_SCHEDULE = {
  monthly: 'Bulanan',
  quarterly: 'Per 3 Bulan',
  biannually: 'Per 6 Bulan',
  annually: 'Tahunan',
};

export const CUSTOMER_TYPES = {
  apotek: 'Apotek',
  rumah_sakit: 'Rumah Sakit',
  klinik: 'Klinik',
  puskesmas: 'Puskesmas',
  toko_obat: 'Toko Obat',
  pemerintah: 'Pemerintah',
  pbf_lain: 'PBF Lain',
};

export const TIMEZONE_OPTIONS = {
  'Asia/Jakarta': 'WIB (Waktu Indonesia Barat)',
  'Asia/Makassar': 'WITA (Waktu Indonesia Tengah)',
  'Asia/Jayapura': 'WIT (Waktu Indonesia Timur)',
};

export const DATE_FORMAT_OPTIONS = {
  'DD/MM/YYYY': '01/04/2026',
  'MM/DD/YYYY': '04/01/2026',
  'YYYY-MM-DD': '2026-04-01',
};

export const LANGUAGE_OPTIONS = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

export const DOC_TYPE_LABELS = {
  invoice: 'Invoice',
  purchaseOrder: 'Purchase Order',
  deliveryOrder: 'Delivery Order',
  returnOrder: 'Return Order',
};

/** Default settings — digunakan sebagai fallback jika settings belum di-fetch dari server */
export const DEFAULT_SETTINGS = {
  company: {
    name: '',
    logo: null,
    phone: '',
    email: '',
    website: '',
    officeAddress: { street: '', city: '', province: '', postalCode: '', country: 'Indonesia' },
    warehouseAddress: { street: '', city: '', province: '', postalCode: '', country: 'Indonesia' },
    licenses: {
      pbf: { number: '', issuedDate: null, expiryDate: null },
      siup: { number: '', issuedDate: null, expiryDate: null },
      tdp: { number: '', issuedDate: null, expiryDate: null },
      nib: { number: '' },
      cdob: { number: '', issuedDate: null, expiryDate: null },
    },
    responsiblePharmacist: {
      name: '', sipaNumber: '', straNumber: '',
      sipaExpiry: null, straExpiry: null, phone: '', email: '',
    },
    responsiblePharmacistObat: {
      name: '', sipaNumber: '', straNumber: '',
      sipaExpiry: null, straExpiry: null, phone: '', email: '',
    },
    responsiblePharmacistAlkes: {
      name: '', sipaNumber: '', straNumber: '',
      sipaExpiry: null, straExpiry: null, phone: '', email: '',
    },
    tax: { npwp: '', isPkp: false, defaultPpnRate: 11 },
  },
  invoice: { prefix: 'INV', autoNumber: true, defaultPaymentTermDays: 30 },
  purchaseOrder: { prefix: 'SP', autoNumber: true, requireApproval: true, approvalLevels: 2 },
  deliveryOrder: { prefix: 'SJ', autoNumber: true },
  returnOrder: { prefix: 'RET', autoNumber: true, maxReturnDays: 14 },
  inventory: {
    enableBatchTracking: true,
    enableExpiryDate: true,
    useFEFO: true,
    lowStockThreshold: 10,
    temperatureZones: [
      { name: 'CRT (Controlled Room Temperature)', minTemp: 15, maxTemp: 25 },
      { name: 'Ruang Sejuk', minTemp: 8, maxTemp: 15 },
      { name: 'Lemari Es', minTemp: 2, maxTemp: 8 },
    ],
  },
  cdob: {
    enableTemperatureLog: true,
    enableRecallManagement: true,
    enableComplaintTracking: true,
    selfInspectionSchedule: 'quarterly',
    documentRetentionYears: 5,
  },
  medication: {
    trackNarcotic: true,
    trackPsychotropic: true,
    trackPrecursor: true,
    trackOtc: false,
    requireSpecialSP: true,
  },
  customer: {
    requireSIA: true,
    customerTypes: ['apotek', 'rumah_sakit', 'klinik', 'puskesmas'],
    defaultCreditLimit: 50000000,
  },
  payment: {
    bankAccounts: [],
    allowPartialPayment: true,
    allowCreditPayment: true,
    latePenaltyRate: 2,
  },
  notification: {
    enableEmail: true,
    enableSMS: false,
    enableWhatsApp: false,
    alerts: {
      lowStock: true, nearExpiry: true, overduePayment: true,
      recall: true, temperatureAlert: true,
    },
    smtp: { host: '', port: 587, user: '', password: '', fromName: '', fromEmail: '' },
  },
  reporting: {
    bpom: { enableEReport: false, apiKey: '' },
    fiscalYearStart: 1,
    currency: 'IDR',
  },
  general: {
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    language: 'id',
    maintenanceMode: false,
    sessionTimeoutMinutes: 60,
  },
};
