import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Sheets access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

        // List spreadsheets from Google Drive
        const response = await fetch(
            'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"&pageSize=100&fields=files(id,name)',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ 
                error: 'Failed to list spreadsheets', 
                details: error 
            }, { status: response.status });
        }

        const data = await response.json();
        
        return Response.json({ 
            spreadsheets: data.files || []
        });

    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});