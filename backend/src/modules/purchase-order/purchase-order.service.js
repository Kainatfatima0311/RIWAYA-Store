import { PurchaseOrder } from './purchase-order.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequence } from '../../utils/counter.js';
import { supplierService } from '../supplier/supplier.service.js';

// ===== Internal helpers =====

const recomputeFinancials = (po) => {
  const subtotal = po.items.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantityOrdered || 0), 0);
  const taxAmount = +(subtotal * ((po.taxRate || 0) / 100)).toFixed(2);
  const grandTotal = +(subtotal + taxAmount + (po.shippingCost || 0) - (po.discount || 0)).toFixed(2);
  po.subtotal = +subtotal.toFixed(2);
  po.taxAmount = taxAmount;
  po.grandTotal = Math.max(0, grandTotal);
};

const recomputePaidAmount = (po) => {
  po.paidAmount = +po.payments.reduce((s, p) => s + (p.amount || 0), 0).toFixed(2);
  if (po.paidAmount <= 0) po.paymentStatus = 'unpaid';
  else if (po.paidAmount >= po.grandTotal) po.paymentStatus = 'paid';
  else po.paymentStatus = 'partial';
};

const recomputeReceivingStatus = (po) => {
  if (po.status === 'draft' || po.status === 'cancelled') return;
  const totalOrdered = po.items.reduce((s, it) => s + it.quantityOrdered, 0);
  const totalReceived = po.items.reduce((s, it) => s + it.quantityReceived, 0);

  if (totalReceived === 0) {
    po.status = 'placed';
  } else if (totalReceived >= totalOrdered) {
    po.status = 'fully_received';
  } else {
    po.status = 'partially_received';
  }
};

const assertReceivable = (po) => {
  if (po.status === 'draft') throw ApiError.badRequest('Approve the PO before recording receipts');
  if (po.status === 'cancelled') throw ApiError.badRequest('PO is cancelled');
  if (po.status === 'fully_received') throw ApiError.badRequest('PO is already fully received');
};

// ===== Service =====

export const purchaseOrderService = {
  async create(payload, userId) {
    const [supplier, warehouse] = await Promise.all([
      Supplier.findById(payload.supplier),
      Warehouse.findById(payload.warehouse),
    ]);
    if (!supplier) throw ApiError.notFound('Supplier not found');
    if (!warehouse) throw ApiError.notFound('Warehouse not found');
    if (!supplier.isActive) throw ApiError.badRequest('Supplier is inactive');

    const poNumber = await formatSequence('po', 'PO');

    const po = new PurchaseOrder({
      ...payload,
      poNumber,
      status: 'draft',
      paymentStatus: 'unpaid',
      createdBy: userId,
    });
    recomputeFinancials(po);
    await po.save();
    return po;
  },

  async list({
    page = 1,
    limit = 20,
    search,
    supplier,
    warehouse,
    status,
    paymentStatus,
    from,
    to,
    sort = '-orderDate',
  }) {
    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (warehouse) filter.warehouse = warehouse;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = from;
      if (to) filter.orderDate.$lte = to;
    }
    if (search) filter.poNumber = new RegExp(search, 'i');

    const [items, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('supplier', 'name code phone')
        .populate('warehouse', 'name code')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-receipts -payments'), // omit heavy sub-docs in list
      PurchaseOrder.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const po = await PurchaseOrder.findById(id)
      .populate('supplier')
      .populate('warehouse', 'name code location')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('cancelledBy', 'name email')
      .populate('receipts.receivedBy', 'name email')
      .populate('payments.recordedBy', 'name email');
    if (!po) throw ApiError.notFound('Purchase order not found');
    return po;
  },

  async update(id, payload, userId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    if (po.status !== 'draft') {
      throw ApiError.badRequest('Only draft purchase orders can be edited');
    }

    Object.assign(po, payload);
    po.updatedBy = userId;
    recomputeFinancials(po);
    await po.save();
    return po;
  },

  async approve(id, userId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    if (po.status !== 'draft') throw ApiError.badRequest('Only draft POs can be approved');

    po.status = 'placed';
    po.approvedBy = userId;
    po.approvedAt = new Date();
    await po.save();

    await supplierService.adjustTotals(po.supplier, {
      purchaseDelta: po.grandTotal,
      poDelta: 1,
    });

    return po;
  },

  async cancel(id, reason, userId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    if (po.status === 'cancelled') throw ApiError.badRequest('PO already cancelled');
    if (po.status === 'fully_received') throw ApiError.badRequest('Cannot cancel a fully-received PO');
    if (po.payments.length > 0) {
      throw ApiError.badRequest('Cannot cancel: payments already recorded. Refund first.');
    }

    const wasApproved = ['placed', 'partially_received'].includes(po.status);

    po.status = 'cancelled';
    po.cancelledBy = userId;
    po.cancelledAt = new Date();
    po.cancelReason = reason;
    await po.save();

    if (wasApproved) {
      await supplierService.adjustTotals(po.supplier, {
        purchaseDelta: -po.grandTotal,
        poDelta: -1,
      });
    }

    return po;
  },

  async addReceipt(id, payload, userId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    assertReceivable(po);

    // Validate each receipt item and that quantities don't exceed remaining
    for (const r of payload.items) {
      const poItem = po.items.id(r.poItem);
      if (!poItem) throw ApiError.badRequest(`Invalid item reference: ${r.poItem}`);
      const remaining = poItem.quantityOrdered - poItem.quantityReceived;
      if (r.quantity > remaining) {
        throw ApiError.badRequest(
          `Cannot receive ${r.quantity} '${poItem.name}' — only ${remaining} remaining`
        );
      }
    }

    // Snapshot names + apply quantities
    const enrichedItems = payload.items.map((r) => {
      const poItem = po.items.id(r.poItem);
      poItem.quantityReceived += r.quantity;
      return { poItem: r.poItem, name: poItem.name, quantity: r.quantity, notes: r.notes };
    });

    po.receipts.push({
      receivedAt: payload.receivedAt || new Date(),
      receivedBy: userId,
      items: enrichedItems,
      notes: payload.notes,
      documentUrl: payload.documentUrl,
    });

    recomputeReceivingStatus(po);
    await po.save();
    return po;
  },

  async removeReceipt(id, receiptId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    const receipt = po.receipts.id(receiptId);
    if (!receipt) throw ApiError.notFound('Receipt not found');

    // Roll back item quantities
    for (const r of receipt.items) {
      const poItem = po.items.id(r.poItem);
      if (poItem) poItem.quantityReceived = Math.max(0, poItem.quantityReceived - r.quantity);
    }
    receipt.deleteOne();

    recomputeReceivingStatus(po);
    await po.save();
    return po;
  },

  async addPayment(id, payload, userId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    if (po.status === 'cancelled') throw ApiError.badRequest('Cannot pay on cancelled PO');
    if (po.status === 'draft') throw ApiError.badRequest('Approve PO before recording payments');

    const newPaid = po.paidAmount + payload.amount;
    if (newPaid > po.grandTotal + 0.001) {
      throw ApiError.badRequest(
        `Payment exceeds outstanding amount. Outstanding: ${(po.grandTotal - po.paidAmount).toFixed(2)}`
      );
    }

    po.payments.push({
      paidAt: payload.paidAt || new Date(),
      amount: payload.amount,
      method: payload.method || 'cash',
      reference: payload.reference,
      notes: payload.notes,
      recordedBy: userId,
    });

    recomputePaidAmount(po);
    await po.save();

    await supplierService.adjustTotals(po.supplier, { paidDelta: payload.amount });

    return po;
  },

  async removePayment(id, paymentId) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    const payment = po.payments.id(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');

    const refundAmount = payment.amount;
    payment.deleteOne();
    recomputePaidAmount(po);
    await po.save();

    await supplierService.adjustTotals(po.supplier, { paidDelta: -refundAmount });

    return po;
  },

  async remove(id) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw ApiError.notFound('Purchase order not found');
    if (po.status !== 'draft') {
      throw ApiError.badRequest('Only draft purchase orders can be deleted');
    }
    await po.deleteOne();
    return po;
  },

  // Aggregate stats
  async stats({ from, to, supplier, warehouse }) {
    const mongoose = (await import('mongoose')).default;
    const match = {};
    if (from || to) {
      match.orderDate = {};
      if (from) match.orderDate.$gte = new Date(from);
      if (to) match.orderDate.$lte = new Date(to);
    }
    if (supplier) match.supplier = new mongoose.Types.ObjectId(supplier);
    if (warehouse) match.warehouse = new mongoose.Types.ObjectId(warehouse);

    const [byStatus, totals] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$grandTotal' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { ...match, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalPOs: { $sum: 1 },
            totalValue: { $sum: '$grandTotal' },
            totalPaid: { $sum: '$paidAmount' },
          },
        },
      ]),
    ]);

    return {
      byStatus,
      summary: totals[0] || { totalPOs: 0, totalValue: 0, totalPaid: 0 },
    };
  },
};
