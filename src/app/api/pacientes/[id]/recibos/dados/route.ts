import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const db = await getDb();

    // 1. Get patient financial data (payments only)
    const payments = await db.all(
      `SELECT 
        REGISTRO as id,
        DATA as date,
        HISTORICO as description,
        CAST(VALOR AS FLOAT) as value,
        NRORECIBO as receiptNumber
      FROM CCPACIENTE 
      WHERE NROPAC = ? AND NROLAN IN ('6', '7', '8', '105') AND CAST(VALOR AS FLOAT) > 0
      ORDER BY DATA DESC, CAST(REGISTRO AS INTEGER) DESC`,
      [patientId]
    );

    // 2. Get patient personal info for the receipt
    const patient = await db.get(
        `SELECT PRINOM, SEGNOM, CIC, RG, NOMRES, CICRES FROM PESSOAL WHERE NROPAC = ?`,
        [patientId]
    );

    // 3. Get professionals list for selection
    const professionals = await db.all(
        `SELECT ID_PRESTADOR as id, NOME as name, CRO_PF as cro, CPF_PF as cpf FROM PRESTADOR WHERE INATIVO = '0'`
    );

    await db.close();

    return NextResponse.json({ 
      payments,
      patient: {
          name: `${patient?.PRINOM || ''} ${patient?.SEGNOM || ''}`.trim(),
          cpf: patient?.CIC || '',
          rg: patient?.RG || '',
          responsible: patient?.NOMRES || '',
          responsibleCpf: patient?.CICRES || ''
      },
      professionals
    });
  } catch (error: any) {
    console.error("API Error (Receipt Data):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
