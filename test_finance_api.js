const http = require('http');

async function testFinanceAPI() {
  try {
    const res = await fetch(`http://localhost:3000/api/financeiro`);
    const data = await res.json();
    console.log("Summary:", data.summary);
    console.log("Pending Transactions Count:", data.pendingTransactions?.length);
    if (data.pendingTransactions?.length > 0) {
        const ids = data.pendingTransactions.map(t => t.id);
        const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
        console.log("Duplicate IDs found:", duplicates);
        if (duplicates.length > 0) {
            console.log("First 5 pending items:", JSON.stringify(data.pendingTransactions.slice(0, 5), null, 2));
        }
    }
  } catch (err) {
    console.error(err);
  }
}
testFinanceAPI();
