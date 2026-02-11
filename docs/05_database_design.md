# 05 - Database Design & Schema

## Overview
This document contains the complete database design for the Windoor application, including every table, relationship, and constraint.

---

## 🗄️ Database Selection: PostgreSQL

### Why PostgreSQL?
- **ACID Compliance**: Ensures data integrity
- **JSON Support**: Store complex design data
- **Scalability**: Handles growth well
- **Open Source**: Free to use
- **Rich Features**: Full-text search, arrays, etc.

---

## 📊 Complete Database Schema

### Prisma Schema File

Create this file: `server/prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  phone         String?
  role          UserRole
  status        UserStatus @default(ACTIVE)
  companyId     String?   @map("company_id")
  company       Company?  @relation(fields: [companyId], references: [id])
  
  // Profile
  avatar        String?
  timezone      String?
  language      String    @default("en")
  
  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  
  // Relationships
  projects      Project[] @relation("CustomerProjects")
  assignedProjects Project[] @relation("SalesRepProjects")
  quotes        Quote[]
  orders        Order[]
  notifications Notification[]
  
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  COMPANY_ADMIN
  PRODUCTION_MANAGER
  SALES_MANAGER
  SALES_REP
  DEALER
  DEALER_STAFF
  CUSTOMER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}

model Company {
  id              String   @id @default(uuid())
  name            String
  type            CompanyType
  email           String?
  phone           String?
  website         String?
  
  // Address
  addressLine1    String?  @map("address_line1")
  addressLine2    String?  @map("address_line2")
  city            String?
  state           String?
  zipCode         String?  @map("zip_code")
  country         String?  @default("USA")
  
  // Business Info
  taxId           String?  @map("tax_id")
  license         String?
  
  // Settings
  markupPercent   Decimal? @map("markup_percent") @db.Decimal(5, 2)
  discountLimit   Decimal? @map("discount_limit") @db.Decimal(5, 2)
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  users           User[]
  projects        Project[]
  suppliers       Supplier[]
  
  @@map("companies")
}

enum CompanyType {
  MANUFACTURER
  DEALER
  DISTRIBUTOR
  CONTRACTOR
}

// ============================================
// PRODUCT CATALOG
// ============================================

model Profile {
  id              String   @id @default(uuid())
  name            String
  sku             String   @unique
  category        ProfileCategory
  material        MaterialType
  
  // Dimensions (in mm)
  width           Int?
  height          Int?
  thickness       Int?
  
  // Pricing
  unitPrice       Decimal  @map("unit_price") @db.Decimal(10, 2)
  unit            String   @default("meter") // meter, piece, foot
  
  // Inventory
  stockQuantity   Int      @default(0) @map("stock_quantity")
  minStock        Int      @default(10) @map("min_stock")
  
  // Details
  description     String?  @db.Text
  specifications  Json?
  color           String?
  finish          String?
  
  // Supplier
  supplierId      String?  @map("supplier_id")
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  
  // Images
  imageUrl        String?  @map("image_url")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  designItems     DesignItem[]
  inventoryTransactions InventoryTransaction[]
  
  @@map("profiles")
}

enum ProfileCategory {
  FRAME
  SASH
  MULLION
  TRANSOM
  BEAD
  SILL
}

enum MaterialType {
  PVC
  UPVC
  ALUMINUM
  WOOD
  COMPOSITE
  STEEL
}

model Hardware {
  id              String   @id @default(uuid())
  name            String
  sku             String   @unique
  type            HardwareType
  
  // Details
  description     String?  @db.Text
  specifications  Json?
  material        String?
  finish          String?
  size            String?
  
  // Pricing
  unitPrice       Decimal  @map("unit_price") @db.Decimal(10, 2)
  
  // Inventory
  stockQuantity   Int      @default(0) @map("stock_quantity")
  minStock        Int      @default(5) @map("min_stock")
  
  // Supplier
  supplierId      String?  @map("supplier_id")
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  
  // Images
  imageUrl        String?  @map("image_url")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  designItems     DesignItem[]
  inventoryTransactions InventoryTransaction[]
  
  @@map("hardware")
}

enum HardwareType {
  HINGE
  LOCK
  HANDLE
  ROLLER
  TRACK
  SEAL
  WEATHERSTRIP
  SCREW
  BRACKET
  CORNER
}

model GlassType {
  id              String   @id @default(uuid())
  name            String
  sku             String   @unique
  type            GlassCategory
  
  // Specifications
  thickness       Int      // in mm
  uValue          Decimal? @map("u_value") @db.Decimal(4, 2)
  shgc            Decimal? @db.Decimal(3, 2) // Solar Heat Gain Coefficient
  visibleTransmittance Decimal? @map("visible_transmittance") @db.Decimal(3, 2)
  
  // Features
  isTempered      Boolean  @default(false) @map("is_tempered")
  isLaminated     Boolean  @default(false) @map("is_laminated")
  isLowE          Boolean  @default(false) @map("is_low_e")
  isTinted        Boolean  @default(false) @map("is_tinted")
  tintColor       String?  @map("tint_color")
  
  // Pricing (per square meter)
  pricePerSqm     Decimal  @map("price_per_sqm") @db.Decimal(10, 2)
  
  // Inventory
  stockArea       Decimal  @default(0) @map("stock_area") @db.Decimal(10, 2) // in m²
  minStock        Decimal  @default(10) @map("min_stock") @db.Decimal(10, 2)
  
  // Supplier
  supplierId      String?  @map("supplier_id")
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  designItems     DesignItem[]
  inventoryTransactions InventoryTransaction[]
  
  @@map("glass_types")
}

enum GlassCategory {
  SINGLE_GLAZED
  DOUBLE_GLAZED
  TRIPLE_GLAZED
  SPECIAL
}

// ============================================
// SUPPLIERS
// ============================================

model Supplier {
  id              String   @id @default(uuid())
  name            String
  email           String?
  phone           String?
  website         String?
  
  // Address
  addressLine1    String?  @map("address_line1")
  addressLine2    String?  @map("address_line2")
  city            String?
  state           String?
  zipCode         String?  @map("zip_code")
  country         String?
  
  // Business Info
  contactPerson   String?  @map("contact_person")
  paymentTerms    String?  @map("payment_terms")
  
  // Company association
  companyId       String?  @map("company_id")
  company         Company? @relation(fields: [companyId], references: [id])
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  profiles        Profile[]
  hardware        Hardware[]
  glassTypes      GlassType[]
  
  @@map("suppliers")
}

// ============================================
// PROJECTS & QUOTES
// ============================================

model Project {
  id              String   @id @default(uuid())
  projectNumber   String   @unique @map("project_number")
  name            String
  description     String?  @db.Text
  
  // Customer
  customerId      String   @map("customer_id")
  customer        User     @relation("CustomerProjects", fields: [customerId], references: [id])
  
  // Sales Rep
  salesRepId      String?  @map("sales_rep_id")
  salesRep        User?    @relation("SalesRepProjects", fields: [salesRepId], references: [id])
  
  // Company
  companyId       String   @map("company_id")
  company         Company  @relation(fields: [companyId], references: [id])
  
  // Project Details
  status          ProjectStatus @default(DRAFT)
  priority        Priority @default(NORMAL)
  
  // Location
  siteAddress     String?  @map("site_address")
  city            String?
  state           String?
  zipCode         String?  @map("zip_code")
  
  // Financial
  estimatedValue  Decimal? @map("estimated_value") @db.Decimal(12, 2)
  actualValue     Decimal? @map("actual_value") @db.Decimal(12, 2)
  
  // Dates
  startDate       DateTime? @map("start_date")
  dueDate         DateTime? @map("due_date")
  completedDate   DateTime? @map("completed_date")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  designs         Design[]
  quotes          Quote[]
  orders          Order[]
  
  @@map("projects")
}

enum ProjectStatus {
  DRAFT
  QUOTED
  APPROVED
  IN_PRODUCTION
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model Design {
  id              String   @id @default(uuid())
  name            String
  
  // Project
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Window/Door Type
  type            WindowType
  
  // Dimensions (in mm)
  width           Int
  height          Int
  quantity        Int      @default(1)
  
  // Design Configuration (JSON)
  configuration   Json     // Stores mullions, grids, opening direction, etc.
  
  // Preview
  previewImage    String?  @map("preview_image")
  
  // Calculated Materials
  materials       Json?    // Calculated material requirements
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  items           DesignItem[]
  quoteItems      QuoteItem[]
  
  @@map("designs")
}

enum WindowType {
  CASEMENT_SINGLE
  CASEMENT_DOUBLE
  SLIDING_2_PANEL
  SLIDING_3_PANEL
  TILT_TURN
  FIXED
  AWNING
  HOPPER
  BAY
  BOW
  CUSTOM
}

model DesignItem {
  id              String   @id @default(uuid())
  
  // Design
  designId        String   @map("design_id")
  design          Design   @relation(fields: [designId], references: [id], onDelete: Cascade)
  
  // Item Type
  itemType        DesignItemType @map("item_type")
  
  // References to catalog items
  profileId       String?  @map("profile_id")
  profile         Profile? @relation(fields: [profileId], references: [id])
  
  hardwareId      String?  @map("hardware_id")
  hardware        Hardware? @relation(fields: [hardwareId], references: [id])
  
  glassTypeId     String?  @map("glass_type_id")
  glassType       GlassType? @relation(fields: [glassTypeId], references: [id])
  
  // Quantity
  quantity        Decimal  @db.Decimal(10, 2)
  unit            String   // meter, piece, sqm
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("design_items")
}

enum DesignItemType {
  PROFILE
  HARDWARE
  GLASS
}

model Quote {
  id              String   @id @default(uuid())
  quoteNumber     String   @unique @map("quote_number")
  
  // Project
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Created by
  createdById     String   @map("created_by_id")
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  // Status
  status          QuoteStatus @default(DRAFT)
  
  // Pricing
  subtotal        Decimal  @db.Decimal(12, 2)
  discountPercent Decimal  @default(0) @map("discount_percent") @db.Decimal(5, 2)
  discountAmount  Decimal  @default(0) @map("discount_amount") @db.Decimal(12, 2)
  taxPercent      Decimal  @default(0) @map("tax_percent") @db.Decimal(5, 2)
  taxAmount       Decimal  @default(0) @map("tax_amount") @db.Decimal(12, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)
  
  // Terms
  validUntil      DateTime @map("valid_until")
  paymentTerms    String?  @map("payment_terms")
  notes           String?  @db.Text
  termsConditions String?  @map("terms_conditions") @db.Text
  
  // Dates
  sentAt          DateTime? @map("sent_at")
  approvedAt      DateTime? @map("approved_at")
  rejectedAt      DateTime? @map("rejected_at")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  items           QuoteItem[]
  order           Order?
  
  @@map("quotes")
}

enum QuoteStatus {
  DRAFT
  SENT
  VIEWED
  APPROVED
  REJECTED
  EXPIRED
  CONVERTED
}

model QuoteItem {
  id              String   @id @default(uuid())
  
  // Quote
  quoteId         String   @map("quote_id")
  quote           Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  // Design
  designId        String   @map("design_id")
  design          Design   @relation(fields: [designId], references: [id])
  
  // Pricing
  quantity        Int
  unitPrice       Decimal  @map("unit_price") @db.Decimal(10, 2)
  totalPrice      Decimal  @map("total_price") @db.Decimal(12, 2)
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("quote_items")
}

// ============================================
// ORDERS & PRODUCTION
// ============================================

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique @map("order_number")
  
  // Project & Quote
  projectId       String   @map("project_id")
  project         Project  @relation(fields: [projectId], references: [id])
  
  quoteId         String   @unique @map("quote_id")
  quote           Quote    @relation(fields: [quoteId], references: [id])
  
  // Customer
  customerId      String   @map("customer_id")
  customer        User     @relation(fields: [customerId], references: [id])
  
  // Status
  status          OrderStatus @default(PENDING)
  
  // Financial
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)
  paidAmount      Decimal  @default(0) @map("paid_amount") @db.Decimal(12, 2)
  
  // Production
  productionNotes String?  @map("production_notes") @db.Text
  cncFiles        Json?    @map("cnc_files")
  
  // Dates
  scheduledDate   DateTime? @map("scheduled_date")
  productionStartDate DateTime? @map("production_start_date")
  productionEndDate DateTime? @map("production_end_date")
  shippingDate    DateTime? @map("shipping_date")
  deliveryDate    DateTime? @map("delivery_date")
  
  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relationships
  payments        Payment[]
  inventoryTransactions InventoryTransaction[]
  
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  IN_PRODUCTION
  QUALITY_CHECK
  READY_TO_SHIP
  SHIPPED
  DELIVERED
  CANCELLED
}

model Payment {
  id              String   @id @default(uuid())
  
  // Order
  orderId         String   @map("order_id")
  order           Order    @relation(fields: [orderId], references: [id])
  
  // Payment Details
  amount          Decimal  @db.Decimal(12, 2)
  method          PaymentMethod
  status          PaymentStatus @default(PENDING)
  
  // External References
  stripePaymentId String?  @map("stripe_payment_id")
  transactionId   String?  @map("transaction_id")
  
  // Timestamps
  paidAt          DateTime? @map("paid_at")
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("payments")
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  BANK_TRANSFER
  CHECK
  CASH
  STRIPE
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

// ============================================
// INVENTORY
// ============================================

model InventoryTransaction {
  id              String   @id @default(uuid())
  
  // Item Type & Reference
  itemType        InventoryItemType @map("item_type")
  
  profileId       String?  @map("profile_id")
  profile         Profile? @relation(fields: [profileId], references: [id])
  
  hardwareId      String?  @map("hardware_id")
  hardware        Hardware? @relation(fields: [hardwareId], references: [id])
  
  glassTypeId     String?  @map("glass_type_id")
  glassType       GlassType? @relation(fields: [glassTypeId], references: [id])
  
  // Transaction Details
  type            TransactionType
  quantity        Decimal  @db.Decimal(10, 2)
  unit            String
  
  // Reference
  orderId         String?  @map("order_id")
  order           Order?   @relation(fields: [orderId], references: [id])
  
  // Notes
  notes           String?  @db.Text
  
  // Timestamp
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("inventory_transactions")
}

enum InventoryItemType {
  PROFILE
  HARDWARE
  GLASS
}

enum TransactionType {
  PURCHASE
  USAGE
  ADJUSTMENT
  WASTE
  RETURN
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id              String   @id @default(uuid())
  
  // User
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Notification Details
  type            NotificationType
  title           String
  message         String   @db.Text
  
  // Reference
  referenceType   String?  @map("reference_type")
  referenceId     String?  @map("reference_id")
  
  // Status
  isRead          Boolean  @default(false) @map("is_read")
  readAt          DateTime? @map("read_at")
  
  // Timestamp
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("notifications")
}

enum NotificationType {
  QUOTE_CREATED
  QUOTE_SENT
  QUOTE_APPROVED
  QUOTE_REJECTED
  ORDER_CREATED
  ORDER_STATUS_CHANGED
  PAYMENT_RECEIVED
  LOW_STOCK
  SYSTEM
}
```

---

## 🔄 Database Relationships

### One-to-Many Relationships
```
Company → Users (1:N)
Company → Projects (1:N)
Company → Suppliers (1:N)

Project → Designs (1:N)
Project → Quotes (1:N)
Project → Orders (1:N)

Design → DesignItems (1:N)
Design → QuoteItems (1:N)

Quote → QuoteItems (1:N)
Quote → Order (1:1)

Order → Payments (1:N)
Order → InventoryTransactions (1:N)

User → Projects (1:N as customer)
User → Projects (1:N as sales rep)
User → Quotes (1:N)
User → Orders (1:N)
User → Notifications (1:N)

Supplier → Profiles (1:N)
Supplier → Hardware (1:N)
Supplier → GlassTypes (1:N)
```

---

## 📝 SQL Migration Commands

### Initialize Prisma

```bash
cd server
npm install -D prisma
npm install @prisma/client
npx prisma init
```

### Create Schema File

Copy the schema above into `server/prisma/schema.prisma`

### Set Database URL

In `server/.env`:
```env
DATABASE_URL="postgresql://windoor_user:your_password@localhost:5432/windoor_db"
```

### Generate Migration

```bash
npx prisma migrate dev --name init
```

This will:
1. Create all tables
2. Set up relationships
3. Generate Prisma Client

### Generate Prisma Client

```bash
npx prisma generate
```

---

## 🌱 Seed Data

Create `server/prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole, MaterialType, WindowType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@windoor.com',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('✅ Created super admin');

  // Create Sample Company
  const company = await prisma.company.create({
    data: {
      name: 'Windoor Manufacturing Co.',
      type: 'MANUFACTURER',
      email: 'info@windoor.com',
      phone: '+1-555-0100',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      markupPercent: 30,
    },
  });

  console.log('✅ Created sample company');

  // Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'PVC Profiles Inc.',
      email: 'sales@pvcprofiles.com',
      phone: '+1-555-0200',
      companyId: company.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Glass Solutions Ltd.',
      email: 'orders@glasssolutions.com',
      phone: '+1-555-0300',
      companyId: company.id,
    },
  });

  console.log('✅ Created suppliers');

  // Create Sample Profiles
  await prisma.profile.createMany({
    data: [
      {
        name: 'Standard PVC Frame 70mm',
        sku: 'PVC-FRAME-70',
        category: 'FRAME',
        material: MaterialType.PVC,
        width: 70,
        thickness: 3,
        unitPrice: 12.50,
        stockQuantity: 500,
        supplierId: supplier1.id,
      },
      {
        name: 'Standard PVC Sash 60mm',
        sku: 'PVC-SASH-60',
        category: 'SASH',
        material: MaterialType.PVC,
        width: 60,
        thickness: 3,
        unitPrice: 10.00,
        stockQuantity: 400,
        supplierId: supplier1.id,
      },
      {
        name: 'Mullion Profile 50mm',
        sku: 'PVC-MULL-50',
        category: 'MULLION',
        material: MaterialType.PVC,
        width: 50,
        thickness: 2.5,
        unitPrice: 8.00,
        stockQuantity: 300,
        supplierId: supplier1.id,
      },
    ],
  });

  console.log('✅ Created sample profiles');

  // Create Sample Hardware
  await prisma.hardware.createMany({
    data: [
      {
        name: 'Standard Hinge - White',
        sku: 'HW-HINGE-001',
        type: 'HINGE',
        unitPrice: 3.50,
        stockQuantity: 1000,
        supplierId: supplier1.id,
      },
      {
        name: 'Multi-Point Lock',
        sku: 'HW-LOCK-001',
        type: 'LOCK',
        unitPrice: 25.00,
        stockQuantity: 200,
        supplierId: supplier1.id,
      },
      {
        name: 'Handle - Chrome',
        sku: 'HW-HANDLE-001',
        type: 'HANDLE',
        unitPrice: 15.00,
        stockQuantity: 300,
        supplierId: supplier1.id,
      },
    ],
  });

  console.log('✅ Created sample hardware');

  // Create Sample Glass Types
  await prisma.glassType.createMany({
    data: [
      {
        name: 'Clear Double Glazed 24mm',
        sku: 'GLASS-DBL-24',
        type: 'DOUBLE_GLAZED',
        thickness: 24,
        uValue: 1.1,
        pricePerSqm: 45.00,
        stockArea: 100,
        supplierId: supplier2.id,
      },
      {
        name: 'Low-E Double Glazed 28mm',
        sku: 'GLASS-DBL-LOWE-28',
        type: 'DOUBLE_GLAZED',
        thickness: 28,
        uValue: 0.8,
        isLowE: true,
        pricePerSqm: 65.00,
        stockArea: 50,
        supplierId: supplier2.id,
      },
    ],
  });

  console.log('✅ Created sample glass types');
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

Add to `server/package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Install ts-node:
```bash
npm install -D ts-node @types/node
```

Run seed:
```bash
npx prisma db seed
```

---

## ✅ Verification

### Check Tables Created

```bash
npx prisma studio
```

This opens a GUI to browse your database at `http://localhost:5555`

### Or use SQL

```bash
psql -U windoor_user -d windoor_db

# List all tables
\dt

# View users
SELECT * FROM users;

# Exit
\q
```

---

## 🎯 Next Steps

Database is ready! 

➡️ **Next**: [06 - Backend Server Setup](./06_backend_setup.md)

---

**Status**: ✅ Database Schema Complete  
**Tables Created**: 15  
**Last Updated**: February 2026

    