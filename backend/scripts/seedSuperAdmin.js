import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/user/user.model.js';
import { ROLES } from '../src/middleware/role.middleware.js';

const run = async () => {
  try {
    await connectDB();

    const { superAdminName, superAdminEmail, superAdminPassword } = env.seed;

    const existing = await User.findOne({ email: superAdminEmail });

    if (existing) {
      // Idempotent: if the seed email exists but has the wrong role
      // (e.g. accidentally registered as customer via /register),
      // promote it to super_admin and reset the password.
      const oldRole = existing.role;
      if (oldRole !== ROLES.SUPER_ADMIN) {
        existing.role = ROLES.SUPER_ADMIN;
        existing.password = superAdminPassword; // pre-save hook re-hashes
        existing.isActive = true;
        await existing.save();
        console.log('✓ Fixed existing account');
        console.log(`  Email:    ${superAdminEmail}`);
        console.log(`  Role:     ${oldRole} → super_admin`);
        console.log(`  Password: ${superAdminPassword} (reset)`);
      } else {
        // Already correct — leave the existing password untouched (idempotent).
        if (!existing.isActive) {
          existing.isActive = true;
          await existing.save();
        }
        console.log('ℹ Super admin already exists — no changes made (password left intact)');
        console.log(`  Email:    ${superAdminEmail}`);
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    const user = await User.create({
      name: superAdminName,
      email: superAdminEmail,
      password: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
    });

    console.log('✓ Super admin created');
    console.log(`  Name:     ${user.name}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${superAdminPassword}`);
    console.log('  ⚠ Change this password after first login.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  }
};

run();
