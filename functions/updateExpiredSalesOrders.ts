import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all signed sales orders
    const salesOrders = await base44.asServiceRole.entities.SalesOrder.filter({ status: 'signed' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiredOrders = [];
    
    for (const order of salesOrders) {
      if (order.endDate) {
        const endDate = new Date(order.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        // Check if end date has passed
        if (endDate < today) {
          await base44.asServiceRole.entities.SalesOrder.update(order.id, {
            status: 'expired',
            updated_by: 'system'
          });
          
          // Log audit
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'update',
            entity_type: 'SalesOrder',
            entity_id: order.id,
            entity_name: order.orderFormNo || 'Sales Order',
            user_email: 'system',
            user_name: 'System',
            details: `Auto-updated to expired status (end date: ${order.endDate})`
          });
          
          expiredOrders.push(order.orderFormNo);
        }
      }
    }
    
    return Response.json({ 
      success: true,
      message: `Updated ${expiredOrders.length} sales orders to expired status`,
      expiredOrders
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});