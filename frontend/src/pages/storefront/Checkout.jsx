import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Truck, Wallet } from 'lucide-react';
import { useGetCartQuery } from '@/api/cartApi';
import { usePlaceOrderMutation } from '@/api/orderApi';
import { useMyCustomerProfileQuery } from '@/api/peopleApi';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Label, FormError } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(7, 'Enter a valid phone'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  customerNotes: z.string().optional(),
});

const SHIPPING_FEES = { standard: 250, express: 500 };

export default function Checkout() {
  const navigate = useNavigate();
  const { data: cartData, isLoading: cartLoading } = useGetCartQuery();
  const { data: profileData } = useMyCustomerProfileQuery();
  const [placeOrder, { isLoading: placing }] = usePlaceOrderMutation();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const profile = profileData?.data;
  const defaultAddr = profile?.addresses?.find((a) => a.isDefault) || profile?.addresses?.[0];

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: defaultAddr?.fullName || profile?.name || '',
      phone: defaultAddr?.phone || profile?.phone || '',
      line1: defaultAddr?.line1 || '',
      line2: defaultAddr?.line2 || '',
      city: defaultAddr?.city || '',
      province: defaultAddr?.province || '',
      postalCode: defaultAddr?.postalCode || '',
      shippingMethod: 'standard',
      customerNotes: '',
    },
  });

  if (cartLoading) return <PageSpinner label="Loading checkout…" />;

  const cart = cartData?.data;
  const items = cart?.items || [];

  if (!items.length) {
    return (
      <div className="container py-16">
        <EmptyState title="Your cart is empty" description="Add some items before checking out." action={<Link to="/products"><Button>Shop now</Button></Link>} />
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const shippingFee = subtotal >= 5000 ? 0 : SHIPPING_FEES[watch('shippingMethod') || 'standard'];
  const grandTotal = subtotal + shippingFee;

  const onSubmit = async (values) => {
    if (!items.length) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    // Require transaction ID for non-COD methods
    if (paymentMethod !== 'cod' && !paymentReference.trim()) {
      toast.error('Please enter the transaction ID / reference for your payment');
      return;
    }

    const orderItems = items.map((it) => ({
      product: typeof it.product === 'object' ? it.product._id : it.product,
      variantId: it.variantId,
      quantity: it.quantity,
    }));

    const payload = {
      items: orderItems,
      shippingAddress: {
        fullName: values.fullName,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        province: values.province || undefined,
        postalCode: values.postalCode || undefined,
      },
      shippingMethod: values.shippingMethod,
      shippingFee,
      customerNotes: values.customerNotes,
      payment: {
        method: paymentMethod,
        reference: paymentReference.trim() || undefined,
        notes: paymentNote.trim() || undefined,
      },
    };

    try {
      const res = await placeOrder(payload).unwrap();
      const orderNumber = res.data?.orderNumber;
      toast.success(`Order ${orderNumber} placed! Payment is pending verification.`);
      navigate(`/track/${orderNumber}`, { state: { justPlaced: true } });
    } catch (err) {
      toast.error(err?.data?.message || 'Could not place order');
    }
  };

  return (
    <div className="container py-8">
      <Link to="/cart" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>
      <h1 className="font-serif text-3xl md:text-4xl mb-6">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* Shipping address */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Shipping address</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName" required>Full name</Label>
                  <Input id="fullName" {...register('fullName')} />
                  <FormError>{errors.fullName?.message}</FormError>
                </div>
                <div>
                  <Label htmlFor="phone" required>Phone</Label>
                  <Input id="phone" {...register('phone')} placeholder="+92 300 1234567" />
                  <FormError>{errors.phone?.message}</FormError>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="line1" required>Address line 1</Label>
                  <Input id="line1" {...register('line1')} placeholder="House #, Street" />
                  <FormError>{errors.line1?.message}</FormError>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="line2">Address line 2</Label>
                  <Input id="line2" {...register('line2')} placeholder="Apartment, area (optional)" />
                </div>
                <div>
                  <Label htmlFor="city" required>City</Label>
                  <Input id="city" {...register('city')} />
                  <FormError>{errors.city?.message}</FormError>
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select id="province" {...register('province')}>
                    <option value="">Select…</option>
                    {['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'AJK'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" {...register('postalCode')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping method */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Shipping method</h2>
              <div className="space-y-2">
                {[
                  { val: 'standard', label: 'Standard (3-5 days)', fee: SHIPPING_FEES.standard },
                  { val: 'express', label: 'Express (1-2 days)', fee: SHIPPING_FEES.express },
                ].map((opt) => (
                  <label key={opt.val} className={cn('flex items-center justify-between border rounded-md p-3 cursor-pointer hover:border-primary', watch('shippingMethod') === opt.val && 'border-primary bg-primary/5')}>
                    <div className="flex items-center gap-3">
                      <input type="radio" value={opt.val} {...register('shippingMethod')} />
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <span className="text-sm">{subtotal >= 5000 ? 'Free' : formatPrice(opt.fee)}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Payment method</h2>
              <div className="space-y-2">
                {[
                  { val: 'cod', label: 'Cash on Delivery', icon: Wallet, note: 'Pay when your order arrives. No reference needed.' },
                  { val: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard, note: 'Transfer to our bank account and enter transaction ID below.' },
                  { val: 'jazzcash', label: 'JazzCash', icon: Wallet, note: 'Send to our JazzCash and share TX ID.' },
                  { val: 'easypaisa', label: 'EasyPaisa', icon: Wallet, note: 'Send to our EasyPaisa and share TX ID.' },
                ].map((opt) => (
                  <label key={opt.val} className={cn('flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:border-primary', paymentMethod === opt.val && 'border-primary bg-primary/5')}>
                    <input type="radio" name="paymentMethod" value={opt.val} checked={paymentMethod === opt.val} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1" />
                    <opt.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.note}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Transaction reference for non-COD methods */}
              {paymentMethod !== 'cod' && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <Label htmlFor="paymentReference">Transaction ID / Reference</Label>
                    <Input
                      id="paymentReference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. TXN123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentNote">Note for admin (optional)</Label>
                    <Input
                      id="paymentNote"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Anything we should know about your payment"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>How it works:</strong> Your order is placed immediately and your payment is marked
                <em> pending verification</em>. Our team will review and confirm it within 24 hours. You'll
                see the update on your <strong>My Orders</strong> page.
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="customerNotes">Order notes (optional)</Label>
              <textarea id="customerNotes" {...register('customerNotes')} rows={2} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Please call before delivery" />
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <aside>
          <Card className="sticky top-20">
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold text-lg">Order summary</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((it) => {
                  const p = it.product;
                  const img = p?.images?.[0]?.url;
                  return (
                    <div key={it._id} className="flex gap-3 text-sm">
                      <div className="w-12 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                        {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-1">{p?.name}</div>
                        <div className="text-xs text-muted-foreground">Qty {it.quantity} × {formatPrice(it.priceSnapshot)}</div>
                      </div>
                      <div className="font-medium">{formatPrice(it.priceSnapshot * it.quantity)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t text-base"><span>Total</span><span className="text-primary">{formatPrice(grandTotal)}</span></div>
              </div>
              <Button type="submit" loading={placing} className="w-full">Place order</Button>
              <p className="text-xs text-muted-foreground text-center">By placing this order, you agree to RIWAYA's terms of service.</p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
