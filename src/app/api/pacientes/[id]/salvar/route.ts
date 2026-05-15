import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

function getInternalToothId(toothNum: number): number {
  if (toothNum >= 11 && toothNum <= 18) return 9 - (toothNum - 10); // 18->1, 11->8
  if (toothNum >= 21 && toothNum <= 28) return toothNum - 20 + 8; // 21->9, 28->16
  if (toothNum >= 41 && toothNum <= 48) return 9 - (toothNum - 40) + 16; // 48->17, 41->24
  if (toothNum >= 31 && toothNum <= 38) return toothNum - 30 + 24; // 31->25, 38->32
  return 0;
}

const statusMap: Record<string, string> = {
  healthy: '',
  absent: 'arc_EXTRACAO_s',
  caries: 'arc_CARIE',
  restoration: 'arc_FIXA1',
  prosthesis: 'arc_IMPLANTE',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const { interventions, odontogram } = body;
    
    console.log(`[SAVE] Saving for patient ${patientId}`);
    console.log(`[SAVE] Interventions to save:`, interventions.length);
    
    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      try {
        for (const inter of interventions) {
          console.log(`[SAVE] Processing intervention:`, inter.procedure);
          
          const lastInt = await db.get(
            "SELECT MAX(CAST(NROINTPAC AS INTEGER)) as maxInt FROM INTERVENCAO WHERE NROPAC = ?",
            [patientId]
          );
          const nextNroIntPac = (lastInt?.maxInt || 0) + 1;

          console.log(`[SAVE] Input date: ${inter.date}`);

          // Fix date format: Ensure it's YYYY-MM-DD 00:00:00.000, no timezone shift
          // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss' formats
          const dateOnly = inter.date.split('T')[0];
          const [yyyy, mm, dd] = dateOnly.split('-').map((s: string) => s.padStart(2, '0'));
          const formattedDate = `${yyyy}-${mm}-${dd} 00:00:00.000`;
          console.log(`[SAVE] Formatted date: ${formattedDate}`);

          const now = new Date().toISOString().replace('T', ' ').split('.')[0].replace('Z', '') + '.000';
          await db.run(
            `INSERT INTO INTERVENCAO (
              NROPAC, NROINTPAC, NROTRA, ID_PRESTADOR, NROINT, 
              DATCAD, STATUS, OBSERV, VALOR_PACIENTE, S_DENTES,
              USER_STAMP_INS, TIME_STAMP_INS
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              patientId,
              nextNroIntPac.toString(),
              '1',
              inter.professionalId || '1',
              inter.procedureId || '0',
              formattedDate,
              inter.status === 'Concluído' ? '2' : '1',
              `PROCEDIMENTO: ${inter.procedure} | ${inter.notes}`,
              inter.numericValue || 0,
              inter.tooth || '',
              '1',
              now
            ]
          );

          const toothNum = parseInt(inter.tooth);
          if (!isNaN(toothNum) && inter.toothData) {
            const internalId = getInternalToothId(toothNum);
            const status = inter.toothData.status;
            let bitmap = statusMap[status] || '';
            
            if (bitmap && bitmap !== 'arc_EXTRACAO_s') {
              bitmap = `${bitmap}_${toothNum}`;
            }

            console.log(`[SAVE] Inserting DENTE: PAC=${patientId}, INTPAC=${nextNroIntPac}, DEN=${internalId}, BITMAP=${bitmap}`);
            
            await db.run(
              "INSERT INTO DENTE (NROPAC, NROINTPAC, NRODEN, BITMAP) VALUES (?, ?, ?, ?)",
              [patientId, nextNroIntPac.toString(), internalId.toString(), bitmap]
            );

            const faces = inter.toothData.surfaces;
            console.log(`[SAVE] Inserting FACE: PAC=${patientId}, INTPAC=${nextNroIntPac}, DEN=${internalId}, FACES=${JSON.stringify(faces)}`);
            await db.run(
              `INSERT INTO FACE (
                NROPAC, NROINTPAC, NRODEN, 
                FACE1, FACE2, FACE3, FACE4, FACE5
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                patientId,
                nextNroIntPac.toString(),
                internalId.toString(),
                faces.top ? '-1' : '0',
                faces.left ? '-1' : '0',
                faces.bottom ? '-1' : '0',
                faces.right ? '-1' : '0',
                faces.center ? '-1' : '0'
              ]
            );
          } else {
            console.log(`[SAVE] No tooth data for intervention on tooth: ${inter.tooth}`);
          }
        }
        await db.run("COMMIT");
        return NextResponse.json({ success: true });
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    } finally {
      await db.close();
    }
  } catch (error: any) {
    console.error("API Error (Save):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
