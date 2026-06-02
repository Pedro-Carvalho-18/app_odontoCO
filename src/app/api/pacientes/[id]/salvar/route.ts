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
  // Legacy support for reconstruction
  ausente: 'arc_EXTRACAO_s',
  extracao: 'arc_EXTRACAO_s'
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
          const dateOnly = inter.date.split('T')[0];
          const [yyyy, mm, dd] = dateOnly.split('-').map((s: string) => s.padStart(2, '0'));
          const formattedDate = `${yyyy}-${mm}-${dd} 00:00:00.000`;
          
          const now = new Date().toISOString().replace('T', ' ').split('.')[0].replace('Z', '') + '.000';
          const today = new Date().toISOString().split('T')[0];

          const lastTraRow = await db.get("SELECT MAX(CAST(NROTRA AS INTEGER)) as id FROM INTERVENCAO");
          const nextTraId = (Number(lastTraRow?.id) || 0) + 1;

          const observText = inter.procedure?.startsWith("Atestado")
            ? `${inter.procedure} | ${inter.notes}`
            : inter.notes?.startsWith("DIAGNÓSTICO:")
              ? inter.notes
              : inter.notes?.startsWith("PROCEDIMENTO:")
                ? inter.notes
                : `PROCEDIMENTO: ${inter.procedure} | ${inter.notes}`;

          await db.run(
            `INSERT INTO INTERVENCAO (
              NROPAC, NROINTPAC, NROTRA, ID_PRESTADOR, NROTAB, NROINT, 
              DATCAD, STATUS, OBSERV, VALOR_PACIENTE, S_DENTES,
              USER_STAMP_INS, TIME_STAMP_INS
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              patientId,
              nextNroIntPac.toString(),
              nextTraId.toString(),
              inter.professionalId || '1',
              '1',
              inter.procedureId || '0',
              formattedDate,
              inter.status === 'Concluído' ? '2' : '1',
              observText,
              inter.numericValue || 0,
              inter.tooth || '',
              '1',
              now
            ]
          );

          // FINANCIAL INTEGRATION: Create debt and payment in CCPACIENTE
          // Only for real clinical procedures with value
          if (inter.numericValue > 0 && !inter.procedure?.includes("Alteração Odontograma")) {
            const instCount = Math.max(1, parseInt(inter.installments) || 1);
            const rawValue = parseFloat(inter.numericValue) || 0;
            const valPerInst = rawValue / instCount;

            // 1. Create DEBT records (NROLAN '4') - One for each installment
            for (let i = 1; i <= instCount; i++) {
              const lastCcRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
              const nextCcId = (Number(lastCcRow?.id) || 0) + 1;

              await db.run(
                `INSERT INTO CCPACIENTE (
                  REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
                  USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROTRA, NROPAR
                ) VALUES (?, ?, ?, ?, '4', '255', ?, ?, ?, ?, ?, ?)`,
                [
                  nextCcId.toString(),
                  patientId,
                  formattedDate,
                  `${inter.procedure} (Parc ${i}/${instCount})`,
                  valPerInst.toFixed(2),
                  "SISTEMA",
                  now,
                  today + " 00:00:00.000",
                  nextTraId.toString(),
                  i.toString()
                ]
              );

              // 2. Create PAYMENT record if payment method is provided (NROLAN '6') and isPaid is true
              if (i === 1 && inter.isPaid && inter.paymentMethodId && inter.paymentMethodId !== 'none') {
                 const lastPayRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
                 const nextPayId = (Number(lastPayRow?.id) || 0) + 1;
                 
                 await db.run(
                   `INSERT INTO CCPACIENTE (
                     REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
                     TIPO_PAGTO, USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO, NROTRA, NROPAR
                   ) VALUES (?, ?, ?, ?, '6', '255', ?, ?, ?, ?, ?, ?, ?)`,
                   [
                     nextPayId.toString(),
                     patientId,
                     formattedDate,
                     `Pg ${inter.procedure} (Parc 1/${instCount})`,
                     valPerInst.toFixed(2),
                     inter.paymentMethodId,
                     "SISTEMA",
                     now,
                     today + " 00:00:00.000",
                     nextTraId.toString(),
                     "1"
                   ]
                 );
              }
            }
          }

          const toothNum = parseInt(inter.tooth);
          if (!isNaN(toothNum) && inter.toothData) {
            console.log(`[SAVE] Saving tooth ${toothNum} with status: ${inter.toothData.status}`);
            const internalId = getInternalToothId(toothNum);
            const status = inter.toothData.status;
            let bitmap = '';
            
            // PRIORITY 1: 100% Fidelity - Use the exact icon filename provided by the client
            if (inter.toothData.latestIcon) {
              bitmap = `icon:${inter.toothData.latestIcon}`;
              console.log(`[SAVE] Storing literal icon reference for exact match: ${bitmap}`);
            }
            
            // PRIORITY 2: Fallback to Procedure-based lookup (if no specific icon was selected from carousel)
            if (!bitmap && inter.procedureId && inter.procedureId !== '0') {
              const procSymbol = await db.get(
                `SELECT S.BITMAP1 
                 FROM TAB_PRC_ITEM PRC
                 JOIN __SIMBOLO_ODONTO S ON PRC.NROSIM = S.NROSIM
                 WHERE (PRC.NROPROCTAB = ? OR PRC.ID_PRC_GEN = ?) AND PRC.NROTAB = '1'
                 LIMIT 1`,
                [inter.procedureId, inter.procedureId]
              ) || await db.get(
                `SELECT S.BITMAP1
                 FROM TAB_GEN_ITEM GEN
                 JOIN __SIMBOLO_ODONTO S ON GEN.ID_SIMBOLO = S.NROSIM
                 WHERE GEN.ID_PRC_GEN = ?
                 LIMIT 1`,
                [inter.procedureId]
              );

              if (procSymbol?.BITMAP1) {
                bitmap = `arc_${procSymbol.BITMAP1}`;
                console.log(`[SAVE] Fallback: Found bitmap from procedure ${inter.procedureId}: ${bitmap}`);
              }
            }
            
            // PRIORITY 3: Generic status mapping (last resort)
            if (!bitmap) {
              bitmap = statusMap[status] || '';
              if (bitmap && bitmap !== 'arc_EXTRACAO_s') {
                bitmap = `${bitmap}_${toothNum}`;
              }
            }

            // Append tooth number to arc_ bitmaps if not already present
            if (bitmap.startsWith('arc_') && bitmap !== 'arc_EXTRACAO_s' && !bitmap.includes(toothNum.toString())) {
              bitmap = `${bitmap}_${toothNum}`;
            }

            console.log(`[SAVE] Inserting DENTE: PAC=${patientId}, INTPAC=${nextNroIntPac}, DEN=${internalId}, BITMAP="${bitmap}"`);
            
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
