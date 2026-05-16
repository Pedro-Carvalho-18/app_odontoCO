import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // 1. Get clinical history (HISTORICO)
    const history = await db.all(
      `SELECT 
        H.REGISTRO as id,
        'history' as type,
        H.DATA as date,
        H.DATA as createdAt,
        TRIM(H.DESCRICAO) as procedure,
        'Concluído' as status,
        COALESCE(TRIM(P.NOME), 'Profissional não identificado') as professional,
        0.0 as value,
        TRIM(H.NRODENTE) as tooth
      FROM HISTORICO H
      LEFT JOIN PRESTADOR P ON H.ID_PRESTADOR = P.ID_PRESTADOR
      WHERE H.NROPAC = ?
      ORDER BY H.DATA DESC, CAST(H.REGISTRO AS INTEGER) DESC LIMIT 100`,
      [id]
    );

    // 2. Get interventions (INTERVENCAO)
    const interventions = await db.all(
      `SELECT 
        I.NROINTPAC as id,
        'intervention' as type,
        I.DATCAD as date,
        I.TIME_STAMP_INS as createdAt,
        COALESCE(
          CASE 
            WHEN I.OBSERV LIKE '%|%' THEN TRIM(SUBSTR(I.OBSERV, 1, INSTR(I.OBSERV, '|') - 1))
            ELSE I.OBSERV 
          END,
          PRC.DESCRICAO, 
          T.NOME, 
          'Procedimento'
        ) as procedure,
        CASE 
          WHEN I.OBSERV LIKE '%|%|%' THEN TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '|') + 1, INSTR(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '|') + 1), '|') - 1))
          ELSE NULL
        END as time,
        CASE 
          WHEN I.STATUS = '1' THEN 'Em Aberto'
          WHEN I.STATUS = '2' THEN 'Concluído'
          ELSE 'Em Aberto'
        END as status,
        COALESCE(TRIM(P.NOME), 'Profissional não identificado') as professional,
        CAST(IFNULL(I.VALOR_PACIENTE, 0) AS FLOAT) as value,
        TRIM(COALESCE(I.S_DENTES, '')) as tooth,
        I.OBSERV as notes,
        CASE 
          WHEN I.ORCAMENTO IS NOT NULL AND I.ORCAMENTO != '' THEN CAST(I.ORCAMENTO AS INTEGER)
          WHEN I.STATUS = '2' THEN 
            CASE 
              WHEN I.OBSERV LIKE '%(%/%x)%' THEN CAST(TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '(') + 1, INSTR(I.OBSERV, '/') - INSTR(I.OBSERV, '(') - 1)) AS INTEGER)
              WHEN I.OBSERV LIKE '%(%x)%' THEN CAST(TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '(') + 1, INSTR(I.OBSERV, 'x)') - INSTR(I.OBSERV, '(') - 1)) AS INTEGER)
              ELSE 1
            END
          ELSE 
            CASE 
              WHEN I.OBSERV LIKE '%(%/%x)%' THEN CAST(TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '(') + 1, INSTR(I.OBSERV, '/') - INSTR(I.OBSERV, '(') - 1)) AS INTEGER)
              ELSE 0
            END
        END as paidInstallments,
        CASE 
          WHEN I.OBSERV LIKE '%(%/%x)%' THEN TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '/') + 1, INSTR(I.OBSERV, 'x)') - INSTR(I.OBSERV, '/') - 1))
          WHEN I.OBSERV LIKE '%(%x)%' THEN TRIM(SUBSTR(I.OBSERV, INSTR(I.OBSERV, '(') + 1, INSTR(I.OBSERV, 'x)') - INSTR(I.OBSERV, '(') - 1))
          ELSE '1'
        END as installments,
        COALESCE(TRIM(C.NOME), 'Particular') as convenio,
        DF.BITMAP as dentalStatus,
        DF.NRODEN as internalToothId,
        DF.FACE1, DF.FACE2, DF.FACE3, DF.FACE4, DF.FACE5
      FROM INTERVENCAO I
      LEFT JOIN TRATAMENTO TR ON I.NROTRA = TR.NROTRA
      LEFT JOIN TAB_GEN_ITEM T ON I.NROINT = T.ID_PRC_GEN
      LEFT JOIN TAB_PRC_ITEM PRC ON I.NROINT = PRC.ID_PRC_TAB AND I.NROTAB = PRC.NROTAB
      LEFT JOIN PRESTADOR P ON I.ID_PRESTADOR = P.ID_PRESTADOR
      LEFT JOIN CONVENIO C ON TR.ID_CONVENIO = C.NROCONV
      LEFT JOIN (
        SELECT NROPAC, NROINTPAC, NRODEN, MAX(BITMAP) as BITMAP, MAX(FACE1) as FACE1, MAX(FACE2) as FACE2, MAX(FACE3) as FACE3, MAX(FACE4) as FACE4, MAX(FACE5) as FACE5
        FROM (
          SELECT NROPAC, NROINTPAC, NRODEN, BITMAP, NULL as FACE1, NULL as FACE2, NULL as FACE3, NULL as FACE4, NULL as FACE5 FROM DENTE
          UNION ALL
          SELECT NROPAC, NROINTPAC, NRODEN, NULL as BITMAP, FACE1, FACE2, FACE3, FACE4, FACE5 FROM FACE
        ) GROUP BY NROPAC, NROINTPAC, NRODEN
      ) DF ON I.NROPAC = DF.NROPAC AND I.NROINTPAC = DF.NROINTPAC
      WHERE I.NROPAC = ?
      ORDER BY I.DATCAD DESC, I.TIME_STAMP_INS DESC, CAST(I.NROINTPAC AS INTEGER) DESC`,
      [id]
    );

    await db.close();
    return NextResponse.json({ history, interventions });
  } catch (error: any) {
    console.error("API Error (History):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
