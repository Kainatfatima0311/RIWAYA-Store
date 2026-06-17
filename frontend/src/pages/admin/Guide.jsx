import { Link } from 'react-router-dom';
import {
  Warehouse,
  Truck,
  Boxes,
  Receipt,
  Tag,
  Package,
  Users,
  ShoppingBag,
  CreditCard,
  PieChart,
  ArrowRight,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { Card, CardContent } from '@/components/ui/Card';

// The recommended order to set things up in. Each later step depends on the ones above it.
const STEPS = [
  {
    icon: Warehouse,
    title: 'Set up a warehouse',
    to: '/admin/warehouses',
    body: 'Create a warehouse, then add its floors and racks. Racks are the physical shelves where your stock is kept.',
  },
  {
    icon: Truck,
    title: 'Add your suppliers',
    to: '/admin/suppliers',
    body: 'Add the mills / vendors you buy from. Only name and phone are required — NTN, GST and bank details are optional.',
  },
  {
    icon: Boxes,
    title: 'Create stock items',
    to: '/admin/stock',
    body: 'Add each item you keep in stock (its SKU is generated automatically). Link a supplier and a rack category — manage those groups under Inventory → Rack Categories.',
  },
  {
    icon: Receipt,
    title: 'Bring stock in',
    to: '/admin/purchase-orders',
    body: 'Create a Purchase Order → Approve it → Record a receipt to add quantity into a rack. (Or use “Receive” directly on a stock item.)',
  },
  {
    icon: Tag,
    title: 'Create product categories',
    to: '/admin/product-categories',
    body: 'Customer-facing groups such as Bridal, Formal, Casual. These are what shoppers browse on the storefront.',
  },
  {
    icon: Package,
    title: 'Add & publish products',
    to: '/admin/products',
    body: 'Create a product, link it to a stock item, set the price and upload images. Set status to “Published” and turn on “Show on storefront”.',
  },
  {
    icon: Users,
    title: 'Customers',
    to: '/admin/customers',
    body: 'Shoppers sign up themselves on the storefront. For in-store sales, add walk-in customers here.',
  },
  {
    icon: ShoppingBag,
    title: 'Handle orders',
    to: '/admin/orders',
    body: 'Online orders arrive automatically; you can also record walk-in sales. Move each order through its stages: Confirmed → Packed → Shipped → Delivered.',
  },
  {
    icon: CreditCard,
    title: 'Record payments',
    to: '/admin/payments',
    body: 'Approve or record payments against orders. Stock is deducted automatically when an order is shipped.',
  },
  {
    icon: PieChart,
    title: 'Track the business',
    to: '/admin/finance',
    body: 'See revenue, expenses and profit in Finance, and sales / inventory health in Reports.',
  },
];

const TIPS = [
  'Products only appear on the storefront when status is “Published” AND “Show on storefront” is turned on.',
  'You can’t delete a stock item that still has quantity in a rack — write it off to 0 first.',
  'You can’t delete a warehouse that still has racks/floors, or a category that’s still in use — clear what’s inside first, or just deactivate it.',
  'Prefer “Deactivate” over delete for anything you might need later — it hides the item without breaking past records.',
  'If a form won’t save, the red message now tells you exactly why (e.g. a missing field or a duplicate name).',
];

export default function Guide() {
  return (
    <div className="max-w-4xl">
      <div className="animate-fade-up">
        <PageHeader
          title="Getting Started"
          description="A quick guide to setting up and running your store. Follow the steps top to bottom."
        />
      </div>

      {/* Intro */}
      <Reveal animation="fade-up" className="mb-6">
       <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 flex gap-4">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 animate-pop">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="text-sm text-foreground/80">
            <p className="font-medium text-foreground mb-1">New here? Set things up in this order.</p>
            <p>
              Each step builds on the ones before it — for example, you need a <strong>warehouse and stock</strong> before
              you can sell <strong>products</strong>, and a <strong>stock item</strong> before a product can be bought.
              Click <em>“Open”</em> on any step to jump straight to that screen.
            </p>
          </div>
        </CardContent>
       </Card>
      </Reveal>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.to} animation="fade-up-sm" delay={Math.min(i * 60, 400)}>
            <Card className="hover-lift-sm group">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold animate-pop">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-shrink-0 hidden sm:flex h-10 w-10 rounded-md bg-muted items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.body}</p>
                </div>
                <Link
                  to={s.to}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-all hover:gap-2 whitespace-nowrap mt-1"
                >
                  Open <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Tips */}
      <Reveal animation="fade-up" className="mt-6">
       <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Good to know</h3>
          </div>
          <ul className="space-y-2">
            {TIPS.map((t, i) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </CardContent>
       </Card>
      </Reveal>
    </div>
  );
}
