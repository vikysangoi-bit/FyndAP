import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();

    // Fetch all POs to validate against
    const purchaseOrders = await base44.entities.PurchaseOrder.list();
    
    const validationErrors = [];
    const validData = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const errors = [];

      // Validate PO Number exists
      if (!row.po_number) {
        errors.push(`Row ${i + 1}: PO Number is required`);
      } else {
        const po = purchaseOrders.find(p => p.po_number === row.po_number);
        if (!po) {
          errors.push(`Row ${i + 1}: PO Number "${row.po_number}" not found`);
        } else {
          // Validate item exists in PO
          const poItem = po.items?.find(item => 
            item.itemCode === row.item_sku || 
            item.styleID === row.styleID
          );
          
          if (!poItem) {
            errors.push(`Row ${i + 1}: Item (SKU: ${row.item_sku || 'N/A'}, Style: ${row.styleID || 'N/A'}) not found in PO ${row.po_number}`);
          }
        }
      }

      // Validate required fields
      if (!row.transaction_date) {
        errors.push(`Row ${i + 1}: Transaction Date is required`);
      }
      if (!row.type) {
        errors.push(`Row ${i + 1}: Type is required`);
      }

      if (errors.length > 0) {
        validationErrors.push(...errors);
      } else {
        validData.push(row);
      }
    }

    return Response.json({
      valid: validationErrors.length === 0,
      errors: validationErrors,
      validCount: validData.length,
      errorCount: validationErrors.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});