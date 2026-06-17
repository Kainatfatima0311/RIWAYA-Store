import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { orderService } from './order.service.js';

export const orderController = {
  // ===== Admin =====
  createPhysical: asyncHandler(async (req, res) => {
    const order = await orderService.createPhysicalOrder(req.body, req.user._id);
    created(res, order, 'Physical order recorded');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await orderService.list(req.query);
    paginated(res, items, page, limit, total, 'Orders fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const order = await orderService.getById(req.params.id);
    ok(res, order, 'Order fetched');
  }),

  transition: asyncHandler(async (req, res) => {
    const order = await orderService.transitionStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.body.notes
    );
    ok(res, order, `Order status updated to '${order.status}'`);
  }),

  cancel: asyncHandler(async (req, res) => {
    const order = await orderService.cancel(req.params.id, req.body.reason, req.user._id);
    ok(res, order, 'Order cancelled');
  }),

  updateCourier: asyncHandler(async (req, res) => {
    const order = await orderService.updateCourier(req.params.id, req.body, req.user._id);
    ok(res, order, 'Courier details updated');
  }),

  stats: asyncHandler(async (req, res) => {
    const data = await orderService.stats(req.query);
    ok(res, data, 'Order statistics');
  }),

  // ===== Customer self-service =====
  placeOnline: asyncHandler(async (req, res) => {
    const order = await orderService.placeOnlineOrder(req.user._id, req.body);
    created(res, order, 'Order placed');
  }),

  myOrders: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await orderService.getOwnOrders(req.user._id, req.query);
    paginated(res, items, page, limit, total, 'Your orders');
  }),

  myOrder: asyncHandler(async (req, res) => {
    const order = await orderService.getOwnOrder(req.user._id, req.params.id);
    ok(res, order, 'Order fetched');
  }),

  trackByNumber: asyncHandler(async (req, res) => {
    const order = await orderService.getByNumber(req.params.orderNumber);
    ok(
      res,
      {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        hasPendingPayment: order.hasPendingPayment,
        pendingPayment: order.pendingPayment,
        statusHistory: order.statusHistory,
        courier: order.courier,
        estimatedDelivery: order.estimatedDelivery,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
      'Tracking info'
    );
  }),
};
