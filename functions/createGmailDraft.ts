import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ 
        error: 'Missing required fields: to, subject, body' 
      }, { status: 400 });
    }

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Create email as HTML (no attachment)
    const emailLines = [
      'Content-Type: text/html; charset=UTF-8',
      'MIME-Version: 1.0',
      'To: ' + to,
      'Subject: ' + subject,
      '',
      body,
    ];

    const email = emailLines.join('\r\n');
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Create Gmail draft
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          raw: encodedEmail
        }
      })
    });

    if (!gmailResponse.ok) {
      const error = await gmailResponse.text();
      return Response.json({ error: `Gmail API error: ${error}` }, { status: 500 });
    }

    const draft = await gmailResponse.json();

    return Response.json({ 
      success: true, 
      draftId: draft.id,
      message: 'Draft created successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});