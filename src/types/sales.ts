export interface SalesOrder {
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
}

export interface RegionQuarterCell {
  revenue: number;
  units: number;
  orderCount: number;
  avgDiscountPct: number;
}

export interface ProductVariance {
  product: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueDiff: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
}

export interface ChannelVariance {
  channel: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueDiff: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
}

export interface RegionVariance {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueDiff: number;
  absRevenueDiff: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  productVariances: ProductVariance[];
  channelVariances: ChannelVariance[];
  topProductDriver?: {
    product: string;
    revenueDiff: number;
    unitsDiff: number;
  };
  topChannelDriver?: {
    channel: string;
    revenueDiff: number;
    unitsDiff: number;
  };
}

export interface VarianceCalculationSummary {
  hasQ2AndQ3: boolean;
  warning?: string;
  mostChangedRegion: RegionVariance | null;
  mostChangedByPctRegion: RegionVariance | null;
  allRegionVariances: RegionVariance[];
  totalQ2Revenue: number;
  totalQ3Revenue: number;
  totalRevenueChange: number;
  totalPctChange: number;
  // Compact strictly computed summary object ready for the AI
  aiPayload: Record<string, any>;
}

export interface MatrixData {
  quarters: string[];
  regions: string[];
  cells: Record<string, Record<string, RegionQuarterCell>>; // region -> quarter -> cell
  regionTotals: Record<string, { revenue: number; units: number }>;
  quarterTotals: Record<string, { revenue: number; units: number }>;
  grandTotalRevenue: number;
  grandTotalUnits: number;
}
