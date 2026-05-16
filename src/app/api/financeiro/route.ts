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
    const patientIncome = await db.all(
      `SELECT 
        'p-' || C.REGISTRO as id,
        C.DATA as date,
        C.HISTORICO as description,
        C.VALOR as value,
        P.PRINOM as patientName,
        TP.NOME as paymentMethod,
        'income' as type
      FROM CCPACIENTE C
      LEFT JOIN PESSOAL P ON C.NROPAC = P.NROPAC
      LEFT JOIN __TIPO_PAGTO TP ON C.TIPO_PAGTO = TP.REGISTRO
      WHERE DATE(C.DATA) BETWEEN DATE(?) AND DATE(?)
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
      ORDER BY C.DATA DESC`,
      [start, end]
    );

    // 3. Saldo Pendente (Total que falta receber de todos os pacientes)
    // Buscamos intervenções que não estão totalmente pagas
    const pendingInterventions = await db.all(`
      SELECT 
        I.VALOR_PACIENTE as value,
        I.ORCAMENTO as paidInst,
        I.OBSERV as notes,
        I.NROINTPAC,
        I.DATCAD as date,
        TRIM(P.PRINOM || ' ' || COALESCE(P.SEGNOM, '')) as patientName
      FROM INTERVENCAO I
      LEFT JOIN PESSOAL P ON I.NROPAC = P.NROPAC
      WHERE I.STATUS != '3' -- Ignorar cancelados
    `);

    const pendingTransactions: any[] = [];
    let globalCounter = 0;
    const totalPending = pendingInterventions.reduce((sum, inter) => {
      // Tenta extrair o total de parcelas do OBSERV (X/Yx)
      let total = 1;
      const notes = inter.notes || "";
      let procName = notes.split('|')[0].replace('PROCEDIMENTO:', '').trim() || 'Procedimento';
      
      if (notes.includes('/')) {
        const match = notes.match(/\/(\d+)x\)/);
        if (match) total = parseInt(match[1]) || 1;
      } else if (notes.includes('(')) {
        const match = notes.match(/\((\d+)x\)/);
        if (match) total = parseInt(match[1]) || 1;
      }

      const paid = parseInt(inter.paidInst || '0') || 0;
      
      if (paid < total) {
        const valPerInst = (inter.value || 0) / total;
        const unpaidCount = total - paid;
        
        // Adicionar detalhamento para o extrato pendente com ID global único e descrição rica
        for (let i = paid + 1; i <= total; i++) {
           globalCounter++;
           pendingTransactions.push({
              id: `pending-item-${globalCounter}-${inter.NROINTPAC || 'no-id'}`,
              date: inter.date || new Date().toISOString(),
              description: `A RECEBER: Parcela ${i}/${total} - ${inter.patientName} - ${procName}`,
              value: valPerInst,
              patientName: inter.patientName,
              type: 'pending'
           });
        }

        return sum + (valPerInst * unpaidCount);
      }
      return sum;
    }, 0);

    // 4. Totais e Resumo
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

    // 1. Gerar novo REGISTRO (ID)
    const lastIdRow = await db.get("SELECT MAX(CAST(REGISTRO AS INTEGER)) as id FROM CCCIRURGIAO");
    const nextId = (Number(lastIdRow?.id) || 0) + 1;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const today = new Date().toISOString().split('T')[0];

    // NROLAN: '9' para Despesa, '6' ou outro para Entrada (Ajuste conforme necessidade)
    // No Easy Dental, Despesas costumam ser código 9
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

    return NextResponse.json({ success: true, id: nextId.toString() });
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
