const http = require('http');

async function testFetch() {
  try {
    const res = await fetch(`http://localhost:3000/api/pacientes/1037/historico`);
    const data = await res.json();
    console.log(JSON.stringify(data.interventions.slice(0, 5).map(i => ({ id: i.id, paidInstallments: i.paidInstallments, status: i.status })), null, 2));
  } catch (err) {
    console.error(err);
  }
}
testFetch();
