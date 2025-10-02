import React, { useState, useEffect } from 'react';
import ExcelService from '../services/ExcelService';
import TempInvoiceService from '../services/TempInvoiceService';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import PDFService from '../services/PDFService';
import CalculationService from '../services/CalculationService';

const InvoiceForm = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    invoiceDate: new Date().toISOString().split('T')[0], // Today's date
    fromDate: '',
    toDate: '',
    makkahHotelName: '',
    makkahHotelRate: '',
    nightsInMakkah: '',
    madinahHotelName: '',
    madinahHotelRate: '',
    nightsInMadinah: '',
    visaRate: '',
    profitPercentage: '',
    perPaxCount: '',
    exchangeRate: '', // SAR to PKR
    ziyaratRate: '', // Ziyarat per pax (SAR)
    airlineName: '',
    airlinePricePkr: '', // per pax in PKR
    packageType: '',
    visa: '',
    transport: '',
    historicalVisit: false
  });

  const [calculations, setCalculations] = useState({
    makkahCost: 0,
    madinahCost: 0,
    visaTotal: 0,
    ziyaratTotal: 0,
    baseTotal: 0,
    withProfit: 0,
    perPax: 0,
    finalInPKR: 0,
    paxCount: 1
  });

  // Store precise (unrounded) values separately for tooltips / exact mode
  const [precise, setPrecise] = useState({});
  const [showExact, setShowExact] = useState(true); // now default precise view

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  // Auto-calculate when form data changes
  useEffect(() => {
    const newCalcs = CalculationService.calculateInvoice(formData);
    // Keep a copy of original precise numeric values before integer display formatting
    setPrecise({
      ...newCalcs,
      // Derive precise totals again if needed (here they are already rounded to 2 in service; for demo we treat them as precise)
    });
    setCalculations(newCalcs);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Allow decimal input directly; strip negatives
    let val = value;
    if (name === 'historicalVisit') {
      setFormData(prev => ({ ...prev, historicalVisit: !prev.historicalVisit }));
      return;
    }
    if (['makkahHotelRate','madinahHotelRate','visaRate','ziyaratRate','profitPercentage','exchangeRate','airlinePricePkr'].includes(name)) {
      if (val === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) {
        setFormData(prev => ({ ...prev, [name]: 0 }));
        return;
      }
      val = val; // keep as typed for now
    }
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const showStatus = (message, type = 'success') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 3000);
  };

  const handleGenerateInvoice = () => {
    if (!formData.clientName) {
      showStatus('Please enter client name', 'error');
      return;
    }
    
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceData = { ...formData, ...calculations, invoiceNumber, generatedAt: new Date().toISOString() };
    console.log('Generated Invoice:', invoiceData);
    // Immediately persist record by appending to Excel (in-memory + trigger download)
    TempInvoiceService.add(invoiceData);
    // Persist to Firestore
    addDoc(collection(db, 'invoices'), { ...invoiceData, createdAt: serverTimestamp() })
      .then(()=> {
        showStatus('Invoice staged & saved to cloud. Use Save to Excel to download sheet.');
      })
      .catch(err=> {
        console.error('Firestore add error', err);
        showStatus('Cloud save failed (check console). Invoice still staged locally.', 'error');
      });
  };

  const handleSaveToExcel = async () => {
    if (!formData.clientName) {
      showStatus('Please enter client name', 'error');
      return;
    }

    try {
      // Commit ALL staged invoices + current snapshot (ensure latest recalculated values included)
      const staged = TempInvoiceService.getAll();
      if (staged.length === 0) {
        showStatus('No staged invoices to save', 'error');
        return;
      }
      for (const inv of staged) await ExcelService.saveInvoiceData(inv);
      TempInvoiceService.clear();
      showStatus('All staged invoices saved to Excel');
    } catch (error) {
      console.error('Excel save error:', error);
      showStatus('Error saving to Excel', 'error');
    }
  };

  const handleExportToPDF = async () => {
    if (!formData.clientName) {
      showStatus('Please enter client name', 'error');
      return;
    }

    try {
      const invoiceData = {
        ...formData,
        ...calculations,
        invoiceNumber: `INV-${Date.now()}`,
        generatedAt: new Date().toISOString()
      };
      
      await PDFService.generateInvoicePDF(invoiceData);
      showStatus('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      showStatus('Error exporting PDF', 'error');
    }
  };

  const formatCurrency = (amount, currency = 'SAR') => {
    if (amount === undefined || amount === null || amount === '' || isNaN(amount)) return `0.00 ${currency}`;
    let num = Number(amount);
    if (!isFinite(num)) num = 0;
    const val = Math.round((num + Number.EPSILON) * 100) / 100;
    return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  return (
    <div className="invoice-form">
      <div className="form-grid">
        {/* Client Information Section */}
        <div className="form-section">
          <h3>Client & Package</h3>
          <div className="form-group">
            <label>
              Client Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              placeholder="Enter client name"
              required
            />
          </div>
          <div className="form-group">
            <label>Invoice Date</label>
            <input
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group two-col">
            <div>
              <label>From Date</label>
              <input type="date" name="fromDate" value={formData.fromDate} onChange={handleInputChange} />
            </div>
            <div>
              <label>To Date</label>
              <input type="date" name="toDate" value={formData.toDate} onChange={handleInputChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Per Pax Count</label>
            <input
              type="number"
              name="perPaxCount"
              value={formData.perPaxCount}
              onChange={handleInputChange}
              placeholder="Number of passengers"
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Package Type</label>
            <select name="packageType" value={formData.packageType} onChange={handleInputChange}>
              <option value="">Select type</option>
              <option value="Double Bed">Double Bed</option>
              <option value="Triple Bed">Triple Bed</option>
              <option value="Quad Bed">Quad Bed</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <div className="form-group">
            <label>Visa Text</label>
            <input type="text" name="visa" placeholder="KSA Umrah visa included" value={formData.visa} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Transport Text</label>
            <input type="text" name="transport" placeholder="6 Sector Sharing Transport By BUS" value={formData.transport} onChange={handleInputChange} />
          </div>
          <div className="form-group checkbox-inline">
            <label className="checkbox-label">
              <input type="checkbox" name="historicalVisit" checked={formData.historicalVisit} onChange={handleInputChange} /> Historical Visit Included
            </label>
          </div>
          <div className="meta-inline">
            <small className="muted">Total Days (auto): { (parseInt(formData.nightsInMakkah)||0) + (parseInt(formData.nightsInMadinah)||0) + 1 }</small>
          </div>
        </div>

        {/* Makkah Hotel Section */}
        <div className="form-section">
          <h3>Makkah Hotel Details</h3>
          <div className="form-group">
            <label>Hotel Name</label>
            <input
              type="text"
              name="makkahHotelName"
              value={formData.makkahHotelName}
              onChange={handleInputChange}
              placeholder="Makkah hotel name"
            />
          </div>
          <div className="form-group">
            <label>Rate per Night (SAR)</label>
            <input
              type="number"
              name="makkahHotelRate"
              value={formData.makkahHotelRate}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Number of Nights</label>
            <input
              type="number"
              name="nightsInMakkah"
              value={formData.nightsInMakkah}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Madinah Hotel Section */}
        <div className="form-section">
          <h3>Madinah Hotel Details</h3>
          <div className="form-group">
            <label>Hotel Name</label>
            <input
              type="text"
              name="madinahHotelName"
              value={formData.madinahHotelName}
              onChange={handleInputChange}
              placeholder="Madinah hotel name"
            />
          </div>
          <div className="form-group">
            <label>Rate per Night (SAR)</label>
            <input
              type="number"
              name="madinahHotelRate"
              value={formData.madinahHotelRate}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Number of Nights</label>
            <input
              type="number"
              name="nightsInMadinah"
              value={formData.nightsInMadinah}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* Additional Charges Section */}
        <div className="form-section">
          <h3>Additional Details</h3>
          <div className="form-group">
            <label>Visa Rate Per Pax (SAR)</label>
              <input
                type="number"
                name="visaRate"
                value={formData.visaRate}
                onChange={handleInputChange}
                placeholder="0"
                step="1"
                inputMode="numeric"
                min="0"
              />
          </div>
          <div className="form-group">
            <label>Ziyarat Rate Per Pax (SAR)</label>
            <input
              type="number"
              name="ziyaratRate"
              value={formData.ziyaratRate}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              inputMode="numeric"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Profit Percentage (%)</label>
            <input
              type="number"
              name="profitPercentage"
              value={formData.profitPercentage}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              min="0"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Exchange Rate (SAR to PKR)</label>
            <input
              type="number"
              name="exchangeRate"
              value={formData.exchangeRate}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Airline Name</label>
            <input
              type="text"
              name="airlineName"
              value={formData.airlineName}
              onChange={handleInputChange}
              placeholder="e.g. Saudi Airline"
            />
          </div>
          <div className="form-group">
            <label>Airline Price Per Pax (PKR)</label>
            <input
              type="number"
              name="airlinePricePkr"
              value={formData.airlinePricePkr}
              onChange={handleInputChange}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Calculations Section */}
      <div className="calculation-section">
        <h3 style={{margin:0}}>Invoice Calculations</h3>
        <div className="calculation-row">
          <span className="calculation-label">Makkah Hotel Cost:</span>
          <span className="calculation-value" title={`Precise: ${precise.makkahCost}`}>{formatCurrency(calculations.makkahCost)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Madinah Hotel Cost:</span>
          <span className="calculation-value" title={`Precise: ${precise.madinahCost}`}>{formatCurrency(calculations.madinahCost)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Visa Total ({calculations.paxCount} pax):</span>
          <span className="calculation-value" title={`Precise: ${precise.visaTotal}`}>{formatCurrency(calculations.visaTotal)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Ziyarat Total ({calculations.paxCount} pax):</span>
          <span className="calculation-value" title={`Precise: ${precise.ziyaratTotal}`}>{formatCurrency(calculations.ziyaratTotal)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Base Total:</span>
          <span className="calculation-value" title={`Precise: ${precise.baseTotal}`}>{formatCurrency(calculations.baseTotal)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">With Profit ({formData.profitPercentage}%):</span>
          <span className="calculation-value" title={`Precise: ${precise.withProfit}`}>{formatCurrency(calculations.withProfit)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Per Pax Cost (SAR):</span>
          <span className="calculation-value" title={`Precise: ${precise.perPaxSar}`}>{formatCurrency(calculations.perPax || calculations.perPaxSar)}</span>
        </div>
        <div className="calculation-row">
            <span className="calculation-label">Per Pax Cost (PKR):</span>
            <span className="calculation-value" title={`Precise: ${precise.perPaxPkr}`}>{formatCurrency(calculations.perPaxPkr || calculations.finalInPKR, 'PKR')}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Airline Per Pax (PKR):</span>
          <span className="calculation-value" title={`Precise: ${precise.airlinePerPaxPkr}`}>{formatCurrency(calculations.airlinePerPaxPkr || formData.airlinePricePkr, 'PKR')}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Airline Total (PKR):</span>
          <span className="calculation-value" title={`Precise: ${precise.airlineTotalPkr}`}>{formatCurrency(calculations.airlineTotalPkr, 'PKR')}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Total With Profit (SAR):</span>
          <span className="calculation-value" title={`Precise: ${precise.withProfit}`}>{formatCurrency(calculations.withProfit)}</span>
        </div>
        <div className="calculation-row">
          <span className="calculation-label">Total With Profit (PKR):</span>
          <span className="calculation-value" title={`Precise: ${precise.totalWithProfitPKR}`}>{formatCurrency(calculations.totalWithProfitPKR || ( (calculations.withProfit || 0) * (parseFloat(formData.exchangeRate)||0)), 'PKR')}</span>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`status-message status-${statusType}`}>
          {statusMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="actions-section">
        <button
          className="btn btn-primary"
          onClick={handleGenerateInvoice}
          disabled={!formData.clientName}
        >
          Generate Invoice
        </button>
        <button
          className="btn btn-success"
          onClick={handleSaveToExcel}
          disabled={!formData.clientName}
        >
          Save to Excel
        </button>
        <button
          className="btn btn-info"
          onClick={handleExportToPDF}
          disabled={!formData.clientName}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;