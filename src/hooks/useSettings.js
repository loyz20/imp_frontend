import useSettingsStore from '../store/settingsStore';
import { DEFAULT_SETTINGS } from '../constants/settings';

/**
 * Hook untuk mengakses settings aplikasi dari mana saja.
 * Mengembalikan settings dengan fallback ke default values jika belum di-fetch.
 */
export default function useSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const isLoading = useSettingsStore((s) => s.isLoading);

  /** Ambil section tertentu dengan fallback ke default */
  const getSection = (section) => {
    return settings?.[section] ?? DEFAULT_SETTINGS[section] ?? {};
  };

  /** Shortcut — settings umum */
  const general = settings?.general ?? DEFAULT_SETTINGS.general;
  const company = settings?.company ?? DEFAULT_SETTINGS.company;
  const tax = settings?.company?.tax ?? DEFAULT_SETTINGS.company.tax;
  const inventory = settings?.inventory ?? DEFAULT_SETTINGS.inventory;
  const medication = settings?.medication ?? DEFAULT_SETTINGS.medication;
  const customer = settings?.customer ?? DEFAULT_SETTINGS.customer;
  const payment = settings?.payment ?? DEFAULT_SETTINGS.payment;
  const notification = settings?.notification ?? DEFAULT_SETTINGS.notification;
  const reporting = settings?.reporting ?? DEFAULT_SETTINGS.reporting;
  const cdob = settings?.cdob ?? DEFAULT_SETTINGS.cdob;

  /** Tarif PPN aktif */
  const ppnRate = tax.defaultPpnRate ?? 11;
  const isPkp = tax.isPkp ?? false;

  /** Hitung PPN dari nilai */
  const calculatePpn = (amount) => isPkp ? Math.round(amount * ppnRate / 100) : 0;

  /** Cek apakah maintenance mode aktif */
  const isMaintenanceMode = general.maintenanceMode ?? false;

  /** Session timeout dalam milidetik */
  const sessionTimeoutMs = (general.sessionTimeoutMinutes ?? 60) * 60 * 1000;

  /** Apakah batch tracking aktif */
  const isBatchTrackingEnabled = inventory.enableBatchTracking ?? true;

  /** Apakah menggunakan FEFO */
  const isFEFOEnabled = inventory.useFEFO ?? true;

  /** Threshold stok rendah */
  const lowStockThreshold = inventory.lowStockThreshold ?? 10;

  /** Zona suhu yang dikonfigurasi */
  const temperatureZones = inventory.temperatureZones ?? DEFAULT_SETTINGS.inventory.temperatureZones;

  /** Prefix dokumen berdasarkan tipe */
  const getDocPrefix = (type) => {
    const section = settings?.[type] ?? DEFAULT_SETTINGS[type];
    return section?.prefix ?? '';
  };

  /** Apakah auto-number aktif untuk tipe dokumen */
  const isAutoNumber = (type) => {
    const section = settings?.[type] ?? DEFAULT_SETTINGS[type];
    return section?.autoNumber ?? true;
  };

  /** Setting Purchase Order */
  const requirePOApproval = settings?.purchaseOrder?.requireApproval ?? DEFAULT_SETTINGS.purchaseOrder.requireApproval;
  const poApprovalLevels = settings?.purchaseOrder?.approvalLevels ?? DEFAULT_SETTINGS.purchaseOrder.approvalLevels;

  /** Batas hari retur */
  const maxReturnDays = settings?.returnOrder?.maxReturnDays ?? DEFAULT_SETTINGS.returnOrder.maxReturnDays;

  /** Jatuh tempo default (hari) */
  const defaultPaymentTermDays = settings?.invoice?.defaultPaymentTermDays ?? DEFAULT_SETTINGS.invoice.defaultPaymentTermDays;

  /** Tipe pelanggan aktif */
  const activeCustomerTypes = customer.customerTypes ?? DEFAULT_SETTINGS.customer.customerTypes;

  /** Credit limit default */
  const defaultCreditLimit = customer.defaultCreditLimit ?? DEFAULT_SETTINGS.customer.defaultCreditLimit;

  /** Apakah SIA diperlukan */
  const requireSIA = customer.requireSIA ?? true;

  /** Bank accounts */
  const bankAccounts = payment.bankAccounts ?? [];

  /** Notifikasi alert aktif */
  const activeAlerts = notification.alerts ?? DEFAULT_SETTINGS.notification.alerts;

  /** Nama perusahaan */
  const companyName = company.name || 'PBF';

  return {
    settings,
    isLoading,
    getSection,

    // General
    general,
    isMaintenanceMode,
    sessionTimeoutMs,
    timezone: general.timezone,
    dateFormat: general.dateFormat,
    language: general.language,

    // Company
    company,
    companyName,
    tax,
    ppnRate,
    isPkp,
    calculatePpn,

    // Documents
    getDocPrefix,
    isAutoNumber,
    requirePOApproval,
    poApprovalLevels,
    maxReturnDays,
    defaultPaymentTermDays,

    // Inventory
    inventory,
    isBatchTrackingEnabled,
    isFEFOEnabled,
    lowStockThreshold,
    temperatureZones,

    // CDOB
    cdob,

    // Medication
    medication,

    // Customer
    customer,
    activeCustomerTypes,
    defaultCreditLimit,
    requireSIA,

    // Payment
    payment,
    bankAccounts,

    // Notification
    notification,
    activeAlerts,

    // Reporting
    reporting,
  };
}
