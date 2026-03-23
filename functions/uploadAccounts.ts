export default async function uploadAccounts({ accounts }) {
  const { base44 } = await import('@base44/node-sdk');
  
  if (!accounts || !Array.isArray(accounts)) {
    return {
      status: 'error',
      message: 'Invalid input: accounts must be an array'
    };
  }

  const results = {
    success: [],
    errors: []
  };

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    try {
      // Validate required fields
      if (!account.code || !account.name || !account.type || !account.category) {
        results.errors.push({
          index: i,
          account: account,
          error: 'Missing required fields: code, name, type, category'
        });
        continue;
      }

      // Set currentBalance to openingBalance if provided
      if (account.openingBalance && !account.currentBalance) {
        account.currentBalance = account.openingBalance;
      }

      // Create account
      const created = await base44.asServiceRole.entities.Account.create(account);
      results.success.push({
        index: i,
        id: created.id,
        code: created.code
      });
      
    } catch (error) {
      results.errors.push({
        index: i,
        account: account,
        error: error.message || 'Unknown error'
      });
    }
  }

  return {
    status: results.errors.length === 0 ? 'success' : 'partial',
    total: accounts.length,
    successCount: results.success.length,
    errorCount: results.errors.length,
    results: results
  };
}