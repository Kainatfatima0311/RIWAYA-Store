/**
 * applyProductImages.js — copies images from `backend/seed-images/products/`
 * into the public uploads folder and attaches them to the matching products.
 *
 * Two naming styles supported:
 *
 *   1. **SKU-named (precise)** — `<SKU>.jpg` or `<SKU>-N.jpg`
 *      Example:  BRD-VEL-001.jpg, BRD-VEL-001-2.jpg
 *      Single file `<SKU>.<ext>` = the only image (primary).
 *      `<SKU>-1.<ext>` = primary in a gallery. `-2`, `-3` etc. follow.
 *
 *   2. **Positional (quick)** — `1.jpg`, `2.jpg`, ..., `N.jpg`
 *      Pure-numeric filenames map to products in DB creation order:
 *      `1.jpg` → 1st product, `2.jpg` → 2nd, etc. Use this when you just
 *      want to drop images quickly. SKU-named files always take precedence.
 *
 * Allowed extensions: jpg, jpeg, png, webp.
 *
 * Run:  npm run images:apply
 */
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Product } from '../src/modules/product/product.model.js';

const SOURCE_DIR = path.resolve(process.cwd(), 'seed-images', 'products');
const TARGET_DIR = path.resolve(process.cwd(), 'uploads', 'products');
const PUBLIC_PREFIX = '/uploads/products';
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ok = (m) => console.log(`  ✓ ${m}`);
const info = (m) => console.log(`  ℹ ${m}`);
const warn = (m) => console.log(`  ⚠ ${m}`);

const run = async () => {
  console.log('\n--- RIWAYA: Apply Product Images ---\n');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`  ✗ Source folder not found: ${SOURCE_DIR}`);
    console.error('    Create the folder and drop your images, then re-run.');
    process.exit(1);
  }

  const entries = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => !f.startsWith('.') && f.toLowerCase() !== 'readme.md');

  if (entries.length === 0) {
    info('No images in seed-images/products/.');
    info('Drop image files there (named by SKU or 1/2/3) and re-run.');
    info('See seed-images/products/README.md for the naming convention.');
    process.exit(0);
  }

  await connectDB();

  // Load all products + their valid SKUs from DB, in creation order (for positional mapping)
  const products = await Product.find({}).sort({ createdAt: 1 }).lean();
  const skuSet = new Set(products.map((p) => p.sku.toUpperCase()));
  const productBySku = Object.fromEntries(
    products.map((p) => [p.sku.toUpperCase(), p])
  );

  /**
   * Parse a filename into { kind, key, order, ext }.
   *   kind = "sku" → key is a product SKU
   *   kind = "positional" → key is a number string ("1", "2", ...)
   *   kind = null → unparseable / unsupported
   */
  const parseFilename = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return { kind: null, reason: 'unsupported extension' };
    const stem = path.basename(filename, ext);
    const upper = stem.toUpperCase();

    // 1. Exact full-stem SKU match (single image, primary).
    if (skuSet.has(upper)) return { kind: 'sku', key: upper, order: 1, ext };

    // 2. Trailing -N where the preceding part is a known SKU (multi-image gallery).
    const m = upper.match(/^(.+)-(\d+)$/);
    if (m && skuSet.has(m[1])) {
      return { kind: 'sku', key: m[1], order: parseInt(m[2], 10), ext };
    }

    // 3. Pure-numeric stem → positional mapping.
    if (/^\d+$/.test(stem)) {
      return { kind: 'positional', key: stem, order: parseInt(stem, 10), ext };
    }

    return { kind: null, reason: 'no matching SKU and not numeric' };
  };

  // ---- Group files ----
  /** @type {Record<string, Array<{ filename, order, ext }>>} */
  const bySku = {};                                  // sku → files for that sku
  /** @type {Array<{ filename, order, ext }>} */
  const positional = [];                             // numeric files (sort + assign positionally)
  const skippedNames = [];

  for (const f of entries) {
    const parsed = parseFilename(f);
    if (parsed.kind === 'sku') {
      if (!bySku[parsed.key]) bySku[parsed.key] = [];
      bySku[parsed.key].push({ filename: f, order: parsed.order, ext: parsed.ext });
    } else if (parsed.kind === 'positional') {
      positional.push({ filename: f, order: parsed.order, ext: parsed.ext });
    } else {
      skippedNames.push(`${f} (${parsed.reason})`);
    }
  }

  // ---- Map positional files to products that don't yet have an SKU-named match ----
  if (positional.length > 0) {
    positional.sort((a, b) => a.order - b.order);
    const queueOfProducts = products.filter((p) => !bySku[p.sku.toUpperCase()]);
    info(`Positional mapping: ${positional.length} numbered file(s) → first ${Math.min(positional.length, queueOfProducts.length)} product(s) by creation order`);
    for (let i = 0; i < positional.length; i++) {
      const product = queueOfProducts[i];
      if (!product) {
        skippedNames.push(`${positional[i].filename} (no product slot left)`);
        continue;
      }
      const sku = product.sku.toUpperCase();
      if (!bySku[sku]) bySku[sku] = [];
      bySku[sku].push({ filename: positional[i].filename, order: 1, ext: positional[i].ext });
    }
  }

  if (skippedNames.length) {
    skippedNames.forEach((s) => warn(`Skipped: ${s}`));
  }

  // ---- Ensure target dir ----
  if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

  // ---- Apply ----
  let productsUpdated = 0;
  let totalImagesCopied = 0;

  for (const [sku, files] of Object.entries(bySku)) {
    const product = productBySku[sku];
    if (!product) continue;
    files.sort((a, b) => a.order - b.order);

    const newImages = [];
    for (const f of files) {
      const sourcePath = path.join(SOURCE_DIR, f.filename);
      const stamp = Date.now();
      const random = crypto.randomBytes(4).toString('hex');
      const targetName = `${stamp}-${random}-${sku.toLowerCase()}-${f.order}${f.ext}`;
      const targetPath = path.join(TARGET_DIR, targetName);
      try {
        fs.copyFileSync(sourcePath, targetPath);
      } catch (err) {
        warn(`Failed to copy ${f.filename}: ${err.message}`);
        continue;
      }
      newImages.push({
        url: `${PUBLIC_PREFIX}/${targetName}`,
        publicId: `products/${targetName}`,
        alt: product.name,
        isPrimary: newImages.length === 0,
        order: newImages.length,
      });
      totalImagesCopied++;
    }

    if (newImages.length === 0) continue;

    await Product.updateOne({ _id: product._id }, { $set: { images: newImages } });
    productsUpdated++;
    const sourceLabel = files.map((f) => f.filename).join(', ');
    ok(`${sku.padEnd(15)} ← ${sourceLabel}`);
  }

  console.log('\n--- Summary ---');
  ok(`Products updated  : ${productsUpdated}`);
  ok(`Images copied     : ${totalImagesCopied}`);
  if (skippedNames.length) warn(`Files skipped     : ${skippedNames.length}`);

  // Products still without images
  const stillEmpty = await Product.find({
    $or: [{ images: { $size: 0 } }, { images: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .select('sku name')
    .lean();
  if (stillEmpty.length) {
    console.log('\n--- Products WITHOUT images yet ---');
    stillEmpty.forEach((p) => console.log(`  - ${p.sku.padEnd(15)} ${p.name}`));
    console.log('  (drop a file named <SKU>.jpg in seed-images/products/, or a numbered file)');
  } else if (productsUpdated > 0) {
    ok('All products now have at least one image.');
  }

  console.log('\n--- Done ---\n');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('\n✗ applyProductImages failed:', err.message);
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
