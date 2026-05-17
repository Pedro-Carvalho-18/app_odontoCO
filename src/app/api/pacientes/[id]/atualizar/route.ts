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

    // 2. Atualizar Anamnese (Saúde)
    if (body.anamnesis && Array.isArray(body.anamnesis)) {
      for (const item of body.anamnesis) {
        await db.run(
          `UPDATE ANAMNESE_RSP_ITEM SET 
            TX_COMPLEMENTO = ?,
            ID_OPCAO_RSP = ?
          WHERE ID_RSP_ITEM IN (
            SELECT RI.ID_RSP_ITEM 
            FROM ANAMNESE_RSP_ITEM RI
            JOIN ANAMNESE_RSP R ON RI.ID_RSP = R.ID_RSP
            JOIN ANAMNESE_QST_ITEM QI ON RI.ID_QST_ITEM = QI.ID_QST_ITEM
            WHERE R.ID_PESSOA = ? AND QI.TX_PERGUNTA = ?
          )`,
          [
            item.complement || item.alert || "", 
            item.responseId || "0",
            id, 
            item.question
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Update Patient):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
