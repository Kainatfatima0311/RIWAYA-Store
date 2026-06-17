import { z } from 'zod';
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_STATUS,
  WORK_TYPES,
  SALARY_FREQUENCY,
  GENDERS,
  ATTENDANCE_STATUS,
} from './employee.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const addressSchema = z.object({
  line1: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().max(120).optional(),
  relation: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().max(120).optional(),
  accountTitle: z.string().max(120).optional(),
  accountNumber: z.string().max(40).optional(),
  iban: z.string().max(40).optional(),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().min(7).max(30),
  cnic: z.string().min(5).max(20),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  bloodGroup: z.string().max(10).optional(),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  designation: z.string().min(2).max(120),
  department: z.enum(EMPLOYEE_DEPARTMENTS),
  workType: z.enum(WORK_TYPES).optional(),
  joiningDate: z.coerce.date(),
  salary: z.number().nonnegative(),
  salaryFrequency: z.enum(SALARY_FREQUENCY).optional(),
  currency: z.string().max(8).optional(),
  bankAccount: bankAccountSchema.optional(),
  warehouse: objectId.optional(),
  reportsTo: objectId.optional(),
  status: z.enum(EMPLOYEE_STATUS).optional(),
  skills: z.array(z.string().max(40)).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const listEmployeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  department: z.enum(EMPLOYEE_DEPARTMENTS).optional(),
  status: z.enum(EMPLOYEE_STATUS).optional(),
  warehouse: objectId.optional(),
  workType: z.enum(WORK_TYPES).optional(),
  reportsTo: objectId.optional(),
  sort: z.string().optional().default('-joiningDate'),
});

export const employeeIdSchema = z.object({ id: objectId });

export const setStatusSchema = z.object({
  status: z.enum(EMPLOYEE_STATUS),
  endReason: z.string().max(300).optional(),
});

export const linkUserSchema = z.object({
  user: objectId.nullable(),
});

// ===== Attendance =====
export const markAttendanceSchema = z.object({
  date: z.coerce.date().optional(),
  status: z.enum(ATTENDANCE_STATUS),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  notes: z.string().max(300).optional(),
});

export const listAttendanceQuerySchema = z.object({
  employee: objectId.optional(),
  status: z.enum(ATTENDANCE_STATUS).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  sort: z.string().optional().default('-date'),
});
