import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CalculationService from './CalculationService';

class PDFService {
  /**
   * Minimal invoice generation with provided letterhead template.
   * Only shows: Invoice Number, Date, Pax Count, Final Per Pax Amount (PKR & SAR), and a visa inclusion note.
   * The function tries to load an optional background image located at '/assets/invoice_template.png'.
   */
  static async generateInvoicePDF(invoiceData, options = {}) {
    const detailed = options.detailed !== false; // default true (enhanced)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const perPkrFormat = (v)=> (Number(v)||0).toFixed(2);

      // Background (template or fallback banner)
      try {
        const imgData = await this.loadTemplateImage('/assets/invoice_template.png');
        if (imgData) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        } else {
          pdf.setFillColor(20, 42, 84);
          pdf.rect(0, 0, pageWidth, 24, 'F');
          pdf.setFontSize(14);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont(undefined, 'bold');
          pdf.text('INVOICE', pageWidth / 2, 16, { align: 'center' });
        }
      } catch (_) {
        pdf.setFillColor(20, 42, 84);
        pdf.rect(0, 0, pageWidth, 24, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text('INVOICE', pageWidth / 2, 16, { align: 'center' });
      }

      // Data extraction with fallbacks
      const invoiceNumber = invoiceData.invoiceNumber || CalculationService.generateInvoiceNumber();
      const invoiceDate = invoiceData.invoiceDate || new Date().toISOString().split('T')[0];
  const pax = parseInt(invoiceData.perPaxCount || invoiceData.paxCount || 1);
  const toNum = (v)=>{const n = Number(v); return isNaN(n)?0:n;};
  const perPaxSar = toNum(invoiceData.perPaxSar || invoiceData.perPax || 0);
  const perPaxPkr = toNum(invoiceData.perPaxPkr || invoiceData.finalInPKR || 0);
  const totalSar = toNum(invoiceData.totalSar || perPaxSar * pax);
  const totalPkr = toNum(invoiceData.totalWithProfitPKR || invoiceData.totalPkr || perPaxPkr * pax);
  const visaPerPax = toNum(invoiceData.visaRate || 0);
  const ziyaratPerPax = toNum(invoiceData.ziyaratRate || invoiceData.ziyaratPerPax || 0);
  const airlineName = invoiceData.airlineName || '';
  const airlinePerPax = toNum(invoiceData.airlinePerPaxPkr || invoiceData.airlinePricePkr || 0);
  const airlineTotal = toNum(invoiceData.airlineTotalPkr || airlinePerPax * pax);
  const makkahCost = toNum(invoiceData.makkahCost || 0);
  const madinahCost = toNum(invoiceData.madinahCost || 0);
  // Package meta
  const clientName = invoiceData.clientName || '';
  const packageType = invoiceData.packageType || 'Package';
  const nightsInMakkah = parseInt(invoiceData.nightsInMakkah)||0;
  const nightsInMadinah = parseInt(invoiceData.nightsInMadinah)||0;
  const totalDays = nightsInMakkah + nightsInMadinah + 1;
  const visaText = invoiceData.visa || invoiceData.visaInfo || 'KSA Umrah visa included';
  const transportText = invoiceData.transport || invoiceData.transportInfo || '6 Sector Sharing Transport By BUS';
  const historicalVisit = !!invoiceData.historicalVisit;

      // Cursor helpers
      let y = 40; // start below banner
      const lineH = 6.5;
      const add = (t, { bold=false, size=11, indent=0, color=[20,40,70] } = {}) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        const x = 14 + indent * 4; // indent in mm
        pdf.text(String(t), x, y);
        y += lineH;
      };

  // Header info (reduced, rely on template visual identity). Align left margin.
  add(`Invoice #: ${invoiceNumber}`, { bold: true, size: 11 });
  add(`Date: ${invoiceDate}`);
  add(`PAX: ${pax}`);
  if (clientName) add(`Client: ${clientName}`);
  y += 1;

      // Package details block positioned near top (before financial summaries)
      const pkgStartY = y; // capture starting Y for potential future positioning adjustments
      const pkgLines = [
        `${totalDays} Day Umrah Package for ${pax} Pax with ${packageType}`,
        `Makkah Hotel: ${invoiceData.makkahHotelName || ''}`,
        `Madinah Hotel: ${invoiceData.madinahHotelName || ''}`,
        `${nightsInMakkah} Nights in Makkah & ${nightsInMadinah} Nights in Madinah`,
        visaText,
        transportText
      ];
      if (historicalVisit) pkgLines.push('Historical visit of both holy cities');
      pkgLines.push('This Package is valid for the next 24 Hours');

  pkgLines.forEach(line => add(line, { size: 9.5, color:[15,35,60] }));
  y += 1; // spacer

      // Display centered financial summary (Total + Per Pax) without box
      // Push content slightly further down to avoid overlapping template header elements
      if (y < 70) y = 70;
      const center = (text, size=12, bold=false, color=[15,35,60]) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.text(String(text), pageWidth/2, y, { align: 'center' });
        y += 7; // centered line spacing
      };

      // Total Amount (all pax) large & bold
      center('TOTAL AMOUNT (PKR)', 14, true, [20,42,84]);
      center(`PKR ${totalPkr.toFixed(2)}`, 20, true, [0,0,0]);
      y += 2;
      // Per pax line
      center(`Per Pax: PKR ${perPaxPkr.toFixed(2)}`, 14, true, [30,30,30]);
      y += 2;
      // Optional airline & visa info (centered, smaller)
      if (airlineName && airlinePerPax > 0) {
        center(`Includes Airline (${airlineName}) PKR ${airlinePerPax.toFixed(2)} / pax`, 9, false, [60,60,60]);
      }
      if (visaPerPax) center(`Visa Included (SAR ${visaPerPax.toFixed(2)} per pax)`, 9, false, [60,60,60]);

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica','normal');
      pdf.setTextColor(90,90,90);
  pdf.text('Generated by Karwan-e-Usmania Package Manager', pageWidth/2, pageHeight - 14, { align: 'center' });
      pdf.text(new Date().toLocaleString(), pageWidth/2, pageHeight - 8, { align: 'center' });

      const fileName = `invoice_${invoiceNumber}.pdf`;
      pdf.save(fileName);
      return { success: true, fileName, message: detailed ? 'Detailed invoice PDF generated' : 'Minimal invoice PDF generated' };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  // Helper to fetch template image and convert to base64
  static async loadTemplateImage(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('Template image not found');
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null; // silently ignore so we can fallback
    }
  }

  static addInvoiceHeader(pdf, invoiceData) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Company/Title header
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('HOTEL INVOICE', pageWidth / 2, 30, { align: 'center' });
    
    // Invoice number and date
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const invoiceNumber = invoiceData.invoiceNumber || CalculationService.generateInvoiceNumber();
    const invoiceDate = invoiceData.invoiceDate || new Date().toISOString().split('T')[0];
    
    pdf.text(`Invoice #: ${invoiceNumber}`, 20, 50);
    pdf.text(`Date: ${invoiceDate}`, pageWidth - 20, 50, { align: 'right' });
    
    // Add line separator
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(52, 152, 219);
    pdf.line(20, 55, pageWidth - 20, 55);
  }

  static addClientDetails(pdf, invoiceData) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Client Information', 20, 70);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    
    let yPos = 80;
    pdf.text(`Client Name: ${invoiceData.clientName || 'N/A'}`, 20, yPos);
    yPos += 10;
    pdf.text(`Number of Passengers: ${invoiceData.perPaxCount || 1}`, 20, yPos);
  }

  static addHotelDetails(pdf, invoiceData) {
    let yPos = 110;
    
    // Makkah Hotel Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Makkah Hotel Details', 20, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    
    yPos += 10;
    pdf.text(`Hotel Name: ${invoiceData.makkahHotelName || 'N/A'}`, 25, yPos);
    yPos += 8;
    pdf.text(`Rate per Night: ${CalculationService.formatCurrency(invoiceData.makkahHotelRate)}`, 25, yPos);
    yPos += 8;
    pdf.text(`Number of Nights: ${invoiceData.nightsInMakkah || 0}`, 25, yPos);
    yPos += 8;
    pdf.text(`Total Cost: ${CalculationService.formatCurrency(invoiceData.makkahCost)}`, 25, yPos);
    
    yPos += 20;
    
    // Madinah Hotel Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Madinah Hotel Details', 20, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    
    yPos += 10;
    pdf.text(`Hotel Name: ${invoiceData.madinahHotelName || 'N/A'}`, 25, yPos);
    yPos += 8;
    pdf.text(`Rate per Night: ${CalculationService.formatCurrency(invoiceData.madinahHotelRate)}`, 25, yPos);
    yPos += 8;
    pdf.text(`Number of Nights: ${invoiceData.nightsInMadinah || 0}`, 25, yPos);
    yPos += 8;
    pdf.text(`Total Cost: ${CalculationService.formatCurrency(invoiceData.madinahCost)}`, 25, yPos);
  }

  static addCalculations(pdf, invoiceData) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 220;
    
    // Calculations section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Invoice Calculations', 20, yPos);
    
    // Add background for calculation area
    pdf.setFillColor(236, 240, 241);
    pdf.rect(20, yPos + 5, pageWidth - 40, 60, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    
    yPos += 15;
    
    const calculations = [
      { label: 'Makkah Hotel Cost:', value: CalculationService.formatCurrency(invoiceData.makkahCost) },
      { label: 'Madinah Hotel Cost:', value: CalculationService.formatCurrency(invoiceData.madinahCost) },
      { label: `Visa Total (${invoiceData.perPaxCount || 1} pax):`, value: CalculationService.formatCurrency(invoiceData.visaTotal) },
      { label: `Ziyarat Total (${invoiceData.perPaxCount || 1} pax):`, value: CalculationService.formatCurrency(invoiceData.ziyaratTotal) },
      { label: 'Base Total:', value: CalculationService.formatCurrency(invoiceData.baseTotal) },
      { label: `With Profit (${invoiceData.profitPercentage || 0}%):`, value: CalculationService.formatCurrency(invoiceData.withProfit) },
      { label: 'Per Pax Cost (SAR):', value: CalculationService.formatCurrency(invoiceData.perPax) }
    ];
    
    calculations.forEach(calc => {
      pdf.text(calc.label, 25, yPos);
      pdf.text(calc.value, pageWidth - 25, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // Final amount highlight
    yPos += 5;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(39, 174, 96);
    pdf.text('Final Amount per Pax (PKR):', 25, yPos);
    pdf.text(CalculationService.formatCurrency(invoiceData.finalInPKR, 'PKR'), pageWidth - 25, yPos, { align: 'right' });
    
    // Exchange rate note
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(127, 140, 141);
    pdf.text(`Exchange Rate Used: 1 SAR = ${invoiceData.exchangeRate || 1} PKR`, 25, yPos);
  }

  static addFooter(pdf) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Footer line
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(52, 152, 219);
    pdf.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
    
    // Footer text
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(127, 140, 141);
    pdf.text('Generated by Hotel Invoice Manager', pageWidth / 2, pageHeight - 20, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  static async generateInvoiceFromTemplate(invoiceData, templateElement) {
    try {
      // This method would use a custom template
      // For now, we'll use the standard generation
      if (templateElement) {
        // Convert HTML template to canvas then to PDF
        const canvas = await html2canvas(templateElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        const fileName = `template_invoice_${invoiceData.clientName?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        return {
          success: true,
          fileName: fileName,
          message: 'Template-based PDF generated successfully'
        };
      } else {
        // Fallback to standard generation
        return await this.generateInvoicePDF(invoiceData);
      }
    } catch (error) {
      console.error('Template PDF generation error:', error);
      throw new Error('Failed to generate template PDF: ' + error.message);
    }
  }

  static async generateReceiptPDF(invoiceData) {
    try {
      const pdf = new jsPDF('p', 'mm', [80, 200]); // Receipt size
      
      // Compact receipt format
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('PAYMENT RECEIPT', 40, 20, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      
      let yPos = 35;
      pdf.text(`Client: ${invoiceData.clientName}`, 5, yPos);
      yPos += 10;
      pdf.text(`Date: ${invoiceData.invoiceDate}`, 5, yPos);
      yPos += 10;
      pdf.text(`Invoice #: ${invoiceData.invoiceNumber}`, 5, yPos);
      yPos += 15;
      
      pdf.setFont(undefined, 'bold');
      pdf.text(`Amount: ${CalculationService.formatCurrency(invoiceData.finalInPKR, 'PKR')}`, 5, yPos);
      
      const fileName = `receipt_${invoiceData.clientName?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      return {
        success: true,
        fileName: fileName,
        message: 'Receipt generated successfully'
      };
    } catch (error) {
      console.error('Receipt generation error:', error);
      throw new Error('Failed to generate receipt: ' + error.message);
    }
  }
}

export default PDFService;