class CalculationService {
  static calculateInvoice(formData) {
    const {
      makkahHotelRate = 0,
      nightsInMakkah = 0,
      madinahHotelRate = 0,
      nightsInMadinah = 0,
      visaRate = 0,
      ziyaratRate = 0,
      profitPercentage = 0,
      perPaxCount = 1,
      exchangeRate = 1,
      airlinePricePkr = 0
    } = formData;

    // Safe numeric conversion helper
    const num = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };
    const intNum = (v) => {
      const n = parseInt(v);
      return isNaN(n) ? 0 : n;
    };
    const round2 = (v) => {
      if (!isFinite(v)) return 0;
      // Scale & round
      const scaled = Math.round((v + Number.EPSILON) * 100);
      let result = scaled / 100;
      // Normalize near-integers (e.g. 19.999999999 -> 20)
      const nearInt = Math.round(result);
      if (Math.abs(result - nearInt) < 1e-9) {
        result = nearInt;
      }
      return result;
    };

    const makkahRate = num(makkahHotelRate);
    const makkahNights = intNum(nightsInMakkah);
    const madinahRate = num(madinahHotelRate);
    const madinahNights = intNum(nightsInMadinah);
    const visaPerPax = num(visaRate); // now treated as per pax
    const ziyaratPerPax = num(ziyaratRate); // new field per pax
  const profit = num(profitPercentage);
  const airlinePerPaxPkr = num(airlinePricePkr); // already PKR per pax
    const paxCount = Math.max(1, intNum(perPaxCount));
    const sarToPkr = num(exchangeRate) || 1;

    // Core costs
    const makkahCost = round2(makkahRate * makkahNights);
    const madinahCost = round2(madinahRate * madinahNights);
    const visaTotal = round2(visaPerPax * paxCount);
    const ziyaratTotal = round2(ziyaratPerPax * paxCount);

    // Base total now includes visa & ziyarat totals (both per pax aggregated)
    const baseTotal = round2(makkahCost + madinahCost + visaTotal + ziyaratTotal);
  const withProfit = round2(baseTotal * (1 + (profit / 100)));
  // Per-pax SAR after adding profit
  const perPaxSar = round2(paxCount > 0 ? withProfit / paxCount : 0);
  // Explicit PKR conversion (per pax)
  let perPaxPkr = round2(perPaxSar * sarToPkr);
  // Add airline per pax PKR directly
  perPaxPkr = round2(perPaxPkr + airlinePerPaxPkr);
  const airlineTotalPkr = round2(airlinePerPaxPkr * paxCount);
  // total with profit PKR + airline total
  const totalWithProfitPKR = round2((withProfit * sarToPkr) + airlineTotalPkr);

    return {
      makkahCost,
      madinahCost,
      visaTotal,
      ziyaratTotal,
      baseTotal,
      withProfit,
      perPax: perPaxSar, // backward compatibility
      perPaxSar,
      perPaxPkr,
      finalInPKR: perPaxPkr, // keep old name reference
      totalWithProfitPKR,
      paxCount,
      airlinePerPaxPkr,
      airlineTotalPkr
    };
  }

  static formatCurrency(amount, currency = 'SAR') {
    if (amount === undefined || amount === null || isNaN(amount)) return `0.00 ${currency}`;
    let v = Number(amount);
    if (!isFinite(v)) v = 0;
    // Always show two decimals now
    const str = v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${str} ${currency}`;
  }

  static generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `INV-${year}${month}${day}-${timestamp}`;
  }
}

export default CalculationService;