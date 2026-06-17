/**
 * seedRichDemo.js — populates the database with rich demo content so that
 * every admin module + storefront looks like a live, used store.
 *
 * Adds (idempotent — safe to re-run):
 *   - 10 more products (across all 4 categories) with stock entries
 *   - 4 customers with login-enabled User accounts
 *   - 3 suppliers
 *   - 1 fully-received Purchase Order (with stock movements)
 *   - 10 orders spread across past 30 days, varied statuses
 *   - Payments for paid/partial orders
 *   - 4 employees
 *   - 3 equipment items + categories
 *
 * Requires `npm run seed:admin` and `npm run seed:demo` to have been run first.
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/user/user.model.js';
import { ROLES } from '../src/middleware/role.middleware.js';
import { Warehouse } from '../src/modules/warehouse/warehouse.model.js';
import { Floor } from '../src/modules/warehouse/floor.model.js';
import { Rack } from '../src/modules/warehouse/rack.model.js';
import { RackCategory } from '../src/modules/warehouse/rack-category.model.js';
import { StockItem } from '../src/modules/stock/stock-item.model.js';
import { StockEntry } from '../src/modules/stock/stock-entry.model.js';
import { StockMovement } from '../src/modules/stock/stock-movement.model.js';
import { ProductCategory } from '../src/modules/product-category/product-category.model.js';
import { Product } from '../src/modules/product/product.model.js';
import { Customer } from '../src/modules/customer/customer.model.js';
import { Supplier } from '../src/modules/supplier/supplier.model.js';
import { PurchaseOrder } from '../src/modules/purchase-order/purchase-order.model.js';
import { Order } from '../src/modules/order/order.model.js';
import { Payment } from '../src/modules/payment/payment.model.js';
import { Employee } from '../src/modules/employee/employee.model.js';
import { Equipment } from '../src/modules/equipment/equipment.model.js';
import { EquipmentCategory } from '../src/modules/equipment/equipment-category.model.js';

const log = (m) => console.log(`  ${m}`);
const ok = (m) => console.log(`  ✓ ${m}`);
const info = (m) => console.log(`  ℹ ${m}`);
const heading = (m) => console.log(`\n[${m}]`);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), n % 60, 0, 0);
  return d;
};

// ============================================================================
// PRODUCT CATALOG — 10 additional products (on top of the 6 from seed:demo)
// ============================================================================
const NEW_PRODUCTS = [
  {
    name: 'Bridal Lehenga — Gold Tissue',
    sku: 'BRD-LEH-002',
    productCategory: 'Bridal',
    rackCategory: 'Bridal',
    description:
      'Luxurious gold tissue lehenga choli with hand-stitched zardozi work covering the entire skirt. Heavy embroidered choli paired with a net dupatta finished with kundan border. The ultimate statement piece for the modern bride.',
    shortDescription: 'Gold tissue lehenga with full zardozi work.',
    basePrice: 65000,
    salePrice: 58500,
    initialStock: 3,
    isFeatured: true,
    isBestseller: true,
    tags: ['bridal', 'lehenga', 'gold', 'zardozi'],
  },
  {
    name: 'Walima Dress — Ivory & Pearl',
    sku: 'BRD-WAL-001',
    productCategory: 'Bridal',
    rackCategory: 'Bridal',
    description:
      'Elegant ivory walima dress featuring pearl detailing, silver thread embroidery, and a flared silhouette. Comes with matching silver dupatta and slim-fit trousers. Designed for the post-wedding bride.',
    shortDescription: 'Ivory walima dress with pearl & silver thread work.',
    basePrice: 55000,
    initialStock: 4,
    isFeatured: true,
    isNew: true,
    tags: ['bridal', 'walima', 'ivory', 'pearl'],
  },
  {
    name: 'Formal Crepe Suit — Midnight Black',
    sku: 'FRM-CRP-001',
    productCategory: 'Formal',
    rackCategory: 'Formal',
    description:
      'Sophisticated black crepe three-piece with delicate silver embroidery at the neckline and cuffs. Slim straight pants and matching organza dupatta complete the look. Ideal for formal dinners and corporate events.',
    shortDescription: 'Black crepe formal 3-piece with silver embroidery.',
    basePrice: 9500,
    salePrice: 8100,
    initialStock: 18,
    isBestseller: true,
    tags: ['formal', 'crepe', 'black', 'dinner'],
  },
  {
    name: 'Formal Silk Trouser Suit — Teal',
    sku: 'FRM-SLK-001',
    productCategory: 'Formal',
    rackCategory: 'Formal',
    description:
      'Teal silk trouser suit with delicate gold thread embroidery on the front panel. Comfortable yet refined — perfect for evening gatherings and Eid get-togethers.',
    shortDescription: 'Teal silk formal trouser suit with gold thread work.',
    basePrice: 14500,
    initialStock: 10,
    isFeatured: true,
    tags: ['formal', 'silk', 'teal'],
  },
  {
    name: 'Mehndi Outfit — Sunshine Yellow',
    sku: 'EID-MHD-001',
    productCategory: 'Embroidered',
    rackCategory: 'Embroidery',
    description:
      'Vibrant yellow mehndi outfit with traditional gota work, mirror detailing, and a flared sharara. Includes matching dupatta with tassels. Perfect for mehndi ceremonies and dholki nights.',
    shortDescription: 'Yellow mehndi outfit with gota work & mirrors.',
    basePrice: 18000,
    salePrice: 15300,
    initialStock: 7,
    isNew: true,
    isBestseller: true,
    tags: ['mehndi', 'yellow', 'gota', 'sharara'],
  },
  {
    name: 'Embroidered Maxi — Mustard Velvet',
    sku: 'EMB-MAX-001',
    productCategory: 'Embroidered',
    rackCategory: 'Embroidery',
    description:
      'Floor-length mustard velvet maxi with intricate copper thread embroidery throughout the bodice. Bell sleeves and flared bottom give a regal silhouette. Pair with statement jewelry for an evening look.',
    shortDescription: 'Mustard velvet embroidered maxi with copper thread.',
    basePrice: 14500,
    initialStock: 11,
    isFeatured: true,
    tags: ['embroidered', 'maxi', 'velvet', 'mustard'],
  },
  {
    name: 'Net Embroidered Frock — Ferozi Blue',
    sku: 'EMB-NET-001',
    productCategory: 'Embroidered',
    rackCategory: 'Embroidery',
    description:
      'Ferozi blue net frock with multi-tier ruffles and silver embroidery. Comes with inner lining and matching net dupatta. Elegant choice for engagements and family functions.',
    shortDescription: 'Ferozi net frock with multi-tier ruffles.',
    basePrice: 17800,
    salePrice: 14900,
    initialStock: 9,
    tags: ['embroidered', 'net', 'ferozi', 'frock'],
  },
  {
    name: 'Casual Lawn Suit — Crisp White',
    sku: 'CAS-LWN-002',
    productCategory: 'Casual',
    rackCategory: 'Casual',
    description:
      'Breathable crisp white lawn 2-piece with delicate floral block print on the shirt. Loose fit kurta with comfortable straight trousers. A daily wear staple for hot summer days.',
    shortDescription: 'White lawn 2-piece with floral block print.',
    basePrice: 3500,
    initialStock: 50,
    isBestseller: true,
    tags: ['casual', 'lawn', 'white', 'summer'],
  },
  {
    name: 'Cotton Trouser Set — Beige',
    sku: 'CAS-CTN-001',
    productCategory: 'Casual',
    rackCategory: 'Casual',
    description:
      'Comfortable beige cotton trouser set with simple piping detail. Ideal for office wear or college. Easy to layer with a printed dupatta or shawl.',
    shortDescription: 'Beige cotton trouser set for daily wear.',
    basePrice: 2200,
    initialStock: 60,
    tags: ['casual', 'cotton', 'beige', 'office'],
  },
  {
    name: 'Printed Kurta — Charcoal Black',
    sku: 'CAS-KRT-002',
    productCategory: 'Casual',
    rackCategory: 'Casual',
    description:
      'Charcoal black printed long kurta with white geometric pattern. Pair with white trousers or jeans for a contemporary look. Made from soft viscose fabric.',
    shortDescription: 'Charcoal printed long kurta in soft viscose.',
    basePrice: 1800,
    salePrice: 1500,
    initialStock: 70,
    isNew: true,
    tags: ['casual', 'kurta', 'black', 'printed'],
  },
];

// ============================================================================
// CUSTOMERS — 4 Pakistani customers with login-enabled User accounts
// ============================================================================
const CUSTOMERS = [
  {
    name: 'Ayesha Khan',
    email: 'ayesha.khan@example.com',
    phone: '+923001234567',
    customerCode: 'CUST-DEMO-001',
    password: 'Test@1234',
    addresses: [
      {
        label: 'Home',
        fullName: 'Ayesha Khan',
        phone: '+923001234567',
        line1: 'House 45, Street 12, DHA Phase 5',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan',
        isDefault: true,
      },
    ],
    segment: 'vip',
    tags: ['premium', 'lahore'],
  },
  {
    name: 'Fatima Sheikh',
    email: 'fatima.sheikh@example.com',
    phone: '+923214567890',
    customerCode: 'CUST-DEMO-002',
    password: 'Test@1234',
    addresses: [
      {
        label: 'Home',
        fullName: 'Fatima Sheikh',
        phone: '+923214567890',
        line1: 'Flat 302, Sea Breeze Apartments, Clifton Block 4',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75600',
        country: 'Pakistan',
        isDefault: true,
      },
    ],
    segment: 'returning',
    tags: ['karachi'],
  },
  {
    name: 'Hina Malik',
    email: 'hina.malik@example.com',
    phone: '+923331122334',
    customerCode: 'CUST-DEMO-003',
    password: 'Test@1234',
    addresses: [
      {
        label: 'Home',
        fullName: 'Hina Malik',
        phone: '+923331122334',
        line1: 'House 18, Street 9, F-7/3',
        city: 'Islamabad',
        province: 'Islamabad',
        postalCode: '44000',
        country: 'Pakistan',
        isDefault: true,
      },
    ],
    segment: 'returning',
    tags: ['islamabad'],
  },
  {
    name: 'Sara Ahmed',
    email: 'sara.ahmed@example.com',
    phone: '+923445566778',
    customerCode: 'CUST-DEMO-004',
    password: 'Test@1234',
    addresses: [
      {
        label: 'Home',
        fullName: 'Sara Ahmed',
        phone: '+923445566778',
        line1: 'House 7, Bahria Town Phase 8',
        city: 'Rawalpindi',
        province: 'Punjab',
        postalCode: '46000',
        country: 'Pakistan',
        isDefault: true,
      },
    ],
    segment: 'new',
    tags: ['rawalpindi'],
  },
];

// ============================================================================
// SUPPLIERS
// ============================================================================
const SUPPLIERS = [
  {
    name: 'Faisal Mills',
    code: 'SUP-DEMO-001',
    type: 'mill',
    contactPerson: 'Mr. Asad Faisal',
    phone: '+924137654321',
    email: 'sales@faisalmills.pk',
    address: {
      line1: 'Plot 142, Faisalabad Industrial Estate',
      city: 'Faisalabad',
      province: 'Punjab',
      country: 'Pakistan',
    },
    ntn: '1234567-8',
    gst: '03-12-3456-789-12',
    paymentTerms: 'Net 30',
    bank: { bankName: 'HBL', accountTitle: 'Faisal Mills', accountNumber: '00123456789012' },
    notes: 'Primary fabric mill — bridal velvets and silks.',
  },
  {
    name: 'Sapphire Fabrics',
    code: 'SUP-DEMO-002',
    type: 'distributor',
    contactPerson: 'Ms. Sana Iqbal',
    phone: '+924235678901',
    email: 'orders@sapphire.pk',
    address: {
      line1: '12 Mall Road',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
    },
    ntn: '9876543-2',
    paymentTerms: 'Net 15',
    notes: 'Reliable distributor for lawn and chiffon stock.',
  },
  {
    name: 'Lahore Lace House',
    code: 'SUP-DEMO-003',
    type: 'wholesaler',
    contactPerson: 'Mr. Tariq Sheikh',
    phone: '+924235678234',
    address: {
      line1: 'Shop 23, Anarkali Bazaar',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
    },
    paymentTerms: 'COD',
    notes: 'Trims, lace, dupatta borders — bulk supplier.',
  },
];

// ============================================================================
// EMPLOYEES
// ============================================================================
const EMPLOYEES = [
  {
    employeeCode: 'EMP-DEMO-001',
    name: 'Hassan Ali',
    phone: '+923011111111',
    email: 'hassan.ali@riwaya.com',
    cnic: '35202-1111111-1',
    designation: 'Sales Manager',
    department: 'sales',
    joiningDate: daysAgo(540),
    salary: 85000,
  },
  {
    employeeCode: 'EMP-DEMO-002',
    name: 'Bilal Ahmed',
    phone: '+923022222222',
    email: 'bilal.ahmed@riwaya.com',
    cnic: '35202-2222222-2',
    designation: 'Warehouse Supervisor',
    department: 'warehouse',
    joiningDate: daysAgo(380),
    salary: 65000,
  },
  {
    employeeCode: 'EMP-DEMO-003',
    name: 'Sara Hussain',
    phone: '+923033333333',
    email: 'sara.hussain@riwaya.com',
    cnic: '35202-3333333-3',
    designation: 'Accountant',
    department: 'accounts',
    joiningDate: daysAgo(220),
    salary: 70000,
  },
  {
    employeeCode: 'EMP-DEMO-004',
    name: 'Imran Shah',
    phone: '+923044444444',
    email: 'imran.shah@riwaya.com',
    cnic: '35202-4444444-4',
    designation: 'Inventory Clerk',
    department: 'inventory',
    joiningDate: daysAgo(120),
    salary: 45000,
  },
];

// ============================================================================
// EQUIPMENT CATEGORIES + ITEMS
// ============================================================================
const EQUIPMENT_CATEGORIES = [
  { name: 'IT Equipment', description: 'Laptops, printers, networking gear' },
  { name: 'Office Equipment', description: 'Office furniture, fans, ACs' },
  { name: 'Production', description: 'Sewing machines and stitching tools' },
];

const EQUIPMENT_ITEMS = [
  {
    name: 'HP LaserJet Pro M1136',
    category: 'IT Equipment',
    brand: 'HP',
    model: 'M1136',
    serialNumber: 'HP-PRT-001',
    quantity: 1,
    purchaseDate: daysAgo(420),
    unitCost: 28000,
    warrantyMonths: 12,
    vendor: { name: 'Galaxy Computers', phone: '+924237771234' },
    condition: 'working',
  },
  {
    name: 'Dell Latitude 5420',
    category: 'IT Equipment',
    brand: 'Dell',
    model: 'Latitude 5420',
    quantity: 3,
    purchaseDate: daysAgo(280),
    unitCost: 165000,
    warrantyMonths: 24,
    vendor: { name: 'Czone', phone: '+924235551234' },
    condition: 'working',
  },
  {
    name: 'Juki Industrial Sewing Machine',
    category: 'Production',
    brand: 'Juki',
    model: 'DDL-8700',
    quantity: 2,
    purchaseDate: daysAgo(180),
    unitCost: 95000,
    warrantyMonths: 12,
    vendor: { name: 'Pakistan Machine Tools', phone: '+924234567000' },
    condition: 'working',
  },
];

// ============================================================================
// RUN
// ============================================================================
const run = async () => {
  console.log('\n--- RIWAYA Rich Demo Seeder ---\n');
  await connectDB();

  // -------- Prereqs --------
  const admin = await User.findOne({ email: env.seed.superAdminEmail });
  if (!admin) {
    console.error('  ✗ Super admin not found. Run `npm run seed:admin` first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  ok(`Using admin: ${admin.email}`);

  const warehouse = await Warehouse.findOne({ code: 'WH-LHR-01' });
  if (!warehouse) {
    console.error('  ✗ Demo warehouse not found. Run `npm run seed:demo` first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  const floor = await Floor.findOne({ warehouse: warehouse._id, floorNumber: 0 });
  const rackCats = await RackCategory.find({});
  const rackCatMap = Object.fromEntries(rackCats.map((c) => [c.name, c]));
  const racks = await Rack.find({ warehouse: warehouse._id });
  const rackMap = {};
  for (const r of racks) {
    const cat = rackCats.find((c) => String(c._id) === String(r.rackCategory));
    if (cat) rackMap[cat.name] = r;
  }
  const productCats = await ProductCategory.find({});
  const productCatMap = Object.fromEntries(productCats.map((c) => [c.name, c]));

  if (!floor || !rackMap.Bridal || !productCatMap.Bridal) {
    console.error('  ✗ Demo warehouse setup incomplete. Run `npm run seed:demo` first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  ok('Warehouse, floor, racks and product categories ready');

  // ============================================================================
  heading('1/7  Products + stock items');
  // ============================================================================
  let prodCreated = 0;
  let prodSkipped = 0;
  for (const p of NEW_PRODUCTS) {
    const existingProduct = await Product.findOne({ sku: p.sku });
    if (existingProduct) {
      prodSkipped++;
      info(`Product exists: ${p.sku}`);
      continue;
    }

    // StockItem
    let stock = await StockItem.findOne({ sku: p.sku });
    if (!stock) {
      stock = await StockItem.create({
        name: p.name,
        sku: p.sku,
        description: p.shortDescription,
        rackCategory: rackCatMap[p.rackCategory]._id,
        defaultRack: rackMap[p.rackCategory]._id,
        unit: 'pcs',
        unitCost: Math.round(p.basePrice * 0.6),
        lastCost: Math.round(p.basePrice * 0.6),
        minStockLevel: 3,
        reorderLevel: 1,
        tags: p.tags,
        isActive: true,
        createdBy: admin._id,
      });

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
    }

    // Product
    await Product.create({
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
        { label: 'Default', stockItem: stock._id, additionalPrice: 0, isDefault: true },
      ],
      images: [],
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
      createdBy: admin._id,
    });
    prodCreated++;
    ok(`Created: ${p.name}`);
  }

  // Refresh product counts on categories
  for (const cat of productCats) {
    cat.productCount = await Product.countDocuments({
      categories: cat._id,
      status: 'published',
    });
    await cat.save();
  }

  // ============================================================================
  heading('2/7  Customers (with login accounts)');
  // ============================================================================
  const customerDocs = {};
  let custCreated = 0;
  let custSkipped = 0;
  for (const c of CUSTOMERS) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        name: c.name,
        email: c.email,
        password: c.password,
        phone: c.phone,
        role: ROLES.CUSTOMER,
        customerType: 'online',
        addresses: c.addresses,
      });
    }

    let cust = await Customer.findOne({ customerCode: c.customerCode });
    if (cust) {
      customerDocs[c.customerCode] = cust;
      custSkipped++;
      info(`Customer exists: ${c.name}`);
      continue;
    }
    cust = await Customer.create({
      user: user._id,
      customerCode: c.customerCode,
      name: c.name,
      email: c.email,
      phone: c.phone,
      customerType: 'online',
      addresses: c.addresses,
      segment: c.segment,
      tags: c.tags,
      source: 'online',
      marketingOptIn: true,
      createdBy: admin._id,
    });
    customerDocs[c.customerCode] = cust;
    custCreated++;
    ok(`Created customer: ${c.name} (${c.email})`);
  }

  // ============================================================================
  heading('3/7  Suppliers');
  // ============================================================================
  const supplierDocs = {};
  let supCreated = 0;
  let supSkipped = 0;
  for (const s of SUPPLIERS) {
    let sup = await Supplier.findOne({ code: s.code });
    if (sup) {
      supplierDocs[s.code] = sup;
      supSkipped++;
      info(`Supplier exists: ${s.name}`);
      continue;
    }
    sup = await Supplier.create({ ...s, createdBy: admin._id });
    supplierDocs[s.code] = sup;
    supCreated++;
    ok(`Created supplier: ${s.name}`);
  }

  // ============================================================================
  heading('4/7  Purchase Order (1 fully-received PO from Faisal Mills)');
  // ============================================================================
  const allProducts = await Product.find({}).populate('variants.stockItem');
  const poNumber = 'PO-DEMO-001';
  const existingPo = await PurchaseOrder.findOne({ poNumber });
  if (existingPo) {
    info(`PO exists: ${poNumber}`);
  } else if (supplierDocs['SUP-DEMO-001']) {
    // Pick 3 stock items to re-stock via this PO
    const restockSkus = ['BRD-VEL-001', 'WED-SHR-001', 'FRM-LWN-001'];
    const restockItems = [];
    for (const sku of restockSkus) {
      const si = await StockItem.findOne({ sku });
      if (si) restockItems.push(si);
    }

    if (restockItems.length === 0) {
      info('No matching stock items for PO — skipping');
    } else {
      const poItems = restockItems.map((si) => ({
        name: si.name,
        sku: si.sku,
        unit: 'pcs',
        quantityOrdered: 10,
        quantityReceived: 10,
        unitPrice: si.unitCost,
        totalPrice: si.unitCost * 10,
      }));
      const subtotal = poItems.reduce((s, it) => s + it.totalPrice, 0);
      const receivedAt = daysAgo(10);

      const po = await PurchaseOrder.create({
        poNumber,
        supplier: supplierDocs['SUP-DEMO-001']._id,
        warehouse: warehouse._id,
        items: poItems,
        subtotal,
        taxAmount: 0,
        shippingCost: 0,
        grandTotal: subtotal,
        paidAmount: subtotal,
        currency: 'PKR',
        status: 'fully_received',
        paymentStatus: 'paid',
        orderDate: daysAgo(20),
        expectedDeliveryDate: daysAgo(12),
        receipts: [
          {
            receivedAt,
            receivedBy: admin._id,
            items: [],
            notes: 'Full receipt — demo seed',
          },
        ],
        payments: [
          {
            paidAt: receivedAt,
            amount: subtotal,
            method: 'bank_transfer',
            reference: 'TXN-DEMO-PO-001',
            notes: 'Demo full payment',
            recordedBy: admin._id,
          },
        ],
        approvedBy: admin._id,
        approvedAt: daysAgo(19),
        notes: 'Demo PO — re-stock of bestseller bridal pieces.',
        createdBy: admin._id,
      });

      // Boost stock for each item, write stock movement, update default rack entry
      for (let i = 0; i < restockItems.length; i++) {
        const si = restockItems[i];
        const it = poItems[i];
        const stockEntry = await StockEntry.findOne({
          stockItem: si._id,
          warehouse: warehouse._id,
        });
        if (stockEntry) {
          stockEntry.quantity += it.quantityReceived;
          stockEntry.lastReceivedAt = receivedAt;
          await stockEntry.save();
        }
        si.totalQuantity = (si.totalQuantity || 0) + it.quantityReceived;
        si.lastReceivedAt = receivedAt;
        await si.save();

        await StockMovement.create({
          stockItem: si._id,
          stockItemName: si.name,
          stockItemSku: si.sku,
          type: 'receive',
          quantity: it.quantityReceived,
          toRack: stockEntry?.rack,
          warehouse: warehouse._id,
          unitCost: it.unitPrice,
          totalValue: it.totalPrice,
          reason: 'PO receipt',
          reference: { kind: 'purchase_order', id: po._id, label: po.poNumber },
          performedBy: admin._id,
          performedAt: receivedAt,
          balanceAfter: si.totalQuantity,
        });
      }

      // Update supplier totals
      const sup = supplierDocs['SUP-DEMO-001'];
      sup.totalPurchases = (sup.totalPurchases || 0) + subtotal;
      sup.totalPaid = (sup.totalPaid || 0) + subtotal;
      await sup.save();

      ok(`Created PO ${poNumber} with 3 items — fully received & paid`);
    }
  }

  // ============================================================================
  heading('5/7  Orders (10 across past 30 days)');
  // ============================================================================
  // Build a snapshot of products with their default variant's stockItem
  const productCatalog = allProducts
    .filter((p) => p.variants && p.variants[0]?.stockItem)
    .map((p) => ({
      product: p,
      stockItem: p.variants[0].stockItem,
      price: p.salePrice || p.basePrice,
    }));

  const customerList = Object.values(customerDocs);
  if (customerList.length === 0) {
    info('No demo customers — skipping orders');
  } else if (productCatalog.length === 0) {
    info('No products — skipping orders');
  } else {
    // Refresh product catalog after any new products were just added
    const freshProducts = await Product.find({ status: 'published' }).populate(
      'variants.stockItem'
    );
    const freshCatalog = freshProducts
      .filter((p) => p.variants && p.variants[0]?.stockItem)
      .map((p) => ({
        product: p,
        stockItem: p.variants[0].stockItem,
        price: p.salePrice || p.basePrice,
      }));

    const ORDERS_SPEC = [
      { num: 'ORD-DEMO-001', dayAgo: 28, custIdx: 0, items: [0, 6], status: 'delivered', pay: 'paid', method: 'jazzcash' },
      { num: 'ORD-DEMO-002', dayAgo: 25, custIdx: 1, items: [2], status: 'delivered', pay: 'paid', method: 'cod' },
      { num: 'ORD-DEMO-003', dayAgo: 22, custIdx: 2, items: [4, 9], status: 'delivered', pay: 'paid', method: 'stripe' },
      { num: 'ORD-DEMO-004', dayAgo: 18, custIdx: 0, items: [7], status: 'delivered', pay: 'paid', method: 'easypaisa' },
      { num: 'ORD-DEMO-005', dayAgo: 14, custIdx: 3, items: [3, 8], status: 'shipped', pay: 'paid', method: 'bank_transfer' },
      { num: 'ORD-DEMO-006', dayAgo: 10, custIdx: 1, items: [5], status: 'shipped', pay: 'paid', method: 'cod' },
      { num: 'ORD-DEMO-007', dayAgo: 7, custIdx: 2, items: [1], status: 'packed', pay: 'paid', method: 'jazzcash' },
      { num: 'ORD-DEMO-008', dayAgo: 5, custIdx: 0, items: [6, 7, 8], status: 'confirmed', pay: 'partial', method: 'bank_transfer' },
      { num: 'ORD-DEMO-009', dayAgo: 2, custIdx: 3, items: [9], status: 'pending', pay: 'unpaid', method: null },
      { num: 'ORD-DEMO-010', dayAgo: 1, custIdx: 1, items: [4], status: 'cancelled', pay: 'unpaid', method: null },
    ];

    let ordCreated = 0;
    let ordSkipped = 0;
    let paymentSeq = 1;
    const paymentDocs = [];

    for (const spec of ORDERS_SPEC) {
      const existing = await Order.findOne({ orderNumber: spec.num });
      if (existing) {
        ordSkipped++;
        info(`Order exists: ${spec.num}`);
        continue;
      }
      const cust = customerList[spec.custIdx];
      const items = spec.items
        .map((i) => freshCatalog[i])
        .filter(Boolean)
        .map((pc, idx) => {
          const qty = 1 + (idx % 2); // 1 or 2
          return {
            product: pc.product._id,
            stockItem: pc.stockItem._id,
            productName: pc.product.name,
            productSku: pc.product.sku,
            variantLabel: 'Default',
            productImage: pc.product.images?.[0]?.url || '',
            quantity: qty,
            unitPrice: pc.price,
            totalPrice: pc.price * qty,
          };
        });
      if (items.length === 0) {
        info(`Order ${spec.num} — no valid items, skipping`);
        continue;
      }

      const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
      const shippingFee = 250;
      const grandTotal = subtotal + shippingFee;
      const paidAmount = spec.pay === 'paid' ? grandTotal : spec.pay === 'partial' ? Math.round(grandTotal * 0.5) : 0;

      const addr = cust.addresses?.[0];
      const orderedAt = daysAgo(spec.dayAgo);
      const statusHistory = [{ status: 'pending', changedAt: orderedAt, changedBy: admin._id }];
      const flow = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
      let cursor = orderedAt;
      for (const st of flow) {
        cursor = new Date(cursor.getTime() + 1000 * 60 * 60 * 12); // +12h
        statusHistory.push({ status: st, changedAt: cursor, changedBy: admin._id });
        if (st === spec.status) break;
      }
      if (spec.status === 'cancelled') {
        statusHistory.push({
          status: 'cancelled',
          changedAt: new Date(orderedAt.getTime() + 1000 * 60 * 60 * 3),
          changedBy: admin._id,
          notes: 'Customer changed mind',
        });
      }

      const shippedAt = ['shipped', 'out_for_delivery', 'delivered'].includes(spec.status)
        ? new Date(orderedAt.getTime() + 1000 * 60 * 60 * 36)
        : undefined;
      const deliveredAt = spec.status === 'delivered'
        ? new Date(orderedAt.getTime() + 1000 * 60 * 60 * 72)
        : undefined;

      const order = await Order.create({
        orderNumber: spec.num,
        orderType: 'online',
        customer: cust._id,
        items,
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        shippingFee,
        discount: 0,
        grandTotal,
        paidAmount,
        currency: 'PKR',
        shippingAddress: {
          fullName: addr.fullName,
          phone: addr.phone,
          line1: addr.line1,
          city: addr.city,
          province: addr.province,
          postalCode: addr.postalCode,
          country: addr.country,
        },
        billingAddress: {
          fullName: addr.fullName,
          phone: addr.phone,
          line1: addr.line1,
          city: addr.city,
          province: addr.province,
          postalCode: addr.postalCode,
          country: addr.country,
        },
        status: spec.status,
        paymentStatus: spec.pay,
        statusHistory,
        stockReserved: true,
        stockFulfilled: ['shipped', 'out_for_delivery', 'delivered'].includes(spec.status),
        shippingMethod: 'standard',
        courier: shippedAt
          ? {
              name: 'TCS',
              trackingNumber: `TCS${100000 + paymentSeq + spec.dayAgo}`,
              trackingUrl: 'https://www.tcsexpress.com/track',
            }
          : undefined,
        shippedAt,
        deliveredAt,
        orderedAt,
        cancelledAt: spec.status === 'cancelled' ? new Date(orderedAt.getTime() + 1000 * 60 * 60 * 3) : undefined,
        cancelReason: spec.status === 'cancelled' ? 'Customer changed mind' : undefined,
        createdBy: admin._id,
      });

      // Deduct stock for shipped/delivered/out_for_delivery
      const shouldDeduct = ['shipped', 'out_for_delivery', 'delivered', 'packed', 'confirmed'].includes(
        spec.status
      );
      if (shouldDeduct) {
        for (const it of items) {
          const si = await StockItem.findById(it.stockItem);
          if (!si) continue;
          const newQty = Math.max(0, (si.totalQuantity || 0) - it.quantity);
          si.totalQuantity = newQty;
          si.totalSold = (si.totalSold || 0) + it.quantity;
          await si.save();

          const entry = await StockEntry.findOne({
            stockItem: si._id,
            warehouse: warehouse._id,
          });
          if (entry) {
            entry.quantity = Math.max(0, entry.quantity - it.quantity);
            await entry.save();
          }

          if (['shipped', 'out_for_delivery', 'delivered'].includes(spec.status)) {
            await StockMovement.create({
              stockItem: si._id,
              stockItemName: si.name,
              stockItemSku: si.sku,
              type: 'sale',
              quantity: -it.quantity,
              fromRack: entry?.rack,
              warehouse: warehouse._id,
              unitCost: si.unitCost,
              totalValue: si.unitCost * it.quantity,
              reason: 'Order shipped',
              reference: { kind: 'order', id: order._id, label: order.orderNumber },
              performedBy: admin._id,
              performedAt: shippedAt || orderedAt,
              balanceAfter: si.totalQuantity,
            });
          }
        }
      }

      // Record payment
      if (spec.method && paidAmount > 0) {
        const payNum = `PAY-DEMO-${String(paymentSeq).padStart(3, '0')}`;
        paymentSeq++;
        await Payment.create({
          paymentNumber: payNum,
          order: order._id,
          customer: cust._id,
          amount: paidAmount,
          currency: 'PKR',
          method: spec.method,
          status: 'completed',
          gateway: ['stripe', 'jazzcash', 'easypaisa'].includes(spec.method) ? spec.method : undefined,
          transactionId: ['stripe', 'jazzcash', 'easypaisa'].includes(spec.method)
            ? `TXN${100000 + paymentSeq}`
            : undefined,
          paidAt: orderedAt,
          completedAt: orderedAt,
          recordedBy: admin._id,
        });
        paymentDocs.push(payNum);
      }

      // Update customer denormalized stats
      if (!['cancelled', 'pending'].includes(spec.status)) {
        cust.totalOrders = (cust.totalOrders || 0) + 1;
        cust.totalSpent = (cust.totalSpent || 0) + grandTotal;
        cust.averageOrderValue = Math.round(cust.totalSpent / cust.totalOrders);
        cust.lastOrderAt = orderedAt;
        await cust.save();
      }

      // Update product totalSold + viewCount
      for (const it of items) {
        await Product.updateOne(
          { _id: it.product },
          { $inc: { totalSold: it.quantity, viewCount: 5 + spec.dayAgo } }
        );
      }

      ordCreated++;
      ok(`Order ${spec.num} → ${spec.status} (${cust.name}, Rs ${grandTotal.toLocaleString()})`);
    }
    info(`Orders: ${ordCreated} created, ${ordSkipped} skipped. Payments: ${paymentDocs.length}`);
  }

  // ============================================================================
  heading('6/7  Employees');
  // ============================================================================
  let empCreated = 0;
  let empSkipped = 0;
  // Clean up any existing demo employees that still have user=null (would conflict with sparse+unique)
  await Employee.collection.updateMany(
    { user: null, employeeCode: { $regex: '^EMP-DEMO-' } },
    { $unset: { user: '' } }
  );
  for (const e of EMPLOYEES) {
    const existing = await Employee.findOne({ employeeCode: e.employeeCode });
    if (existing) {
      empSkipped++;
      info(`Employee exists: ${e.name}`);
      continue;
    }
    const emp = new Employee({
      ...e,
      warehouse: warehouse._id,
      status: 'active',
      workType: 'full_time',
      salaryFrequency: 'monthly',
      currency: 'PKR',
      createdBy: admin._id,
    });
    await emp.save();
    // Strip the user:null default so sparse+unique index treats it as "field missing"
    await Employee.collection.updateOne({ _id: emp._id }, { $unset: { user: '' } });
    empCreated++;
    ok(`Created employee: ${e.name} (${e.designation})`);
  }

  // ============================================================================
  heading('7/7  Equipment categories + items');
  // ============================================================================
  const equipCatMap = {};
  for (const ec of EQUIPMENT_CATEGORIES) {
    let cat = await EquipmentCategory.findOne({ name: ec.name });
    if (!cat) {
      cat = await EquipmentCategory.create({ ...ec, createdBy: admin._id });
      ok(`Created equipment category: ${ec.name}`);
    } else {
      info(`Equipment category exists: ${ec.name}`);
    }
    equipCatMap[ec.name] = cat;
  }

  let eqCreated = 0;
  let eqSkipped = 0;
  for (const eq of EQUIPMENT_ITEMS) {
    const existing = await Equipment.findOne({ name: eq.name });
    if (existing) {
      eqSkipped++;
      info(`Equipment exists: ${eq.name}`);
      continue;
    }
    await Equipment.create({
      ...eq,
      category: equipCatMap[eq.category]._id,
      warehouse: warehouse._id,
      floor: floor._id,
      status: 'active',
      createdBy: admin._id,
    });
    eqCreated++;
    ok(`Created equipment: ${eq.name}`);
  }

  // ============================================================================
  console.log('\n--- Summary ---');
  ok(`Products      : +${prodCreated} new, ${prodSkipped} already existed`);
  ok(`Customers     : +${custCreated} new, ${custSkipped} already existed`);
  ok(`Suppliers     : +${supCreated} new, ${supSkipped} already existed`);
  ok(`Employees     : +${empCreated} new, ${empSkipped} already existed`);
  ok(`Equipment     : +${eqCreated} new, ${eqSkipped} already existed`);

  const totalProducts = await Product.countDocuments({});
  const totalOrders = await Order.countDocuments({});
  const totalCustomers = await Customer.countDocuments({});
  console.log('\n--- Database totals after seed ---');
  ok(`Products  : ${totalProducts}`);
  ok(`Customers : ${totalCustomers}`);
  ok(`Orders    : ${totalOrders}`);
  ok(`Suppliers : ${await Supplier.countDocuments({})}`);
  ok(`Employees : ${await Employee.countDocuments({})}`);
  ok(`Equipment : ${await Equipment.countDocuments({})}`);

  console.log('\n--- Test customer credentials ---');
  console.log('  All demo customers use the same password: Test@1234');
  console.log('  ayesha.khan@example.com  /  Test@1234   (VIP, Lahore)');
  console.log('  fatima.sheikh@example.com /  Test@1234  (Returning, Karachi)');
  console.log('  hina.malik@example.com   /  Test@1234   (Returning, Islamabad)');
  console.log('  sara.ahmed@example.com   /  Test@1234   (New, Rawalpindi)');
  console.log('\n--- Done! ---\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('\n✗ Rich demo seed failed:', err.message);
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
