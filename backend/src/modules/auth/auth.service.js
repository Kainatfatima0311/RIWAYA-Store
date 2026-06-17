import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../middleware/role.middleware.js';

export const authService = {
  async registerCustomer({ name, email, password, phone }) {
    const exists = await User.findOne({ email });
    if (exists) throw ApiError.conflict('Email already in use');
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: ROLES.CUSTOMER,
      customerType: 'online',
    });
    // Auto-create customer profile (lazy import to avoid circular dep at startup)
    try {
      const { customerService } = await import('../customer/customer.service.js');
      await customerService.createForUser(user);
    } catch (e) {
      // Non-fatal: customer profile creation can be retried later
      console.error('Failed to auto-create customer profile:', e.message);
    }
    return user;
  },

  async verifyCredentials({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated. Contact admin.');
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    return user;
  },

  async createStaff({ name, email, password, phone, role }, createdById) {
    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
      throw ApiError.badRequest('Role must be admin or super_admin');
    }
    const exists = await User.findOne({ email });
    if (exists) throw ApiError.conflict('Email already in use');
    return User.create({
      name,
      email,
      password,
      phone,
      role,
      createdBy: createdById,
    });
  },

  async updateProfile(userId, updates) {
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User not found');
    if (!(await user.matchPassword(currentPassword))) {
      throw ApiError.unauthorized('Current password is incorrect');
    }
    user.password = newPassword;
    await user.save();
    return user;
  },
};
