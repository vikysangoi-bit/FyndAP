import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { spreadsheetId } = await req.json();

        if (!spreadsheetId) {
            return Response.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
        }

        // Get Google Sheets access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

        // Get spreadsheet metadata
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
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
                error: 'Failed to list sheets', 
                details: error 
            }, { status: response.status });
        }

        const data = await response.json();
        const sheets = data.sheets?.map(sheet => sheet.properties.title) || [];
        
        return Response.json({ sheets });

    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});