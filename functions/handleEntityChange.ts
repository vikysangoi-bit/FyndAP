import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, payload_too_large } = await req.json();

    // If payload was too large, fetch the data
    let entityData = data;
    if (payload_too_large && event.entity_id) {
      entityData = await base44.asServiceRole.entities[event.entity_name].get(event.entity_id);
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      action: event.type,
      entity_type: event.entity_name,
      entity_id: event.entity_id,
      entity_name: entityData?.name || entityData?.code || entityData?.id,
      user_email: entityData?.created_by || entityData?.updated_by || 'system',
      user_name: 'System',
      details: `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} ${event.entity_name}`,
      old_values: old_data || {},
      new_values: entityData || {},
      ip_address: 'system'
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Entity change handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});