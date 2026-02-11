import { PrismaClient, UserRole, CompanyType, ProfileCategory, MaterialType, HardwareType, GlassCategory, WindowType } from '@prisma/client';
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
      type: CompanyType.MANUFACTURER,
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
        category: ProfileCategory.FRAME,
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
        category: ProfileCategory.SASH,
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
        category: ProfileCategory.MULLION,
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
        type: HardwareType.HINGE,
        unitPrice: 3.50,
        stockQuantity: 1000,
        supplierId: supplier1.id,
      },
      {
        name: 'Multi-Point Lock',
        sku: 'HW-LOCK-001',
        type: HardwareType.LOCK,
        unitPrice: 25.00,
        stockQuantity: 200,
        supplierId: supplier1.id,
      },
      {
        name: 'Handle - Chrome',
        sku: 'HW-HANDLE-001',
        type: HardwareType.HANDLE,
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
        type: GlassCategory.DOUBLE_GLAZED,
        thickness: 24,
        uValue: 1.1,
        pricePerSqm: 45.00,
        stockArea: 100,
        supplierId: supplier2.id,
      },
      {
        name: 'Low-E Double Glazed 28mm',
        sku: 'GLASS-DBL-LOWE-28',
        type: GlassCategory.DOUBLE_GLAZED,
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
