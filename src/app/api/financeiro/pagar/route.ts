import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nroTra, nroPac, nroPar, value, description, paymentMethodId } = await request.json();
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
      ) VALUES (?, ?, ?, ?, ?, '6', '255', ?, ?, 'SISTEMA', ?, ?, ?)`,
      [
        nextId.toString(),
        nroPac,
        nroTra,
        today,
        description || "Pg Tratamento",
        value.toString(),
        paymentMethodId || "1",
        now,
        today + " 00:00:00.000",
        nroPar || "1"
      ]
    );

    // Sincronizar INTERVENCAO e TRATAMENTO com os novos pagamentos
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
    console.error("API Error (Finance Pay):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
