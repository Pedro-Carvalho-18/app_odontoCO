import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const db = await getDb();

    const start = startDate || '1990-01-01';
    const end = endDate || '2100-12-31';

    // 1. Receitas de Pacientes (CCPACIENTE)
    // Filtramos apenas lançamentos de PAGAMENTO (NROLAN 6, 7, 8)
    // Excluímos lançamentos de DÉBITO/LANÇAMENTO (NROLAN 4, 5) para evitar duplicatas semânticas
    const patientIncome = await db.all(
      `SELECT 
        'p-' || C.REGISTRO as id,
        C.DATA as date,
        C.HISTORICO as description,
        C.VALOR as value,
        C.NROPAC as nroPac,
        C.NROTRA as nroTra,
        P.PRINOM as patientName,
        TP.NOME as paymentMethod,
        'income' as type
      FROM CCPACIENTE C
      LEFT JOIN PESSOAL P ON C.NROPAC = P.NROPAC
      LEFT JOIN __TIPO_PAGTO TP ON C.TIPO_PAGTO = TP.REGISTRO
      WHERE DATE(C.DATA) BETWEEN DATE(?) AND DATE(?)
      AND C.NROLAN IN ('6', '7', '8', '105') 
      AND C.HISTORICO NOT LIKE '%Alteração Odontograma%'
      ORDER BY C.DATA DESC`,
      [start, end]
    );

    // 2. Movimentações do Cirurgião (CCCIRURGIAO)
    const surgeonMoves = await db.all(
      `SELECT 
        'c-' || C.REGISTRO as id,
        C.DATA as date,
        C.HISTORICO as description,
        C.VALOR as value,
        PR.NOME as professionalName,
        C.NROLAN as code,
        CASE 
          WHEN C.NROLAN = '9' THEN 'expense'
          ELSE 'income' 
        END as type
      FROM CCCIRURGIAO C
      LEFT JOIN PRESTADOR PR ON C.ID_PRESTADOR = PR.ID_PRESTADOR
      WHERE DATE(C.DATA) BETWEEN DATE(?) AND DATE(?)
      AND (C.NROCCPAC IS NULL OR C.NROCCPAC = '' OR C.NROCCPAC = '0')
      AND C.HISTORICO NOT LIKE '%Alteração Odontograma%'
      ORDER BY C.DATA DESC`,
      [start, end]
    );

    // 3. Saldo Pendente Global (Cálculo via Conta Corrente)
    // Pendente = (Soma de Lançamentos de Débito) - (Soma de Pagamentos Realizados)
    // Filtramos para dados a partir do ano 2000 para evitar resquícios de moedas antigas/inflação (Cruzeiro)
    const ledgerBalance = await db.get(`
      SELECT 
        SUM(CASE WHEN NROLAN IN ('4', '5') THEN VALOR ELSE 0 END) as totalCharges,
        SUM(CASE WHEN NROLAN IN ('6', '7', '8', '105') THEN VALOR ELSE 0 END) as totalPayments
      FROM CCPACIENTE
      WHERE STRFTIME('%Y', DATA) >= '2000'
      AND HISTORICO NOT LIKE '%Alteração Odontograma%'
    `);
    
    const totalPending = Math.max(0, (ledgerBalance?.totalCharges || 0) - (ledgerBalance?.totalPayments || 0));

    // 4. Lista de Detalhes Pendentes (Itemizada via Conta Corrente)
    // Buscamos cada parcela de tratamento (NROTRA + NROPAR) que ainda possui saldo devedor
    const pendingList = await db.all(`
      SELECT 
        C.NROTRA,
        C.NROPAC,
        C.NROPAR,
        MAX(C.DATA) as lastDate,
        MAX(C.HISTORICO) as description,
        SUM(CASE WHEN NROLAN IN ('4', '5') THEN VALOR ELSE 0 END) - 
        SUM(CASE WHEN NROLAN IN ('6', '7', '8', '105') THEN VALOR ELSE 0 END) as balance,
        P.PRINOM as patientName
      FROM CCPACIENTE C
      LEFT JOIN PESSOAL P ON C.NROPAC = P.NROPAC
      WHERE STRFTIME('%Y', C.DATA) >= '2000'
      AND C.NROTRA IS NOT NULL AND C.NROTRA != '0'
      AND C.HISTORICO NOT LIKE '%Alteração Odontograma%'
      GROUP BY C.NROPAC, C.NROTRA, COALESCE(C.NROPAR, '0')
      HAVING balance > 0.01
      ORDER BY lastDate DESC
    `);

    const pendingTransactions: any[] = [];
    let globalCounter = 0;
    
    for (const item of pendingList) {
      globalCounter++;
      pendingTransactions.push({
        id: `pending-item-${globalCounter}-${item.NROTRA}-${item.NROPAC}`,
        date: item.lastDate || new Date().toISOString(),
        description: `A RECEBER: ${item.description || 'Tratamento'}`,
        value: item.balance,
        patientName: item.patientName,
        nroTra: item.NROTRA,
        nroPac: item.NROPAC,
        nroPar: item.NROPAR || "1",
        type: 'pending'
      });
    }

    // 5. Totais e Resumo
    const allTransactions = [...patientIncome, ...surgeonMoves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalIncome = allTransactions.reduce((sum, item) => item.type === 'income' ? sum + parseFloat(item.value || 0) : sum, 0);
    const totalExpense = allTransactions.reduce((sum, item) => item.type === 'expense' ? sum + parseFloat(item.value || 0) : sum, 0);

    // 6. Buscar Intervenções Globais (Todos os Pacientes)
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
        I.NROTRA as nroTra,
        I.NROPAC as nroPac,
        PAT.PRINOM as patientName,
        COALESCE(FIN.totalPaid, 0) as totalPaid,
        COALESCE(VTRA.totalValue, CAST(IFNULL(I.VALOR_PACIENTE, 0) AS FLOAT)) as totalTraValue
      FROM INTERVENCAO I
      INNER JOIN PESSOAL PAT ON I.NROPAC = PAT.NROPAC
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
      WHERE (DATE(I.DATCAD) BETWEEN DATE(?) AND DATE(?))
         OR I.NROTRA IN (
            SELECT DISTINCT NROTRA FROM CCPACIENTE 
            WHERE DATE(DATA) BETWEEN DATE(?) AND DATE(?) 
              AND NROLAN IN ('6', '7', '8', '105')
         )
      ORDER BY I.DATCAD DESC, CAST(I.NROINTPAC AS INTEGER) DESC`,
      [start, end, start, end]
    );

    // Buscar pagamentos para essas intervenções
    const payments = await db.all(
      `SELECT 
        C.REGISTRO as id,
        C.DATA as date,
        C.VALOR as value,
        C.NROTRA as nroTra,
        C.NROPAR as installment,
        C.HISTORICO as description,
        COALESCE(TP.NOME, 'Particular') as paymentMethod
      FROM CCPACIENTE C
      LEFT JOIN __TIPO_PAGTO TP ON C.TIPO_PAGTO = TP.REGISTRO
      WHERE C.NROLAN IN ('6', '7', '8', '105')
        AND C.NROTRA IN (
          SELECT DISTINCT I.NROTRA 
          FROM INTERVENCAO I
          WHERE (DATE(I.DATCAD) BETWEEN DATE(?) AND DATE(?))
             OR I.NROTRA IN (
                SELECT DISTINCT NROTRA FROM CCPACIENTE 
                WHERE DATE(DATA) BETWEEN DATE(?) AND DATE(?) 
                  AND NROLAN IN ('6', '7', '8', '105')
             )
        )
      ORDER BY C.DATA DESC, CAST(C.REGISTRO AS INTEGER) DESC`,
      [start, end, start, end]
    );

    const processedInterventions = interventions
      .filter(inter => !inter.procedure?.includes("Alteração Odontograma"))
      .map(inter => {
        let totalInst = 1;
        if (inter.notes && inter.notes.includes('(') && inter.notes.includes('x)')) {
          const match = inter.notes.match(/\((\d+)x\)/);
          if (match) totalInst = parseInt(match[1]) || 1;
        } else if (inter.installments) {
          totalInst = parseInt(inter.installments) || 1;
        }

        let paymentMethod = 'Não informado';
        if (inter.notes && inter.notes.includes('Pagamento:')) {
          const parts = inter.notes.split('|');
          const payPart = parts.find((p: string) => p.includes('Pagamento:'));
          if (payPart) {
            paymentMethod = payPart.replace('Pagamento:', '').split('(')[0].trim();
          }
        }

        const interPayments = payments.filter(p => p.nroTra && String(p.nroTra) === String(inter.nroTra));

        let paidInst = 0;
        const orcamentoValue = inter.paidInstallments;
        if (orcamentoValue !== null && orcamentoValue !== undefined && orcamentoValue !== '' && !isNaN(Number(orcamentoValue))) {
          paidInst = Number(orcamentoValue);
        } else {
          const totalPaid = parseFloat(inter.totalPaid) || 0;
          const totalTraValue = parseFloat(inter.totalTraValue) || 0;
          if (totalTraValue > 0) {
            const progress = totalPaid / totalTraValue;
            paidInst = Math.round(progress * totalInst);
          } else if (totalPaid > 0) {
            paidInst = totalInst;
          }
        }

        let currentStatus = inter.status;
        if (paidInst >= totalInst && totalInst > 0) {
          paidInst = totalInst;
          currentStatus = 'Concluído';
        }
        if (currentStatus === 'Concluído') {
          paidInst = totalInst;
        }

        let procedureClean = inter.procedure || '';
        if (procedureClean.toUpperCase().startsWith('PROCEDIMENTO:')) {
          procedureClean = procedureClean.substring(13).trim();
        } else if (procedureClean.toUpperCase().startsWith('DIAGNÓSTICO:')) {
          procedureClean = procedureClean.substring(12).trim();
        }

        return {
          ...inter,
          procedure: procedureClean,
          status: currentStatus,
          installments: totalInst.toString(),
          totalInstallments: totalInst,
          paidInstallments: paidInst,
          paymentMethod,
          payments: interPayments
        };
      });

    return NextResponse.json({
      transactions: allTransactions,
      pendingTransactions,
      interventions: processedInterventions,
      summary: {
        income: totalIncome,
        expenses: totalExpense,
        balance: totalIncome - totalExpense,
        pending: totalPending
      }
    });
  } catch (error: any) {
    console.error("API Error (Finance GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const today = new Date().toISOString().split('T')[0];

    // Se for entrada e tiver paciente, inserimos em CCPACIENTE
    if (body.type === 'income' && body.patientId) {
      const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCPACIENTE");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      await db.run(
        `INSERT INTO CCPACIENTE (
          REGISTRO, NROPAC, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
          TIPO_PAGTO, USER_STAMP_INS, TIME_STAMP_INS, DATA_LANCAMENTO
        ) VALUES (?, ?, ?, ?, '6', '255', ?, ?, ?, ?, ?)`,
        [
          nextId.toString(),
          body.patientId,
          body.date || today,
          body.description,
          body.value.toString(),
          body.paymentMethodId || "1",
          "SISTEMA",
          now,
          today + " 00:00:00.000"
        ]
      );

      return NextResponse.json({ success: true, id: `p-${nextId}` });
    } else {
      // Caso contrário (despesa ou entrada sem paciente específico), inserimos em CCCIRURGIAO
      const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCCIRURGIAO");
      const nextId = (Number(lastIdRow?.id) || 0) + 1;

      const nroLan = body.type === 'expense' ? '9' : '6';

      await db.run(
        `INSERT INTO CCCIRURGIAO (
          REGISTRO, ID_PRESTADOR, DATA, HISTORICO, NROLAN, NROIND, VALOR, 
          TRIBUTAVEL, TIPO_PAGTO, STATUS, TIME_STAMP_INS, DATA_LANCAMENTO, USER_STAMP_INS
        ) VALUES (?, ?, ?, ?, ?, '255', ?, '0', ?, '2', ?, ?, ?)`,
        [
          nextId.toString(),
          body.professionalId || "1",
          body.date || today,
          body.description,
          nroLan,
          body.value.toString(),
          body.paymentMethodId || "1",
          now,
          today + " 00:00:00.000",
          "SISTEMA"
        ]
      );

      return NextResponse.json({ success: true, id: `c-${nextId}` });
    }
  } catch (error: any) {
    console.error("API Error (Finance POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // e.g. "p-1" or "c-1"

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const db = await getDb();
    
    if (id.startsWith('p-')) {
      await db.run("DELETE FROM CCPACIENTE WHERE REGISTRO = ?", [id.replace('p-', '')]);
    } else if (id.startsWith('c-')) {
      await db.run("DELETE FROM CCCIRURGIAO WHERE REGISTRO = ?", [id.replace('c-', '')]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (Finance DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
