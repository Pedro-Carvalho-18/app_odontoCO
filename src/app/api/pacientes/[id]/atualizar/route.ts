import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    await db.run(
      `UPDATE PESSOAL SET 
        PRINOM = ?,
        APELIDO = ?,
        EMAIL = ?,
        FONE1 = ?,
        DATNAS = ?,
        SEXO = ?,
        ESTCIVIL = ?,
        CIC = ?,
        RG = ?,
        ENDRES = ?,
        BAIRES = ?,
        CIDRES = ?,
        ESTRES = ?,
        CEPRES = ?,
        PROFIS = ?,
        ID_CONVENIO = ?,
        MATRICULA = ?,
        ID_PRESTADOR = ?,
        TIPO_INDICA = ?,
        STATUS = ?
      WHERE NROPAC = ?`,
      [
        body.name,
        body.nickname || null,
        body.email || null,
        body.phone || null,
        body.birthDate || null,
        body.sex || "2",
        body.maritalStatus || "6",
        body.cpf || null,
        body.rg || null,
        body.address || null,
        body.neighborhood || null,
        body.city || "ARARAQUARA",
        body.state || "SP",
        body.zipCode || null,
        body.profession || null,
        body.convenioId || "1",
        body.registrationNumber || null,
        body.preferredProfessionalId || "1",
        body.referralTypeId || "3",
        body.status || "2",
        id
      ]
    );

    // 2. Atualizar/Inserir Anamnese (Saúde)
    if (body.anamnesis && Array.isArray(body.anamnesis)) {
      // 2a. Garantir que existe o cabeçalho de resposta ANAMNESE_RSP para este paciente com ID_QST = '1'
      let rsp = await db.get(
        `SELECT ID_RSP FROM ANAMNESE_RSP WHERE ID_PESSOA = ? AND ID_QST = '1'`,
        [id]
      );
      let rspId: string;
      if (!rsp) {
        const maxRsp = await db.get(`SELECT MAX(CAST(ID_RSP AS INTEGER)) as maxId FROM ANAMNESE_RSP`);
        const nextRspId = (maxRsp?.maxId || 0) + 1;
        rspId = String(nextRspId);
        
        await db.run(
          `INSERT INTO ANAMNESE_RSP (ID_RSP, DT_RSP, ID_QST, ID_PESSOA, FL_CANCELADO, DT_TIME_STAMP_INS, ID_USER_STAMP_INS)
           VALUES (?, datetime('now', 'localtime'), '1', ?, '0', datetime('now', 'localtime'), '1')`,
          [rspId, id]
        );
      } else {
        rspId = rsp.ID_RSP;
      }

      // 2b. Para cada questão, atualizar ou inserir no ANAMNESE_RSP_ITEM
      for (const item of body.anamnesis) {
        if (item.id) {
          const qstItemId = String(item.id);
          const existingItem = await db.get(
            `SELECT ID_RSP_ITEM FROM ANAMNESE_RSP_ITEM WHERE ID_RSP = ? AND ID_QST_ITEM = ?`,
            [rspId, qstItemId]
          );
          const valComplement = item.complement || "";
          const valResponseId = item.responseId || "0";
          
          if (existingItem) {
            await db.run(
              `UPDATE ANAMNESE_RSP_ITEM SET 
                TX_COMPLEMENTO = ?,
                ID_OPCAO_RSP = ?,
                DT_TIME_STAMP_UPD = datetime('now', 'localtime'),
                ID_USER_STAMP_UPD = '1'
               WHERE ID_RSP_ITEM = ?`,
              [valComplement, valResponseId, existingItem.ID_RSP_ITEM]
            );
          } else {
            const maxItem = await db.get(`SELECT MAX(CAST(ID_RSP_ITEM AS INTEGER)) as maxId FROM ANAMNESE_RSP_ITEM`);
            const nextItemId = (maxItem?.maxId || 0) + 1;
            
            await db.run(
              `INSERT INTO ANAMNESE_RSP_ITEM (ID_RSP_ITEM, ID_RSP, ID_QST_ITEM, ID_OPCAO_RSP, TX_COMPLEMENTO, FL_CANCELADO, DT_TIME_STAMP_INS, ID_USER_STAMP_INS)
               VALUES (?, ?, ?, ?, ?, '0', datetime('now', 'localtime'), '1')`,
              [String(nextItemId), rspId, qstItemId, valResponseId, valComplement]
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Update Patient):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
