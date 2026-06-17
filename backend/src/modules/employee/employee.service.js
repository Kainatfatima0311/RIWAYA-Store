import { Employee, Attendance } from './employee.model.js';
import { User } from '../user/user.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequenceNoYear } from '../../utils/counter.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const employeeService = {
  async create(payload, userId) {
    const dupCnic = await Employee.findOne({ cnic: payload.cnic });
    if (dupCnic) throw ApiError.conflict(`Employee with CNIC ${payload.cnic} already exists`);

    if (payload.warehouse) {
      const wh = await Warehouse.findById(payload.warehouse);
      if (!wh) throw ApiError.notFound('Warehouse not found');
    }
    if (payload.reportsTo) {
      const mgr = await Employee.findById(payload.reportsTo);
      if (!mgr) throw ApiError.notFound('Reporting manager not found');
    }

    const employeeCode = await formatSequenceNoYear('employee', 'EMP', 4);
    return Employee.create({ ...payload, employeeCode, createdBy: userId });
  },

  async list({
    page = 1,
    limit = 20,
    search,
    department,
    status,
    warehouse,
    workType,
    reportsTo,
    sort = '-joiningDate',
  }) {
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (workType) filter.workType = workType;
    if (reportsTo) filter.reportsTo = reportsTo;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { employeeCode: new RegExp(search, 'i') },
        { designation: new RegExp(search, 'i') },
        { cnic: new RegExp(search, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .populate('warehouse', 'name code')
        .populate('reportsTo', 'name employeeCode designation')
        .populate('user', 'role isActive')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  },

  async getById(id) {
    const e = await Employee.findById(id)
      .populate('warehouse', 'name code')
      .populate('reportsTo', 'name employeeCode designation')
      .populate('user', 'role isActive avatar lastLogin');
    if (!e) throw ApiError.notFound('Employee not found');
    return e;
  },

  async update(id, payload, userId) {
    if (payload.warehouse) {
      const wh = await Warehouse.findById(payload.warehouse);
      if (!wh) throw ApiError.notFound('Warehouse not found');
    }
    const e = await Employee.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!e) throw ApiError.notFound('Employee not found');
    return e;
  },

  async setStatus(id, status, endReason, userId) {
    const e = await Employee.findById(id);
    if (!e) throw ApiError.notFound('Employee not found');
    e.status = status;
    e.updatedBy = userId;
    if (['terminated', 'resigned'].includes(status)) {
      e.endDate = new Date();
      if (endReason) e.endReason = endReason;
    } else if (status === 'active' && e.endDate) {
      e.endDate = undefined;
      e.endReason = undefined;
    }
    await e.save();
    return e;
  },

  async linkUser(id, userIdToLink, performedBy) {
    const e = await Employee.findById(id);
    if (!e) throw ApiError.notFound('Employee not found');
    if (userIdToLink) {
      const u = await User.findById(userIdToLink);
      if (!u) throw ApiError.notFound('User not found');
      // Prevent linking the same User to multiple employees
      const dup = await Employee.findOne({ user: userIdToLink, _id: { $ne: id } });
      if (dup) throw ApiError.conflict('This user is already linked to another employee');
      e.user = userIdToLink;
    } else {
      e.user = null;
    }
    e.updatedBy = performedBy;
    await e.save();
    return e;
  },

  async remove(id) {
    await Attendance.deleteMany({ employee: id });
    const e = await Employee.findByIdAndDelete(id);
    if (!e) throw ApiError.notFound('Employee not found');
    return e;
  },

  async getTeam(managerId) {
    return Employee.find({ reportsTo: managerId, status: 'active' })
      .populate('warehouse', 'name code')
      .sort('name');
  },

  // ===== Attendance =====
  async markAttendance(employeeId, payload, markedBy) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw ApiError.notFound('Employee not found');

    const date = startOfDay(payload.date || new Date());

    const data = {
      employee: employeeId,
      date,
      status: payload.status,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      notes: payload.notes,
      markedBy,
    };

    return Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      data,
      { upsert: true, new: true, runValidators: true }
    );
  },

  async listAttendance({
    employee,
    status,
    from,
    to,
    page = 1,
    limit = 50,
    sort = '-date',
  }) {
    const filter = {};
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDay(from);
      if (to) filter.date.$lte = startOfDay(to);
    }
    const [items, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'name employeeCode designation')
        .populate('markedBy', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  },

  async getAttendanceSummary(employeeId, { from, to }) {
    const filter = { employee: employeeId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDay(from);
      if (to) filter.date.$lte = startOfDay(to);
    }
    const agg = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, hours: { $sum: '$hoursWorked' } } },
    ]);
    return agg.reduce(
      (acc, row) => {
        acc.byStatus[row._id] = { count: row.count, hours: row.hours || 0 };
        acc.totalDays += row.count;
        acc.totalHours += row.hours || 0;
        return acc;
      },
      { totalDays: 0, totalHours: 0, byStatus: {} }
    );
  },
};
