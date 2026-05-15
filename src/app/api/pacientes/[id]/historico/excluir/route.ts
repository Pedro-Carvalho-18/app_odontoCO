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
      // 1. First, we might want to check for related records in DENTE/FACE
      // In a robust system, we'd use foreign keys with CASCADE or manual deletion.
      await db.run("DELETE FROM DENTE WHERE NROPAC = ? AND NROINTPAC = ?", [patientId, id]);
      await db.run("DELETE FROM FACE WHERE NROPAC = ? AND NROINTPAC = ?", [patientId, id]);
      
      // 2. Delete from INTERVENCAO
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
