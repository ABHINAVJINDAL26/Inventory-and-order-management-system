import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { authOptions } from '@/lib/auth';

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;

    let items;
    if (role === 'admin') {
      // Admin sees everything (including inactive ones)
      items = await db.query.products.findMany({
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      });
    } else {
      // Seller sees only active products
      items = await db.query.products.findMany({
        where: eq(products.isActive, true),
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      });
    }

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, sku, description, category, baseUnit, stockQuantity, pricePerBaseUnitPaise } = body;

    // Validation
    if (!name || !baseUnit || pricePerBaseUnitPaise === undefined) {
      return NextResponse.json({ error: 'Name, base unit, and price are required.' }, { status: 400 });
    }

    const allowedUnits = ['g', 'kg', 'mL', 'L', 'unit'];
    if (!allowedUnits.includes(baseUnit)) {
      return NextResponse.json({ error: `Invalid base unit: ${baseUnit}` }, { status: 400 });
    }

    // Insert into DB
    const newProduct = await db.insert(products).values({
      name,
      sku: sku || null,
      description: description || null,
      category: category || null,
      baseUnit,
      stockQuantity: stockQuantity ? stockQuantity.toString() : '0',
      pricePerBaseUnitPaise: Number(pricePerBaseUnitPaise),
      isActive: true,
    }).returning();

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    // Handle unique SKU constraint
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Product with this SKU already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
