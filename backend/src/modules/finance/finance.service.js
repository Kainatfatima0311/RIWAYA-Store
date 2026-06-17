import mongoose from 'mongoose';
import { Order } from '../order/order.model.js';
import { Payment } from '../payment/payment.model.js';
import { PurchaseOrder } from '../purchase-order/purchase-order.model.js';
import { Equipment } from '../equipment/equipment.model.js';
import { Supplier } from '../supplier/supplier.model.js';

const buildDateMatch = (field, from, to) => {
  if (!from && !to) return {};
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return { [field]: range };
};

export const financeService = {
  // High-level overview — revenue, expenses, profit (gross), receivables, payables
  async overview({ from, to } = {}) {
    const orderMatch = { ...buildDateMatch('orderedAt', from, to), status: { $nin: ['cancelled'] } };
    const paymentMatchCompleted = { ...buildDateMatch('paidAt', from, to), status: 'completed' };
    const paymentMatchRefunded = { ...buildDateMatch('paidAt', from, to), status: 'refunded' };
    const poMatch = { ...buildDateMatch('orderDate', from, to), status: { $ne: 'cancelled' } };
    const equipmentMatch = buildDateMatch('purchaseDate', from, to);

    const [orderAgg, paidAgg, refundedAgg, poAgg, equipmentAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: '$grandTotal' },
            outstanding: { $sum: { $subtract: ['$grandTotal', '$paidAmount'] } },
          },
        },
      ]),
      Payment.aggregate([
        { $match: paymentMatchCompleted },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: paymentMatchRefunded },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: poMatch },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalSpent: { $sum: '$grandTotal' },
            paidToSuppliers: { $sum: '$paidAmount' },
          },
        },
      ]),
      Equipment.aggregate([
        { $match: equipmentMatch },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalCost' } } },
      ]),
    ]);

    const orders = orderAgg[0] || { count: 0, totalRevenue: 0, outstanding: 0 };
    const paid = paidAgg[0] || { total: 0, count: 0 };
    const refunded = refundedAgg[0] || { total: 0, count: 0 };
    const po = poAgg[0] || { count: 0, totalSpent: 0, paidToSuppliers: 0 };
    const equipment = equipmentAgg[0] || { count: 0, total: 0 };

    const totalIncome = paid.total - refunded.total;
    const totalExpenses = po.paidToSuppliers + equipment.total;
    const grossProfit = +(totalIncome - totalExpenses).toFixed(2);
    const margin = totalIncome > 0 ? +(((grossProfit) / totalIncome) * 100).toFixed(2) : 0;

    return {
      revenue: {
        orders: orders.count,
        totalBooked: +orders.totalRevenue.toFixed(2),
        totalCollected: +paid.total.toFixed(2),
        outstanding: Math.max(0, +orders.outstanding.toFixed(2)),
        refunded: +refunded.total.toFixed(2),
        netIncome: +totalIncome.toFixed(2),
      },
      expenses: {
        purchaseOrders: po.count,
        purchaseOrderSpend: +po.totalSpent.toFixed(2),
        paidToSuppliers: +po.paidToSuppliers.toFixed(2),
        outstandingPayables: Math.max(0, +(po.totalSpent - po.paidToSuppliers).toFixed(2)),
        equipmentRecords: equipment.count,
        equipmentSpend: +equipment.total.toFixed(2),
        totalExpenses: +totalExpenses.toFixed(2),
      },
      summary: {
        grossProfit,
        marginPercent: margin,
      },
    };
  },

  // Revenue time series (daily / weekly / monthly)
  async revenueTimeSeries({ from, to, granularity = 'day' } = {}) {
    const match = { ...buildDateMatch('paidAt', from, to), status: 'completed' };

    const dateGroup = {
      day: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' }, d: { $dayOfMonth: '$paidAt' } },
      week: { y: { $year: '$paidAt' }, w: { $week: '$paidAt' } },
      month: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
    }[granularity] || { y: { $year: '$paidAt' }, m: { $month: '$paidAt' }, d: { $dayOfMonth: '$paidAt' } };

    return Payment.aggregate([
      { $match: match },
      { $group: { _id: dateGroup, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.w': 1, '_id.d': 1 } },
    ]);
  },

  // Top customers by spend
  async topCustomers({ limit = 10, from, to } = {}) {
    const match = { ...buildDateMatch('orderedAt', from, to), status: { $nin: ['cancelled'] } };
    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' },
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: 0,
          customer: { _id: '$customer._id', name: '$customer.name', email: '$customer.email', customerCode: '$customer.customerCode' },
          orderCount: 1,
          totalSpent: 1,
          totalPaid: 1,
        },
      },
    ]);
  },

  // Top suppliers by spend
  async topSuppliers({ limit = 10 } = {}) {
    return Supplier.find({ isActive: true })
      .sort('-totalPurchases')
      .limit(limit)
      .select('name code totalPurchases totalPaid activePoCount');
  },

  // Outstanding receivables (unpaid orders)
  async receivables({ limit = 50 } = {}) {
    return Order.find({
      status: { $nin: ['cancelled', 'refunded'] },
      paymentStatus: { $in: ['unpaid', 'partial'] },
    })
      .sort('-orderedAt')
      .limit(limit)
      .populate('customer', 'name email phone customerCode')
      .select('orderNumber orderType customer grandTotal paidAmount paymentStatus orderedAt');
  },

  // Outstanding payables (POs we haven't fully paid)
  async payables({ limit = 50 } = {}) {
    return PurchaseOrder.find({
      status: { $ne: 'cancelled' },
      paymentStatus: { $in: ['unpaid', 'partial'] },
    })
      .sort('-orderDate')
      .limit(limit)
      .populate('supplier', 'name code phone')
      .select('poNumber supplier grandTotal paidAmount paymentStatus orderDate');
  },
};
