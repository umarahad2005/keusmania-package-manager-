// Temporary invoice storage (buffer) before committing to Excel.
// Uses localStorage so multiple generated invoices accumulate until user saves.

const TEMP_KEY = 'temp_invoice_buffer_v1';

function load() {
  try {
    const raw = localStorage.getItem(TEMP_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function persist(list) {
  try { localStorage.setItem(TEMP_KEY, JSON.stringify(list)); } catch (_) { /* ignore */ }
}

class TempInvoiceService {
  static add(invoice) {
    const list = load();
    // dedupe by invoiceNumber
    const idx = list.findIndex(r => r.invoiceNumber === invoice.invoiceNumber);
    if (idx >= 0) list[idx] = invoice; else list.push(invoice);
    persist(list);
    return list.length;
  }

  static getAll() { return load(); }

  static clear() { persist([]); }

  static remove(invoiceNumber) {
    const list = load().filter(r => r.invoiceNumber !== invoiceNumber);
    persist(list);
    return list.length;
  }
}

export default TempInvoiceService;