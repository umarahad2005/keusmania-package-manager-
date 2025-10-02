import * as XLSX from 'xlsx';
import CalculationService from './CalculationService';

// A single filename for cumulative storage
const CUMULATIVE_FILE_NAME = 'hotel_invoices.xlsx';
const LOCAL_STORAGE_KEY = 'hotel_invoice_records_v1';

function isElectron() {
  return !!(typeof window !== 'undefined' && window.process && window.process.type);
}

function loadLocalRecords() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLocalRecords(records) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    // ignore quota errors silently
  }
}

class ExcelService {
  /**
   * Save (append) invoice data to a single cumulative Excel file.
   * In Electron: attempts to read/write same file directly.
   * In browser: keeps an in-memory/localStorage array and re-downloads updated file each save.
   */
  static async saveInvoiceData(invoiceData) {
    try {
      const newRow = this.prepareExcelData(invoiceData);

      // Load existing dataset
      let allRows = [];

      if (isElectron()) {
        try {
          const fs = window.require ? window.require('fs') : null;
          if (fs && fs.existsSync(CUMULATIVE_FILE_NAME)) {
            const wbData = fs.readFileSync(CUMULATIVE_FILE_NAME);
            const wb = XLSX.read(wbData, { type: 'buffer' });
            const ws = wb.Sheets['Invoices'];
            if (ws) allRows = XLSX.utils.sheet_to_json(ws);
          }
        } catch (e) {
          // fallback to localStorage if fs fails
          allRows = loadLocalRecords();
        }
      } else {
        allRows = loadLocalRecords();
      }

      allRows.push(newRow);
      saveLocalRecords(allRows); // persist in browser too

      // Create workbook & worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allRows);

      // Adjust column widths dynamically (basic heuristic)
      const headers = Object.keys(newRow);
      worksheet['!cols'] = headers.map(h => ({ wch: Math.min(35, Math.max(12, h.length + 2)) }));

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

      if (isElectron()) {
        try {
          const fs = window.require ? window.require('fs') : null;
          if (fs) {
            const wbOut = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            fs.writeFileSync(CUMULATIVE_FILE_NAME, wbOut);
          } else {
            XLSX.writeFile(workbook, CUMULATIVE_FILE_NAME);
          }
        } catch (e) {
          // fallback to browser download
          XLSX.writeFile(workbook, CUMULATIVE_FILE_NAME);
        }
      } else {
        // Browser: trigger download (overwrites prior downloaded copy; user will have multiples unless using Electron)
        XLSX.writeFile(workbook, CUMULATIVE_FILE_NAME);
      }

      return {
        success: true,
        fileName: CUMULATIVE_FILE_NAME,
        rows: allRows.length,
        message: 'Invoice appended to cumulative Excel file'
      };
    } catch (error) {
      console.error('Excel cumulative save error:', error);
      throw new Error('Failed to append invoice: ' + error.message);
    }
  }

  static async appendToExistingFile(invoiceData, fileName = 'hotel_invoices.xlsx') {
    try {
      let workbook;
      let worksheet;
      
      try {
        // Try to read existing file
        const fileBuffer = await this.readExcelFile(fileName);
        workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        worksheet = workbook.Sheets['Invoices'];
      } catch (error) {
        // If file doesn't exist, create new one
        workbook = XLSX.utils.book_new();
        worksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
      }
      
      // Prepare new data
      const newData = this.prepareExcelData(invoiceData);
      
      // Convert existing worksheet to JSON
      const existingData = XLSX.utils.sheet_to_json(worksheet);
      
      // Add new data
      existingData.push(newData);
      
      // Create new worksheet with all data
      const newWorksheet = XLSX.utils.json_to_sheet(existingData);
      
      // Update workbook
      workbook.Sheets['Invoices'] = newWorksheet;
      
      // Save file
      XLSX.writeFile(workbook, fileName);
      
      return {
        success: true,
        fileName: fileName,
        message: 'Data appended to Excel file successfully'
      };
    } catch (error) {
      console.error('Excel append error:', error);
      throw new Error('Failed to append to Excel file: ' + error.message);
    }
  }

  static prepareExcelData(invoiceData) {
    // Numeric helpers preserving two decimals
    const r2 = (v) => {
      const n = parseFloat(v);
      if (isNaN(n) || !isFinite(n)) return 0;
      return Math.round((n + Number.EPSILON) * 100) / 100;
    };
    const exh = parseFloat(invoiceData.exchangeRate) || 1;
  const perPaxSar = r2(invoiceData.perPaxSar !== undefined ? invoiceData.perPaxSar : (invoiceData.perPax || 0));
  // perPaxPkr already includes airline if produced by calculation service; fallback compute and add airline
  const airlinePerPax = r2(invoiceData.airlinePerPaxPkr || invoiceData.airlinePricePkr || 0);
  let perPaxPkr = r2(invoiceData.perPaxPkr !== undefined ? invoiceData.perPaxPkr : (perPaxSar * exh));
  if (airlinePerPax) perPaxPkr = r2(perPaxPkr + airlinePerPax);

    return {
      'Invoice Number': invoiceData.invoiceNumber || CalculationService.generateInvoiceNumber(),
      'Date': invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      'Client Name': invoiceData.clientName || '',
      'From Date': invoiceData.fromDate || '',
      'To Date': invoiceData.toDate || '',
      'Package Type': invoiceData.packageType || '',
      'Visa Text': invoiceData.visa || invoiceData.visaInfo || '',
      'Transport Text': invoiceData.transport || invoiceData.transportInfo || '',
      'Historical Visit': invoiceData.historicalVisit ? 'Yes' : 'No',
      'Pax Count': parseInt(invoiceData.perPaxCount) || invoiceData.paxCount || 1,
      'Makkah Hotel': invoiceData.makkahHotelName || '',
  'Makkah Rate (SAR)': r2(invoiceData.makkahHotelRate),
      'Makkah Nights': parseInt(invoiceData.nightsInMakkah) || 0,
  'Makkah Cost (SAR)': r2(invoiceData.makkahCost),
      'Madinah Hotel': invoiceData.madinahHotelName || '',
  'Madinah Rate (SAR)': r2(invoiceData.madinahHotelRate),
      'Madinah Nights': parseInt(invoiceData.nightsInMadinah) || 0,
  'Madinah Cost (SAR)': r2(invoiceData.madinahCost),
  'Visa Per Pax (SAR)': r2(invoiceData.visaRate),
  'Visa Total (SAR)': r2(invoiceData.visaTotal),
  'Ziyarat Per Pax (SAR)': r2(invoiceData.ziyaratRate),
  'Ziyarat Total (SAR)': r2(invoiceData.ziyaratTotal),
  'Airline Name': invoiceData.airlineName || '',
  'Airline Per Pax (PKR)': airlinePerPax,
  'Airline Total (PKR)': r2(invoiceData.airlineTotalPkr || (airlinePerPax * (parseInt(invoiceData.perPaxCount)||1))),
  'Base Total (SAR)': r2(invoiceData.baseTotal),
  'Profit Percentage': r2(invoiceData.profitPercentage),
  'Total With Profit (SAR)': r2(invoiceData.withProfit),
      'Per Pax Amount (SAR)': perPaxSar,
  'Exchange Rate (SAR->PKR)': r2(exh),
  'Per Pax Amount (PKR)': perPaxPkr,
  'Total With Profit (PKR)': r2(invoiceData.totalWithProfitPKR),
      'Generated At': invoiceData.generatedAt || new Date().toISOString()
    };
  }

  static async readExcelFile(fileName) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target.result);
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsArrayBuffer(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      
      // Simulate click to open file dialog
      // input.click();
      
      // For now, just reject as we'll create new file
      reject(new Error('File not found'));
    });
  }

  static async exportInvoiceHistory() {
    try {
      // This would typically fetch from a database or local storage
      // For now, we'll create a sample structure
      const sampleData = [
        {
          'Invoice Number': 'INV-20240101-001',
          'Date': '2024-01-01',
          'Client Name': 'Sample Client',
          'Total Amount (SAR)': 5000,
          'Per Pax Amount (PKR)': 200000
        }
      ];
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice History');
      
      const fileName = `invoice_history_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      return {
        success: true,
        fileName: fileName,
        message: 'Invoice history exported successfully'
      };
    } catch (error) {
      console.error('Export history error:', error);
      throw new Error('Failed to export invoice history: ' + error.message);
    }
  }
}

export default ExcelService;