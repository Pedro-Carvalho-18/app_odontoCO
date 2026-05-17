import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. Gerar novo NROPAC (ID do Paciente)
    const lastIdRow = await db.get("SELECT MAX(CAST(NROPAC AS INTEGER)) as id FROM PESSOAL");
    const nextId = (Number(lastIdRow?.id) || 0) + 1;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const today = new Date().toISOString().split('T')[0];

    // 2. Inserir na tabela PESSOAL
    await db.run(
      `INSERT INTO PESSOAL (
        NROPAC, PRINOM, APELIDO, EMAIL, FONE1, DATNAS, SEXO, ESTCIVIL, CIC, RG, 
        ENDRES, BAIRES, CIDRES, ESTRES, CEPRES, PROFIS,
        ID_CONVENIO, MATRICULA, ID_PRESTADOR, TIPO_INDICA, STATUS,
        DATCAD, USER_STAMP_INS, TIME_STAMP_INS, ID_UNIDADE
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId.toString(),
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
        today,
        "SISTEMA",
        now,
        "1"
      ]
    );

    // 3. Criar registro de Anamnese se houver respostas
    if (body.anamnesis && Array.isArray(body.anamnesis)) {
      // Gerar ID_RSP
      const lastRspRow = await db.get("SELECT MAX(CAST(ID_RSP AS INTEGER)) as id FROM ANAMNESE_RSP");
      const nextRspId = (Number(lastRspRow?.id) || 0) + 1;

      // Inserir cabeçalho da resposta
      await db.run(
        `INSERT INTO ANAMNESE_RSP (ID_RSP, DT_RSP, ID_QST, ID_PESSOA, DT_TIME_STAMP_INS, ID_USER_STAMP_INS, FL_CANCELADO)
         VALUES (?, ?, '1', ?, ?, '1', '0')`,
        [nextRspId, now, nextId.toString(), now]
      );

      // Inserir itens da resposta
      const stmt = await db.prepare(
        `INSERT INTO ANAMNESE_RSP_ITEM (ID_RSP_ITEM, ID_RSP, ID_QST_ITEM, ID_OPCAO_RSP, TX_COMPLEMENTO, DT_TIME_STAMP_INS, ID_USER_STAMP_INS, FL_CANCELADO)
         VALUES (?, ?, ?, ?, ?, ?, '1', '0')`
      );

      let itemCounter = 0;
      const lastItemRow = await db.get("SELECT MAX(CAST(ID_RSP_ITEM AS INTEGER)) as id FROM ANAMNESE_RSP_ITEM");
      let nextItemId = (Number(lastItemRow?.id) || 0) + 1;

      for (const item of body.anamnesis) {
        if (item.value) {
          await stmt.run([
            (nextItemId++).toString(),
            nextRspId.toString(),
            item.id,
            "2", // Sim / Alerta
            item.value,
            now
          ]);
        }
      }
      await stmt.finalize();
    }

    return NextResponse.json({ success: true, id: nextId.toString() });
  } catch (error: any) {
    console.error("API Error (Create Patient):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
