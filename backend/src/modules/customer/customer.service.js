import { Customer } from './customer.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequenceNoYear } from '../../utils/counter.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

const generateCode = () => formatSequenceNoYear('customer', 'CUST', 5);

export const customerService = {
  // ===== Internal: called by auth on registration =====
  async createForUser(user) {
    const existing = await Customer.findOne({ user: user._id });
    if (existing) return existing;

    const customerCode = await generateCode();
    const payload = {
      user: user._id,
      customerCode,
      name: user.name,
      email: user.email,
      customerType: 'online',
      source: 'online_signup',
      addedBy: user._id,
    };
    if (user.phone) payload.phone = user.phone;
    return Customer.create(payload);
  },

  // ===== Admin: create walk-in customer =====
  async create(payload, userId) {
    // Walk-in: phone uniqueness is checked (most likely duplicate signal)
    const dup = await Customer.findOne({ phone: payload.phone, customerType: payload.customerType || 'walk_in' });
    if (dup) {
      throw ApiError.conflict(`Customer with phone ${payload.phone} already exists (code: ${dup.customerCode})`);
    }

    if (payload.email) {
      const dupEmail = await Customer.findOne({ email: payload.email });
      if (dupEmail) {
        throw ApiError.conflict(`Customer with email ${payload.email} already exists (code: ${dupEmail.customerCode})`);
      }
    }

    const customerCode = await generateCode();
    return Customer.create({
      ...payload,
      customerCode,
      customerType: payload.customerType || 'walk_in',
      addedBy: userId,
      createdBy: userId,
    });
  },

  async list({
    page = 1,
    limit = 20,
    search,
    customerType,
    segment,
    isActive,
    city,
    minSpent,
    sort = '-createdAt',
  }) {
    const filter = {};
    if (customerType) filter.customerType = customerType;
    if (segment) filter.segment = segment;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['addresses.city'] = new RegExp(escapeRegex(city), 'i');
    if (minSpent != null) filter.totalSpent = { $gte: minSpent };
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { email: new RegExp(escapeRegex(search), 'i') },
        { phone: new RegExp(escapeRegex(search), 'i') },
        { customerCode: new RegExp(escapeRegex(search), 'i') },
        { cnic: new RegExp(escapeRegex(search), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Customer.find(filter)
        .populate('user', 'role isActive lastLogin')
        .populate('addedBy', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Customer.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const c = await Customer.findById(id)
      .populate('user', 'role isActive lastLogin avatar')
      .populate('addedBy', 'name email')
      .populate('preferredCategories', 'name slug');
    if (!c) throw ApiError.notFound('Customer not found');
    return c;
  },

  async getByUserId(userId) {
    return Customer.findOne({ user: userId });
  },

  async update(id, payload, userId) {
    const c = await Customer.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!c) throw ApiError.notFound('Customer not found');
    return c;
  },

  async remove(id) {
    // Check for orders (Phase 8) — lazy import
    try {
      const { Order } = await import('../order/order.model.js');
      const orderCount = await Order.countDocuments({ customer: id });
      if (orderCount) {
        throw ApiError.conflict(`Cannot delete: customer has ${orderCount} order(s). Deactivate instead.`);
      }
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
      // Order module not built yet — safe to proceed
    }
    const c = await Customer.findByIdAndDelete(id);
    if (!c) throw ApiError.notFound('Customer not found');
    return c;
  },

  async setSegment(id, segment, userId) {
    return customerService.update(id, { segment }, userId);
  },

  // ===== Addresses =====
  async addAddress(id, address, userId) {
    const c = await Customer.findById(id);
    if (!c) throw ApiError.notFound('Customer not found');
    if (address.isDefault) c.addresses.forEach((a) => (a.isDefault = false));
    if (!c.addresses.length && !address.isDefault) address.isDefault = true;
    c.addresses.push(address);
    c.updatedBy = userId;
    await c.save();
    return c;
  },

  async updateAddress(id, addressId, updates, userId) {
    const c = await Customer.findById(id);
    if (!c) throw ApiError.notFound('Customer not found');
    const addr = c.addresses.id(addressId);
    if (!addr) throw ApiError.notFound('Address not found');
    Object.assign(addr, updates);
    if (updates.isDefault) {
      c.addresses.forEach((a) => {
        if (String(a._id) !== String(addressId)) a.isDefault = false;
      });
    }
    c.updatedBy = userId;
    await c.save();
    return c;
  },

  async removeAddress(id, addressId, userId) {
    const c = await Customer.findById(id);
    if (!c) throw ApiError.notFound('Customer not found');
    const addr = c.addresses.id(addressId);
    if (!addr) throw ApiError.notFound('Address not found');
    addr.deleteOne();
    if (c.addresses.length && !c.addresses.some((a) => a.isDefault)) {
      c.addresses[0].isDefault = true;
    }
    c.updatedBy = userId;
    await c.save();
    return c;
  },

  // ===== Self-service (logged-in customer) =====
  async getOwnProfile(userId) {
    const c = await Customer.findOne({ user: userId }).populate('preferredCategories', 'name slug');
    if (!c) throw ApiError.notFound('Customer profile not found');
    return c;
  },

  async updateOwnProfile(userId, payload) {
    const c = await Customer.findOneAndUpdate({ user: userId }, payload, {
      new: true,
      runValidators: true,
    });
    if (!c) throw ApiError.notFound('Customer profile not found');
    return c;
  },

  // ===== Internal: called by order service on order completion =====
  async recordOrder(customerId, orderTotal) {
    // Atomic increments to avoid lost updates under concurrent orders.
    const c = await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { totalOrders: 1, totalSpent: orderTotal },
        $set: { lastOrderAt: new Date() },
      },
      { new: true }
    );
    if (!c) return;

    // Derived fields recomputed from the post-increment consistent values.
    const totalSpent = +c.totalSpent.toFixed(2);
    const derived = {
      totalSpent,
      averageOrderValue: +(totalSpent / c.totalOrders).toFixed(2),
    };
    if (totalSpent >= 100000) derived.segment = 'vip';
    else if (c.totalOrders >= 2) derived.segment = 'returning';

    return Customer.findByIdAndUpdate(customerId, { $set: derived }, { new: true });
  },
};
