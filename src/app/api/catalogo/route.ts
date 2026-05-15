import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();

    // 1. Get specialties for categorization
    const specialties = await db.all(`SELECT REGISTRO as id, NOME as name FROM __ESPECIALIDADE ORDER BY NOME`);

    // 2. Get all procedures joined with their specialty AND price
    // We use GROUP BY TRIM(T.NOME) to remove duplicates
    const procedures = await db.all(`
      SELECT 
        MIN(T.ID_PRC_GEN) as id, 
        TRIM(T.NOME) as name, 
        T.ID_ESPECIALIDADE as specialtyId,
        CAST(IFNULL(P.VALOR_PACIENTE, 0) AS FLOAT) as price
      FROM TAB_GEN_ITEM T
      LEFT JOIN (
        SELECT ID_PRC_GEN, MAX(VALOR_PACIENTE) as VALOR_PACIENTE 
        FROM TAB_PRC_ITEM 
        WHERE INATIVO = '0' OR INATIVO IS NULL 
        GROUP BY ID_PRC_GEN
      ) P ON T.ID_PRC_GEN = P.ID_PRC_GEN
      WHERE T.INATIVO = '0'
      GROUP BY TRIM(T.NOME)
      ORDER BY T.NOME
    `);

    // 3. Get all payment methods
    const payments = await db.all(`SELECT REGISTRO as id, NOME as name FROM __TIPO_PAGTO ORDER BY NOME`);

    // 4. Get all professionals
    const professionals = await db.all(`SELECT ID_PRESTADOR as id, NOME as name FROM PRESTADOR WHERE INATIVO = '0' OR INATIVO IS NULL ORDER BY NOME`);

    // 5. Get Convenios (Insurance)
    const convenios = await db.all(`SELECT NROCONV as id, NOME as name FROM CONVENIO WHERE INATIVO = '0' OR INATIVO IS NULL ORDER BY NOME`);

    // 6. Get Unidades (Units/Locations)
    const unidades = await db.all(`SELECT ID_UNIDADE as id, NOME as name FROM UNIDADE WHERE INATIVO = '0' OR INATIVO IS NULL ORDER BY NOME`);

    // 7. Get Agenda Statuses
    const agendaStatuses = await db.all(`SELECT CODIGO as id, NOME as name, NROCOR as color FROM __STATUS_AGENDA ORDER BY CODIGO`);

    return NextResponse.json({
      specialties,
      procedures,
      payments,
      professionals,
      convenios,
      unidades,
      agendaStatuses
    });
  } catch (error: any) {
    console.error("API Error (Catalog):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
