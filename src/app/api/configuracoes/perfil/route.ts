import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    // Pegamos o primeiro prestador (geralmente o Dr. titular)
    const professional = await db.get("SELECT * FROM PRESTADOR WHERE ID_PRESTADOR = '1'");
    
    if (!professional) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: professional.ID_PRESTADOR,
      name: professional.NOME,
      cro: professional.CRO_PF,
      email: professional.EMAIL,
      phone: professional.FONE1,
      specialties: professional.OBSERV || "", // Usando OBSERV para especialidades como fallback
    });
  } catch (error: any) {
    console.error("API Error (Profile GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await db.run(
      `UPDATE PRESTADOR SET 
        NOME = ?, 
        CRO_PF = ?, 
        EMAIL = ?, 
        FONE1 = ?, 
        OBSERV = ?,
        TIME_STAMP_UPD = ?,
        USER_STAMP_UPD = 'SISTEMA'
      WHERE ID_PRESTADOR = '1'`,
      [
        body.name,
        body.cro,
        body.email,
        body.phone,
        body.specialties,
        now
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Profile POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
