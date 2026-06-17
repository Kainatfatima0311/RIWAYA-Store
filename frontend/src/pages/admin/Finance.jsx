import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFinanceOverviewQuery,
  useRevenueTimeSeriesQuery,
  useTopCustomersQuery,
  useTopSuppliersQuery,
  useReceivablesQuery,
  usePayablesQuery,
} from '@/api/peopleApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Input';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { formatPrice, formatDate } from '@/lib/format';
import {
  createReportDoc,
  addSection,
  addTable,
  addTileGrid,
  addEmpty,
  savePdf,
  fmtPdfPrice,
} from '@/lib/pdf';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatBucket = (id) => {
  if (id?.d) return `${id.y}-${String(id.m).padStart(2, '0')}-${String(id.d).padStart(2, '0')}`;
  if (id?.w) return `${id.y} W${id.w}`;
  if (id?.m) return `${id.y}-${String(id.m).padStart(2, '0')}`;
  return '';
};

export default function Finance() {
  const [granularity, setGranularity] = useState('day');
  const reduced = useReducedMotion();

  const { data: overview, isLoading: loadingOverview } = useFinanceOverviewQuery();
  const { data: timeSeries } = useRevenueTimeSeriesQuery({ granularity });
  const { data: topCustomers } = useTopCustomersQuery({ limit: 5 });
  const { data: topSuppliers } = useTopSuppliersQuery({ limit: 5 });
  const { data: receivables } = useReceivablesQuery({ limit: 10 });
  const { data: payables } = usePayablesQuery({ limit: 10 });

  if (loadingOverview) return <PageSpinner label="Loading finance…" />;

  const o = overview?.data || { revenue: {}, expenses: {}, summary: { grossProfit: 0, marginPercent: 0 } };
  const chartData = (timeSeries?.data || []).map((row) => ({
    label: formatBucket(row._id),
    amount: row.amount,
    count: row.count,
  }));

  // ===== PDF generators =====

  const downloadRevenuePdf = () => {
    try {
      const doc = createReportDoc('Revenue Time Series', `Granularity: ${granularity} · ${chartData.length} data points`);
      if (!chartData.length) addEmpty(doc, 'No revenue recorded yet.');
      else {
        addTable(
          doc,
          ['Period', 'Payment count', 'Amount collected (Rs)'],
          chartData.map((r) => [r.label, r.count, fmtPdfPrice(r.amount)])
        );
      }
      savePdf(doc, `riwaya-revenue-${granularity}`);
      toast.success('Revenue PDF downloaded');
    } catch (err) { toast.error('Failed to generate PDF'); console.error(err); }
  };

  const downloadTopCustomersPdf = () => {
    try {
      const items = topCustomers?.data || [];
      const doc = createReportDoc('Top Customers by Spend', `${items.length} customers`);
      if (!items.length) addEmpty(doc, 'No customer spending recorded yet.');
      else {
        addTable(
          doc,
          ['#', 'Customer', 'Email', 'Code', 'Orders', 'Spent (Rs)', 'Paid (Rs)'],
          items.map((c, i) => [
            i + 1,
            c.customer?.name || '—',
            c.customer?.email || '—',
            c.customer?.customerCode || '—',
            c.orderCount,
            fmtPdfPrice(c.totalSpent),
            fmtPdfPrice(c.totalPaid),
          ])
        );
      }
      savePdf(doc, 'riwaya-top-customers');
      toast.success('Top customers PDF downloaded');
    } catch (err) { toast.error('Failed to generate PDF'); console.error(err); }
  };

  const downloadTopSuppliersPdf = () => {
    try {
      const items = topSuppliers?.data || [];
      const doc = createReportDoc('Top Suppliers', `${items.length} suppliers ranked by total purchases`);
      if (!items.length) addEmpty(doc, 'No suppliers yet.');
      else {
        addTable(
          doc,
          ['#', 'Supplier', 'Code', 'Active POs', 'Total purchases (Rs)', 'Paid (Rs)'],
          items.map((s, i) => [
            i + 1,
            s.name,
            s.code,
            s.activePoCount || 0,
            fmtPdfPrice(s.totalPurchases),
            fmtPdfPrice(s.totalPaid),
          ])
        );
      }
      savePdf(doc, 'riwaya-top-suppliers');
      toast.success('Top suppliers PDF downloaded');
    } catch (err) { toast.error('Failed to generate PDF'); console.error(err); }
  };

  const downloadReceivablesPdf = () => {
    try {
      const items = receivables?.data || [];
      const total = items.reduce((s, r) => s + (r.grandTotal - r.paidAmount), 0);
      const doc = createReportDoc('Outstanding Receivables', `${items.length} unsettled orders · total ${fmtPdfPrice(total)}`);
      if (!items.length) addEmpty(doc, 'No outstanding receivables. All settled.');
      else {
        addTable(
          doc,
          ['Order #', 'Customer', 'Order date', 'Total (Rs)', 'Paid (Rs)', 'Outstanding (Rs)', 'Status'],
          items.map((r) => [
            r.orderNumber,
            r.customer?.name || '—',
            formatDate(r.orderedAt),
            fmtPdfPrice(r.grandTotal),
            fmtPdfPrice(r.paidAmount),
            fmtPdfPrice(r.grandTotal - r.paidAmount),
            r.paymentStatus,
          ])
        );
      }
      savePdf(doc, 'riwaya-receivables');
      toast.success('Receivables PDF downloaded');
    } catch (err) { toast.error('Failed to generate PDF'); console.error(err); }
  };

  const downloadPayablesPdf = () => {
    try {
      const items = payables?.data || [];
      const total = items.reduce((s, p) => s + (p.grandTotal - p.paidAmount), 0);
      const doc = createReportDoc('Outstanding Payables', `${items.length} unsettled POs · total ${fmtPdfPrice(total)}`);
      if (!items.length) addEmpty(doc, 'No outstanding payables. All settled.');
      else {
        addTable(
          doc,
          ['PO #', 'Supplier', 'PO date', 'Total (Rs)', 'Paid (Rs)', 'Outstanding (Rs)', 'Status'],
          items.map((p) => [
            p.poNumber,
            p.supplier?.name || '—',
            formatDate(p.orderDate),
            fmtPdfPrice(p.grandTotal),
            fmtPdfPrice(p.paidAmount),
            fmtPdfPrice(p.grandTotal - p.paidAmount),
            p.paymentStatus,
          ])
        );
      }
      savePdf(doc, 'riwaya-payables');
      toast.success('Payables PDF downloaded');
    } catch (err) { toast.error('Failed to generate PDF'); console.error(err); }
  };

  const downloadFullFinancePdf = () => {
    try {
      const doc = createReportDoc('Finance Overview', 'Comprehensive financial snapshot');

      addTileGrid(doc, [
        ['Net income', fmtPdfPrice(o.revenue.netIncome)],
        ['Total expenses', fmtPdfPrice(o.expenses.totalExpenses)],
        ['Gross profit', fmtPdfPrice(o.summary.grossProfit)],
        ['Margin', `${o.summary.marginPercent}%`],
      ]);

      addSection(doc, 'Revenue breakdown');
      addTable(
        doc,
        ['Metric', 'Value (Rs)'],
        [
          ['Orders booked (count)', String(o.revenue.orders || 0)],
          ['Total booked', fmtPdfPrice(o.revenue.totalBooked)],
          ['Collected', fmtPdfPrice(o.revenue.totalCollected)],
          ['Outstanding', fmtPdfPrice(o.revenue.outstanding)],
          ['Refunded', fmtPdfPrice(o.revenue.refunded)],
          ['Net income', fmtPdfPrice(o.revenue.netIncome)],
        ]
      );

      addSection(doc, 'Expenses breakdown');
      addTable(
        doc,
        ['Metric', 'Value (Rs)'],
        [
          ['PO count', String(o.expenses.purchaseOrders || 0)],
          ['PO spend (booked)', fmtPdfPrice(o.expenses.purchaseOrderSpend)],
          ['Paid to suppliers', fmtPdfPrice(o.expenses.paidToSuppliers)],
          ['Outstanding payables', fmtPdfPrice(o.expenses.outstandingPayables)],
          ['Equipment spend', fmtPdfPrice(o.expenses.equipmentSpend)],
          ['Total expenses', fmtPdfPrice(o.expenses.totalExpenses)],
        ]
      );

      // Top customers
      const tc = topCustomers?.data || [];
      addSection(doc, 'Top customers');
      if (!tc.length) addEmpty(doc, 'No data.');
      else {
        addTable(
          doc,
          ['#', 'Customer', 'Orders', 'Spent (Rs)'],
          tc.map((c, i) => [i + 1, c.customer?.name || '—', c.orderCount, fmtPdfPrice(c.totalSpent)])
        );
      }

      // Top suppliers
      const ts = topSuppliers?.data || [];
      addSection(doc, 'Top suppliers');
      if (!ts.length) addEmpty(doc, 'No data.');
      else {
        addTable(
          doc,
          ['#', 'Supplier', 'POs', 'Total purchases (Rs)'],
          ts.map((s, i) => [i + 1, s.name, s.activePoCount || 0, fmtPdfPrice(s.totalPurchases)])
        );
      }

      // Receivables
      const recv = receivables?.data || [];
      addSection(doc, 'Outstanding receivables');
      if (!recv.length) addEmpty(doc, 'All settled.');
      else {
        addTable(
          doc,
          ['Order', 'Customer', 'Outstanding (Rs)', 'Status'],
          recv.map((r) => [r.orderNumber, r.customer?.name || '—', fmtPdfPrice(r.grandTotal - r.paidAmount), r.paymentStatus])
        );
      }

      // Payables
      const pay = payables?.data || [];
      addSection(doc, 'Outstanding payables');
      if (!pay.length) addEmpty(doc, 'All settled.');
      else {
        addTable(
          doc,
          ['PO', 'Supplier', 'Outstanding (Rs)', 'Status'],
          pay.map((p) => [p.poNumber, p.supplier?.name || '—', fmtPdfPrice(p.grandTotal - p.paidAmount), p.paymentStatus])
        );
      }

      // Time series
      addSection(doc, `Revenue (${granularity})`);
      if (!chartData.length) addEmpty(doc, 'No revenue yet.');
      else {
        addTable(
          doc,
          ['Period', 'Payments', 'Amount (Rs)'],
          chartData.map((r) => [r.label, r.count, fmtPdfPrice(r.amount)])
        );
      }

      savePdf(doc, 'riwaya-finance-overview');
      toast.success('Finance PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Revenue, expenses & profit overview"
        actions={
          <Button onClick={downloadFullFinancePdf} className="w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Finance report (PDF)</span>
            <span className="hidden sm:inline">Download full finance report (PDF)</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up">
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground">Net income</div><div className="text-xl sm:text-2xl font-semibold text-primary"><CountUp value={o.revenue.netIncome} format={formatPrice} /></div></div><Wallet className="h-8 w-8 text-primary" /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground">Total expenses</div><div className="text-xl sm:text-2xl font-semibold text-destructive"><CountUp value={o.expenses.totalExpenses} format={formatPrice} /></div></div><CreditCard className="h-8 w-8 text-destructive" /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground">Gross profit</div><div className={`text-xl sm:text-2xl font-semibold ${o.summary.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}><CountUp value={o.summary.grossProfit} format={formatPrice} /></div></div>{o.summary.grossProfit >= 0 ? <TrendingUp className="h-8 w-8 text-emerald-600" /> : <TrendingDown className="h-8 w-8 text-destructive" />}</div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground">Margin</div><div className="text-xl sm:text-2xl font-semibold"><CountUp value={o.summary.marginPercent} suffix="%" /></div></div></div></CardContent></Card>
      </div>

      <Reveal animation="fade-up" className="mb-6">
       <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-semibold">Revenue over time</h2>
            <div className="flex items-center gap-2">
              <Select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="w-32">
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </Select>
              <Button size="sm" variant="outline" onClick={downloadRevenuePdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={!reduced} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-10">No revenue data yet</p>
          )}
        </CardContent>
       </Card>
      </Reveal>

      <Reveal animation="fade-up" className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-3">Revenue breakdown</h2>
            <div className="space-y-2 text-sm">
              <Row label="Orders booked" value={`${o.revenue.orders} (${formatPrice(o.revenue.totalBooked)})`} />
              <Row label="Collected" value={formatPrice(o.revenue.totalCollected)} tone="success" />
              <Row label="Outstanding" value={formatPrice(o.revenue.outstanding)} tone="warning" />
              <Row label="Refunded" value={formatPrice(o.revenue.refunded)} tone="danger" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-3">Expenses breakdown</h2>
            <div className="space-y-2 text-sm">
              <Row label="PO spend (booked)" value={formatPrice(o.expenses.purchaseOrderSpend)} />
              <Row label="Paid to suppliers" value={formatPrice(o.expenses.paidToSuppliers)} />
              <Row label="Payables (owed)" value={formatPrice(o.expenses.outstandingPayables)} tone="warning" />
              <Row label="Equipment spend" value={formatPrice(o.expenses.equipmentSpend)} />
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal animation="fade-up" className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Top customers</h2>
              <Button size="sm" variant="outline" onClick={downloadTopCustomersPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {(topCustomers?.data || []).map((c) => (
                <li key={c.customer._id} className="flex justify-between border-b last:border-0 py-1.5">
                  <div>
                    <div className="font-medium">{c.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{c.orderCount} orders</div>
                  </div>
                  <span className="font-semibold">{formatPrice(c.totalSpent)}</span>
                </li>
              ))}
              {!(topCustomers?.data?.length) && <li className="text-muted-foreground">No data</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Top suppliers</h2>
              <Button size="sm" variant="outline" onClick={downloadTopSuppliersPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {(topSuppliers?.data || []).map((s) => (
                <li key={s._id} className="flex justify-between border-b last:border-0 py-1.5">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.activePoCount} POs</div>
                  </div>
                  <span className="font-semibold">{formatPrice(s.totalPurchases)}</span>
                </li>
              ))}
              {!(topSuppliers?.data?.length) && <li className="text-muted-foreground">No data</li>}
            </ul>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal animation="fade-up" className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Receivables (money owed to us)</h2>
              <Button size="sm" variant="outline" onClick={downloadReceivablesPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {(receivables?.data || []).map((r) => (
                <li key={r._id} className="flex justify-between border-b last:border-0 py-1.5">
                  <div>
                    <div className="font-mono text-xs">{r.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{r.customer?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-destructive">{formatPrice(r.grandTotal - r.paidAmount)}</div>
                    <Badge status={r.paymentStatus} className="text-[10px]">{r.paymentStatus}</Badge>
                  </div>
                </li>
              ))}
              {!(receivables?.data?.length) && <li className="text-muted-foreground">All settled</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Payables (money we owe)</h2>
              <Button size="sm" variant="outline" onClick={downloadPayablesPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              {(payables?.data || []).map((p) => (
                <li key={p._id} className="flex justify-between border-b last:border-0 py-1.5">
                  <div>
                    <div className="font-mono text-xs">{p.poNumber}</div>
                    <div className="text-xs text-muted-foreground">{p.supplier?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-destructive">{formatPrice(p.grandTotal - p.paidAmount)}</div>
                    <Badge status={p.paymentStatus} className="text-[10px]">{p.paymentStatus}</Badge>
                  </div>
                </li>
              ))}
              {!(payables?.data?.length) && <li className="text-muted-foreground">All settled</li>}
            </ul>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

function Row({ label, value, tone }) {
  const colors = { success: 'text-emerald-600', warning: 'text-amber-600', danger: 'text-destructive' };
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${colors[tone] || ''}`}>{value}</span>
    </div>
  );
}
