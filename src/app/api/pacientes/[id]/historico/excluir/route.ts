import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const { id, type } = body;
    
    const db = await getDb();

    if (type === 'intervention') {
      // 1. Get NROTRA associated with this intervention to delete financial records
      const intervention = await db.get(
        "SELECT NROTRA FROM INTERVENCAO WHERE NROPAC = ? AND NROINTPAC = ?",
        [patientId, id]
      );

      if (intervention?.NROTRA) {
        const nroTra = intervention.NROTRA;

        // 2. Find CC records to delete related surgeon commissions (CCCIRURGIAO)
        const ccRecords = await db.all(
          "SELECT REGISTRO FROM CCPACIENTE WHERE NROTRA = ?",
          [nroTra]
        );

        if (ccRecords && ccRecords.length > 0) {
          const ccIds = ccRecords.map(r => r.REGISTRO);
          const placeholders = ccIds.map(() => "?").join(",");
          await db.run(
            `DELETE FROM CCCIRURGIAO WHERE NROCCPAC IN (${placeholders})`,
            ccIds
          );
        }

        // 3. Delete from financial tables linked by NROTRA
        await db.run("DELETE FROM CCPACIENTE WHERE NROTRA = ?", [nroTra]);
        await db.run("DELETE FROM PARCELA WHERE NROTRA = ?", [nroTra]);
        await db.run("DELETE FROM TRATAMENTO_COMISSAO WHERE NROTRA = ?", [nroTra]);
        await db.run("DELETE FROM TRATAMENTO WHERE NROTRA = ?", [nroTra]);
      }

      // 4. Delete from INTERVENCAO related tables (DENTE, FACE)
      await db.run("DELETE FROM DENTE WHERE NROPAC = ? AND NROINTPAC = ?", [patientId, id]);
      await db.run("DELETE FROM FACE WHERE NROPAC = ? AND NROINTPAC = ?", [patientId, id]);
      
      // 5. Finally, delete from INTERVENCAO
      await db.run(
        `DELETE FROM INTERVENCAO WHERE NROPAC = ? AND NROINTPAC = ?`,
        [patientId, id]
      );
    } else if (type === 'history') {
      await db.run(
        `DELETE FROM HISTORICO WHERE NROPAC = ? AND REGISTRO = ?`,
        [patientId, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Delete Procedure):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
