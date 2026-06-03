import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/drizzle/schema';
import { authOptions } from '@/lib/auth';
import { toBaseUnit, UNIT_DIMENSION, calculateLineTotalPaise } from '@/lib/unitConversion';

// GET /api/orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    const items = await db.query.orders.findMany({
      where: role === 'admin' ? undefined : eq(orders.sellerId, userId),
      with: {
        seller: {
          columns: {
            name: true,
            email: true,
          },
        },
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders (Place order)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { items: orderLines, notes } = body;

    if (!orderLines || !Array.isArray(orderLines) || orderLines.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one product item.' }, { status: 400 });
    }

    // Step 1: Pre-verify all items, perform conversions, and verify stock availability
    const preparedItems: Array<{
      productId: string;
      productName: string;
      orderedUnit: string;
      orderedQuantity: number;
      baseUnit: string;
      baseQuantity: number;
      unitPricePaise: number;
      lineTotalPaise: number;
      currentStock: number;
    }> = [];
    let totalOrderPaise = 0;

    for (const line of orderLines) {
      const { productId, orderedUnit, orderedQuantity } = line;

      if (!productId || !orderedUnit || orderedQuantity === undefined || orderedQuantity <= 0) {
        return NextResponse.json({ error: 'Invalid item parameters provided.' }, { status: 400 });
      }

      // Fetch product
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      if (!product.isActive) {
        return NextResponse.json({ error: `Product is no longer active: ${product.name}` }, { status: 400 });
      }

      // Verify unit dimension compatibility
      const productDim = UNIT_DIMENSION[product.baseUnit];
      const orderedDim = UNIT_DIMENSION[orderedUnit];

      if (productDim !== orderedDim) {
        return NextResponse.json(
          { error: `Incompatible unit dimensions: Cannot order product '${product.name}' in unit '${orderedUnit}'. Product dimension is '${productDim}'.` },
          { status: 400 }
        );
      }

      // Convert quantity to base unit
      const baseQty = toBaseUnit(orderedQuantity, orderedUnit);
      const currentStock = parseFloat(product.stockQuantity);

      // Verify stock level
      if (currentStock < baseQty) {
        return NextResponse.json(
          { error: `Insufficient stock for product '${product.name}'. Requested: ${orderedQuantity} ${orderedUnit} (${baseQty} ${product.baseUnit}), Available: ${currentStock} ${product.baseUnit}.` },
          { status: 400 }
        );
      }

      // Calculate line total price in paise
      const lineTotal = calculateLineTotalPaise(orderedQuantity, orderedUnit, product.pricePerBaseUnitPaise);
      totalOrderPaise += lineTotal;

      preparedItems.push({
        productId,
        productName: product.name,
        orderedUnit,
        orderedQuantity,
        baseUnit: product.baseUnit,
        baseQuantity: baseQty,
        unitPricePaise: product.pricePerBaseUnitPaise,
        lineTotalPaise: lineTotal,
        currentStock,
      });
    }

    // Step 2: Execute Order creation and stock adjustments in a transaction
    const finalOrder = await db.transaction(async (tx) => {
      // Create primary order record
      const [newOrder] = await tx
        .insert(orders)
        .values({
          sellerId: userId,
          status: 'pending',
          totalPaise: totalOrderPaise,
          notes: notes || null,
        })
        .returning();

      // Insert all items and update product stocks
      for (const item of preparedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          orderedUnit: item.orderedUnit,
          orderedQuantity: item.orderedQuantity.toString(),
          baseUnit: item.baseUnit,
          baseQuantity: item.baseQuantity.toString(),
          unitPricePaise: item.unitPricePaise,
          lineTotalPaise: item.lineTotalPaise,
        });

        // Deduct stock
        const updatedStockQuantity = (item.currentStock - item.baseQuantity).toFixed(6);
        await tx
          .update(products)
          .set({
            stockQuantity: updatedStockQuantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      return newOrder;
    });

    return NextResponse.json(finalOrder, { status: 201 });
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
