import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const { text } = await request.json();
    
    // Adicionar registro apenas no banco de dados na tabela central de documentos
    const db = await getDb();

    const lastDocRow = await db.get("SELECT MAX(CAST(ID_DOCUMENTO AS INTEGER)) as id FROM LOG_DOCUMENTO");
    const nextDocId = (Number(lastDocRow?.id) || 0) + 1;
    const now = new Date().toISOString();
    const todayStr = new Date().toLocaleDateString('pt-BR');

    await db.run(
        `INSERT INTO LOG_DOCUMENTO (ID_DOCUMENTO, NROPAC, TIME_STAMP_INS, USER_STAMP_INS, TIPO, NOME, TEXTO, FL_CANCELADO) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextDocId.toString(), patientId, now, '1', '1', `${todayStr} - Atestado`, text, '0']
    );

    await db.close();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Save Certificate):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
