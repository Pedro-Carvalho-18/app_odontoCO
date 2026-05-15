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
        EMAIL = ?,
        FONE1 = ?,
        DATNAS = ?,
        CIC = ?,
        RG = ?,
        ENDRES = ?,
        BAIRES = ?,
        CIDRES = ?,
        ESTRES = ?,
        CEPRES = ?,
        PROFIS = ?
      WHERE NROPAC = ?`,
      [
        body.name,
        body.email,
        body.phone,
        body.birthDate,
        body.cpf,
        body.rg,
        body.address,
        body.neighborhood,
        body.city,
        body.state,
        body.zipCode,
        body.profession,
        id
      ]
    );

    // 2. Atualizar Anamnese (Saúde)
    if (body.anamnesis && Array.isArray(body.anamnesis)) {
      for (const item of body.anamnesis) {
        // Precisamos encontrar o ID_RSP_ITEM para este paciente e pergunta
        // Uma forma segura é buscar pelo ID_PESSOA e TX_PERGUNTA via JOIN
        await db.run(
          `UPDATE ANAMNESE_RSP_ITEM SET 
            TX_COMPLEMENTO = ?
          WHERE ID_RSP_ITEM IN (
            SELECT RI.ID_RSP_ITEM 
            FROM ANAMNESE_RSP_ITEM RI
            JOIN ANAMNESE_RSP R ON RI.ID_RSP = R.ID_RSP
            JOIN ANAMNESE_QST_ITEM QI ON RI.ID_QST_ITEM = QI.ID_QST_ITEM
            WHERE R.ID_PESSOA = ? AND QI.TX_PERGUNTA = ?
          )`,
          [
            item.alert || item.complement || "", 
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
