import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { authOptions } from '@/lib/auth';

// PUT /api/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, sku, description, category, baseUnit, stockQuantity, pricePerBaseUnitPaise, isActive } = body;

    // Validate existence
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update
    const updated = await db
      .update(products)
      .set({
        name: name !== undefined ? name : product.name,
        sku: sku !== undefined ? sku : product.sku,
        description: description !== undefined ? description : product.description,
        category: category !== undefined ? category : product.category,
        baseUnit: baseUnit !== undefined ? baseUnit : product.baseUnit,
        stockQuantity: stockQuantity !== undefined ? stockQuantity.toString() : product.stockQuantity,
        pricePerBaseUnitPaise: pricePerBaseUnitPaise !== undefined ? Number(pricePerBaseUnitPaise) : product.pricePerBaseUnitPaise,
        isActive: isActive !== undefined ? isActive : product.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Product with this SKU already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] (Soft Delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete
    const deleted = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({ message: 'Product soft deleted successfully', product: deleted[0] });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
