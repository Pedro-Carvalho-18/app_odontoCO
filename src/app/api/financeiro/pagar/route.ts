import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nroTra, nroPac, nroPar, value, description } = await request.json();
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const today = new Date().toISOString().split('T')[0];

    // Buscamos o último ID de registro para gerar o próximo
    const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
    const nextId = (Number(lastIdRow?.id) || 0) + 1;

    // Inserimos o registro de PAGAMENTO (NROLAN 6)
    await db.run(
      `INSERT INTO CCPACIENTE (
        REGISTRO, NROPAC, NROTRA, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
        TIPO_PAGTO, USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROPAR
      ) VALUES (?, ?, ?, ?, ?, '6', '255', ?, '1', 'SISTEMA', ?, ?, ?)`,
      [
        nextId.toString(),
        nroPac,
        nroTra,
        today,
        description || "Pg Tratamento",
        value.toString(),
        now,
        today + " 00:00:00.000",
        nroPar || "1"
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Finance Pay):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
