import { Order } from './order.model.js';
import { Product } from '../product/product.model.js';
import { Customer } from '../customer/customer.model.js';
import { StockItem } from '../stock/stock-item.model.js';
import { StockEntry } from '../stock/stock-entry.model.js';
import { customerService } from '../customer/customer.service.js';
import { stockMovementService } from '../stock/stock-movement.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequence } from '../../utils/counter.js';

// ===== Stock helpers =====

// Reserve stock — increments reservedQuantity on stock items
const reserveStockForItems = async (items) => {
  for (const item of items) {
    await StockItem.findByIdAndUpdate(item.stockItem, {
      $inc: { reservedQuantity: item.quantity },
    });
  }
};

const releaseReservation = async (items) => {
  for (const item of items) {
    const si = await StockItem.findById(item.stockItem);
    if (si) {
      si.reservedQuantity = Math.max(0, si.reservedQuantity - item.quantity);
      await si.save();
    }
  }
};

// Actually deduct stock: find rack entries with sufficient quantity and decrement
const deductStockForItems = async (items, userId, orderRef, orderNumber) => {
  // Pre-flight: ensure every item has enough stock before we start mutating anything.
  // Without this, a partial deduction can succeed and the failure leaves inconsistent state.
  for (const item of items) {
    const si = await StockItem.findById(item.stockItem).select('name sku totalQuantity');
    if (!si) throw ApiError.notFound(`Stock item ${item.stockItem} not found`);
    if ((si.totalQuantity || 0) < item.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for '${si.name}' (${si.sku}). Have ${si.totalQuantity || 0}, need ${item.quantity}.`
      );
    }
  }

  for (const item of items) {
    const stockItemDoc = await StockItem.findById(item.stockItem);
    if (!stockItemDoc) continue;

    let remaining = item.quantity;

    const entries = await StockEntry.find({
      stockItem: item.stockItem,
      quantity: { $gt: 0 },
    }).sort('-quantity'); // greedy: take from rack with most stock first

    for (const entry of entries) {
      if (remaining <= 0) break;
      const takeQty = Math.min(remaining, entry.quantity);
      entry.quantity -= takeQty;
      entry.lastMovedAt = new Date();
      await entry.save();
      remaining -= takeQty;

      await stockMovementService.record({
        stockItem: item.stockItem,
        stockItemName: stockItemDoc.name,
        stockItemSku: stockItemDoc.sku,
        type: 'sale',
        quantity: -takeQty,
        fromRack: entry.rack,
        warehouse: entry.warehouse,
        unitCost: stockItemDoc.unitCost,
        reason: `Sold via order ${orderNumber}`,
        reference: { kind: 'order', id: orderRef, label: orderNumber },
        performedBy: userId,
      });
    }

    if (remaining > 0) {
      throw ApiError.badRequest(
        `Insufficient stock for '${stockItemDoc.name}' (${stockItemDoc.sku}). Short by ${remaining}.`
      );
    }

    // Refresh denormalized totals
    const agg = await StockEntry.aggregate([
      { $match: { stockItem: stockItemDoc._id } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    stockItemDoc.totalQuantity = agg[0]?.total || 0;
    stockItemDoc.reservedQuantity = Math.max(0, stockItemDoc.reservedQuantity - item.quantity);
    stockItemDoc.totalSold = (stockItemDoc.totalSold || 0) + item.quantity;
    await stockItemDoc.save();
  }
};

// Return stock to a default rack (typically the stock item's defaultRack, or first existing entry)
const returnStockForItems = async (items, userId, orderRef, orderNumber) => {
  for (const item of items) {
    const stockItemDoc = await StockItem.findById(item.stockItem);
    if (!stockItemDoc) continue;

    let rackId = stockItemDoc.defaultRack;
    let entry = rackId
      ? await StockEntry.findOne({ stockItem: item.stockItem, rack: rackId })
      : null;

    // Fallback to any existing entry for this item
    if (!entry) {
      entry = await StockEntry.findOne({ stockItem: item.stockItem }).sort('-quantity');
      if (entry) rackId = entry.rack;
    }

    if (!entry) {
      // No prior entry — we don't know where to put it. Log a movement with no rack.
      await stockMovementService.record({
        stockItem: item.stockItem,
        stockItemName: stockItemDoc.name,
        stockItemSku: stockItemDoc.sku,
        type: 'return',
        quantity: item.quantity,
        warehouse: undefined,
        unitCost: stockItemDoc.unitCost,
        reason: `Returned via order ${orderNumber} (no rack assigned — assign manually)`,
        reference: { kind: 'order', id: orderRef, label: orderNumber },
        performedBy: userId,
      });
      stockItemDoc.totalQuantity += item.quantity;
      await stockItemDoc.save();
      continue;
    }

    entry.quantity += item.quantity;
    entry.lastReceivedAt = new Date();
    await entry.save();

    await stockMovementService.record({
      stockItem: item.stockItem,
      stockItemName: stockItemDoc.name,
      stockItemSku: stockItemDoc.sku,
      type: 'return',
      quantity: item.quantity,
      toRack: rackId,
      warehouse: entry.warehouse,
      unitCost: stockItemDoc.unitCost,
      reason: `Returned via order ${orderNumber}`,
      reference: { kind: 'order', id: orderRef, label: orderNumber },
      performedBy: userId,
    });

    stockItemDoc.totalQuantity += item.quantity;
    stockItemDoc.totalSold = Math.max(0, (stockItemDoc.totalSold || 0) - item.quantity);
    await stockItemDoc.save();
  }
};

// ===== Build order items from input (validates product/variant + computes prices) =====
const buildItemsFromInput = async (inputItems) => {
  const built = [];
  let subtotal = 0;

  for (const inp of inputItems) {
    const product = await Product.findById(inp.product);
    if (!product) throw ApiError.notFound(`Product ${inp.product} not found`);
    if (product.status !== 'published') {
      throw ApiError.badRequest(`Product '${product.name}' is not published`);
    }

    const variant = product.variants.id(inp.variantId);
    if (!variant) throw ApiError.notFound(`Variant ${inp.variantId} not found on product`);

    const stockItem = await StockItem.findById(variant.stockItem);
    if (!stockItem) throw ApiError.notFound('Linked stock item not found');

    const availableQty = (stockItem.totalQuantity || 0) - (stockItem.reservedQuantity || 0);
    if (availableQty < inp.quantity) {
      throw ApiError.badRequest(
        `Not enough stock for '${product.name}' (${variant.label}). Available: ${availableQty}, requested: ${inp.quantity}`
      );
    }

    const unitPrice = +(
      ((product.salePrice > 0 && product.salePrice < product.basePrice) ? product.salePrice : product.basePrice) +
      (variant.additionalPrice || 0)
    ).toFixed(2);
    const totalPrice = +(unitPrice * inp.quantity).toFixed(2);

    built.push({
      product: product._id,
      stockItem: stockItem._id,
      productName: product.name,
      productSku: product.sku || stockItem.sku,
      variantLabel: variant.label,
      productImage: product.images?.[0]?.url,
      quantity: inp.quantity,
      unitPrice,
      totalPrice,
    });
    subtotal += totalPrice;
  }

  return { items: built, subtotal: +subtotal.toFixed(2) };
};

const computeTotals = (order) => {
  const taxAmount = +((order.subtotal * (order.taxRate || 0)) / 100).toFixed(2);
  const grandTotal = Math.max(
    0,
    +(order.subtotal + taxAmount + (order.shippingFee || 0) - (order.discount || 0)).toFixed(2)
  );
  order.taxAmount = taxAmount;
  order.grandTotal = grandTotal;
};

const pushHistory = (order, status, userId, notes) => {
  order.statusHistory.push({ status, changedAt: new Date(), changedBy: userId, notes });
};

// Allowed forward transitions
const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: ['refunded'],
  refunded: [],
};

export const orderService = {
  // ===== Online order from storefront =====
  async placeOnlineOrder(userId, payload) {
    const customer = await customerService.getByUserId(userId);
    if (!customer) throw ApiError.notFound('Customer profile missing. Complete signup first.');

    const { items, subtotal } = await buildItemsFromInput(payload.items);

    const orderNumber = await formatSequence('order', 'ORD', 5);

    const order = new Order({
      orderNumber,
      orderType: 'online',
      customer: customer._id,
      items,
      subtotal,
      taxRate: 0,
      shippingFee: payload.shippingFee || 0,
      shippingMethod: payload.shippingMethod || 'standard',
      discountCode: payload.discountCode,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress || payload.shippingAddress,
      customerNotes: payload.customerNotes,
      status: 'pending',
      statusHistory: [{ status: 'pending', changedAt: new Date(), changedBy: userId, notes: 'Order placed' }],
    });

    computeTotals(order);
    await order.save();

    // Reserve stock immediately on online order
    await reserveStockForItems(items);
    order.stockReserved = true;
    await order.save();

    // Create a PENDING payment record so admin can verify and approve.
    // Customer's order shows "Payment under verification" until admin approves.
    if (payload.payment) {
      const { Payment } = await import('../payment/payment.model.js');
      const paymentNumber = await formatSequence('payment', 'PAY', 5);
      await Payment.create({
        paymentNumber,
        order: order._id,
        customer: customer._id,
        amount: order.grandTotal,
        currency: order.currency,
        method: payload.payment.method,
        status: 'pending',
        transactionId: payload.payment.reference,
        referenceNumber: payload.payment.reference,
        notes: payload.payment.notes
          ? `${payload.payment.notes}${payload.payment.screenshot ? ` | Receipt: ${payload.payment.screenshot}` : ''}`
          : payload.payment.screenshot
            ? `Receipt: ${payload.payment.screenshot}`
            : undefined,
        recordedBy: userId,
      });
    }

    return order;
  },

  // ===== Physical / walk-in order recorded by staff =====
  async createPhysicalOrder(payload, staffUserId) {
    const customer = await Customer.findById(payload.customer);
    if (!customer) throw ApiError.notFound('Customer not found');

    const { items, subtotal } = await buildItemsFromInput(payload.items);

    const orderNumber = await formatSequence('order', 'ORD', 5);

    const order = new Order({
      orderNumber,
      orderType: 'physical',
      customer: customer._id,
      items,
      subtotal,
      taxRate: payload.taxRate || 0,
      shippingFee: payload.shippingFee || 0,
      discount: payload.discount || 0,
      shippingMethod: 'walk_in',
      storeLocation: payload.storeLocation,
      warehouse: payload.warehouse,
      customerNotes: payload.customerNotes,
      internalNotes: payload.internalNotes,
      status: 'delivered', // walk-in is delivered immediately
      statusHistory: [
        { status: 'delivered', changedAt: new Date(), changedBy: staffUserId, notes: 'Physical sale' },
      ],
      createdBy: staffUserId,
    });

    computeTotals(order);
    await order.save();

    // Physical orders deduct stock immediately
    await deductStockForItems(items, staffUserId, order._id, order.orderNumber);
    order.stockFulfilled = true;
    order.deliveredAt = new Date();
    await order.save();

    // Update customer stats
    await customerService.recordOrder(customer._id, order.grandTotal);

    return order;
  },

  // ===== Listing / fetching =====
  async list({
    page = 1,
    limit = 20,
    search,
    orderType,
    status,
    paymentStatus,
    customer,
    from,
    to,
    sort = '-orderedAt',
  }) {
    const filter = {};
    if (orderType) filter.orderType = orderType;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customer) filter.customer = customer;
    if (from || to) {
      filter.orderedAt = {};
      if (from) filter.orderedAt.$gte = from;
      if (to) filter.orderedAt.$lte = to;
    }
    if (search) filter.orderNumber = new RegExp(search, 'i');

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email phone customerCode customerType')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-statusHistory'),
      Order.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const order = await Order.findById(id)
      .populate('customer')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('cancelledBy', 'name email')
      .populate('returnedBy', 'name email');
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  },

  async getByNumber(orderNumber) {
    const order = await Order.findOne({ orderNumber })
      .populate('customer')
      .populate('statusHistory.changedBy', 'name email role');
    if (!order) throw ApiError.notFound('Order not found');
    return orderService._attachPendingPayment(order);
  },

  // ===== Status transitions =====
  async transitionStatus(id, newStatus, userId, notes) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found');

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from '${order.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    // Side effects
    if (newStatus === 'shipped' && !order.stockFulfilled) {
      await deductStockForItems(order.items, userId, order._id, order.orderNumber);
      order.stockFulfilled = true;
      order.shippedAt = new Date();
    }
    if (newStatus === 'delivered') {
      order.deliveredAt = new Date();
      // Walk-in & online: ensure stock was deducted by 'shipped'; for online orders going pending→delivered (rare), do it
      if (!order.stockFulfilled) {
        await deductStockForItems(order.items, userId, order._id, order.orderNumber);
        order.stockFulfilled = true;
      }
      // Update customer stats
      await customerService.recordOrder(order.customer, order.grandTotal);
    }
    if (newStatus === 'returned') {
      if (order.stockFulfilled) {
        await returnStockForItems(order.items, userId, order._id, order.orderNumber);
      } else if (order.stockReserved) {
        await releaseReservation(order.items);
      }
      order.stockReserved = false;
      order.stockFulfilled = false;
      order.returnedAt = new Date();
      order.returnedBy = userId;
      order.returnReason = notes;
    }

    order.status = newStatus;
    pushHistory(order, newStatus, userId, notes);
    order.updatedBy = userId;
    await order.save();
    return order;
  },

  async cancel(id, reason, userId) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    if (['delivered', 'cancelled', 'returned', 'refunded'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot cancel order in '${order.status}' state`);
    }

    if (order.stockFulfilled) {
      await returnStockForItems(order.items, userId, order._id, order.orderNumber);
      order.stockFulfilled = false;
    } else if (order.stockReserved) {
      await releaseReservation(order.items);
      order.stockReserved = false;
    }

    order.status = 'cancelled';
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = userId;
    pushHistory(order, 'cancelled', userId, reason);
    order.updatedBy = userId;
    await order.save();
    return order;
  },

  async updateCourier(id, payload, userId) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    if (payload.name !== undefined) order.courier.name = payload.name;
    if (payload.trackingNumber !== undefined) order.courier.trackingNumber = payload.trackingNumber;
    if (payload.trackingUrl !== undefined) order.courier.trackingUrl = payload.trackingUrl;
    if (payload.estimatedDelivery) order.estimatedDelivery = payload.estimatedDelivery;
    order.updatedBy = userId;
    await order.save();
    return order;
  },

  // ===== Internal: called by payment service =====
  async refreshPaymentStatus(orderId) {
    const { Payment } = await import('../payment/payment.model.js');
    const order = await Order.findById(orderId);
    if (!order) return null;

    const payments = await Payment.find({ order: orderId, status: 'completed' });
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const refunds = await Payment.find({ order: orderId, status: 'refunded' });
    const refunded = refunds.reduce((s, p) => s + p.amount, 0);

    order.paidAmount = +paid.toFixed(2);
    order.refundedAmount = +refunded.toFixed(2);

    if (refunded > 0 && refunded >= paid) order.paymentStatus = 'refunded';
    else if (refunded > 0) order.paymentStatus = 'partially_refunded';
    else if (paid <= 0) order.paymentStatus = 'unpaid';
    else if (paid >= order.grandTotal) order.paymentStatus = 'paid';
    else order.paymentStatus = 'partial';

    await order.save();
    return order;
  },

  // Helper: enrich orders with pending-payment info for customer-facing views.
  // After admin approves a payment, paymentStatus auto-flips to 'paid' and pendingPayment is absent.
  async _attachPendingPayment(orderDocs) {
    const list = Array.isArray(orderDocs) ? orderDocs : [orderDocs];
    if (!list.length) return orderDocs;
    const { Payment } = await import('../payment/payment.model.js');
    const ids = list.map((o) => o._id);
    const pending = await Payment.find({ order: { $in: ids }, status: 'pending' })
      .select('order method transactionId paidAt amount notes')
      .lean();
    const byOrder = new Map(pending.map((p) => [String(p.order), p]));
    const out = list.map((o) => {
      const obj = o.toObject ? o.toObject() : o;
      const pp = byOrder.get(String(obj._id));
      obj.hasPendingPayment = !!pp;
      obj.pendingPayment = pp || null;
      return obj;
    });
    return Array.isArray(orderDocs) ? out : out[0];
  },

  // ===== Customer self-service =====
  async getOwnOrders(userId, { page = 1, limit = 20 } = {}) {
    const customer = await customerService.getByUserId(userId);
    if (!customer) throw ApiError.notFound('Customer profile not found');
    const [docs, total] = await Promise.all([
      Order.find({ customer: customer._id })
        .sort('-orderedAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-statusHistory -internalNotes'),
      Order.countDocuments({ customer: customer._id }),
    ]);
    const items = await orderService._attachPendingPayment(docs);
    return { items, page, limit, total };
  },

  async getOwnOrder(userId, orderId) {
    const customer = await customerService.getByUserId(userId);
    if (!customer) throw ApiError.notFound('Customer profile not found');
    const order = await Order.findOne({ _id: orderId, customer: customer._id })
      .populate('customer', 'name email phone')
      .select('-internalNotes');
    if (!order) throw ApiError.notFound('Order not found');
    return orderService._attachPendingPayment(order);
  },

  // ===== Stats / aggregations =====
  async stats({ from, to }) {
    const match = {};
    if (from || to) {
      match.orderedAt = {};
      if (from) match.orderedAt.$gte = new Date(from);
      if (to) match.orderedAt.$lte = new Date(to);
    }
    const [byStatus, byType, totals] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$orderType', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: { ...match, status: { $nin: ['cancelled', 'refunded'] } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$grandTotal' },
            totalPaid: { $sum: '$paidAmount' },
            totalRefunded: { $sum: '$refundedAmount' },
          },
        },
      ]),
    ]);
    return {
      byStatus,
      byType,
      summary: totals[0] || { totalOrders: 0, totalRevenue: 0, totalPaid: 0, totalRefunded: 0 },
    };
  },
};
