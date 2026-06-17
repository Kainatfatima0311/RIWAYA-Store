import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../../utils/generateToken.js';
import { authService } from './auth.service.js';

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  customerType: user.customerType,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export const authController = {
  // POST /api/auth/register  (public — customer self-signup)
  register: asyncHandler(async (req, res) => {
    const user = await authService.registerCustomer(req.body);
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    created(res, { user: sanitize(user), token }, 'Registered successfully');
  }),

  // POST /api/auth/login  (public — any role)
  login: asyncHandler(async (req, res) => {
    const user = await authService.verifyCredentials(req.body);
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    ok(res, { user: sanitize(user), token }, 'Logged in');
  }),

  // POST /api/auth/logout
  logout: asyncHandler(async (req, res) => {
    clearTokenCookie(res);
    ok(res, null, 'Logged out');
  }),

  // GET /api/auth/me  (protected)
  getMe: asyncHandler(async (req, res) => {
    ok(res, { user: sanitize(req.user) }, 'Profile fetched');
  }),

  // PATCH /api/auth/me  (protected)
  updateMe: asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body);
    ok(res, { user: sanitize(user) }, 'Profile updated');
  }),

  // POST /api/auth/change-password  (protected)
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    ok(res, null, 'Password changed');
  }),

  // POST /api/auth/create-staff  (super_admin only)
  createStaff: asyncHandler(async (req, res) => {
    const user = await authService.createStaff(req.body, req.user._id);
    created(res, { user: sanitize(user) }, 'Staff account created');
  }),
};
