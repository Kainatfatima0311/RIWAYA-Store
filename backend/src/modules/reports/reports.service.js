import { Order } from '../order/order.model.js';
import { Payment } from '../payment/payment.model.js';
import { Customer } from '../customer/customer.model.js';
import { Product } from '../product/product.model.js';
import { StockItem } from '../stock/stock-item.model.js';
import { StockMovement } from '../stock/stock-movement.model.js';
import { PurchaseOrder } from '../purchase-order/purchase-order.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { Equipment } from '../equipment/equipment.model.js';
import { Employee } from '../employee/employee.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const reportsService = {
  // ===== Admin dashboard snapshot =====
  async dashboard() {
    const today = startOfDay();
    const endToday = endOfDay();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      monthOrders,
      todayPayments,
      monthPayments,
      pendingOrders,
      shippedOrders,
      lowStockCount,
      outOfStockCount,
      openPOs,
      totalCustomers,
      newCustomersThisMonth,
      activeEmployees,
      productsPublished,
      warehouseCount,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { orderedAt: { $gte: today, $lte: endToday }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: { orderedAt: { $gte: monthStart }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      ]),
      Payment.aggregate([
        { $match: { paidAt: { $gte: today, $lte: endToday }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { paidAt: { $gte: monthStart }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'packed'] } }),
      Order.countDocuments({ status: { $in: ['shipped', 'out_for_delivery'] } }),
      StockItem.countDocuments({
        isActive: true,
        $expr: { $and: [{ $lte: ['$totalQuantity', '$minStockLevel'] }, { $gt: ['$totalQuantity', 0] }] },
      }),
      StockItem.countDocuments({ isActive: true, totalQuantity: 0 }),
      PurchaseOrder.countDocuments({ status: { $in: ['placed', 'partially_received'] } }),
      Customer.countDocuments({ isActive: true }),
      Customer.countDocuments({ createdAt: { $gte: monthStart }, isActive: true }),
      Employee.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'published', displayOnFrontend: true }),
      Warehouse.countDocuments({ isActive: true }),
    ]);

    return {
      today: {
        orders: todayOrders[0]?.count || 0,
        revenue: +(todayOrders[0]?.revenue || 0).toFixed(2),
        paymentsReceived: +(todayPayments[0]?.total || 0).toFixed(2),
        paymentCount: todayPayments[0]?.count || 0,
      },
      month: {
        orders: monthOrders[0]?.count || 0,
        revenue: +(monthOrders[0]?.revenue || 0).toFixed(2),
        paymentsReceived: +(monthPayments[0]?.total || 0).toFixed(2),
        paymentCount: monthPayments[0]?.count || 0,
        newCustomers: newCustomersThisMonth,
      },
      operations: {
        pendingOrders,
        shippedOrders,
        openPurchaseOrders: openPOs,
      },
      inventory: {
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
      },
      catalog: {
        publishedProducts: productsPublished,
        warehouses: warehouseCount,
      },
      people: {
        totalCustomers,
        activeEmployees,
      },
    };
  },

  // ===== Sales report — orders grouped by day =====
  async salesReport({ from, to, groupBy = 'day' } = {}) {
    const match = { status: { $nin: ['cancelled'] } };
    if (from || to) {
      match.orderedAt = {};
      if (from) match.orderedAt.$gte = new Date(from);
      if (to) match.orderedAt.$lte = new Date(to);
    }

    const dateExpr = {
      day: { y: { $year: '$orderedAt' }, m: { $month: '$orderedAt' }, d: { $dayOfMonth: '$orderedAt' } },
      week: { y: { $year: '$orderedAt' }, w: { $week: '$orderedAt' } },
      month: { y: { $year: '$orderedAt' }, m: { $month: '$orderedAt' } },
    }[groupBy] || { y: { $year: '$orderedAt' }, m: { $month: '$orderedAt' }, d: { $dayOfMonth: '$orderedAt' } };

    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: dateExpr,
          orderCount: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          itemsSold: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.w': 1, '_id.d': 1 } },
    ]);
  },

  // ===== Top-selling products =====
  async topProducts({ limit = 10, from, to } = {}) {
    const match = { status: { $nin: ['cancelled'] } };
    if (from || to) {
      match.orderedAt = {};
      if (from) match.orderedAt.$gte = new Date(from);
      if (to) match.orderedAt.$lte = new Date(to);
    }

    return Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
      {
        $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' },
      },
      {
        $project: {
          _id: 1,
          productName: 1,
          unitsSold: 1,
          revenue: 1,
          orderCount: 1,
          slug: { $arrayElemAt: ['$product.slug', 0] },
          image: { $arrayElemAt: [{ $arrayElemAt: ['$product.images.url', 0] }, 0] },
        },
      },
    ]);
  },

  // ===== Inventory report (per stock item with movement counts) =====
  async inventoryReport({ from, to, rackCategory, lowStockOnly = false } = {}) {
    const filter = { isActive: true };
    if (rackCategory) filter.rackCategory = rackCategory;

    const items = await StockItem.find(filter)
      .populate('rackCategory', 'name')
      .populate('supplier', 'name code')
      .lean();

    let filtered = items;
    if (lowStockOnly) {
      filtered = items.filter((it) => it.totalQuantity <= it.minStockLevel);
    }

    return filtered.map((it) => ({
      _id: it._id,
      name: it.name,
      sku: it.sku,
      rackCategory: it.rackCategory,
      supplier: it.supplier,
      totalQuantity: it.totalQuantity,
      reservedQuantity: it.reservedQuantity,
      availableQuantity: Math.max(0, it.totalQuantity - it.reservedQuantity),
      minStockLevel: it.minStockLevel,
      reorderLevel: it.reorderLevel,
      unitCost: it.unitCost,
      stockValue: +(it.totalQuantity * (it.unitCost || 0)).toFixed(2),
      status:
        it.totalQuantity <= 0
          ? 'out_of_stock'
          : it.totalQuantity <= it.reorderLevel
          ? 'urgent'
          : it.totalQuantity <= it.minStockLevel
          ? 'low'
          : 'ok',
    }));
  },

  // ===== Activity feed (recent events across modules) =====
  async activityFeed({ limit = 30 } = {}) {
    const [orders, payments, movements, pos] = await Promise.all([
      Order.find()
        .sort('-orderedAt')
        .limit(limit)
        .populate('customer', 'name customerCode')
        .select('orderNumber orderType status grandTotal customer orderedAt'),
      Payment.find({ status: 'completed' })
        .sort('-paidAt')
        .limit(limit)
        .populate('order', 'orderNumber')
        .select('paymentNumber amount method order paidAt'),
      StockMovement.find()
        .sort('-performedAt')
        .limit(limit)
        .populate('stockItem', 'name sku')
        .select('type quantity stockItem reason performedAt'),
      PurchaseOrder.find()
        .sort('-orderDate')
        .limit(limit)
        .populate('supplier', 'name code')
        .select('poNumber status grandTotal supplier orderDate'),
    ]);

    const events = [
      ...orders.map((o) => ({
        kind: 'order',
        at: o.orderedAt,
        label: `Order ${o.orderNumber} (${o.orderType}) — ${o.status} — Rs ${o.grandTotal}`,
        ref: o,
      })),
      ...payments.map((p) => ({
        kind: 'payment',
        at: p.paidAt,
        label: `Payment ${p.paymentNumber} via ${p.method} — Rs ${p.amount}`,
        ref: p,
      })),
      ...movements.map((m) => ({
        kind: 'stock_movement',
        at: m.performedAt,
        label: `${m.type} ${m.quantity > 0 ? '+' : ''}${m.quantity} of ${m.stockItem?.name || 'item'}`,
        ref: m,
      })),
      ...pos.map((po) => ({
        kind: 'purchase_order',
        at: po.orderDate,
        label: `PO ${po.poNumber} — ${po.status} — Rs ${po.grandTotal}`,
        ref: po,
      })),
    ];

    return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
  },

  // ===== Stock-value report (inventory worth) =====
  async stockValueReport() {
    const agg = await StockItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSKUs: { $sum: 1 },
          totalUnits: { $sum: '$totalQuantity' },
          totalValue: { $sum: { $multiply: ['$totalQuantity', '$unitCost'] } },
        },
      },
    ]);
    return agg[0] || { totalSKUs: 0, totalUnits: 0, totalValue: 0 };
  },
};
