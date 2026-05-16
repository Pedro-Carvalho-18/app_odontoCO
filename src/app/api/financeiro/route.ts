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
        'p-' || MAX(C.REGISTRO) as id,
        C.DATA as date,
        MAX(C.HISTORICO) as description,
        C.VALOR as value,
        P.PRINOM as patientName,
        TP.NOME as paymentMethod,
        'income' as type
      FROM CCPACIENTE C
      LEFT JOIN PESSOAL P ON C.NROPAC = P.NROPAC
      LEFT JOIN __TIPO_PAGTO TP ON C.TIPO_PAGTO = TP.REGISTRO
      WHERE DATE(C.DATA) BETWEEN DATE(?) AND DATE(?)
      AND C.NROLAN IN ('6', '7', '8', '105') 
      GROUP BY C.NROPAC, DATE(C.DATA), C.VALOR
      ORDER BY C.DATA DESC`,
      [start, end]
    );

    // 2. Movimentações do Cirurgião (CCCIRURGIAO)
    const surgeonMoves = await db.all(
      `SELECT 
        'c-' || MAX(C.REGISTRO) as id,
        C.DATA as date,
        MAX(C.HISTORICO) as description,
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
      GROUP BY C.ID_PRESTADOR, DATE(C.DATA), C.VALOR, C.NROLAN
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
    `);
    
    const totalPending = Math.max(0, (ledgerBalance?.totalCharges || 0) - (ledgerBalance?.totalPayments || 0));

    // 4. Lista de Detalhes Pendentes (Itemizada via Conta Corrente)
    // Buscamos cada tratamento (NROTRA) que ainda possui saldo devedor
    const pendingList = await db.all(`
      SELECT 
        C.NROTRA,
        C.NROPAC,
        MAX(C.DATA) as lastDate,
        MAX(C.HISTORICO) as description,
        SUM(CASE WHEN NROLAN IN ('4', '5') THEN VALOR ELSE 0 END) - 
        SUM(CASE WHEN NROLAN IN ('6', '7', '8', '105') THEN VALOR ELSE 0 END) as balance,
        P.PRINOM as patientName
      FROM CCPACIENTE C
      LEFT JOIN PESSOAL P ON C.NROPAC = P.NROPAC
      WHERE STRFTIME('%Y', C.DATA) >= '2000'
      AND C.NROTRA IS NOT NULL AND C.NROTRA != '0'
      GROUP BY C.NROPAC, C.NROTRA
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
        type: 'pending'
      });
    }

    // 5. Totais e Resumo
    const allTransactions = [...patientIncome, ...surgeonMoves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalIncome = allTransactions.reduce((sum, item) => item.type === 'income' ? sum + parseFloat(item.value || 0) : sum, 0);
    const totalExpense = allTransactions.reduce((sum, item) => item.type === 'expense' ? sum + parseFloat(item.value || 0) : sum, 0);

    return NextResponse.json({
      transactions: allTransactions,
      pendingTransactions,
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
