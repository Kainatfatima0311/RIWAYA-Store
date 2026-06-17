import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { customerService } from './customer.service.js';

export const customerController = {
  create: asyncHandler(async (req, res) => {
    const c = await customerService.create(req.body, req.user._id);
    created(res, c, 'Customer created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await customerService.list(req.query);
    paginated(res, items, page, limit, total, 'Customers fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const c = await customerService.getById(req.params.id);
    ok(res, c, 'Customer fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const c = await customerService.update(req.params.id, req.body, req.user._id);
    ok(res, c, 'Customer updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await customerService.remove(req.params.id);
    ok(res, null, 'Customer deleted');
  }),

  setSegment: asyncHandler(async (req, res) => {
    const c = await customerService.setSegment(req.params.id, req.body.segment, req.user._id);
    ok(res, c, `Customer segment set to ${c.segment}`);
  }),

  // Addresses
  addAddress: asyncHandler(async (req, res) => {
    const c = await customerService.addAddress(req.params.id, req.body, req.user._id);
    created(res, c, 'Address added');
  }),

  updateAddress: asyncHandler(async (req, res) => {
    const c = await customerService.updateAddress(req.params.id, req.params.addressId, req.body, req.user._id);
    ok(res, c, 'Address updated');
  }),

  removeAddress: asyncHandler(async (req, res) => {
    const c = await customerService.removeAddress(req.params.id, req.params.addressId, req.user._id);
    ok(res, c, 'Address removed');
  }),

  // Self-service
  getMyProfile: asyncHandler(async (req, res) => {
    const c = await customerService.getOwnProfile(req.user._id);
    ok(res, c, 'Profile fetched');
  }),

  updateMyProfile: asyncHandler(async (req, res) => {
    const c = await customerService.updateOwnProfile(req.user._id, req.body);
    ok(res, c, 'Profile updated');
  }),

  addMyAddress: asyncHandler(async (req, res) => {
    const profile = await customerService.getOwnProfile(req.user._id);
    const c = await customerService.addAddress(profile._id, req.body, req.user._id);
    created(res, c, 'Address added');
  }),

  updateMyAddress: asyncHandler(async (req, res) => {
    const profile = await customerService.getOwnProfile(req.user._id);
    const c = await customerService.updateAddress(profile._id, req.params.addressId, req.body, req.user._id);
    ok(res, c, 'Address updated');
  }),

  removeMyAddress: asyncHandler(async (req, res) => {
    const profile = await customerService.getOwnProfile(req.user._id);
    const c = await customerService.removeAddress(profile._id, req.params.addressId, req.user._id);
    ok(res, c, 'Address removed');
  }),
};
