import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { registroId, nroTra } = await request.json();
    if (!registroId) {
      return NextResponse.json({ error: "registroId is required" }, { status: 400 });
    }

    const db = await getDb();

    // Deletar o registro de pagamento do conta-corrente
    await db.run(
      `DELETE FROM CCPACIENTE WHERE REGISTRO = ? AND NROLAN IN ('6', '7', '8', '105')`,
      [registroId.toString()]
    );

    // Sincronizar INTERVENCAO e TRATAMENTO com os pagamentos restantes
    if (nroTra && nroTra !== '0') {
      const paymentsSum = await db.get(
        `SELECT SUM(CAST(VALOR AS FLOAT)) as total FROM CCPACIENTE WHERE NROTRA = ? AND NROLAN IN ('6', '7', '8', '105')`,
        [nroTra.toString()]
      );
      const totalPaid = paymentsSum?.total || 0;

      const interRow = await db.get(
        `SELECT NROINTPAC, VALOR_PACIENTE, OBSERV FROM INTERVENCAO WHERE NROTRA = ? LIMIT 1`,
        [nroTra.toString()]
      );

      if (interRow) {
        const valTotal = Number(interRow.VALOR_PACIENTE) || 0;
        let totalInst = 1;
        
        // Parse installments from OBSERV/notes
        if (interRow.OBSERV && interRow.OBSERV.includes('(') && interRow.OBSERV.includes('x)')) {
          const match = interRow.OBSERV.match(/\((\d+)x\)/);
          if (match) totalInst = parseInt(match[1]) || 1;
        }

        const newPaidInst = Math.min(totalInst, Math.max(0, Math.round((totalPaid / (valTotal || 1)) * totalInst)));
        const newStatus = newPaidInst >= totalInst ? '2' : '1'; // '2' = Concluído, '1' = Em Aberto

        await db.run(
          `UPDATE INTERVENCAO SET ORCAMENTO = ?, STATUS = ? WHERE NROTRA = ?`,
          [newPaidInst.toString(), newStatus, nroTra.toString()]
        );

        await db.run(
          `UPDATE TRATAMENTO SET STATTRA = ? WHERE NROTRA = ?`,
          [newStatus, nroTra.toString()]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Delete Payment):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
