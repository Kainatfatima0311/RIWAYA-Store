import { format, formatDistanceToNow } from 'date-fns';

const currency = import.meta.env.VITE_CURRENCY || 'PKR';

export const formatPrice = (amount, { currency: c = currency } = {}) => {
  const n = Number(amount || 0);
  if (c === 'PKR') return `Rs ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
  return `${c} ${n.toLocaleString()}`;
};

export const formatDate = (d, pattern = 'PP') => {
  if (!d) return '—';
  try {
    return format(new Date(d), pattern);
  } catch {
    return '—';
  }
};

export const formatDateTime = (d) => formatDate(d, 'PPp');

export const timeAgo = (d) => {
  if (!d) return '—';
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true });
  } catch {
    return '—';
  }
};

export const truncate = (s, n = 80) => (s && s.length > n ? `${s.slice(0, n)}…` : s || '');

// Resolve image URLs from the backend (which returns /uploads/... paths) to absolute URLs.
// In dev, Vite proxies /uploads to the backend so the relative path works directly.
// In prod, set VITE_ASSET_BASE to the absolute origin if assets are served from a CDN.
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE
  || (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')
  || '').replace(/\/+$/, '');

export const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${ASSET_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const statusBadgeColor = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-900',
    confirmed: 'bg-blue-100 text-blue-900',
    packed: 'bg-indigo-100 text-indigo-900',
    shipped: 'bg-purple-100 text-purple-900',
    out_for_delivery: 'bg-purple-100 text-purple-900',
    delivered: 'bg-emerald-100 text-emerald-900',
    cancelled: 'bg-rose-100 text-rose-900',
    returned: 'bg-orange-100 text-orange-900',
    refunded: 'bg-slate-200 text-slate-900',
    paid: 'bg-emerald-100 text-emerald-900',
    partial: 'bg-amber-100 text-amber-900',
    unpaid: 'bg-rose-100 text-rose-900',
    out_of_stock: 'bg-rose-100 text-rose-900',
    urgent: 'bg-orange-100 text-orange-900',
    low: 'bg-amber-100 text-amber-900',
    ok: 'bg-emerald-100 text-emerald-900',
    active: 'bg-emerald-100 text-emerald-900',
    inactive: 'bg-slate-200 text-slate-900',
    draft: 'bg-slate-200 text-slate-900',
    placed: 'bg-blue-100 text-blue-900',
    partially_received: 'bg-amber-100 text-amber-900',
    fully_received: 'bg-emerald-100 text-emerald-900',
  };
  return map[status] || 'bg-slate-200 text-slate-900';
};
