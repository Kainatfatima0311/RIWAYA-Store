import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { employeeService } from './employee.service.js';

export const employeeController = {
  create: asyncHandler(async (req, res) => {
    const e = await employeeService.create(req.body, req.user._id);
    created(res, e, 'Employee added');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await employeeService.list(req.query);
    paginated(res, items, page, limit, total, 'Employees fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const e = await employeeService.getById(req.params.id);
    ok(res, e, 'Employee fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const e = await employeeService.update(req.params.id, req.body, req.user._id);
    ok(res, e, 'Employee updated');
  }),

  setStatus: asyncHandler(async (req, res) => {
    const e = await employeeService.setStatus(
      req.params.id,
      req.body.status,
      req.body.endReason,
      req.user._id
    );
    ok(res, e, `Employee status set to ${e.status}`);
  }),

  linkUser: asyncHandler(async (req, res) => {
    const e = await employeeService.linkUser(req.params.id, req.body.user, req.user._id);
    ok(res, e, e.user ? 'User linked to employee' : 'User unlinked');
  }),

  remove: asyncHandler(async (req, res) => {
    await employeeService.remove(req.params.id);
    ok(res, null, 'Employee deleted');
  }),

  team: asyncHandler(async (req, res) => {
    const items = await employeeService.getTeam(req.params.id);
    ok(res, items, 'Team fetched');
  }),

  // Attendance
  markAttendance: asyncHandler(async (req, res) => {
    const a = await employeeService.markAttendance(req.params.id, req.body, req.user._id);
    ok(res, a, 'Attendance recorded');
  }),

  listAttendance: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await employeeService.listAttendance(req.query);
    paginated(res, items, page, limit, total, 'Attendance records fetched');
  }),

  attendanceSummary: asyncHandler(async (req, res) => {
    const summary = await employeeService.getAttendanceSummary(req.params.id, req.query);
    ok(res, summary, 'Attendance summary');
  }),
};
