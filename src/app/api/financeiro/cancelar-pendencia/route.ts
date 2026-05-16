import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nroTra, nroPac } = await request.json();
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Cancelar a pendência significa anular os débitos não pagos
    // Para manter a integridade, apenas marcamos as intervenções como canceladas no sistema legado (Status 3)
    // Ou removemos os lançamentos NROLAN 4 sem pagamentos correspondentes.
    
    // Decisão: Atualizar o Status para 3 (Cancelado) para que pare de gerar cobrança
    await db.run(
      "UPDATE INTERVENCAO SET STATUS = '3' WHERE NROPAC = ? AND NROTRA = ?",
      [nroPac, nroTra]
    );

    // E removemos o débito original da CCPACIENTE para que o saldo suma
    await db.run(
      "DELETE FROM CCPACIENTE WHERE NROPAC = ? AND NROTRA = ? AND NROLAN IN ('4', '5')",
      [nroPac, nroTra]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Finance Cancel Pending):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
