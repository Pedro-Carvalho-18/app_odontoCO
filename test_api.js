const http = require('http');

async function testUpdate() {
  try {
    const res = await fetch(`http://localhost:3000/api/pacientes/1037/historico/atualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: "10823",
        type: "intervention",
        professionalId: "1",
        value: 50,
        status: "Em Aberto",
        paidInstallments: 1,
        nroTra: "220"
      })
    });
    console.log(await res.json());
  } catch (err) {
    console.error(err);
  }
}
testUpdate();
