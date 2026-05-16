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

    // Helper function to normalize SQLite column/value for accent-insensitivity
    const sqliteNormalize = (col: string) => {
      let result = `LOWER(${col})`;
      const replacements = [
        ['á', 'a'], ['à', 'a'], ['â', 'a'], ['ã', 'a'], ['ä', 'a'],
        ['é', 'e'], ['è', 'e'], ['ê', 'e'], ['ë', 'e'],
        ['í', 'i'], ['ì', 'i'], ['î', 'i'], ['ï', 'i'],
        ['ó', 'o'], ['ò', 'o'], ['ô', 'o'], ['õ', 'o'], ['ö', 'o'],
        ['ú', 'u'], ['ù', 'u'], ['û', 'u'], ['ü', 'u'],
        ['ç', 'c']
      ];
      replacements.forEach(([acc, base]) => {
        result = `REPLACE(${result}, '${acc}', '${base}')`;
      });
      return result;
    };

    const normalizeValue = (val: string) => {
      return val.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    if (query) {
      const normalizedQuery = normalizeValue(query);
      const searchPattern = `%${normalizedQuery}%`;
      
      sql += ` WHERE ${sqliteNormalize('PRINOM')} LIKE ? 
                OR ${sqliteNormalize('SEGNOM')} LIKE ? 
                OR CIC LIKE ? 
                OR LOWER(EMAIL) LIKE ?`;
      
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      
      // Priorizar nomes que COMEÇAM com a busca
      sql += ` ORDER BY 
        CASE 
          WHEN ${sqliteNormalize('PRINOM')} LIKE ? THEN 1
          ELSE 2 
        END, 
        PRINOM ASC`;
      params.push(`${normalizedQuery}%`);
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
       const normalizedQuery = normalizeValue(query);
       countSql += ` WHERE ${sqliteNormalize('PRINOM')} LIKE ? 
                      OR ${sqliteNormalize('SEGNOM')} LIKE ? 
                      OR CIC LIKE ? 
                      OR LOWER(EMAIL) LIKE ?`;
       countParams.push(`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`);
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
