import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

// Wipes ALL business data so you can start the project fresh, while KEEPING
// staff login accounts (super_admin + admin) so you never get locked out.
//
// Safe by default: running it WITHOUT --yes only prints what *would* be deleted
// (a dry run). Pass --yes to actually delete.
//
//   npm run clean:data            # dry run — shows counts, deletes nothing
//   npm run clean:data -- --yes   # really wipe (keeps admin/staff logins)

const KEEP_STAFF_ROLES = ['super_admin', 'admin'];

const run = async () => {
  const confirmed = process.argv.includes('--yes') || process.env.CLEAN_CONFIRM === 'yes';
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const names = (await db.listCollections().toArray()).map((c) => c.name).sort();

    console.log('\n--- RIWAYA Data Cleanup ---');
    console.log(`Database : ${mongoose.connection.name}`);
    console.log(`Keeps    : user accounts with role ${KEEP_STAFF_ROLES.join(' / ')}`);
    console.log('Wipes    : everything else (warehouses, racks, stock, products, orders,');
    console.log('           customers, suppliers, counters, carts, etc.)\n');

    if (!confirmed) {
      console.log('DRY RUN — nothing deleted. This is what WOULD be cleared:\n');
      for (const name of names) {
        const coll = db.collection(name);
        if (name === 'users') {
          const total = await coll.countDocuments();
          const keep = await coll.countDocuments({ role: { $in: KEEP_STAFF_ROLES } });
          console.log(`  users           : keep ${keep} staff, delete ${total - keep} other(s)`);
        } else {
          console.log(`  ${name.padEnd(16)}: ${await coll.countDocuments()} doc(s)`);
        }
      }
      console.log('\nTo really clean (this cannot be undone):\n  npm run clean:data -- --yes\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    let deleted = 0;
    console.log('Cleaning...\n');
    for (const name of names) {
      const coll = db.collection(name);
      if (name === 'users') {
        const r = await coll.deleteMany({ role: { $nin: KEEP_STAFF_ROLES } });
        console.log(`  users           : deleted ${r.deletedCount} non-staff (staff kept)`);
        deleted += r.deletedCount;
      } else {
        const r = await coll.deleteMany({});
        console.log(`  ${name.padEnd(16)}: deleted ${r.deletedCount}`);
        deleted += r.deletedCount;
      }
    }
    console.log(`\n✓ Done. ${deleted} document(s) removed. Staff logins preserved.`);
    console.log('  Auto-numbering (PO / Order / Payment / SKU / Customer …) restarts from 1.\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Cleanup failed:', err.message);
    process.exit(1);
  }
};

run();
