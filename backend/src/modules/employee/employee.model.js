import mongoose from 'mongoose';

export const EMPLOYEE_DEPARTMENTS = Object.freeze([
  'warehouse',
  'sales',
  'inventory',
  'accounts',
  'admin',
  'hr',
  'it',
  'marketing',
  'logistics',
  'production',
  'other',
]);

export const EMPLOYEE_STATUS = Object.freeze([
  'active',
  'on_leave',
  'suspended',
  'terminated',
  'resigned',
  'probation',
]);

export const WORK_TYPES = Object.freeze(['full_time', 'part_time', 'contract', 'intern']);
export const SALARY_FREQUENCY = Object.freeze(['monthly', 'weekly', 'daily', 'hourly']);
export const GENDERS = Object.freeze(['male', 'female', 'other']);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    relation: { type: String, trim: true, maxlength: 60 },
    phone: { type: String, trim: true, maxlength: 30 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 80 },
    province: { type: String, trim: true, maxlength: 80 },
    country: { type: String, default: 'Pakistan', trim: true, maxlength: 80 },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 60 }, // CNIC, contract, certificate
    url: { type: String, required: true },
    publicId: { type: String },
    notes: { type: String, trim: true, maxlength: 300 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    // Optional link to User (when employee gets login access)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
      unique: true,
    },

    employeeCode: { type: String, unique: true, uppercase: true, trim: true, maxlength: 20 },

    // Personal
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, sparse: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    cnic: { type: String, required: true, trim: true, maxlength: 20, unique: true, sparse: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: GENDERS },
    bloodGroup: { type: String, trim: true, maxlength: 10 },

    address: { type: addressSchema, default: () => ({}) },
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },

    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // Employment
    designation: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, enum: EMPLOYEE_DEPARTMENTS, required: true, index: true },
    workType: { type: String, enum: WORK_TYPES, default: 'full_time' },
    joiningDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    endReason: { type: String, trim: true, maxlength: 300 },

    // Compensation
    salary: { type: Number, required: true, min: 0 },
    salaryFrequency: { type: String, enum: SALARY_FREQUENCY, default: 'monthly' },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },
    bankAccount: {
      bankName: { type: String, trim: true, maxlength: 120 },
      accountTitle: { type: String, trim: true, maxlength: 120 },
      accountNumber: { type: String, trim: true, maxlength: 40 },
      iban: { type: String, trim: true, maxlength: 40 },
    },

    // Location
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', index: true },

    // Hierarchy
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

    // Status
    status: { type: String, enum: EMPLOYEE_STATUS, default: 'active', index: true },

    // Documents
    documents: [documentSchema],

    // Skills / notes
    skills: [{ type: String, trim: true, maxlength: 40 }],
    notes: { type: String, trim: true, maxlength: 1000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 'text', email: 'text', phone: 'text', employeeCode: 'text', designation: 'text' });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ warehouse: 1, status: 1 });

employeeSchema.virtual('tenureMonths').get(function () {
  if (!this.joiningDate) return 0;
  const end = this.endDate || new Date();
  return Math.max(0, Math.round((end - this.joiningDate) / (1000 * 60 * 60 * 24 * 30)));
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.model('Employee', employeeSchema);

// ===== Attendance (lightweight) =====
export const ATTENDANCE_STATUS = Object.freeze(['present', 'absent', 'leave', 'half_day', 'remote']);

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: Date, required: true, index: true }, // start-of-day
    status: { type: String, enum: ATTENDANCE_STATUS, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    hoursWorked: { type: Number, min: 0 },
    notes: { type: String, trim: true, maxlength: 300 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    this.hoursWorked = +((this.checkOut - this.checkIn) / (1000 * 60 * 60)).toFixed(2);
  }
  next();
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
