import { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSalesReportQuery,
  useTopProductsQuery,
  useInventoryReportQuery,
  useActivityFeedQuery,
  useStockValueReportQuery,
} from '@/api/peopleApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { formatPrice, formatDate, timeAgo } from '@/lib/format';
import {
  createReportDoc,
  addSection,
  addTable,
  addKeyValueList,
  addTileGrid,
  addEmpty,
  savePdf,
  fmtPdfPrice,
} from '@/lib/pdf';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatBucket = (id) => {
  if (id?.d) return `${id.y}-${String(id.m).padStart(2, '0')}-${String(id.d).padStart(2, '0')}`;
  if (id?.w) return `${id.y} W${id.w}`;
  if (id?.m) return `${id.y}-${String(id.m).padStart(2, '0')}`;
  return '';
};

export default function Reports() {
  const [groupBy, setGroupBy] = useState('day');

  const { data: sales } = useSalesReportQuery({ groupBy });
  const { data: topProducts } = useTopProductsQuery({ limit: 10 });
  const { data: inventory } = useInventoryReportQuery({ lowStockOnly: false });
  const { data: activity } = useActivityFeedQuery({ limit: 20 });
  const { data: stockValue } = useStockValueReportQuery();

  const chartData = (sales?.data || []).map((row) => ({
    label: formatBucket(row._id),
    revenue: row.revenue,
    orders: row.orderCount,
    itemsSold: row.itemsSold,
  }));

  const inv = inventory?.data || [];
  const sv = stockValue?.data || { totalSKUs: 0, totalUnits: 0, totalValue: 0 };

  // ===== PDF generators =====

  const downloadSalesPdf = () => {
    try {
      const doc = createReportDoc('Sales Report', `Grouped by ${groupBy} · ${chartData.length} data points`);
      addKeyValueList(doc, [
        ['Total buckets', chartData.length],
        ['Total orders', chartData.reduce((s, r) => s + (r.orders || 0), 0)],
        ['Total revenue', fmtPdfPrice(chartData.reduce((s, r) => s + (r.revenue || 0), 0))],
        ['Total items sold', chartData.reduce((s, r) => s + (r.itemsSold || 0), 0)],
      ]);
      addSection(doc, 'Sales by period');
      if (chartData.length === 0) {
        addEmpty(doc, 'No sales recorded yet.');
      } else {
        addTable(
          doc,
          ['Period', 'Orders', 'Items sold', 'Revenue (Rs)'],
          chartData.map((r) => [r.label, r.orders, r.itemsSold || 0, fmtPdfPrice(r.revenue)])
        );
      }
      savePdf(doc, `riwaya-sales-${groupBy}`);
      toast.success('Sales PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  const downloadTopProductsPdf = () => {
    try {
      const items = topProducts?.data || [];
      const doc = createReportDoc('Top-Selling Products', `Ranked by units sold · ${items.length} products`);
      if (!items.length) {
        addEmpty(doc, 'No sales recorded yet.');
      } else {
        addTable(
          doc,
          ['#', 'Product', 'Units sold', 'Revenue (Rs)'],
          items.map((p, i) => [i + 1, p.productName, p.unitsSold, fmtPdfPrice(p.revenue)])
        );
      }
      savePdf(doc, 'riwaya-top-products');
      toast.success('Top products PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  const downloadInventoryPdf = () => {
    try {
      const doc = createReportDoc('Inventory Health Report', `${inv.length} active SKUs · stock value: ${fmtPdfPrice(sv.totalValue)}`);
      addTileGrid(doc, [
        ['Total SKUs', sv.totalSKUs],
        ['Units in stock', sv.totalUnits],
        ['Stock value', fmtPdfPrice(sv.totalValue)],
        ['Low/Out of stock', inv.filter((i) => i.status !== 'ok').length],
      ]);
      addSection(doc, 'Per-item breakdown');
      if (!inv.length) {
        addEmpty(doc, 'No stock items.');
      } else {
        addTable(
          doc,
          ['SKU', 'Item', 'Qty', 'Min level', 'Unit cost', 'Stock value', 'Status'],
          inv.map((it) => [
            it.sku,
            it.name,
            it.totalQuantity,
            it.minStockLevel,
            fmtPdfPrice(it.unitCost),
            fmtPdfPrice(it.stockValue),
            it.status.replace(/_/g, ' '),
          ])
        );
      }
      savePdf(doc, 'riwaya-inventory');
      toast.success('Inventory PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  const downloadActivityPdf = () => {
    try {
      const events = activity?.data || [];
      const doc = createReportDoc('Activity Feed', `${events.length} recent events across all modules`);
      if (!events.length) {
        addEmpty(doc, 'No recent activity.');
      } else {
        addTable(
          doc,
          ['When', 'Type', 'Event'],
          events.map((ev) => [
            formatDate(ev.at, 'PPp'),
            ev.kind.replace(/_/g, ' '),
            ev.label,
          ]),
          { columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 90 } } }
        );
      }
      savePdf(doc, 'riwaya-activity');
      toast.success('Activity feed PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  const downloadFullReportPdf = () => {
    try {
      const doc = createReportDoc('Full Insights Report', 'Combined sales, inventory, and activity overview');

      // Stock overview tiles
      addTileGrid(doc, [
        ['Total SKUs', sv.totalSKUs],
        ['Units in stock', sv.totalUnits],
        ['Stock value', fmtPdfPrice(sv.totalValue)],
        ['Critical items', inv.filter((i) => i.status !== 'ok').length],
      ]);

      // Sales summary
      addSection(doc, `Sales (${groupBy})`);
      if (chartData.length === 0) {
        addEmpty(doc, 'No sales yet.');
      } else {
        addTable(
          doc,
          ['Period', 'Orders', 'Items', 'Revenue (Rs)'],
          chartData.map((r) => [r.label, r.orders, r.itemsSold || 0, fmtPdfPrice(r.revenue)])
        );
      }

      // Top products
      const items = topProducts?.data || [];
      addSection(doc, 'Top 10 best-selling products');
      if (!items.length) {
        addEmpty(doc, 'No sales yet.');
      } else {
        addTable(
          doc,
          ['#', 'Product', 'Units', 'Revenue (Rs)'],
          items.map((p, i) => [i + 1, p.productName, p.unitsSold, fmtPdfPrice(p.revenue)])
        );
      }

      // Inventory summary (top 20)
      addSection(doc, 'Inventory snapshot (top 20)');
      if (!inv.length) {
        addEmpty(doc, 'No stock.');
      } else {
        addTable(
          doc,
          ['SKU', 'Item', 'Qty', 'Status'],
          inv.slice(0, 20).map((it) => [it.sku, it.name, it.totalQuantity, it.status.replace(/_/g, ' ')])
        );
      }

      // Recent activity (top 15)
      const events = activity?.data || [];
      addSection(doc, 'Recent activity (latest 15)');
      if (!events.length) {
        addEmpty(doc, 'No activity.');
      } else {
        addTable(
          doc,
          ['When', 'Event'],
          events.slice(0, 15).map((ev) => [formatDate(ev.at, 'PPp'), ev.label]),
          { columnStyles: { 0: { cellWidth: 130 } } }
        );
      }

      savePdf(doc, 'riwaya-full-insights');
      toast.success('Full insights PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales, inventory, and activity insights — download as branded PDF"
        actions={
          <Button onClick={downloadFullReportPdf}>
            <FileDown className="h-4 w-4 mr-2" /> Download full report (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total SKUs</div><div className="text-2xl font-semibold">{sv.totalSKUs}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Units in stock</div><div className="text-2xl font-semibold">{sv.totalUnits}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Stock value</div><div className="text-2xl font-semibold text-primary">{formatPrice(sv.totalValue)}</div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-semibold">Sales over time</h2>
            <div className="flex items-center gap-2">
              <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-32">
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </Select>
              <Button size="sm" variant="outline" onClick={downloadSalesPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? formatPrice(v) : v, n]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10">No sales yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Top-selling products</h2>
              <Button size="sm" variant="outline" onClick={downloadTopProductsPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {(topProducts?.data || []).map((p) => (
                <li key={p._id} className="flex justify-between border-b last:border-0 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                      {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1">{p.productName}</div>
                      <div className="text-xs text-muted-foreground">{p.unitsSold} units</div>
                    </div>
                  </div>
                  <span className="font-semibold">{formatPrice(p.revenue)}</span>
                </li>
              ))}
              {!(topProducts?.data?.length) && <li className="text-muted-foreground">No sales yet</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Inventory health</h2>
              <Button size="sm" variant="outline" onClick={downloadInventoryPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm max-h-96 overflow-y-auto">
              {inv.slice(0, 30).map((it) => (
                <li key={it._id} className="flex justify-between border-b last:border-0 py-2">
                  <div>
                    <div className="font-medium line-clamp-1">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.sku} · {it.totalQuantity} / min {it.minStockLevel}</div>
                  </div>
                  <Badge status={it.status}>{it.status.replace(/_/g, ' ')}</Badge>
                </li>
              ))}
              {!inv.length && <li className="text-muted-foreground">No stock</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent activity</h2>
            <Button size="sm" variant="outline" onClick={downloadActivityPdf}>
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {(activity?.data || []).map((ev, i) => (
              <li key={i} className="flex justify-between border-b last:border-0 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{ev.kind.replace(/_/g, ' ')}</Badge>
                    <span className="line-clamp-1">{ev.label}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">{timeAgo(ev.at)}</span>
              </li>
            ))}
            {!(activity?.data?.length) && <li className="text-muted-foreground">No activity yet</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
