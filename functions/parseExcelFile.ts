import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, json_schema } = await req.json();

    if (!file_url) {
      return Response.json({ 
        status: 'error', 
        details: 'file_url is required' 
      });
    }
    // Fetch the Excel file
    const response = await fetch(file_url);
    if (!response.ok) {
      return Response.json({
        status: 'error',
        details: 'Failed to download the file'
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return Response.json({
        status: 'error',
        details: 'No sheets found in the Excel file'
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (!jsonData || jsonData.length === 0) {
      return Response.json({
        status: 'error',
        details: 'No data found in the Excel file'
      });
    }

    // Process the data based on schema
    const processedData = jsonData.map(row => {
      const processed = {};
      const schemaProps = json_schema.items?.properties || json_schema.properties || {};
      
      for (const [key, value] of Object.entries(row)) {
        const schemaProp = schemaProps[key];
        if (!schemaProp) continue;
        
        // Handle different types
        if (schemaProp.type === 'number') {
          // Skip truly empty values for numbers
          if (value === '' || value === null || value === undefined) {
            continue;
          }
          processed[key] = parseFloat(value) || 0;
        } else if (schemaProp.type === 'boolean') {
          // Skip truly empty values for booleans
          if (value === '' || value === null || value === undefined) {
            continue;
          }
          processed[key] = value === 'true' || value === true || value === 1;
        } else if (schemaProp.type === 'array') {
          // Skip truly empty values for arrays
          if (value === '' || value === null || value === undefined) {
            continue;
          }
          processed[key] = typeof value === 'string' ? value.split(',').map(v => v.trim()) : value;
        } else {
          // For strings (including enums), trim whitespace and convert
          // Only skip if the value is truly empty after trimming
          if (value === null || value === undefined) {
            continue;
          }
          const stringValue = String(value).trim();
          if (stringValue !== '') {
            processed[key] = stringValue;
          }
        }
      }
      
      return processed;
    });

    return Response.json({
      status: 'success',
      output: processedData
    });

  } catch (error) {
    return Response.json({
      status: 'error',
      details: error.message || 'Failed to parse Excel file'
    });
  }
});