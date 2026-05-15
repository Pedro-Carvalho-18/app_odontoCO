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
        C.REGISTRO as id,
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
        C.REGISTRO as id,
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

    // 3. Totais e Resumo
    const allTransactions = [...patientIncome, ...surgeonMoves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalIncome = allTransactions.reduce((sum, item) => item.type === 'income' ? sum + parseFloat(item.value || 0) : sum, 0);
    const totalExpense = allTransactions.reduce((sum, item) => item.type === 'expense' ? sum + parseFloat(item.value || 0) : sum, 0);

    return NextResponse.json({
      transactions: allTransactions,
      summary: {
        income: totalIncome,
        expenses: totalExpense,
        balance: totalIncome - totalExpense
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
