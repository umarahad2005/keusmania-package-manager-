import CalculationService from './CalculationService';

/**
 * These tests cover core pricing logic independent of Firebase.
 * Run with: npm test -- CalculationService
 */

describe('CalculationService.calculateInvoice', () => {
  it('computes per pax PKR including airline fare correctly', () => {
    const formData = {
      makkahHotelRate: 100, // SAR
      nightsInMakkah: 2,
      madinahHotelRate: 150, // SAR
      nightsInMadinah: 1,
      visaRate: 50, // per pax SAR
      ziyaratRate: 20, // per pax SAR
      profitPercentage: 10, // %
      perPaxCount: 2,
      exchangeRate: 75, // SAR -> PKR
      airlinePricePkr: 50000 // per pax PKR
    };

    const r = CalculationService.calculateInvoice(formData);
    // Breakdown expectation (see reasoning in code comments):
    // Makkah: 100 * 2 = 200
    // Madinah: 150 * 1 = 150
    // Visa total: 50 * 2 = 100
    // Ziyarat total: 20 * 2 = 40
    // Base = 490
    // With profit 10% => 539
    // Per pax SAR = 539 / 2 = 269.5
    // Per pax PKR (before airline) = 269.5 * 75 = 20212.5
    // Add airline per pax 50000 => 70212.5
    expect(r.makkahCost).toBe(200);
    expect(r.madinahCost).toBe(150);
    expect(r.visaTotal).toBe(100);
    expect(r.ziyaratTotal).toBe(40);
    expect(r.baseTotal).toBe(490);
    expect(r.withProfit).toBe(539);
    expect(r.perPaxSar).toBe(269.5);
    expect(r.perPaxPkr).toBe(70212.5);
    expect(r.airlinePerPaxPkr).toBe(50000);
    expect(r.airlineTotalPkr).toBe(100000);
    expect(r.totalWithProfitPKR).toBe(140425); // 539*75 + 100000
  });

  it('handles missing / zero values safely', () => {
    const r = CalculationService.calculateInvoice({});
    expect(r.baseTotal).toBe(0);
    expect(r.perPaxSar).toBe(0);
    expect(r.perPaxPkr).toBe(0);
    expect(r.paxCount).toBe(1);
  });
});

describe('CalculationService.formatCurrency', () => {
  it('formats with two decimals and currency code', () => {
    expect(CalculationService.formatCurrency(123)).toBe('123.00 SAR');
    expect(CalculationService.formatCurrency(123.4, 'PKR')).toBe('123.40 PKR');
    expect(CalculationService.formatCurrency(undefined)).toBe('0.00 SAR');
  });
});
