import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId, sheetName = 'Sheet1', clearExisting = false } = await req.json();

    if (!spreadsheetId) {
      return Response.json({ error: 'spreadsheetId is required' }, { status: 400 });
    }

    // Get access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Fetch all accounts
    const accounts = await base44.asServiceRole.entities.Account.list();

    // Prepare data for sheets
    const headers = [
      'Code', 'Name', 'Type', 'Category', 'Brand', 'Alias', 
      'Currency', 'Opening Balance', 'Current Balance', 
      'Active', 'Description', 'Contact Person', 'Phone', 
      'Email', 'Address', 'City', 'Country'
    ];

    const rows = accounts.map(account => [
      account.code || '',
      account.name || '',
      account.type || '',
      account.category || '',
      account.brand || '',
      account.alias || '',
      account.currency || 'USD',
      account.openingBalance || 0,
      account.currentBalance || 0,
      account.active ? 'TRUE' : 'FALSE',
      account.description || '',
      account.contactPerson || '',
      account.phone || '',
      account.email || '',
      account.address || '',
      account.city || '',
      account.country || ''
    ]);

    const values = [headers, ...rows];

    // Clear existing data if requested
    if (clearExisting) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Write data to Google Sheets
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return Response.json({ error: `Google Sheets API error: ${error}` }, { status: updateResponse.status });
    }

    const result = await updateResponse.json();

    return Response.json({
      status: 'success',
      message: `Exported ${accounts.length} accounts to Google Sheets`,
      updatedCells: result.updatedCells,
      spreadsheetId: spreadsheetId,
      sheetName: sheetName
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});