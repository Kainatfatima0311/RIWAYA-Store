import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/user/user.model.js';
import { Warehouse } from '../src/modules/warehouse/warehouse.model.js';
import { Floor } from '../src/modules/warehouse/floor.model.js';
import { Rack } from '../src/modules/warehouse/rack.model.js';
import { RackCategory } from '../src/modules/warehouse/rack-category.model.js';
import { StockItem } from '../src/modules/stock/stock-item.model.js';
import { StockEntry } from '../src/modules/stock/stock-entry.model.js';
import { ProductCategory } from '../src/modules/product-category/product-category.model.js';
import { Product } from '../src/modules/product/product.model.js';

const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const info = (msg) => console.log(`  ℹ ${msg}`);

// Unsplash CDN image (free, no auth, stable). Frontend has an onError fallback
// in <ProductImage> so any broken URL gracefully degrades to a branded placeholder.
const unsplash = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// 4 rack categories (inventory grouping)
const RACK_CATEGORIES = [
  { name: 'Bridal', description: 'Bridal & wedding wear', color: '#8B1538' },
  { name: 'Formal', description: 'Formal wear & dinner outfits', color: '#C9A96E' },
  { name: 'Embroidery', description: 'Embroidered & hand-worked pieces', color: '#8B5A8A' },
  { name: 'Casual', description: 'Everyday casual wear', color: '#7C9885' },
];

// 4 customer-facing product categories
const PRODUCT_CATEGORIES = [
  { name: 'Bridal', description: 'Wedding & bridal collection', displayOrder: 1 },
  { name: 'Formal', description: 'Formal wear & dinner outfits', displayOrder: 2 },
  { name: 'Embroidered', description: 'Hand-embroidered designs', displayOrder: 3 },
  { name: 'Casual', description: 'Everyday casual wear', displayOrder: 4 },
];

// 6 demo products — each with 3 real fashion images from Unsplash
const PRODUCTS = [
  {
    name: 'Embroidered Bridal Suit — Maroon Velvet',
    sku: 'BRD-VEL-001',
    productCategory: 'Bridal',
    rackCategory: 'Bridal',
    description:
      'A stunning maroon velvet bridal suit featuring intricate dabka and zardozi embroidery throughout the bodice and sleeves. The matching velvet trousers and silk dupatta with heavy embroidered border complete the regal ensemble. Designed for the modern bride who values heritage craftsmanship.',
    shortDescription: 'Hand-embroidered velvet bridal ensemble with zardozi & dabka work.',
    basePrice: 45000,
    salePrice: 38500,
    images: [],
    initialStock: 5,
    isFeatured: true,
    isBestseller: true,
    tags: ['bridal', 'velvet', 'embroidered', 'wedding'],
  },
  {
    name: 'Wedding Sharara Set — Emerald Green',
    sku: 'WED-SHR-001',
    productCategory: 'Bridal',
    rackCategory: 'Bridal',
    description:
      'Emerald green sharara set with heavy gota work on the kameez and matching net dupatta with golden lace border. The flared sharara is paired with intricate silver thread embroidery. Perfect for mehndi, walima, or formal wedding events.',
    shortDescription: 'Heavy gota work sharara set for wedding events.',
    basePrice: 32000,
    images: [],
    initialStock: 8,
    isFeatured: true,
    tags: ['bridal', 'sharara', 'gota', 'green'],
  },
  {
    name: 'Formal Lawn 3-Piece — Champagne Cream',
    sku: 'FRM-LWN-001',
    productCategory: 'Formal',
    rackCategory: 'Formal',
    description:
      'Lightweight champagne cream lawn three-piece with delicate thread embroidery on the neckline, sleeves, and dupatta border. Ideal for summer dinners and daytime events. Includes shirt, trouser, and matching dupatta.',
    shortDescription: 'Premium lawn 3-piece with thread embroidery.',
    basePrice: 8500,
    salePrice: 7200,
    images: [],
    initialStock: 25,
    isFeatured: true,
    tags: ['formal', 'lawn', '3-piece', 'summer'],
  },
  {
    name: 'Designer Chiffon Saree — Royal Blue',
    sku: 'SAR-CHF-001',
    productCategory: 'Formal',
    rackCategory: 'Formal',
    description:
      'Flowing royal blue chiffon saree with hand-embroidered silver border and stone work. Comes with an unstitched silver-grey blouse piece. A timeless choice for cocktail evenings and formal dinners.',
    shortDescription: 'Royal blue chiffon saree with silver embroidered border.',
    basePrice: 18000,
    images: [],
    initialStock: 12,
    isFeatured: true,
    tags: ['formal', 'saree', 'chiffon', 'evening'],
  },
  {
    name: 'Eid Embroidered Frock — Blush Pink',
    sku: 'EID-FRK-001',
    productCategory: 'Embroidered',
    rackCategory: 'Embroidery',
    description:
      'Festive blush pink frock with hand embroidery, pearl detailing, and a flared silhouette. Comes with chooridar pajama and net dupatta. Perfect for Eid celebrations and family gatherings.',
    shortDescription: 'Festive embroidered frock with pearl detailing.',
    basePrice: 12500,
    salePrice: 10500,
    images: [],
    initialStock: 15,
    isNew: true,
    isBestseller: true,
    tags: ['eid', 'embroidered', 'pink', 'festive'],
  },
  {
    name: 'Casual Cotton Kurti — Navy Block Print',
    sku: 'CAS-KRT-001',
    productCategory: 'Casual',
    rackCategory: 'Casual',
    description:
      'Comfortable everyday cotton kurti with traditional block print pattern in navy and white. Soft fabric, breathable, and perfect for daily wear. Pair with jeans or shalwar for a versatile look.',
    shortDescription: 'Block-printed cotton kurti for daily wear.',
    basePrice: 2800,
    images: [],
    initialStock: 40,
    isNew: true,
    tags: ['casual', 'cotton', 'kurti', 'daily'],
  },
];

const run = async () => {
  try {
    console.log('\n--- RIWAYA Demo Data Seeder ---\n');
    await connectDB();

    // 1. Need a super admin to attribute creation to
    const admin = await User.findOne({ email: env.seed.superAdminEmail });
    if (!admin) {
      console.error('  ✗ Super admin not found. Run `npm run seed:admin` first.');
      await mongoose.disconnect();
      process.exit(1);
    }
    ok(`Using admin: ${admin.email}`);

    // 2. Rack categories
    log('\n[1/7] Rack categories…');
    const rackCatMap = {};
    for (const rc of RACK_CATEGORIES) {
      let cat = await RackCategory.findOne({ name: rc.name });
      if (cat) {
        info(`Rack category exists: ${rc.name}`);
      } else {
        cat = await RackCategory.create({ ...rc, createdBy: admin._id });
        ok(`Created rack category: ${rc.name}`);
      }
      rackCatMap[rc.name] = cat;
    }

    // 3. Warehouse
    log('\n[2/7] Warehouse…');
    let warehouse = await Warehouse.findOne({ code: 'WH-LHR-01' });
    if (warehouse) {
      info(`Warehouse exists: ${warehouse.name}`);
    } else {
      warehouse = await Warehouse.create({
        name: 'RIWAYA Lahore Flagship',
        code: 'WH-LHR-01',
        location: {
          address: 'House 12, Block H, DHA Phase 5',
          area: 'DHA Phase 5',
          city: 'Lahore',
          province: 'Punjab',
          country: 'Pakistan',
        },
        areaMarla: 20,
        areaSqft: 5000,
        totalFloors: 2,
        storageCapacity: 5000,
        description: 'Main warehouse + flagship store',
        createdBy: admin._id,
      });
      ok(`Created warehouse: ${warehouse.name}`);
    }

    // 4. Floor
    log('\n[3/7] Floor…');
    let floor = await Floor.findOne({ warehouse: warehouse._id, floorNumber: 0 });
    if (floor) {
      info(`Floor exists: ${floor.name || `Floor ${floor.floorNumber}`}`);
    } else {
      floor = await Floor.create({
        warehouse: warehouse._id,
        floorNumber: 0,
        name: 'Ground Floor',
        areaSqft: 2500,
        description: 'Main retail floor and stock area',
        createdBy: admin._id,
      });
      ok('Created floor: Ground Floor');
    }

    // 5. Racks (one per rack category)
    log('\n[4/7] Racks…');
    const rackMap = {};
    for (const rcName of Object.keys(rackCatMap)) {
      const code = `GF-${rcName.slice(0, 3).toUpperCase()}-01`;
      let rack = await Rack.findOne({ warehouse: warehouse._id, code });
      if (rack) {
        info(`Rack exists: ${code}`);
      } else {
        rack = await Rack.create({
          warehouse: warehouse._id,
          floor: floor._id,
          rackCategory: rackCatMap[rcName]._id,
          code,
          name: `${rcName} Display`,
          type: 'rack',
          capacity: 500,
          createdBy: admin._id,
        });
        ok(`Created rack: ${code} (${rcName})`);
      }
      rackMap[rcName] = rack;
    }

    // 6. Product categories
    log('\n[5/7] Product categories…');
    const productCatMap = {};
    for (const pc of PRODUCT_CATEGORIES) {
      let cat = await ProductCategory.findOne({ name: pc.name });
      if (cat) {
        info(`Product category exists: ${pc.name}`);
      } else {
        cat = await ProductCategory.create({
          ...pc,
          displayOnFrontend: true,
          isActive: true,
          createdBy: admin._id,
        });
        ok(`Created product category: ${pc.name}`);
      }
      productCatMap[pc.name] = cat;
    }

    // 7. Stock items + initial stock + products
    log('\n[6/7] Stock items + stock receive…');
    log('\n[7/7] Products with images…');

    let createdProducts = 0;
    let skippedProducts = 0;

    for (const p of PRODUCTS) {
      // 7a. Stock item
      let stock = await StockItem.findOne({ sku: p.sku });
      if (!stock) {
        stock = await StockItem.create({
          name: p.name,
          sku: p.sku,
          description: p.shortDescription,
          rackCategory: rackCatMap[p.rackCategory]._id,
          defaultRack: rackMap[p.rackCategory]._id,
          unit: 'pcs',
          unitCost: Math.round(p.basePrice * 0.6), // 60% cost margin
          lastCost: Math.round(p.basePrice * 0.6),
          minStockLevel: 3,
          reorderLevel: 1,
          tags: p.tags,
          isActive: true,
          createdBy: admin._id,
        });
        ok(`Stock item created: ${p.sku}`);

        // Initial stock entry — directly create with starting quantity
        await StockEntry.create({
          stockItem: stock._id,
          warehouse: warehouse._id,
          floor: floor._id,
          rack: rackMap[p.rackCategory]._id,
          quantity: p.initialStock,
          lastReceivedAt: new Date(),
        });
        stock.totalQuantity = p.initialStock;
        await stock.save();
        ok(`Stocked ${p.initialStock} units of ${p.sku}`);
      } else {
        info(`Stock item exists: ${p.sku}`);
      }

      // 7b. Product — upsert (always refresh latest images/flags/prices)
      const productData = {
        name: p.name,
        sku: p.sku,
        brand: 'RIWAYA',
        shortDescription: p.shortDescription,
        description: p.description,
        categories: [productCatMap[p.productCategory]._id],
        basePrice: p.basePrice,
        salePrice: p.salePrice,
        currency: 'PKR',
        variants: [
          {
            label: 'Default',
            stockItem: stock._id,
            additionalPrice: 0,
            isDefault: true,
          },
        ],
        images: (p.images || []).map((id, idx) => ({
          url: unsplash(id),
          alt: p.name,
          isPrimary: idx === 0,
          order: idx,
        })),
        displayOnFrontend: true,
        status: 'published',
        isFeatured: !!p.isFeatured,
        isNew: !!p.isNew,
        isBestseller: !!p.isBestseller,
        tags: p.tags,
        specifications: [
          { label: 'Brand', value: 'RIWAYA' },
          { label: 'Country of origin', value: 'Pakistan' },
          { label: 'Care', value: 'Dry clean only' },
        ],
      };

      const existing = await Product.findOne({ sku: p.sku });
      if (existing) {
        Object.assign(existing, productData);
        existing.updatedBy = admin._id;
        await existing.save();
        skippedProducts++;
        ok(`Product refreshed: ${p.name}`);
      } else {
        await Product.create({ ...productData, createdBy: admin._id });
        createdProducts++;
        ok(`Product created: ${p.name}`);
      }
    }

    // Update productCount on categories
    for (const cat of Object.values(productCatMap)) {
      const count = await Product.countDocuments({
        categories: cat._id,
        status: 'published',
      });
      cat.productCount = count;
      await cat.save();
    }

    console.log('\n--- Summary ---');
    ok(`Rack categories : ${RACK_CATEGORIES.length}`);
    ok(`Warehouses      : 1 (${warehouse.code})`);
    ok(`Floors          : 1`);
    ok(`Racks           : ${Object.keys(rackMap).length}`);
    ok(`Product cats    : ${PRODUCT_CATEGORIES.length}`);
    ok(`Products        : ${createdProducts} new, ${skippedProducts} refreshed`);
    console.log('\n--- Done! ---');
    console.log('  Open http://localhost:5173 to see the products on storefront.');
    console.log('  Admin login: superadmin@riwaya.com / Super@1234\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

run();
