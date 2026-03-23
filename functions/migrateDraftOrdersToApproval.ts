import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all draft sales orders
    const draftOrders = await base44.asServiceRole.entities.SalesOrder.filter({ status: 'draft' });
    
    const migratedOrders = [];
    
    for (const order of draftOrders) {
      // Check if approval request already exists
      const existingRequests = await base44.asServiceRole.entities.ApprovalRequest.filter({
        entity_type: 'sales_order',
        entity_id: order.id
      });
      
      if (existingRequests.length === 0) {
        // Create approval request
        await base44.asServiceRole.entities.ApprovalRequest.create({
          entity_type: 'sales_order',
          entity_id: order.id,
          title: `Sales Order: ${order.orderFormNo}`,
          description: `Customer: ${order.customerName}, Value: ${order.orderFormValue} ${order.currency}`,
          amount: order.orderFormValue,
          currency: order.currency,
          status: 'pending',
          submitted_by: order.created_by || 'system',
          submitted_by_name: order.created_by || 'System',
          submitted_at: order.created_date || new Date().toISOString()
        });
        
        migratedOrders.push(order.orderFormNo);
      }
    }
    
    return Response.json({ 
      success: true,
      message: `Migrated ${migratedOrders.length} draft sales orders to approval queue`,
      migratedOrders
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});