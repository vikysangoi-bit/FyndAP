import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId, sheetName = 'Sheet1' } = await req.json();

    if (!spreadsheetId) {
      return Response.json({ error: 'spreadsheetId is required' }, { status: 400 });
    }

    // Get access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Fetch data from Google Sheets
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!sheetsResponse.ok) {
      const error = await sheetsResponse.text();
      return Response.json({ error: `Google Sheets API error: ${error}` }, { status: sheetsResponse.status });
    }

    const data = await sheetsResponse.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return Response.json({ error: 'No data found in sheet' }, { status: 400 });
    }

    // First row is headers
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const accounts = [];

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const account = {};

      headers.forEach((header, index) => {
        const value = row[index];
        if (!value) return;

        // Map common header names to account fields
        if (header === 'code') account.code = value;
        else if (header === 'name') account.name = value;
        else if (header === 'type') account.type = value.toLowerCase();
        else if (header === 'category') account.category = value.toLowerCase();
        else if (header === 'brand') account.brand = value;
        else if (header === 'alias') account.alias = value;
        else if (header === 'currency') account.currency = value;
        else if (header === 'openingbalance' || header === 'opening_balance') account.openingBalance = parseFloat(value) || 0;
        else if (header === 'description') account.description = value;
        else if (header === 'active') account.active = value.toLowerCase() === 'true' || value === '1';
        else if (header === 'contactperson' || header === 'contact_person') account.contactPerson = value;
        else if (header === 'phone') account.phone = value;
        else if (header === 'email') account.email = value;
        else if (header === 'address') account.address = value;
        else if (header === 'city') account.city = value;
        else if (header === 'country') account.country = value;
      });

      if (account.code && account.name && account.type && account.category) {
        account.currentBalance = account.openingBalance || 0;
        accounts.push(account);
      }
    }

    // Create accounts
    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < accounts.length; i++) {
      try {
        const created = await base44.asServiceRole.entities.Account.create(accounts[i]);
        results.success.push({ index: i + 2, code: created.code, id: created.id });
      } catch (error) {
        results.errors.push({ index: i + 2, account: accounts[i], error: error.message });
      }
    }

    return Response.json({
      status: results.errors.length === 0 ? 'success' : 'partial',
      total: accounts.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});