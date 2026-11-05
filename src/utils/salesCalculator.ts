import Papa from 'papaparse';
import {
  SalesOrder,
  MatrixData,
  RegionQuarterCell,
  RegionVariance,
  VarianceCalculationSummary,
  ProductVariance,
  ChannelVariance,
} from '../types/sales';

// Standardize quarter strings to Q1, Q2, Q3, Q4 when possible
export function normalizeQuarter(raw: any): string {
  if (raw === undefined || raw === null) return 'Unknown';
  const str = String(raw).trim();
  const match = str.match(/q([1-4])/i);
  if (match) {
    return `Q${match[1]}`;
  }
  return str.toUpperCase();
}

// Standardize region strings
export function normalizeRegion(raw: any): string {
  if (!raw) return 'Unknown';
  const str = String(raw).trim();
  if (!str) return 'Unknown';
  // Capitalize nicely e.g. "north" -> "North", "EMEA" -> "EMEA"
  if (str.length <= 4 && str === str.toUpperCase()) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Clean number parses
export function parseCleanNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[\$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

export function parseDiscountPct(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') {
    // If number > 1 (e.g. 15), treat as 0.15
    return val > 1 ? val / 100 : val;
  }
  const str = String(val).replace(/%/g, '').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

export function parseCsvOrders(csvText: string): {
  orders: SalesOrder[];
  errors: string[];
  headersFound: string[];
} {
  const errors: string[] = [];
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.slice(0, 5).forEach((e) => {
      errors.push(`Row ${e.row}: ${e.message}`);
    });
  }

  const rawData = parsed.data as Record<string, any>[];
  if (rawData.length === 0) {
    return { orders: [], errors: ['CSV contains no data rows.'], headersFound: [] };
  }

  const headersFound = Object.keys(rawData[0] || {});

  // Find column keys flexibly
  const findKey = (candidates: string[]): string | undefined => {
    return headersFound.find((h) =>
      candidates.some((c) => h.toLowerCase().replace(/[\s_\-]/g, '') === c.toLowerCase().replace(/[\s_\-]/g, ''))
    );
  };

  const quarterKey = findKey(['quarter', 'qtr', 'period']);
  const regionKey = findKey(['region', 'territory', 'area', 'location']);
  const channelKey = findKey(['channel', 'saleschannel', 'sales_channel', 'type']);
  const productKey = findKey(['product', 'item', 'sku', 'product_name']);
  const unitsKey = findKey(['units', 'quantity', 'qty', 'units_sold']);
  const discountKey = findKey(['discount_pct', 'discount', 'discount_percent', 'discountrate', 'discount_rate']);
  const revenueKey = findKey(['revenue', 'sales', 'total_revenue', 'amount', 'total_amount']);

  const missingColumns: string[] = [];
  if (!quarterKey) missingColumns.push('quarter');
  if (!regionKey) missingColumns.push('region');
  if (!revenueKey) missingColumns.push('revenue');
  if (!unitsKey) missingColumns.push('units');

  if (missingColumns.length > 0) {
    errors.push(`Missing essential column(s): ${missingColumns.join(', ')}. Available columns: ${headersFound.join(', ')}`);
  }

  const orders: SalesOrder[] = [];

  rawData.forEach((row, idx) => {
    const quarter = normalizeQuarter(quarterKey ? row[quarterKey] : '');
    const region = normalizeRegion(regionKey ? row[regionKey] : '');
    const channel = channelKey && row[channelKey] ? String(row[channelKey]).trim() : 'Direct';
    const product = productKey && row[productKey] ? String(row[productKey]).trim() : 'General';
    const units = unitsKey ? Math.round(parseCleanNumber(row[unitsKey], 0)) : 1;
    const discount_pct = discountKey ? parseDiscountPct(row[discountKey]) : 0;
    const revenue = revenueKey ? parseCleanNumber(row[revenueKey], 0) : 0;

    // Filter out rows without quarter or region or valid numbers
    if (quarter && region && !isNaN(revenue)) {
      orders.push({
        quarter,
        region,
        channel,
        product,
        units,
        discount_pct,
        revenue,
      });
    } else {
      if (errors.length < 5) {
        errors.push(`Skipped row ${idx + 1}: incomplete data or invalid revenue value.`);
      }
    }
  });

  return { orders, errors, headersFound };
}

// Compute matrix of Revenue & Units by Region and Quarter
export function computeMatrixData(orders: SalesOrder[]): MatrixData {
  const quarterSet = new Set<string>();
  const regionSet = new Set<string>();

  orders.forEach((o) => {
    quarterSet.add(o.quarter);
    regionSet.add(o.region);
  });

  // Sort quarters logically: Q1, Q2, Q3, Q4, then others
  const standardQuarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
  const quarters = Array.from(quarterSet).sort((a, b) => {
    const idxA = standardQuarterOrder.indexOf(a);
    const idxB = standardQuarterOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const regions = Array.from(regionSet).sort();

  const cells: Record<string, Record<string, RegionQuarterCell>> = {};
  const regionTotals: Record<string, { revenue: number; units: number }> = {};
  const quarterTotals: Record<string, { revenue: number; units: number }> = {};

  regions.forEach((r) => {
    cells[r] = {};
    regionTotals[r] = { revenue: 0, units: 0 };
    quarters.forEach((q) => {
      cells[r][q] = { revenue: 0, units: 0, orderCount: 0, avgDiscountPct: 0 };
    });
  });

  quarters.forEach((q) => {
    quarterTotals[q] = { revenue: 0, units: 0 };
  });

  let grandTotalRevenue = 0;
  let grandTotalUnits = 0;

  // Temporary store discount sums for weighted average discount
  const discountWeightSum: Record<string, Record<string, { totalDiscountTimesUnits: number; totalUnits: number }>> = {};

  orders.forEach((o) => {
    const r = o.region;
    const q = o.quarter;

    if (!cells[r]) cells[r] = {};
    if (!cells[r][q]) cells[r][q] = { revenue: 0, units: 0, orderCount: 0, avgDiscountPct: 0 };

    cells[r][q].revenue += o.revenue;
    cells[r][q].units += o.units;
    cells[r][q].orderCount += 1;

    if (!discountWeightSum[r]) discountWeightSum[r] = {};
    if (!discountWeightSum[r][q]) discountWeightSum[r][q] = { totalDiscountTimesUnits: 0, totalUnits: 0 };

    discountWeightSum[r][q].totalDiscountTimesUnits += o.discount_pct * o.units;
    discountWeightSum[r][q].totalUnits += o.units;

    regionTotals[r].revenue += o.revenue;
    regionTotals[r].units += o.units;

    if (!quarterTotals[q]) quarterTotals[q] = { revenue: 0, units: 0 };
    quarterTotals[q].revenue += o.revenue;
    quarterTotals[q].units += o.units;

    grandTotalRevenue += o.revenue;
    grandTotalUnits += o.units;
  });

  // Calculate weighted average discount per cell
  regions.forEach((r) => {
    quarters.forEach((q) => {
      const dw = discountWeightSum[r]?.[q];
      if (dw && dw.totalUnits > 0) {
        cells[r][q].avgDiscountPct = dw.totalDiscountTimesUnits / dw.totalUnits;
      }
    });
  });

  return {
    quarters,
    regions,
    cells,
    regionTotals,
    quarterTotals,
    grandTotalRevenue,
    grandTotalUnits,
  };
}

// Compute Q2 to Q3 variance for each region, identifying which changed most and why
export function computeQ2ToQ3Variance(orders: SalesOrder[], matrix: MatrixData): VarianceCalculationSummary {
  const hasQ2 = matrix.quarters.includes('Q2');
  const hasQ3 = matrix.quarters.includes('Q3');

  if (!hasQ2 || !hasQ3) {
    return {
      hasQ2AndQ3: false,
      warning: `Your dataset must contain orders for both 'Q2' and 'Q3' to calculate the Q2-Q3 shift. Present quarters: ${matrix.quarters.join(', ')}`,
      mostChangedRegion: null,
      mostChangedByPctRegion: null,
      allRegionVariances: [],
      totalQ2Revenue: matrix.quarterTotals['Q2']?.revenue || 0,
      totalQ3Revenue: matrix.quarterTotals['Q3']?.revenue || 0,
      totalRevenueChange: (matrix.quarterTotals['Q3']?.revenue || 0) - (matrix.quarterTotals['Q2']?.revenue || 0),
      totalPctChange: 0,
      aiPayload: {},
    };
  }

  // Pre-aggregate product and channel numbers in Q2 and Q3 for each region
  const regionProductStats: Record<string, Record<string, { q2Rev: number; q3Rev: number; q2Units: number; q3Units: number }>> = {};
  const regionChannelStats: Record<string, Record<string, { q2Rev: number; q3Rev: number; q2Units: number; q3Units: number }>> = {};

  orders.forEach((o) => {
    if (o.quarter !== 'Q2' && o.quarter !== 'Q3') return;
    const r = o.region;
    const p = o.product;
    const c = o.channel;

    if (!regionProductStats[r]) regionProductStats[r] = {};
    if (!regionProductStats[r][p]) {
      regionProductStats[r][p] = { q2Rev: 0, q3Rev: 0, q2Units: 0, q3Units: 0 };
    }

    if (!regionChannelStats[r]) regionChannelStats[r] = {};
    if (!regionChannelStats[r][c]) {
      regionChannelStats[r][c] = { q2Rev: 0, q3Rev: 0, q2Units: 0, q3Units: 0 };
    }

    if (o.quarter === 'Q2') {
      regionProductStats[r][p].q2Rev += o.revenue;
      regionProductStats[r][p].q2Units += o.units;
      regionChannelStats[r][c].q2Rev += o.revenue;
      regionChannelStats[r][c].q2Units += o.units;
    } else {
      regionProductStats[r][p].q3Rev += o.revenue;
      regionProductStats[r][p].q3Units += o.units;
      regionChannelStats[r][c].q3Rev += o.revenue;
      regionChannelStats[r][c].q3Units += o.units;
    }
  });

  const variances: RegionVariance[] = [];

  matrix.regions.forEach((region) => {
    const q2Cell = matrix.cells[region]?.['Q2'] || { revenue: 0, units: 0, orderCount: 0, avgDiscountPct: 0 };
    const q3Cell = matrix.cells[region]?.['Q3'] || { revenue: 0, units: 0, orderCount: 0, avgDiscountPct: 0 };

    const q2Rev = q2Cell.revenue;
    const q3Rev = q3Cell.revenue;
    const revenueDiff = q3Rev - q2Rev;
    const absRevenueDiff = Math.abs(revenueDiff);
    const pctChange = q2Rev > 0 ? (revenueDiff / q2Rev) * 100 : q3Rev > 0 ? 100 : 0;
    const unitsDiff = q3Cell.units - q2Cell.units;

    // Product breakdown
    const productVariances: ProductVariance[] = [];
    const pStats = regionProductStats[region] || {};
    Object.keys(pStats).forEach((prod) => {
      const p = pStats[prod];
      productVariances.push({
        product: prod,
        q2Revenue: p.q2Rev,
        q3Revenue: p.q3Rev,
        revenueDiff: p.q3Rev - p.q2Rev,
        q2Units: p.q2Units,
        q3Units: p.q3Units,
        unitsDiff: p.q3Units - p.q2Units,
      });
    });

    // Sort products by absolute revenue change descending
    productVariances.sort((a, b) => Math.abs(b.revenueDiff) - Math.abs(a.revenueDiff));

    // Channel breakdown
    const channelVariances: ChannelVariance[] = [];
    const cStats = regionChannelStats[region] || {};
    Object.keys(cStats).forEach((chan) => {
      const c = cStats[chan];
      channelVariances.push({
        channel: chan,
        q2Revenue: c.q2Rev,
        q3Revenue: c.q3Rev,
        revenueDiff: c.q3Rev - c.q2Rev,
        q2Units: c.q2Units,
        q3Units: c.q3Units,
        unitsDiff: c.q3Units - c.q2Units,
      });
    });

    // Sort channels by absolute revenue change descending
    channelVariances.sort((a, b) => Math.abs(b.revenueDiff) - Math.abs(a.revenueDiff));

    const topProduct = productVariances[0]
      ? {
          product: productVariances[0].product,
          revenueDiff: productVariances[0].revenueDiff,
          unitsDiff: productVariances[0].unitsDiff,
        }
      : undefined;

    const topChannel = channelVariances[0]
      ? {
          channel: channelVariances[0].channel,
          revenueDiff: channelVariances[0].revenueDiff,
          unitsDiff: channelVariances[0].unitsDiff,
        }
      : undefined;

    variances.push({
      region,
      q2Revenue: q2Rev,
      q3Revenue: q3Rev,
      revenueDiff,
      absRevenueDiff,
      pctChange,
      q2Units: q2Cell.units,
      q3Units: q3Cell.units,
      unitsDiff,
      q2AvgDiscountPct: q2Cell.avgDiscountPct,
      q3AvgDiscountPct: q3Cell.avgDiscountPct,
      productVariances,
      channelVariances,
      topProductDriver: topProduct,
      topChannelDriver: topChannel,
    });
  });

  // Sort by absolute dollar change descending
  const sortedByAbsDiff = [...variances].sort((a, b) => b.absRevenueDiff - a.absRevenueDiff);
  const mostChangedRegion = sortedByAbsDiff[0] || null;

  // Sort by absolute percent change descending
  const sortedByPct = [...variances].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  const mostChangedByPctRegion = sortedByPct[0] || null;

  const totalQ2Revenue = matrix.quarterTotals['Q2']?.revenue || 0;
  const totalQ3Revenue = matrix.quarterTotals['Q3']?.revenue || 0;
  const totalRevenueChange = totalQ3Revenue - totalQ2Revenue;
  const totalPctChange = totalQ2Revenue > 0 ? (totalRevenueChange / totalQ2Revenue) * 100 : 0;

  // Format compact numbers payload for the AI model to guarantee it has ALL precise numbers
  const aiPayload: Record<string, any> = {
    overview: {
      totalQ2RevenueFormatted: formatCurrency(totalQ2Revenue),
      totalQ3RevenueFormatted: formatCurrency(totalQ3Revenue),
      totalRevenueChangeFormatted: `${totalRevenueChange >= 0 ? '+' : ''}${formatCurrency(totalRevenueChange)}`,
      totalPercentageChangeFormatted: `${totalPctChange >= 0 ? '+' : ''}${totalPctChange.toFixed(1)}%`,
    },
    primaryRegionChangedMostByDollarAmount: mostChangedRegion
      ? {
          region: mostChangedRegion.region,
          q2Revenue: formatCurrency(mostChangedRegion.q2Revenue),
          q3Revenue: formatCurrency(mostChangedRegion.q3Revenue),
          revenueDifferenceDollar: `${mostChangedRegion.revenueDiff >= 0 ? '+' : ''}${formatCurrency(mostChangedRegion.revenueDiff)}`,
          revenuePercentageChange: `${mostChangedRegion.pctChange >= 0 ? '+' : ''}${mostChangedRegion.pctChange.toFixed(1)}%`,
          q2Units: mostChangedRegion.q2Units.toLocaleString(),
          q3Units: mostChangedRegion.q3Units.toLocaleString(),
          unitsDifference: `${mostChangedRegion.unitsDiff >= 0 ? '+' : ''}${mostChangedRegion.unitsDiff.toLocaleString()}`,
          q2AverageDiscountPct: `${(mostChangedRegion.q2AvgDiscountPct * 100).toFixed(1)}%`,
          q3AverageDiscountPct: `${(mostChangedRegion.q3AvgDiscountPct * 100).toFixed(1)}%`,
          whyItChanged_ProductDrivers: mostChangedRegion.productVariances.slice(0, 3).map((p) => ({
            product: p.product,
            revenueChange: `${p.revenueDiff >= 0 ? '+' : ''}${formatCurrency(p.revenueDiff)}`,
            q2Revenue: formatCurrency(p.q2Revenue),
            q3Revenue: formatCurrency(p.q3Revenue),
            unitsChange: `${p.unitsDiff >= 0 ? '+' : ''}${p.unitsDiff.toLocaleString()} units`,
          })),
          whyItChanged_ChannelDrivers: mostChangedRegion.channelVariances.slice(0, 2).map((c) => ({
            channel: c.channel,
            revenueChange: `${c.revenueDiff >= 0 ? '+' : ''}${formatCurrency(c.revenueDiff)}`,
            unitsChange: `${c.unitsDiff >= 0 ? '+' : ''}${c.unitsDiff.toLocaleString()} units`,
          })),
        }
      : null,
    allOtherRegionsComparison: variances
      .filter((v) => v.region !== mostChangedRegion?.region)
      .map((v) => ({
        region: v.region,
        q2Revenue: formatCurrency(v.q2Revenue),
        q3Revenue: formatCurrency(v.q3Revenue),
        revenueChangeDollar: `${v.revenueDiff >= 0 ? '+' : ''}${formatCurrency(v.revenueDiff)}`,
        percentageChange: `${v.pctChange >= 0 ? '+' : ''}${v.pctChange.toFixed(1)}%`,
        unitsChange: `${v.unitsDiff >= 0 ? '+' : ''}${v.unitsDiff.toLocaleString()}`,
      })),
  };

  return {
    hasQ2AndQ3: true,
    mostChangedRegion,
    mostChangedByPctRegion,
    allRegionVariances: sortedByAbsDiff,
    totalQ2Revenue,
    totalQ3Revenue,
    totalRevenueChange,
    totalPctChange,
    aiPayload,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
