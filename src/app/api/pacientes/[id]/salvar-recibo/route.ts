import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const { 
      professionalId, 
      value, 
      name, 
      referente, 
      date, 
      cpfPac, 
      cpfCir,
      ccIds, // Array of CCPACIENTE registration IDs to link
      text   // The formatted receipt text
    } = await request.json();
    
    const db = await getDb();
    
    // 1. Get next internal registration ID for RECIBO
    const lastRegRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM RECIBO");
    const nextRegId = (Number(lastRegRow?.id) || 0) + 1;

    // 2. Get next sequential receipt number for THIS professional
    const lastNroRow = await db.get(
      "SELECT MAX(CAST(NROREC AS INTEGER)) as nro FROM RECIBO WHERE ID_PRESTADOR = ?",
      [professionalId]
    );
    const nextNroRec = (Number(lastNroRow?.nro) || 1000) + 1;

    const now = new Date().toISOString();
    const dbTimestamp = now.replace('T', ' ').slice(0, 19);

    // 3. Insert into RECIBO
    await db.run(
      `INSERT INTO RECIBO (
        REGISTRO, ID_PRESTADOR, NROREC, NROPAC, VALOR, NOME, 
        REFERENTE, CIDADE, DATA, CPFPAC, CPFCIR, 
        DT_TIME_STAMP_INS, ID_USER_STAMP_INS, FL_CANCELADO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextRegId.toString(),
        professionalId,
        nextNroRec.toString(),
        patientId,
        value.toString(),
        name,
        referente,
        'Araraquara',
        date + " 00:00:00.000",
        cpfPac,
        cpfCir,
        dbTimestamp,
        '1',
        '0'
      ]
    );

    // 4. Update CCPACIENTE records to link this receipt number
    if (ccIds && Array.isArray(ccIds) && ccIds.length > 0) {
      const placeholders = ccIds.map(() => '?').join(',');
      await db.run(
        `UPDATE CCPACIENTE SET NRORECIBO = ? WHERE NROPAC = ? AND REGISTRO IN (${placeholders})`,
        [nextNroRec.toString(), patientId, ...ccIds]
      );
    }

    // 5. Store the document in LOG_DOCUMENTO for the history/Files modal
    const lastDocRow = await db.get("SELECT MAX(CAST(ID_DOCUMENTO AS INTEGER)) as id FROM LOG_DOCUMENTO");
    const nextDocId = (Number(lastDocRow?.id) || 0) + 1;
    const todayStr = new Date(date).toLocaleDateString('pt-BR');

    await db.run(
        `INSERT INTO LOG_DOCUMENTO (ID_DOCUMENTO, NROPAC, TIME_STAMP_INS, USER_STAMP_INS, TIPO, NOME, TEXTO, FL_CANCELADO) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextDocId.toString(), patientId, now, '1', '3', `${todayStr} - Recibo #${nextNroRec}`, text, '0']
    );

    await db.close();
    
    return NextResponse.json({ 
      success: true, 
      receiptNumber: nextNroRec,
      id: nextRegId 
    });
  } catch (error: any) {
    console.error("API Error (Save Receipt):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
