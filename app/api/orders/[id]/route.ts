import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, products, orderItems } from '@/drizzle/schema';
import { authOptions } from '@/lib/auth';

// PATCH /api/orders/[id] (Update status - Admin only)
export async function PATCH(
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
    const { status: newStatus } = body;

    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'fulfilled'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
    }

    // Get order with its items
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.status;

    if (currentStatus === newStatus) {
      return NextResponse.json(order);
    }

    // Run the status change and stock adjustment inside a database transaction
    const updatedOrder = await db.transaction(async (tx) => {
      // Case A: Refunding stock (active status to rejected)
      if (currentStatus !== 'rejected' && newStatus === 'rejected') {
        for (const item of order.items) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
          });

          if (product) {
            const refundQty = parseFloat(item.baseQuantity);
            const currentStock = parseFloat(product.stockQuantity);
            const updatedStock = (currentStock + refundQty).toFixed(6);

            await tx
              .update(products)
              .set({
                stockQuantity: updatedStock,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          }
        }
      }

      // Case B: Re-deducting stock (rejected status to active status)
      if (currentStatus === 'rejected' && newStatus !== 'rejected') {
        // Step 1: Pre-verify that all products have enough stock to re-deduct
        const deductions = [];
        for (const item of order.items) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const deductQty = parseFloat(item.baseQuantity);
          const currentStock = parseFloat(product.stockQuantity);

          if (currentStock < deductQty) {
            throw new Error(
              `Cannot restore order. Insufficient stock for product '${product.name}'. Restoring requires: ${deductQty} ${item.baseUnit}, Available: ${currentStock} ${product.baseUnit}.`
            );
          }

          deductions.push({
            productId: product.id,
            newStock: (currentStock - deductQty).toFixed(6),
          });
        }

        // Step 2: Apply deductions if all check out
        for (const dec of deductions) {
          await tx
            .update(products)
            .set({
              stockQuantity: dec.newStock,
              updatedAt: new Date(),
            })
            .where(eq(products.id, dec.productId));
        }
      }

      // Update the order status
      const [updated] = await tx
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
