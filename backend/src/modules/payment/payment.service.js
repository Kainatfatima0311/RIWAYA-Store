import { Payment } from './payment.model.js';
import { Order } from '../order/order.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequence } from '../../utils/counter.js';
import { orderService } from '../order/order.service.js';

export const paymentService = {
  async record(payload, userId) {
    const order = await Order.findById(payload.order);
    if (!order) throw ApiError.notFound('Order not found');

    if (['cancelled', 'refunded'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot record payment on '${order.status}' order`);
    }

    // For completed payments, ensure not over-paying
    if ((payload.status || 'completed') === 'completed') {
      const remaining = order.grandTotal - order.paidAmount;
      if (payload.amount > remaining + 0.001) {
        throw ApiError.badRequest(
          `Payment exceeds outstanding amount. Outstanding: ${remaining.toFixed(2)}`
        );
      }
    }

    const paymentNumber = await formatSequence('payment', 'PAY', 5);

    const payment = await Payment.create({
      ...payload,
      paymentNumber,
      customer: order.customer,
      status: payload.status || 'completed',
      completedAt: (payload.status || 'completed') === 'completed' ? new Date() : undefined,
      recordedBy: userId,
    });

    if (payment.status === 'completed') {
      await orderService.refreshPaymentStatus(order._id);
    }

    return payment;
  },

  async list({ page = 1, limit = 20, order, customer, method, status, from, to, sort = '-paidAt' }) {
    const filter = {};
    if (order) filter.order = order;
    if (customer) filter.customer = customer;
    if (method) filter.method = method;
    if (status) filter.status = status;
    if (from || to) {
      filter.paidAt = {};
      if (from) filter.paidAt.$gte = from;
      if (to) filter.paidAt.$lte = to;
    }

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .populate('order', 'orderNumber grandTotal status orderType')
        .populate('customer', 'name email phone customerCode')
        .populate('recordedBy', 'name email role')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const p = await Payment.findById(id)
      .populate('order')
      .populate('customer')
      .populate('recordedBy', 'name email role');
    if (!p) throw ApiError.notFound('Payment not found');
    return p;
  },

  async listForOrder(orderId) {
    return Payment.find({ order: orderId }).sort('-paidAt').populate('recordedBy', 'name email');
  },

  async updateStatus(id, { status, transactionId, gatewayResponse }, _userId) {
    const p = await Payment.findById(id);
    if (!p) throw ApiError.notFound('Payment not found');

    const previousStatus = p.status;
    p.status = status;
    if (transactionId) p.transactionId = transactionId;
    if (gatewayResponse) p.gatewayResponse = gatewayResponse;

    if (status === 'completed' && !p.completedAt) p.completedAt = new Date();
    if (status === 'failed') p.failedAt = new Date();
    if (status === 'refunded') p.refundedAt = new Date();

    await p.save();

    if (previousStatus !== status) {
      await orderService.refreshPaymentStatus(p.order);
    }

    return p;
  },

  async refund(id, reason, _userId) {
    const p = await Payment.findById(id);
    if (!p) throw ApiError.notFound('Payment not found');
    if (p.status === 'refunded') {
      throw ApiError.badRequest('Payment is already refunded');
    }
    if (p.status !== 'completed') {
      throw ApiError.badRequest(`Only completed payments can be refunded (current: ${p.status})`);
    }
    p.status = 'refunded';
    p.refundedAt = new Date();
    p.refundReason = reason;
    await p.save();

    await orderService.refreshPaymentStatus(p.order);
    return p;
  },

  // Aggregate stats
  async stats({ from, to }) {
    const match = {};
    if (from || to) {
      match.paidAt = {};
      if (from) match.paidAt.$gte = new Date(from);
      if (to) match.paidAt.$lte = new Date(to);
    }
    const [byMethod, byStatus, totals] = await Promise.all([
      Payment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: '$method', count: { $sum: 1 }, value: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: null, totalPayments: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      byMethod,
      byStatus,
      summary: totals[0] || { totalPayments: 0, totalAmount: 0 },
    };
  },
};
