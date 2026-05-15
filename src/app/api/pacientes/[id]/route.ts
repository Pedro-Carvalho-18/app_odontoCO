import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // PRINOM já contém o nome completo no seu banco.
    const patient = await db.get(
      `SELECT 
        NROPAC as id,
        PRINOM as name,
        EMAIL as email,
        FONE1 as phone,
        DATNAS as birthDate,
        CIC as cpf,
        RG as rg,
        ENDRES as address,
        BAIRES as neighborhood,
        CIDRES as city,
        ESTRES as state,
        CEPRES as zipCode,
        PROFIS as profession,
        STATUS as status
      FROM PESSOAL 
      WHERE NROPAC = ?`,
      [id]
    );

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    // 2. Buscar anamnese (Saúde e Medicamentos)
    const anamnesis = await db.all(
      `SELECT 
        Q.TX_PERGUNTA as question,
        RI.TX_COMPLEMENTO as complement,
        QI.TX_MSG_ALERTA as alert,
        RI.ID_OPCAO_RSP as responseId
      FROM ANAMNESE_RSP R
      JOIN ANAMNESE_RSP_ITEM RI ON R.ID_RSP = RI.ID_RSP
      JOIN ANAMNESE_QST_ITEM QI ON RI.ID_QST_ITEM = QI.ID_QST_ITEM
      JOIN ANAMNESE_QST_ITEM Q ON RI.ID_QST_ITEM = Q.ID_QST_ITEM
      WHERE R.ID_PESSOA = ? AND (RI.ID_OPCAO_RSP = '2' OR (RI.TX_COMPLEMENTO IS NOT NULL AND RI.TX_COMPLEMENTO != ''))`,
      [id]
    );

    return NextResponse.json({ ...patient, anamnesis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
