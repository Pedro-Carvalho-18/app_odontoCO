import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const { id, type, procedure, professionalId, value, status, notes, nroTra, treatmentStatus } = body;
    
    const db = await getDb();

    if (type === 'intervention') {
      const statusValue = status === 'Concluído' ? '2' : status === 'Cancelado' ? '3' : '1';
      
      await db.run(
        `UPDATE INTERVENCAO 
         SET OBSERV = ?, 
             ID_PRESTADOR = ?, 
             VALOR_PACIENTE = ?, 
             STATUS = ? 
         WHERE NROPAC = ? AND NROINTPAC = ?`,
        [notes || procedure, professionalId, value, statusValue, patientId, id]
      );

      if (nroTra) {
        await db.run(
          `UPDATE TRATAMENTO SET STATTRA = ? WHERE NROTRA = ?`,
          [treatmentStatus || '1', nroTra]
        );
      }
    } else if (type === 'history') {
      await db.run(
        `UPDATE HISTORICO 
         SET DESCRICAO = ?, 
             ID_PRESTADOR = ? 
         WHERE NROPAC = ? AND REGISTRO = ?`,
        [procedure, professionalId, patientId, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Update Procedure):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
