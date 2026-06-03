import bcrypt from 'bcryptjs';
import { db } from '../lib/db';
import { users, products } from '../drizzle/schema';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create hashed passwords
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const sellerPasswordHash = await bcrypt.hash('Seller@123', 10);

    // 2. Insert Users
    console.log('👤 Inserting default users...');
    const insertedUsers = await db.insert(users).values([
      {
        name: 'Admin User',
        email: 'admin@aasa.dev',
        password: adminPasswordHash,
        role: 'admin',
      },
      {
        name: 'Test Seller',
        email: 'seller@aasa.dev',
        password: sellerPasswordHash,
        role: 'seller',
      },
    ]).returning();

    console.log(`✅ Users inserted: ${insertedUsers.length}`);

    // 3. Insert Products
    console.log('🧪 Inserting sample products...');
    const insertedProducts = await db.insert(products).values([
      {
        name: 'Paracetamol 500mg Tablets',
        sku: 'PARA-500-TAB',
        description: 'Common analgesic and antipyretic medication used to treat fever and mild to moderate pain.',
        category: 'Analgesics',
        baseUnit: 'unit',
        stockQuantity: '10000', // 10,000 tablets
        pricePerBaseUnitPaise: 150, // ₹1.50 per tablet
      },
      {
        name: 'Isopropyl Alcohol 99% Pure',
        sku: 'IPA-99-L',
        description: 'High purity rubbing alcohol / solvent used for industrial cleaning and sanitation.',
        category: 'Solvents',
        baseUnit: 'mL',
        stockQuantity: '50000', // 50,000 mL = 50 L
        pricePerBaseUnitPaise: 25, // 25 paise per mL (₹250 per Litre)
      },
      {
        name: 'Sodium Chloride (Analytical Reagent)',
        sku: 'NACL-AR-KG',
        description: 'Analytical grade table salt reagent for laboratory preparations and chemical tests.',
        category: 'Reagents',
        baseUnit: 'g',
        stockQuantity: '25000', // 25,000 g = 25 kg
        pricePerBaseUnitPaise: 15, // 15 paise per gram (₹150 per kg)
      },
      {
        name: 'Amoxicillin 250mg Capsules',
        sku: 'AMOX-250-CAP',
        description: 'Broad-spectrum beta-lactam antibiotic used to treat bacterial infections.',
        category: 'Antibiotics',
        baseUnit: 'unit',
        stockQuantity: '5000', // 5,000 capsules
        pricePerBaseUnitPaise: 450, // ₹4.50 per capsule
      },
      {
        name: 'Distilled Water (Laboratory Grade)',
        sku: 'H2O-DIST-L',
        description: 'Deionized and purified water for pharmaceutical formulation and laboratory experiments.',
        category: 'Solvents',
        baseUnit: 'mL',
        stockQuantity: '200000', // 200,000 mL = 200 L
        pricePerBaseUnitPaise: 5, // 5 paise per mL (₹50 per Litre)
      },
    ]).returning();

    console.log(`✅ Products inserted: ${insertedProducts.length}`);
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
