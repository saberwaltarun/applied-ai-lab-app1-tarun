export const SAMPLE_CSV_DATA = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North,Direct,Cloud Platform,420,0.10,210000
Q1,North,Partner,Analytics Suite,260,0.12,130000
Q1,North,Online,Security Gateway,310,0.08,124000
Q1,South,Direct,Cloud Platform,350,0.15,175000
Q1,South,Partner,Data Hub,190,0.10,95000
Q1,East,Direct,Analytics Suite,510,0.10,255000
Q1,East,Online,Cloud Platform,400,0.05,200000
Q1,East,Enterprise,Security Gateway,280,0.15,140000
Q1,West,Direct,Cloud Platform,380,0.10,190000
Q1,West,Enterprise,Data Hub,300,0.12,150000
Q1,West,Online,Analytics Suite,240,0.08,120000
Q2,North,Direct,Cloud Platform,450,0.10,225000
Q2,North,Partner,Analytics Suite,290,0.15,145000
Q2,North,Online,Security Gateway,320,0.10,128000
Q2,North,Enterprise,Data Hub,210,0.12,105000
Q2,South,Direct,Cloud Platform,390,0.12,195000
Q2,South,Partner,Data Hub,220,0.10,110000
Q2,South,Online,Security Gateway,260,0.08,104000
Q2,East,Direct,Analytics Suite,540,0.10,270000
Q2,East,Online,Cloud Platform,430,0.05,215000
Q2,East,Enterprise,Security Gateway,310,0.14,155000
Q2,East,Partner,Data Hub,180,0.10,90000
Q2,West,Direct,Cloud Platform,410,0.10,205000
Q2,West,Enterprise,Data Hub,290,0.12,145000
Q2,West,Online,Analytics Suite,220,0.08,110000
Q3,North,Direct,Cloud Platform,410,0.10,205000
Q3,North,Partner,Analytics Suite,250,0.15,125000
Q3,North,Online,Security Gateway,290,0.10,116000
Q3,North,Enterprise,Data Hub,220,0.12,112000
Q3,South,Direct,Cloud Platform,430,0.12,215000
Q3,South,Partner,Data Hub,250,0.10,125000
Q3,South,Online,Security Gateway,310,0.08,124000
Q3,East,Direct,Analytics Suite,590,0.10,295000
Q3,East,Online,Cloud Platform,460,0.05,230000
Q3,East,Enterprise,Security Gateway,340,0.14,170000
Q3,East,Partner,Data Hub,230,0.10,115000
Q3,West,Direct,Cloud Platform,780,0.08,390000
Q3,West,Enterprise,Cloud Platform,520,0.05,260000
Q3,West,Enterprise,Data Hub,380,0.10,190000
Q3,West,Online,Analytics Suite,290,0.06,145000
Q4,North,Direct,Cloud Platform,490,0.10,245000
Q4,North,Partner,Analytics Suite,310,0.15,155000
Q4,North,Online,Security Gateway,360,0.10,144000
Q4,South,Direct,Cloud Platform,480,0.12,240000
Q4,South,Partner,Data Hub,280,0.10,140000
Q4,East,Direct,Analytics Suite,630,0.10,315000
Q4,East,Online,Cloud Platform,500,0.05,250000
Q4,East,Enterprise,Security Gateway,370,0.14,185000
Q4,West,Direct,Cloud Platform,820,0.08,410000
Q4,West,Enterprise,Cloud Platform,560,0.05,280000
Q4,West,Enterprise,Data Hub,410,0.10,205000`;

export function downloadSampleCsvFile(): void {
  const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sales_orders_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
