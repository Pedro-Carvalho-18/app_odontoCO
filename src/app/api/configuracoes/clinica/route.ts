import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    // Pegamos a primeira unidade (clínica principal)
    const clinic = await db.get("SELECT * FROM UNIDADE WHERE ID_UNIDADE = '1'");
    
    if (!clinic) {
      return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: clinic.ID_UNIDADE,
      name: clinic.NOME,
      razao: clinic.RAZAO,
      cnpj: clinic.CNPJ,
      phone: clinic.FONE1,
      email: clinic.EMAIL,
      address: clinic.ENDERECO,
      number: clinic.NUMERO,
      complement: clinic.COMPLEM,
      neighborhood: clinic.BAIRRO,
      city: clinic.CIDADE,
      state: clinic.UF,
      zipCode: clinic.CEP
    });
  } catch (error: any) {
    console.error("API Error (Clinic GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await db.run(
      `UPDATE UNIDADE SET 
        NOME = ?, 
        RAZAO = ?, 
        CNPJ = ?, 
        FONE1 = ?, 
        EMAIL = ?,
        ENDERECO = ?,
        NUMERO = ?,
        COMPLEM = ?,
        BAIRRO = ?,
        CIDADE = ?,
        UF = ?,
        CEP = ?,
        TIME_STAMP_UPD = ?,
        USER_STAMP_UPD = 'SISTEMA'
      WHERE ID_UNIDADE = '1'`,
      [
        body.name,
        body.razao,
        body.cnpj,
        body.phone,
        body.email,
        body.address,
        body.number,
        body.complement,
        body.neighborhood,
        body.city,
        body.state,
        body.zipCode,
        now
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Clinic POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
