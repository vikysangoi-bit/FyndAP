import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, entity_name, details, old_values, new_values } = await req.json();

    // Create audit log entry
    await base44.asServiceRole.entities.AuditLog.create({
      action,
      entity_type,
      entity_id,
      entity_name,
      user_email: user.email,
      user_name: user.full_name,
      details,
      old_values,
      new_values,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});