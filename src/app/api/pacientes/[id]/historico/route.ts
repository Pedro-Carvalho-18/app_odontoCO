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
        DF.FACE1, DF.FACE2, DF.FACE3, DF.FACE4, DF.FACE5,
        COALESCE(FIN.totalPaid, 0) as totalPaid,
        COALESCE(VTRA.totalValue, CAST(IFNULL(I.VALOR_PACIENTE, 0) AS FLOAT)) as totalTraValue,
        CASE 
          WHEN DF.BITMAP LIKE 'icon:%' THEN SUBSTR(DF.BITMAP, 6)
          WHEN S.ICONE LIKE '%.bmp' OR S.ICONE LIKE '%.png' THEN S.ICONE
          WHEN S2.ICONE IS NOT NULL THEN S2.ICONE
          WHEN S3.ICONE IS NOT NULL THEN S3.ICONE
          ELSE NULL 
        END as latestIcon
      FROM INTERVENCAO I
      LEFT JOIN TRATAMENTO TR ON I.NROTRA = TR.NROTRA
      LEFT JOIN TAB_GEN_ITEM T ON I.NROINT = T.ID_PRC_GEN
      LEFT JOIN TAB_PRC_ITEM PRC ON (I.NROINT = PRC.NROPROCTAB OR I.NROINT = PRC.ID_PRC_GEN) AND I.NROTAB = PRC.NROTAB
      LEFT JOIN PRESTADOR P ON I.ID_PRESTADOR = P.ID_PRESTADOR
      LEFT JOIN CONVENIO C ON TR.ID_CONVENIO = C.NROCONV
      LEFT JOIN (
        SELECT NROTRA, SUM(CAST(VALOR AS FLOAT)) as totalPaid
        FROM CCPACIENTE 
        WHERE NROLAN IN ('6', '7', '8', '105')
        GROUP BY NROTRA
      ) FIN ON I.NROTRA = FIN.NROTRA
      LEFT JOIN (
        SELECT NROTRA, SUM(CAST(VALOR_PACIENTE AS FLOAT)) as totalValue
        FROM INTERVENCAO
        GROUP BY NROTRA
      ) VTRA ON I.NROTRA = VTRA.NROTRA
      LEFT JOIN (
        SELECT NROPAC, NROINTPAC, NRODEN, 
          GROUP_CONCAT(BITMAP) as BITMAP, 
          MAX(FACE1) as FACE1, MAX(FACE2) as FACE2, MAX(FACE3) as FACE3, MAX(FACE4) as FACE4, MAX(FACE5) as FACE5
        FROM (
          SELECT NROPAC, NROINTPAC, NRODEN, BITMAP, NULL as FACE1, NULL as FACE2, NULL as FACE3, NULL as FACE4, NULL as FACE5 FROM DENTE
          UNION ALL
          SELECT NROPAC, NROINTPAC, NRODEN, NULL as BITMAP, FACE1, FACE2, FACE3, FACE4, FACE5 FROM FACE
        ) GROUP BY NROPAC, NROINTPAC, NRODEN
      ) DF ON I.NROPAC = DF.NROPAC AND I.NROINTPAC = DF.NROINTPAC
      LEFT JOIN __SIMBOLO_ODONTO S ON COALESCE(PRC.NROSIM, T.ID_SIMBOLO) = S.NROSIM
      LEFT JOIN (
        SELECT BITMAP1, MIN(ICONE) as ICONE, MIN(DESCRICAO) as DESCRICAO
        FROM __SIMBOLO_ODONTO
        WHERE BITMAP1 IS NOT NULL AND BITMAP1 != ''
        GROUP BY BITMAP1
      ) S2 ON (
        CASE 
          WHEN DF.BITMAP LIKE 'arc_%_%' THEN SUBSTR(DF.BITMAP, 5, INSTR(SUBSTR(DF.BITMAP, 5), '_') - 1)
          WHEN DF.BITMAP LIKE 'arc_%' THEN SUBSTR(DF.BITMAP, 5)
          ELSE DF.BITMAP
        END
      ) = S2.BITMAP1
      LEFT JOIN (
        SELECT ICONE, MIN(DESCRICAO) as DESCRICAO
        FROM __SIMBOLO_ODONTO
        WHERE ICONE IS NOT NULL AND ICONE != ''
        GROUP BY ICONE
      ) S3 ON (
        CASE 
          WHEN DF.BITMAP LIKE 'icon:%' THEN SUBSTR(DF.BITMAP, 6)
          ELSE NULL
        END
      ) = S3.ICONE
      WHERE I.NROPAC = ?
      ORDER BY I.DATCAD DESC, I.TIME_STAMP_INS DESC, CAST(I.NROINTPAC AS INTEGER) DESC`,
      [id]
    );

    // After fetching, calculate paidInstallments in JS for more flexibility
    const processedInterventions = interventions
      .filter(inter => !inter.procedure?.includes("Alteração Odontograma"))
      .map(inter => {
      // 1. Determine total installments
      let totalInst = 1;
      if (inter.notes && inter.notes.includes('(') && inter.notes.includes('x)')) {
         const match = inter.notes.match(/\((\d+)x\)/);
         if (match) totalInst = parseInt(match[1]) || 1;
      } else if (inter.installments) {
         totalInst = parseInt(inter.installments) || 1;
      }

      // 2. Paid installments: use ORCAMENTO (from query) as primary source,
      //    fall back to financial calculation only if ORCAMENTO is not set
      let paidInst = 0;
      const orcamentoValue = inter.paidInstallments;
      
      if (orcamentoValue !== null && orcamentoValue !== undefined && orcamentoValue !== '' && !isNaN(Number(orcamentoValue))) {
        paidInst = Number(orcamentoValue);
      } else {
        // Fallback: calculate from financial records
        const totalPaid = parseFloat(inter.totalPaid) || 0;
        const totalTraValue = parseFloat(inter.totalTraValue) || 0;
        
        if (totalTraValue > 0) {
          const progress = totalPaid / totalTraValue;
          paidInst = Math.round(progress * totalInst);
        } else if (totalPaid > 0) {
          paidInst = totalInst;
        }
      }

      // 3. Forced synchronization (Business logic requested by user)
      let currentStatus = inter.status;
      
      // If it's fully paid (or almost fully paid), mark as Concluído
      if (paidInst >= totalInst && totalInst > 0) {
        paidInst = totalInst; // Cap it
        currentStatus = 'Concluído';
      }
      
      // If it's Concluído, ensure it shows as fully paid
      if (currentStatus === 'Concluído') {
        paidInst = totalInst;
      }

      return {
        ...inter,
        status: currentStatus,
        installments: totalInst.toString(),
        totalInstallments: totalInst,
        paidInstallments: paidInst
      };
    });

    // 3. Get financial summary by treatment (NROTRA) for the balance calculation
    // This avoids double-counting payments when multiple interventions share an NROTRA
    const financialSummary = await db.all(
      `SELECT 
        I.NROTRA as nroTra,
        SUM(DISTINCT CAST(IFNULL(FIN.totalPaid, 0) AS FLOAT)) as totalPaid,
        SUM(CAST(IFNULL(I.VALOR_PACIENTE, 0) AS FLOAT)) as totalValue
      FROM INTERVENCAO I
      LEFT JOIN (
        SELECT NROTRA, SUM(CAST(VALOR AS FLOAT)) as totalPaid
        FROM CCPACIENTE 
        WHERE NROLAN IN ('6', '7', '8', '105')
        GROUP BY NROTRA
      ) FIN ON I.NROTRA = FIN.NROTRA
      WHERE I.NROPAC = ? AND I.NROTRA IS NOT NULL AND I.NROTRA != '0'
      GROUP BY I.NROTRA`,
      [id]
    );

    // 4. Get consolidated current odontogram state
    // We look for the absolute latest clinical record per tooth based on NROINTPAC
    const clinicalState = await db.all(
      `SELECT 
        LATEST.NRODEN as internalToothId,
        DF.BITMAP as dentalStatus,
        DF.FACE1, DF.FACE2, DF.FACE3, DF.FACE4, DF.FACE5,
        CASE 
          WHEN DF.BITMAP LIKE 'icon:%' THEN SUBSTR(DF.BITMAP, 6)
          WHEN S.ICONE LIKE '%.bmp' OR S.ICONE LIKE '%.png' THEN S.ICONE
          WHEN S2.ICONE IS NOT NULL THEN S2.ICONE
          WHEN S3.ICONE IS NOT NULL THEN S3.ICONE
          ELSE NULL 
        END as latestIcon,
        COALESCE(
          CASE WHEN DF.BITMAP LIKE 'icon:%' THEN S3.DESCRICAO ELSE NULL END,
          S.DESCRICAO, 
          S2.DESCRICAO
        ) as procedureName
      FROM (
        SELECT NROPAC, NRODEN, MAX(CAST(NROINTPAC AS INTEGER)) as latestId
        FROM (
          SELECT NROPAC, NRODEN, NROINTPAC FROM DENTE
          UNION ALL
          SELECT NROPAC, NRODEN, NROINTPAC FROM FACE
        ) 
        WHERE NROPAC = ?
        GROUP BY NRODEN
      ) LATEST
      JOIN (
        SELECT NROPAC, NROINTPAC, NRODEN, 
          GROUP_CONCAT(BITMAP) as BITMAP, 
          MAX(FACE1) as FACE1, MAX(FACE2) as FACE2, MAX(FACE3) as FACE3, MAX(FACE4) as FACE4, MAX(FACE5) as FACE5
        FROM (
          SELECT NROPAC, NROINTPAC, NRODEN, BITMAP, NULL as FACE1, NULL as FACE2, NULL as FACE3, NULL as FACE4, NULL as FACE5 FROM DENTE
          UNION ALL
          SELECT NROPAC, NROINTPAC, NRODEN, NULL as BITMAP, FACE1, FACE2, FACE3, FACE4, FACE5 FROM FACE
        ) GROUP BY NROPAC, NROINTPAC, NRODEN
      ) DF ON LATEST.NROPAC = DF.NROPAC AND LATEST.NRODEN = DF.NRODEN AND LATEST.latestId = CAST(DF.NROINTPAC AS INTEGER)
      LEFT JOIN INTERVENCAO I ON DF.NROPAC = I.NROPAC AND DF.NROINTPAC = I.NROINTPAC
      LEFT JOIN TAB_PRC_ITEM PRC ON (I.NROINT = PRC.NROPROCTAB OR I.NROINT = PRC.ID_PRC_GEN) AND I.NROTAB = PRC.NROTAB
      LEFT JOIN TAB_GEN_ITEM GEN ON I.NROINT = GEN.ID_PRC_GEN
      LEFT JOIN __SIMBOLO_ODONTO S ON COALESCE(PRC.NROSIM, GEN.ID_SIMBOLO) = S.NROSIM
      LEFT JOIN (
        SELECT BITMAP1, MIN(ICONE) as ICONE, MIN(DESCRICAO) as DESCRICAO
        FROM __SIMBOLO_ODONTO
        WHERE BITMAP1 IS NOT NULL AND BITMAP1 != ''
        GROUP BY BITMAP1
      ) S2 ON (
        CASE 
          WHEN DF.BITMAP LIKE 'arc_%_%' THEN SUBSTR(DF.BITMAP, 5, INSTR(SUBSTR(DF.BITMAP, 5), '_') - 1)
          WHEN DF.BITMAP LIKE 'arc_%' THEN SUBSTR(DF.BITMAP, 5)
          ELSE DF.BITMAP
        END
      ) = S2.BITMAP1
      LEFT JOIN (
        SELECT ICONE, MIN(DESCRICAO) as DESCRICAO
        FROM __SIMBOLO_ODONTO
        WHERE ICONE IS NOT NULL AND ICONE != ''
        GROUP BY ICONE
      ) S3 ON (
        CASE 
          WHEN DF.BITMAP LIKE 'icon:%' THEN SUBSTR(DF.BITMAP, 6)
          ELSE NULL
        END
      ) = S3.ICONE`.replace(/\s+/g, ' '),
      [id]
    );

    // Better summary calculation:
    // Some interventions might not have NROTRA (unlikely but possible)
    // We'll also get the sum of CC records directly for this patient
    const directCcBalance = await db.get(
      `SELECT 
        SUM(CASE WHEN NROLAN IN ('4', '5') THEN CAST(VALOR AS FLOAT) ELSE 0 END) as totalCharges,
        SUM(CASE WHEN NROLAN IN ('6', '7', '8', '105') THEN CAST(VALOR AS FLOAT) ELSE 0 END) as totalPayments
      FROM CCPACIENTE 
      WHERE NROPAC = ?`,
      [id]
    );

    await db.close();
    return NextResponse.json({ 
      history, 
      interventions: processedInterventions,
      clinicalState,
      financialSummary: {
        totalValue: directCcBalance?.totalCharges || 0,
        totalPaid: directCcBalance?.totalPayments || 0,
        balance: Math.max(0, (directCcBalance?.totalCharges || 0) - (directCcBalance?.totalPayments || 0))
      }
    });
  } catch (error: any) {
    console.error("API Error (History):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
