const http = require('http');

async function testFetch() {
  try {
    const res = await fetch(`http://localhost:3000/api/pacientes/1037/historico`);
    const data = await res.json();
    const item = data.interventions.find(i => i.id === "10823");
    console.log(JSON.stringify(item, null, 2));
  } catch (err) {
    console.error(err);
  }
}
testFetch();
