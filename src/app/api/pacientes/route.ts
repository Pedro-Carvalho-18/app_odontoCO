import { getDb } from "@/lib/db/sqlite";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const db = await getDb();

    // PRINOM já contém o nome completo no seu banco.
    // Usamos TRIM para remover espaços em branco desnecessários.
    let sql = `
      SELECT 
        NROPAC as id, 
        TRIM(PRINOM) as name,
        EMAIL as email,
        FONE1 as phone,
        DATNAS as birthDate,
        STATUS as status,
        CIC as cpf,
        TIME_STAMP_INS as createdAt
      FROM PESSOAL
    `;
    
    const params: any[] = [];

    if (query) {
      sql += ` WHERE PRINOM LIKE ? OR SEGNOM LIKE ? OR CIC LIKE ? OR EMAIL LIKE ?`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      
      // Priorizar nomes que COMEÇAM com a busca
      sql += ` ORDER BY 
        CASE 
          WHEN PRINOM LIKE ? THEN 1
          ELSE 2 
        END, 
        PRINOM ASC`;
      params.push(`${query}%`);
    } else {
      sql += ` ORDER BY PRINOM ASC`;
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const patients = await db.all(sql, params);

    // Buscar total para saber se tem mais (hasMore)
    let countSql = `SELECT COUNT(*) as total FROM PESSOAL`;
    const countParams: any[] = [];
    if (query) {
       countSql += ` WHERE PRINOM LIKE ? OR SEGNOM LIKE ? OR CIC LIKE ? OR EMAIL LIKE ?`;
       countParams.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    const countResult = await db.get(countSql, countParams);
    const total = countResult?.total || 0;
    const hasMore = offset + patients.length < total;

    return NextResponse.json({ 
      patients,
      hasMore,
      total
    });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
